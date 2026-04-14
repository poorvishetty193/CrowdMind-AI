import os
import json
import google.generativeai as genai
from pydantic import BaseModel, Field
from typing import List, Dict

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class AgentResponse(BaseModel):
    alerts: List[str] = Field(description="List of real-time alerts about upcoming congestion")
    auto_decisions: List[str] = Field(description="Decisions the AI has taken automatically to offload stress")
    impact_metrics: Dict[str, str] = Field(description="Metrics like 'Wait Time Saved', 'Congestion Avoided'")
    zone_predictions: List[Dict[str, int]] = Field(description="List of dicts: {'zone_id': '...', 'predicted_wait_time_10m': 12}")
    explainable_ai_reasoning: str = Field(description="Explanation of why these decisions were made")

def generate_ai_insights(simulation_state_json: str) -> dict:
    """Takes in the current simulation state JSON string and uses Gemini to generate insights."""
    if not api_key:
        return _mock_ai_insights()

    prompt = f"""
    You are the 'CrowdMind AI' Agent, analyzing real-time stadium metrics.
    Here is the current state of the stadium (JSON format):
    {simulation_state_json}
    
    Based on the capacities, current occupancies, and wait times, provide:
    1. Alerts for which zones will hit capacity in 5-10 minutes.
    2. Auto Decisions you are routing (e.g., 'Routing 200 fans from Gate 1 to Gate 2').
    3. Impact metrics (Wait Time Saved, Congestion Avoided).
    4. Provide the predicted wait time in 10 minutes for EACH zone.
    5. A brief explanation of your reasoning (Explainable AI).
    
    Output strictly in the specified JSON format.
    """
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash", generation_config={"response_mime_type": "application/json"})
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return _mock_ai_insights()

def _mock_ai_insights() -> dict:
    return {
        "alerts": ["Gate 1 is approaching peak capacity", "Rush expected at Food Stall B soon"],
        "auto_decisions": ["Routed 100 incoming fans from Gate 1 to Gate 2", "Suggested Washroom North to 50 fans near South Gate"],
        "impact_metrics": {
            "Wait Time Saved": "150 mins total",
            "Congestion Avoided": "High (Gate 1)"
        },
        "zone_predictions": [
            {"zone_id": "g1", "predicted_wait_time_10m": 10},
            {"zone_id": "g2", "predicted_wait_time_10m": 4},
            {"zone_id": "f1", "predicted_wait_time_10m": 12},
            {"zone_id": "f2", "predicted_wait_time_10m": 35},
            {"zone_id": "w1", "predicted_wait_time_10m": 3},
            {"zone_id": "w2", "predicted_wait_time_10m": 18}
        ],
        "explainable_ai_reasoning": "Detected 95% occupancy at Gate 1; proactive rerouting prevents bottleneck. Food Stall B historical trends during halftime."
    }
