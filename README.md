# 🏟️ CrowdMind AI

An AI-powered system acting as the real-time "nervous system" for large-scale sporting venues. It improves the physical event experience for attendees by predicting crowd movement, minimizing waiting times, and enabling autonomous real-time venue coordination.

---

## 🛑 Problem Statement
Large sporting events suffer from unpredictable crowd spikes, leading to congested gates, overflowing washrooms, and excessive wait times at food stalls. Current systems are purely reactive—dispatching staff *after* a bottleneck has formed—failing to mitigate attendee frustration.

## 🚀 Solution Overview
**CrowdMind AI** solves this by combining a continuous data simulation engine with the advanced reasoning capabilities of **Google Gemini**. Instead of reacting, the system predicts choke points 10-15 minutes in advance and autonomously orchestrates crowd flow (e.g., routing fans to alternative gates or stalls) to optimize real-time venue dynamics.

---

## 🏗️ Simple Architecture

```text
 ┌──────────────────────┐        ┌───────────────────────┐        ┌─────────────────────┐
 │  Continuous Physics  │        │   Google Gemini API   │        │ React Frontend UI   │
 │      Simulator       ├───────►│  (Multi-Agent Engine) ├───────►│ (Delta WebSockets)  │
 │  (Gates, Washrooms)  │        │ Predicts & Auto-Routes│        │ Timeline / Heatmap  │
 └──────────────────────┘        └───────────────────────┘        └─────────────────────┘
```

---

## ✨ Features
- **Dynamic Routing Engine:** Calculates and visualizes paths to avoid congested zones.
- **Predictive Crowd Intelligence:** Forecasts Wait Times +10 minutes into the future seamlessly.
- **Explainable AI (XAI) Panel:** Complete transparency on why decisions were made by the AI.
- **Delta WebSocket Streaming:** Ultra-efficient state streaming sending only changed entities.
- **Accessibility Ready:** Colors paired with textual UI indicators (Low/Medium/High) and aria labels.
- **Demo Mode Controller:** Instantly simulate Halftime, Post-Game, or Pre-Game rushes.

---

## 🤖 Google Services Used
- **Google Gemini API:** Utilized extensively via `google.generativeai` to power the core decision engine, generate wait-time forecasts, and explain "Auto Interventions" in natural language.
- **Google Cloud Run:** Recommended deployment environment for scaling the Python FastAPI backend.
- **Google Firebase Hosting:** Recommended for the React static web application.

---

## 💻 Setup & Deployment

### Local Testing
Ensure you have Python 3.11+ and Node installed.
1. **Clone the Repo**.
2. **Start the Backend:**
   ```bash
   cd backend
   python -m venv venv
   # Windows: .\venv\Scripts\activate | Mac: source venv/bin/activate
   pip install fastapi uvicorn websockets pydantic google-generativeai python-dotenv
   GEMINI_API_KEY="your_api_key_here" uvicorn main:app --port 8000
   ```
3. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Google Cloud Run Deployment
A basic Dockerfile implementation is included for the python environment. You can deploy it instantly using the Google Cloud CLI:
```bash
cd backend
gcloud builds submit --tag gcr.io/[PROJECT-ID]/crowdmind-api
gcloud run deploy crowdmind-api \
  --image gcr.io/[PROJECT-ID]/crowdmind-api \
  --set-env-vars GEMINI_API_KEY="your_key" \
  --allow-unauthenticated
```
Update your frontend `.env` to point to the secure `wss://` URI provided by Cloud Run!
