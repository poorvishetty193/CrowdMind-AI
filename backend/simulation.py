import random
import time
from typing import Dict, List
from pydantic import BaseModel

class Zone(BaseModel):
    id: str
    name: str
    type: str # 'gate', 'food', 'washroom', 'section'
    capacity: int
    current_occupancy: int
    wait_time_mins: int
    coordinates: Dict[str, float] # {x, y} for frontend spatial mapping

class SimulationState(BaseModel):
    timestamp: float
    stadium_pulse_score: int
    zones: List[Zone]
    global_phase: str # 'pre-game', '1st-half', 'halftime', '2nd-half', 'post-game'

# Initial basic layout
INITIAL_ZONES = [
    Zone(id="g1", name="Gate 1 (North)", type="gate", capacity=2000, current_occupancy=400, wait_time_mins=2, coordinates={"x": 50, "y": 10}),
    Zone(id="g2", name="Gate 2 (South)", type="gate", capacity=2000, current_occupancy=500, wait_time_mins=3, coordinates={"x": 50, "y": 90}),
    Zone(id="f1", name="Food Stall A", type="food", capacity=300, current_occupancy=50, wait_time_mins=5, coordinates={"x": 20, "y": 30}),
    Zone(id="f2", name="Food Stall B", type="food", capacity=300, current_occupancy=250, wait_time_mins=25, coordinates={"x": 80, "y": 30}),
    Zone(id="w1", name="Washroom North", type="washroom", capacity=100, current_occupancy=40, wait_time_mins=1, coordinates={"x": 35, "y": 20}),
    Zone(id="w2", name="Washroom South", type="washroom", capacity=100, current_occupancy=90, wait_time_mins=15, coordinates={"x": 65, "y": 80}),
]

class Simulator:
    def __init__(self):
        self.state = SimulationState(
            timestamp=time.time(),
            stadium_pulse_score=40,
            zones=[z.model_copy() for z in INITIAL_ZONES],
            global_phase="pre-game"
        )
        self.ticks = 0
        
    def tick(self):
        """Advances simulation by one step."""
        self.ticks += 1
        
        # Simple cyclic phase changes
        if self.ticks % 60 == 0:
            phases = ["pre-game", "1st-half", "halftime", "2nd-half", "post-game"]
            current_idx = phases.index(self.state.global_phase)
            self.state.global_phase = phases[(current_idx + 1) % len(phases)]

        total_occupancy = 0
        total_capacity = 0
        
        # Apply random walks with trends based on phase
        for zone in self.state.zones:
            change = random.randint(-20, 20)
            
            # Phase-specific logic
            if self.state.global_phase == "pre-game" and zone.type == "gate":
                change += random.randint(10, 40) # Gates fill up
            elif self.state.global_phase == "halftime" and zone.type in ["food", "washroom"]:
                change += random.randint(30, 80) # Rush to food/washrooms
            elif self.state.global_phase == "post-game" and zone.type == "gate":
                change += random.randint(50, 100) # Rush to exit
                
            zone.current_occupancy = max(0, min(zone.capacity, zone.current_occupancy + change))
            
            # Simple Wait time heuristic based on occupancy %
            occupancy_ratio = zone.current_occupancy / zone.capacity
            if zone.type == "gate":
                zone.wait_time_mins = int((zone.current_occupancy / 100)) # e.g. 500 = 5 mins
            elif zone.type in ["food", "washroom"]:
                zone.wait_time_mins = int(occupancy_ratio * 30) # Max 30 mins
                
            total_occupancy += zone.current_occupancy
            total_capacity += zone.capacity

        # Update stadium pulse score (Stress level 0-100)
        overall_ratio = total_occupancy / total_capacity if total_capacity > 0 else 0
        
        # High variation means people are unevenly distributed (bottlenecks)
        ratios = [z.current_occupancy / z.capacity for z in self.state.zones]
        variance = max(ratios) - min(ratios) if ratios else 0
        
        self.state.stadium_pulse_score = int((overall_ratio * 50) + (variance * 50))
        self.state.timestamp = time.time()
        
        return self.state
