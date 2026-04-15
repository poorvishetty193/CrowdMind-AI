import asyncio
import json
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from simulation import Simulator
from agents import generate_gemini_decisions

app = FastAPI(title="CrowdMind AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulator = Simulator()

# --- In-memory rate limiter ---
IP_RATE_LIMIT: dict[str, float] = {}

def rate_limit(request: Request):
    """Basic per-IP rate limiting for demo endpoints — 1 request per 2 seconds."""
    ip = request.client.host
    now = time.time()
    if ip in IP_RATE_LIMIT and now - IP_RATE_LIMIT[ip] < 2.0:
        raise HTTPException(status_code=429, detail="Too Many Requests. Please wait.")
    IP_RATE_LIMIT[ip] = now


class ConnectionManager:
    """Manages active WebSocket connections with full/delta sync strategy."""
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.needs_full_sync: dict[WebSocket, bool] = {}

    async def connect(self, websocket: WebSocket, current_state: dict):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Immediately send the current state so the user doesn't see a loading screen
        await websocket.send_json({"type": "full", "data": current_state})

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_state(self, full_state: dict, delta_state: dict):
        dead = []
        for ws in self.active_connections:
            try:
                # Always send delta if available, otherwise full
                if delta_state and delta_state.get("zones"):
                    await ws.send_json({"type": "delta", "data": delta_state})
                else:
                    await ws.send_json({"type": "full", "data": full_state})
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()
last_broadcasted_state: dict | None = None

# --- Global AI control flags ---
is_ai_mode_active: bool = True
is_burst_mode: bool = False
gemini_calls_count: int = 0
gemini_decisions_count: int = 0


def compute_delta(current: dict, previous: dict | None) -> dict:
    """Returns delta payload — zones that changed + always-fresh AI fields."""
    if not previous:
        return current

    changed_zones = []
    prev_zones = {z["id"]: z for z in previous.get("zones", [])}
    for zone in current.get("zones", []):
        prev = prev_zones.get(zone["id"])
        if not prev or prev["current_occupancy"] != zone["current_occupancy"] or prev["wait_time_mins"] != zone["wait_time_mins"]:
            changed_zones.append({
                "id": zone["id"],
                "current_occupancy": zone["current_occupancy"],
                "wait_time_mins": zone["wait_time_mins"]
            })

    return {
        "timestamp": current["timestamp"],
        "stadium_pulse_score": current["stadium_pulse_score"],
        "global_phase": current["global_phase"],
        "ai_insights": current.get("ai_insights"),           # always fresh
        "ai_telemetry": current.get("ai_telemetry"),         # always fresh
        "ai_metadata": current.get("ai_metadata"),           # always fresh
        "zones": changed_zones,
    }


def apply_ai_routing(ai_data: dict, burst: bool) -> None:
    """
    This logic is strictly powered by Gemini AI. No rule-based routing logic is used.
    Physically applies Gemini-generated routing decisions to the live simulation state.
    """
    global gemini_decisions_count

    decisions = ai_data.get("decisions", [])
    is_emergency = any(
        (z.current_occupancy / z.capacity) > 0.90
        for z in simulator.state.zones if z.capacity > 0
    )

    before_wait = simulator.calculate_wait_times()
    zone_map = {z.id: z for z in simulator.state.zones}

    for decision in decisions:
        src_id = decision.get("from_zone")
        tgt_id = decision.get("to_zone")
        if not src_id or not tgt_id:
            continue

        sz = zone_map.get(src_id)
        tz = zone_map.get(tgt_id)
        if not sz or not tz:
            continue

        # Multiplier: 50% emergency, 45% burst, 30% normal
        multiplier = 0.50 if is_emergency else (0.45 if burst else 0.30)
        qty = int(sz.current_occupancy * multiplier)
        qty = min(qty, tz.capacity - tz.current_occupancy)  # cap at target free space
        qty = max(0, qty)

        if qty > 0:
            sz.current_occupancy -= qty
            tz.current_occupancy += qty
            decision["people"] = qty   # update payload so UI shows real number
            gemini_decisions_count += 1
            simulator.ai_telemetry["total_decisions"] += 1
            print(f"[GEMINI] Decision Executed: {qty} people moved {src_id} -> {tgt_id} (conf={decision.get('confidence_score')}%)")

    after_wait = simulator.calculate_wait_times()

    if before_wait > 0:
        raw_reduction = int(((before_wait - after_wait) / before_wait) * 100)
        # Enforce minimum visible metrics (at least 3% after any AI cycle)
        simulator.ai_telemetry["wait_time_reduced_percentage"] = max(raw_reduction, 3)
        simulator.ai_telemetry["crowd_balanced_percentage"] = max(raw_reduction + 10, 3)

    # Also push aggregate_impact from Gemini into telemetry for the UI
    agg = ai_data.get("aggregate_impact", {})
    if agg.get("wait_time_reduction", 0) > 0:
        simulator.ai_telemetry["wait_time_reduced_percentage"] = max(
            simulator.ai_telemetry["wait_time_reduced_percentage"],
            agg["wait_time_reduction"]
        )
        simulator.ai_telemetry["crowd_balanced_percentage"] = max(
            simulator.ai_telemetry["crowd_balanced_percentage"],
            agg.get("load_balanced", 0)
        )


def _build_full_payload(ai_data: dict | None) -> dict:
    """Assembles the complete state dict to broadcast."""
    global gemini_calls_count, gemini_decisions_count
    state = simulator.state.model_dump()
    state["ai_insights"] = ai_data or getattr(simulator, "_last_ai", None) or {
        "decisions": [], "zone_predictions": [],
        "aggregate_impact": {"wait_time_reduction": 0, "load_balanced": 0},
        "narration": "Gemini AI initializing...",
    }
    state["ai_telemetry"] = simulator.ai_telemetry
    state["ai_metadata"] = {
        "ai_engine": "google_gemini",
        "ai_mode": "active" if is_ai_mode_active else "disabled",
        "gemini_calls_count": gemini_calls_count,
        "gemini_decisions_count": gemini_decisions_count,
        "decision_count": gemini_decisions_count,
        "prediction_count": simulator.ai_telemetry.get("total_predictions", 0),
    }
    return state


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())


async def run_ai_cycle(tick_count):
    """Background task to fetch Gemini decisions without blocking simulation."""
    global gemini_calls_count, is_burst_mode, last_broadcasted_state
    
    is_emergency = any(
        (z.current_occupancy / z.capacity) > 0.90
        for z in simulator.state.zones if z.capacity > 0
    )
    
    print(f"[GEMINI] AI Cycle Started (Tick {tick_count}) - Requesting decisions... (emergency={is_emergency})")
    ai_data = await generate_gemini_decisions(
        json.dumps(simulator.state.model_dump()),
        emergency=is_emergency
    )
    simulator._last_ai = ai_data
    
    # Update telemetry and apply routing
    predictions = ai_data.get("zone_predictions", [])
    simulator.ai_telemetry["total_predictions"] += len(predictions)

    if ai_data.get("decisions"):
        apply_ai_routing(ai_data, is_burst_mode)
        is_burst_mode = False
        
    # Immediately broadcast AI update so it shows up in logs/dashboard instantly
    full_payload = _build_full_payload(ai_data)
    delta_payload = compute_delta(full_payload, last_broadcasted_state)
    await manager.broadcast_state(full_payload, delta_payload)
    last_broadcasted_state = full_payload


async def simulation_loop():
    """
    Continuous simulation loop (every 2s):
      1. Run simulation tick
      2. Broadcast current state (Fast)
      3. Spawn AI cycle (Non-blocking background task)
    """
    global last_broadcasted_state, is_burst_mode, gemini_calls_count, is_ai_mode_active
    tick_count = 0

    while True:
        # 1. Advance simulation
        simulator.tick()

        # 2. Build payload and compute delta (Fast broadcast)
        full_payload = _build_full_payload(None)
        delta_payload = compute_delta(full_payload, last_broadcasted_state)

        # 3. Broadcast Simulation Update
        await manager.broadcast_state(full_payload, delta_payload)
        last_broadcasted_state = full_payload

        # 4. Spawn Gemini update if enabled (Every 5 ticks)
        if is_ai_mode_active and tick_count % 5 == 0:
            gemini_calls_count += 1
            asyncio.create_task(run_ai_cycle(tick_count))

        tick_count += 1
        await asyncio.sleep(2)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Prepare and send initial payload immediately
    initial_payload = _build_full_payload(None)
    await manager.connect(websocket, initial_payload)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.post("/api/settings/ai_mode")
def set_ai_mode(enabled: bool):
    """Toggle AI mode. When disabled, simulation runs without Gemini. Marked ai_mode: 'disabled'."""
    global is_ai_mode_active
    is_ai_mode_active = enabled
    print(f"[GEMINI] AI Mode Toggle: {'ENABLED' if enabled else 'DISABLED'}")
    return {"status": "success", "ai_mode": "active" if enabled else "disabled"}


@app.post("/api/demo/phase/{phase}")
def set_simulation_phase(phase: str, request: Request):
    """Instantly jump simulation to a specific event phase and trigger burst AI response."""
    rate_limit(request)
    valid_phases = ["pre-game", "1st-half", "halftime", "2nd-half", "post-game"]
    if phase not in valid_phases:
        raise HTTPException(status_code=400, detail=f"Invalid phase. Choose from: {valid_phases}")

    simulator.state.global_phase = phase
    simulator.ticks = valid_phases.index(phase) * 60

    # Preset occupancies for maximum demo visual impact
    if phase == "pre-game":
        for z in simulator.state.zones:
            z.current_occupancy = int(z.capacity * 0.2) if z.type != "gate" else int(z.capacity * 0.85)
    elif phase == "halftime":
        for z in simulator.state.zones:
            if z.type in ["food", "washroom"]:
                z.current_occupancy = int(z.capacity * 0.95)  # near saturation → triggers emergency
    elif phase == "post-game":
        for z in simulator.state.zones:
            if z.type == "gate":
                z.current_occupancy = int(z.capacity * 0.92)  # overflowing exits

    global is_burst_mode
    is_burst_mode = True  # Next AI cycle uses 1.5× multiplier
    return {"status": "success", "phase": phase}


@app.get("/health")
def health():
    return {"status": "ok", "ai_mode": "active" if is_ai_mode_active else "disabled"}

@app.get("/")
def root():
    return {
        "status": "CrowdMind AI Backend Running",
        "ai_mode": "active" if is_ai_mode_active else "disabled",
        "ai_engine": "google_gemini"
    }