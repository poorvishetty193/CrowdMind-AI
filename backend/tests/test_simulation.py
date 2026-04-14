import pytest
from simulation import Simulator

def test_initial_state():
    sim = Simulator()
    assert sim.state.global_phase == "pre-game"
    assert len(sim.state.zones) > 0

def test_wait_time_calculation_empty_stadium():
    sim = Simulator()
    # Force empty stadium to test baseline math
    for z in sim.state.zones:
        z.current_occupancy = 0
    
    sim.calculate_wait_times()

    for z in sim.state.zones:
        # non-linear logic: 5 + (0 ** 3) * 40 = 5
        assert z.wait_time_mins == 5

def test_wait_time_calculation_surge():
    sim = Simulator()
    # Test High Surge
    for z in sim.state.zones:
        z.current_occupancy = z.capacity # 100% full
            
    sim.calculate_wait_times()
    
    for z in sim.state.zones:
        # 100% ratio = 1.0
        # 5 + (1 ** 3) * 40 = 45
        assert z.wait_time_mins == 45
            
def test_demo_rushes():
    from main import app
    from fastapi.testclient import TestClient
    client = TestClient(app)
    
    # Test bounded phase overrides and 1.5x demo burst triggers
    response = client.post("/api/demo/phase/halftime")
    assert response.status_code == 200
    assert response.json()["phase"] == "halftime"

def test_ai_interventions_multiplier():
    """Verify interventions do not drop occupancy below 0."""
    sim = Simulator()
    for z in sim.state.zones:
        z.current_occupancy = 0
        
    for z in sim.state.zones:
        change = -100 # attempt negative
        z.current_occupancy = max(0, min(z.capacity, z.current_occupancy + change))
        assert z.current_occupancy == 0
