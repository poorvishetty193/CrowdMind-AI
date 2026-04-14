import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulation import Simulator
from agents import generate_ai_insights

app = FastAPI(title="CrowdMind AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulator = Simulator()

# We track connections and whether they need a FULL state dump or just DELTAS
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        # Store if a connection needs a full state sync on next tick
        self.needs_full_sync: dict[WebSocket, bool] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.needs_full_sync[websocket] = True

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if websocket in self.needs_full_sync:
            del self.needs_full_sync[websocket]

    async def broadcast_state(self, full_state_dict: dict, delta_state_dict: dict):
        """Sends full state to new connections, and delta state to existing connections to save bandwidth."""
        dead_connections = []
        for connection in self.active_connections:
            try:
                if self.needs_full_sync.get(connection):
                    await connection.send_json({"type": "full", "data": full_state_dict})
                    self.needs_full_sync[connection] = False
                else:
                    # Only send if there are actually changes
                    if delta_state_dict.get("zones"):
                        await connection.send_json({"type": "delta", "data": delta_state_dict})
            except Exception:
                dead_connections.append(connection)
                
        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()
last_broadcasted_state = None

def compute_delta(current_state: dict, previous_state: dict) -> dict:
    """Computes the difference between simulation states to reduce WebSocket payload."""
    if not previous_state:
        return current_state
    
    delta = {
        "timestamp": current_state["timestamp"],
        "stadium_pulse_score": current_state["stadium_pulse_score"],
        "global_phase": current_state["global_phase"],
        "ai_insights": current_state["ai_insights"]
    }
    
    changed_zones = []
    prev_zones_map = {z["id"]: z for z in previous_state["zones"]}
    
    for zone in current_state["zones"]:
        prev_zone = prev_zones_map.get(zone["id"])
        # Only send zone if occupancy or wait time changed
        if not prev_zone or prev_zone["current_occupancy"] != zone["current_occupancy"] or prev_zone["wait_time_mins"] != zone["wait_time_mins"]:
            # Send minimal data: ID, wait time, occupancy
            changed_zones.append({
                "id": zone["id"],
                "current_occupancy": zone["current_occupancy"],
                "wait_time_mins": zone["wait_time_mins"]
            })
            
    delta["zones"] = changed_zones
    return delta

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(simulation_loop())

async def simulation_loop():
    """Background task to run simulation ticks and broadcast updates."""
    global last_broadcasted_state
    tick_count = 0
    
    while True:
        state = simulator.tick()
        state_dict = state.model_dump()
        
        # Every 5 seconds, query Gemini AI for predictions to avoid rate limits
        if tick_count % 5 == 0:
            state_json = json.dumps(state_dict)
            ai_data = generate_ai_insights(state_json)
            state_dict["ai_insights"] = ai_data
            simulator._last_ai = ai_data
        else:
            state_dict["ai_insights"] = getattr(simulator, "_last_ai", generate_ai_insights(json.dumps(state_dict)))
            
        tick_count += 1
        
        delta_dict = compute_delta(state_dict, last_broadcasted_state)
        
        await manager.broadcast_state(state_dict, delta_dict)
        last_broadcasted_state = state_dict
            
        await asyncio.sleep(2) 

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open, can receive frontend pings
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- DEMO CONTROLLER ENDPOINTS ---

@app.post("/api/demo/phase/{phase}")
def set_simulation_phase(phase: str):
    """Overrides the ongoing simulation phase to immediately demonstrate 'Empty', 'Rush', etc."""
    valid_phases = ["pre-game", "1st-half", "halftime", "2nd-half", "post-game"]
    if phase not in valid_phases:
        raise HTTPException(status_code=400, detail=f"Invalid phase. Must be one of {valid_phases}")
    
    simulator.state.global_phase = phase
    # Reset ticks so it stays in this phase for a while
    simulator.ticks = valid_phases.index(phase) * 60
    
    # If pre-game (Entry Rush), empty the gates a bit so they can fill rapidly
    if phase == "pre-game":
        for z in simulator.state.zones:
            z.current_occupancy = 10 if z.type != "gate" else 100
    # If halftime, force rush to food
    elif phase == "halftime":
        for z in simulator.state.zones:
            if z.type in ["food", "washroom"]:
                z.current_occupancy = int(z.capacity * 0.8)
    
    return {"status": "success", "phase": phase}

@app.get("/health")
def health():
    return {"status": "ok"}
