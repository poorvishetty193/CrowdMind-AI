# 🧠 CrowdMind AI – Autonomous Stadium Safety System

**Powered by Google Gemini AI**

CrowdMind AI is a state-of-the-art, real-time crowd management platform designed to prevent stadium disasters and optimize fan experience. Unlike traditional systems, CrowdMind uses **Google Gemini 2.0 Flash** to make autonomous, high-stakes routing decisions in milliseconds.

---

## 🚀 What Makes This Unique?
* **Real-Time AI Decision Engine**: Every routing choice is generated dynamically by Google Gemini based on live stadium telemetry.
* **Autonomous Control**: The system doesn't just monitor; it *acts* by redistributing crowds to prevent critical saturation.
* **Explainable AI (XAI)**: Every decision comes with Gemini-generated reasoning, confidence scores, and alternatives considered.
* **Predictive Wait Times**: Gemini predicts future congestion 5-15 minutes in advance, allowing for pre-emptive action.

---

## 🧠 How Gemini Drives the System
The core loop of CrowdMind AI is fully driven by Google Gemini:
1. **Simulation**: The system models thousands of attendees moving between zones.
2. **Telemetry**: Raw zone data (occupancy, capacity, wait times) is sent to Gemini.
3. **Intelligence (Gemini)**: Gemini analyzes the state, identifies hazards, and generates routing decisions.
4. **Execution**: The backend applies Gemini's decisions directly to the live environment.
5. **UI Visibility**: The dashboard reflects Gemini's "thought process" in real-time.

---

## ⚡ AI Impact Demonstration

CrowdMind natively ships with deep UX overlays to prove algorithmic determinism:
- **Toggled AI Comparisons:** Manually hitting **🤖 AI Mode OFF** disables Gemini extraction. You can visually prove that without explicit Real-Time GenAI predictions, bottlenecks explode to `~50 mins` natively. Turning it **ON** forces Gemini to scrub queues and visually displace load across the active SVG heatmap laser fields.
- **Emergency Protocols:** If an un-managed node suddenly eclipses 90% tolerance, Gemini triggers an aggressive logic block dropping 50% displacement arrays instantly marked with Red `🚨` alert tracking on the Explainable AI panel.
- **Narration Scraping:** Gemini reads the exact real-time map structure and renders explicit text evaluations scrolling actively across the top control banner.
- **Decision Replays:** At any time, push `🎬 Replay AI Optimization` to command the React cache to scrub backwards explicitly mapping the active Reroute bounds historically.

---

## ☁️ Google Cloud Stack

- **Google Gemini 2.0 Flash:** High-performance Generative AI Core providing rapid, asynchronous control commands via strict Pydantic JSON mapping routines. 
- **Google Cloud Run:** FastAPI WebSocket architecture featuring non-blocking background AI cycles for 24/7 stadium throughput.
- **Firebase Hosting:** Global `Vite/React` delivery seamlessly handling real-time SVG heatmap updates and AI telemetry synchronization.
- *(Optional)* **Cloud Logging:** The explicit `decision_id` tokens natively appended on the backend guarantee absolute audit traceability inside typical Cloud Logs.

---

## 💻 Local Setup

1. **Start Backend:**
   ```bash
   cd backend
   python -m venv venv
   # Windows: .\venv\Scripts\activate
   pip install fastapi uvicorn websockets pydantic google-genai python-dotenv
   # Create a .env file with GEMINI_API_KEY=your_key
   uvicorn main:app --port 8000
   ```
2. **Start Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🤖 AI vs No-AI Mode

The system allows **direct comparison between AI-driven and non-AI behavior**, clearly demonstrating the impact of Google Gemini.

Toggle the **🤖 AI Mode** button in the dashboard to switch between:
- **ON (Gemini Active):** All routing decisions flow through Gemini. The simulation is actively managed — you see wait times drop, crowds balance, and laser paths fire across the heatmap.
- **OFF (Simulation Only):** Gemini calls are completely disabled. The backend marks all payloads `"ai_mode": "disabled"`. With no AI intervention, exponential wait-time growth causes zones to saturate rapidly — visually proving that Gemini is the controlling intelligence.

---

## 🎬 Replay AI Optimization

The React frontend maintains a **rolling circular buffer of the last 30 simulation frames**. Clicking **🎬 Replay AI Optimization** pauses the live WebSocket feed and replays these frames sequentially at 500ms intervals, showing the exact before-and-after trajectory of a Gemini intervention — with all animations (laser paths, halo rings, zone color transitions) intact.

---

## 🚨 Emergency AI Mode

When any zone exceeds **90% occupancy**, the backend automatically switches to emergency mode:
- Gemini receives an escalated prompt with `"EMERGENCY OPTIMIZATION MODE"` context
- Rerouting multiplier increases from 30% → **50% of zone occupancy**
- The dashboard shows a red pulsing `🚨 Emergency AI Mode: ACTIVE` banner
- The Explainable AI Panel highlights the critical zone and shows emergency reasoning

---

## 📊 Gemini Telemetry

Every AI cycle is tracked and surfaced in the UI:

| Metric | Description |
|---|---|
| `gemini_calls_count` | Total times Gemini API was called |
| `gemini_decisions_count` | Total routing decisions applied to the simulation |
| `prediction_count` | Total zone predictions received |
| `wait_time_reduced_percentage` | Computed reduction from AI routing |

These are broadcast via WebSocket in `ai_metadata` and displayed in the top telemetry bar as:
> **"Powered by Google Gemini AI | X Gemini Calls | Y AI Decisions | Z Predictions"**

---

## ⚡ Real-Time Responsiveness

CrowdMind AI features a **Non-Blocking AI Pipeline** to ensure consistent frame rates:
- **Instant Sync:** Initial stadium state is pushed on connection to eliminate "Syncing..." delays.
- **Asymmetric processing:** Simulation ticks occur strictly every 2 seconds, while Gemini AI analysis runs in background tasks, pushing decision updates the instant they are ready.
- **WebSocket Efficiency:** Delta-based updates minimize bandwidth while ensuring AI narration and metrics always remain fresh.
