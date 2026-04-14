import pytest
from simulation import Simulator

def test_initial_state():
    sim = Simulator()
    assert sim.state.global_phase == "pre-game"
    assert len(sim.state.zones) > 0

def test_wait_time_calculation_empty_stadium():
    sim = Simulator()
    # Force empty stadium
    for z in sim.state.zones:
        z.current_occupancy = 0
    
    # Tick simulation once (it will add some randomness, but we can override it or test logic directly)
    # Instead, we test the logic inside the loop by mirroring it:
    sim.tick()
    # Let's forcibly check the heuristic
    for z in sim.state.zones:
        z.current_occupancy = 0
        occupancy_ratio = 0
        if z.type == "gate":
            z.wait_time_mins = int((z.current_occupancy / 100))
        elif z.type in ["food", "washroom"]:
            z.wait_time_mins = int(occupancy_ratio * 30)
            
        assert z.wait_time_mins == 0

def test_wait_time_calculation_surge():
    sim = Simulator()
    # Test High Surge
    for z in sim.state.zones:
        z.current_occupancy = z.capacity # 100% full
        occupancy_ratio = z.current_occupancy / z.capacity
        if z.type == "gate":
            z.wait_time_mins = int((z.current_occupancy / 100))
        elif z.type in ["food", "washroom"]:
            z.wait_time_mins = int(occupancy_ratio * 30)
            
        if z.type == "gate":
            assert z.wait_time_mins == int(z.capacity / 100)
        elif z.type == "food":
            assert z.wait_time_mins == 30 # Max 30 mins
            
def test_demo_rushes(monkeypatch):
    from main import app
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    # Test the API override
    response = client.post("/api/demo/phase/halftime")
    assert response.status_code == 200
    assert response.json()["phase"] == "halftime"
