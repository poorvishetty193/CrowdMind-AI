import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StadiumHeatmap } from './components/StadiumHeatmap.tsx';
import { ExplainableAIPanel } from './components/ExplainableAIPanel.tsx';
import { PulseGauge, ImpactMetrics, GeminiTelemetry } from './components/Metrics.tsx';
import { TimelineSlider } from './components/TimelineSlider.tsx';
import { DemoController } from './components/DemoController.tsx';
import { Zap, PlayCircle, PauseCircle, Bot, PowerOff, Loader2, AlertTriangle } from 'lucide-react';

const WS_URL = 'ws://localhost:8000/ws';
const API_URL = 'http://localhost:8000';

export function Dashboard() {
  const [simulationState, setSimulationState] = useState<any>(null);
  const [timelineOffset, setTimelineOffset] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isAiMode, setIsAiMode] = useState(true);
  const [isGeminiProcessing, setIsGeminiProcessing] = useState(false);

  // Replay Mode
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const framesBuffer = useRef<any[]>([]);
  const isReplayingRef = useRef(false);  // ref to avoid stale closure in onmessage

  // Toasts
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const prevDecisions = useRef(0);

  // Keep ref in sync with state
  useEffect(() => { isReplayingRef.current = isReplaying; }, [isReplaying]);

  // ─── WebSocket Connection ───────────────────────────────────────────────────
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WS] Connected');
      };
      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WS] Disconnected — reconnecting in 3s');
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onmessage = (event) => {
        if (isReplayingRef.current) return; // block live updates during replay

        const payload = JSON.parse(event.data);
        let nextState: any = null;

        if (payload.type === 'full') {
          nextState = payload.data;
          setSimulationState(nextState);
          console.log('[WS] Full sync received');
        } else if (payload.type === 'delta') {
          // Merge delta into previous state
          setSimulationState((prev: any) => {
            if (!prev) return prev;
            const updatedZones = prev.zones.map((z: any) => {
              const dz = payload.data.zones?.find((d: any) => d.id === z.id);
              return dz ? { ...z, ...dz } : z;
            });
            nextState = {
              ...prev,
              ...payload.data,
              zones: updatedZones,
            };
            return nextState;
          });
        }

        // Buffer frames for replay (use setTimeout to get state after merge)
        setTimeout(() => {
          setSimulationState((current: any) => {
            if (current) {
              framesBuffer.current = [...framesBuffer.current.slice(-29), current];
            }
            return current;
          });
        }, 50);
      };
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  // ─── Replay Scrubber ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReplaying || framesBuffer.current.length === 0) return;
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= framesBuffer.current.length) {
        setIsReplaying(false);
        isReplayingRef.current = false;
        clearInterval(interval);
        return;
      }
      setSimulationState(framesBuffer.current[idx]);
      setReplayIndex(idx);
      idx++;
    }, 500);
    return () => clearInterval(interval);
  }, [isReplaying]);

  // ─── AI Mode Toggle ────────────────────────────────────────────────────────
  const toggleAiMode = useCallback(async () => {
    const next = !isAiMode;
    setIsAiMode(next);
    try {
      await fetch(`${API_URL}/api/settings/ai_mode?enabled=${next}`, { method: 'POST' });
    } catch (e) {
      console.error('[AI Mode] Failed to update backend', e);
    }
  }, [isAiMode]);

  // ─── Replay Trigger ────────────────────────────────────────────────────────
  const triggerReplay = useCallback(() => {
    if (framesBuffer.current.length < 2) return;
    setReplayIndex(0);
    isReplayingRef.current = true;
    setIsReplaying(true);
    setSimulationState(framesBuffer.current[0]);
  }, []);

  // ─── Toast on new AI decision ──────────────────────────────────────────────
  useEffect(() => {
    const decCount = simulationState?.ai_metadata?.gemini_decisions_count ?? 0;
    if (decCount > prevDecisions.current) {
      prevDecisions.current = decCount;
      const dec = simulationState?.ai_insights?.decisions?.[0];
      if (dec) {
        const msg = `⚡ Gemini [${dec.confidence_score}% conf]: Moved ${dec.people} people ${dec.from_zone} → ${dec.to_zone}`;
        setToast({ id: Date.now(), message: msg });
        setTimeout(() => setToast(null), 6000);
      }
    }
    // Track when Gemini is "processing" (narration contains awaiting/initializing)
    const narration = simulationState?.ai_insights?.narration ?? '';
    setIsGeminiProcessing(narration.toLowerCase().includes('await') || narration.toLowerCase().includes('initializ'));
  }, [simulationState]);

  // ─── Skeleton / connection guards ─────────────────────────────────────────
  if (!isConnected && !simulationState) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        <p className="text-sm tracking-widest uppercase">Waiting for AI data stream...</p>
        <p className="text-xs text-gray-600">Ensure backend is running on port 8000</p>
      </div>
    );
  }

  if (!simulationState) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <p className="text-sm tracking-widest uppercase">Syncing AI Core...</p>
      </div>
    );
  }

  const aiMode = simulationState?.ai_metadata?.ai_mode ?? (isAiMode ? 'active' : 'disabled');
  const isEmergency = simulationState?.zones?.some((z: any) => z.current_occupancy / (z.capacity || 1) > 0.9);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 relative overflow-visible pb-10">

      {/* ── Toast ─────────────────────────────────────────── */}
      <div className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-500 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        {toast && (
          <div className="bg-gradient-to-r from-[#172b22] to-emerald-900 border-2 border-emerald-500 text-emerald-100 p-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-3">
            <Zap className="w-5 h-5 text-emerald-400 animate-pulse flex-shrink-0" />
            <p className="font-semibold text-sm tracking-wide">{toast.message}</p>
          </div>
        )}
      </div>

      {/* ── Emergency Banner ─────────────────────────────── */}
      {isEmergency && isAiMode && (
        <div className="w-full bg-red-900/40 border border-red-500/60 rounded-lg px-4 py-2 flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <span className="text-red-400 text-lg">🚨</span>
          <span className="text-red-200 font-bold text-sm uppercase tracking-widest">Emergency AI Mode: ACTIVE</span>
          <span className="text-red-300 text-xs ml-2">— Gemini prioritizing safety routing at 50% displacement</span>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center border-b border-[#2a2a2a] pb-5 pt-3 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            CrowdMind AI
            <span className={`text-[12px] px-3 py-1.5 rounded-full uppercase border-2 font-black tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] ${aiMode === 'active' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
              {aiMode === 'active' ? '🧠 Powered by Google Gemini AI – Real-Time Decision Engine' : '⚙️ AI Mode: OFF (Manual Simulation)'}
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 tracking-widest uppercase">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
            {isGeminiProcessing
              ? '🧠 Gemini Processing...'
              : isConnected
              ? '⚡ Live AI Updates Active — Generated by Google Gemini AI'
              : 'Reconnecting...'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* AI Mode Toggle */}
          <button
            onClick={toggleAiMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-all duration-300 ${
              isAiMode
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20'
            }`}
          >
            {isAiMode ? <Bot className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
            🤖 AI Mode {isAiMode ? 'ON (Gemini Active)' : 'OFF (Simulation Only)'}
          </button>

          {/* Replay */}
          <button
            onClick={triggerReplay}
            disabled={isReplaying || framesBuffer.current.length < 2}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 disabled:opacity-40 transition-all"
          >
            {isReplaying
              ? <><PauseCircle className="w-4 h-4 animate-pulse" /> Replaying...</>
              : <><PlayCircle className="w-4 h-4" /> 🎬 Replay AI Optimization</>}
          </button>

          <div className="h-8 w-px bg-gray-700" />
          <DemoController />
        </div>
      </div>

      {/* ── Narration Marquee ─────────────────────────────── */}
      {simulationState?.ai_insights?.narration && isAiMode && (
        <div className="w-full bg-blue-900/20 border-y border-blue-500/30 py-3 overflow-hidden shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
          <div className="text-blue-400 text-sm font-bold whitespace-nowrap animate-[marquee_25s_linear_infinite] flex items-center gap-10">
            <span>🧠 [REAL-TIME GEMINI NARRATION] • {simulationState.ai_insights.narration}</span>
            <span>⚡ SYSTEM IMPACT: Wait times reduced by {simulationState?.ai_telemetry?.wait_time_reduced_percentage ?? 0}%</span>
            <span>🧠 [DECISION ENGINE] • Processing live stadium telemetry via Google Gemini API</span>
            <span className="opacity-50">• {new Date().toLocaleTimeString()} •</span>
          </div>
        </div>
      )}

      {/* ── Replay Banner ──────────────────────────────────── */}
      {isReplaying && (
        <div className="w-full bg-purple-900/40 border-2 border-purple-500/60 py-4 rounded-xl text-center text-purple-100 font-black text-sm uppercase tracking-[0.2em] animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.3)]">
          <span className="flex items-center justify-center gap-4">
             <span className="animate-spin text-lg">🎬</span> 
             AI OPTIMIZATION REPLAY – DEMONSTRATING IMPACT ACCROSS STADIUM NODES
             <span className="bg-purple-600 px-3 py-1 rounded text-xs font-mono ml-4">FRAME {replayIndex + 1} / {framesBuffer.current.length}</span>
          </span>
        </div>
      )}

      {/* ── Main Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

        {/* Telemetry Bar — full width */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <GeminiTelemetry
              telemetry={simulationState.ai_telemetry}
              metadata={simulationState.ai_metadata}
              lastUpdate={simulationState.timestamp}
              isAiMode={isAiMode}
            />
          </div>
          
          {/* Top Critical Zone Card */}
          <div className="glass-panel p-4 border border-red-500/30 bg-red-950/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Top Critical Zone
              </span>
              <span className="text-[9px] text-gray-500 font-mono">LIVE AI SCAN</span>
            </div>
            {(() => {
              const mostCongested = [...(simulationState.zones || [])].sort((a, b) => (b.current_occupancy / b.capacity) - (a.current_occupancy / a.capacity))[0];
              const isHigh = mostCongested && (mostCongested.current_occupancy / mostCongested.capacity) > 0.8;
              return mostCongested ? (
                <div className="mt-2">
                  <div className="text-lg font-bold text-gray-100 leading-none">{mostCongested.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${(mostCongested.current_occupancy / mostCongested.capacity) * 100}%` }} />
                    </div>
                    <span className={`text-xs font-bold ${isHigh ? 'text-red-400' : 'text-amber-400'}`}>
                      {Math.round((mostCongested.current_occupancy / mostCongested.capacity) * 100)}%
                    </span>
                  </div>
                  <div className="text-[9px] text-emerald-400 mt-2 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> {isAiMode ? 'Gemini Routing Active' : 'Rerouting Disabled'}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Left: Map + metrics */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-4 border border-[#2a2a2a] relative">
            <div className="absolute top-2 right-3 text-[10px] text-gray-600 uppercase tracking-widest">Live Aerial View</div>
            <StadiumHeatmap
              zones={simulationState.zones}
              aiInsights={simulationState.ai_insights}
              timelineOffset={timelineOffset}
            />
          </div>

          <TimelineSlider offset={timelineOffset} setOffset={setTimelineOffset} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[220px]">
            <PulseGauge score={simulationState?.stadium_pulse_score ?? 0} />
            <ImpactMetrics
              aiTelemetry={simulationState?.ai_telemetry}
              aggregateImpact={simulationState?.ai_insights?.aggregate_impact}
            />
          </div>
        </div>

        {/* Right: Explainable AI Panel */}
        <div className="lg:col-span-4 min-h-[500px]">
          <ExplainableAIPanel
            aiInsights={simulationState.ai_insights}
            isAiMode={isAiMode}
          />
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
