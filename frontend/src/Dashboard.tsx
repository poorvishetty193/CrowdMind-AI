import React, { useEffect, useState } from 'react';
import { StadiumHeatmap } from './components/StadiumHeatmap';
import { ExplainableAIPanel } from './components/ExplainableAIPanel';
import { PulseGauge, ImpactMetrics } from './components/Metrics';
import { TimelineSlider } from './components/TimelineSlider';
import { DemoController } from './components/DemoController';

export function Dashboard() {
  const [simulationState, setSimulationState] = useState<any>(null);
  const [timelineOffset, setTimelineOffset] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to FastAPI WebSocket
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'full') {
        setSimulationState(payload.data);
      } else if (payload.type === 'delta') {
        setSimulationState((prev: any) => {
          if (!prev) return prev;
          const newZones = prev.zones.map((z: any) => {
            const deltaZone = payload.data.zones?.find((dz: any) => dz.id === z.id);
            return deltaZone ? { ...z, ...deltaZone } : z;
          });
          return { ...prev, ...payload.data, zones: newZones };
        });
      }
    };

    return () => ws.close();
  }, []);

  if (!simulationState && isConnected) {
    return <div className="text-center mt-20 text-gray-400">Syncing with Stadium Mainframe...</div>;
  }
  
  if (!isConnected) {
    return <div className="text-center mt-20 text-red-400">Disconnected from server. Ensure backend is running.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-7xl mx-auto">
      {/* Left Column - Main Map & Impact */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Heatmap & Timeline Wrapper */}
        <div className="glass-panel relative flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium tracking-wide">Dynamic Crowd Heatmap</h2>
            <div className="text-sm px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
              {simulationState.global_phase.toUpperCase()}
            </div>
          </div>
          
          <StadiumHeatmap 
            zones={simulationState.zones} 
            aiInsights={simulationState.ai_insights}
            timelineOffset={timelineOffset} 
          />
          
          <div className="w-full mt-6">
            <TimelineSlider offset={timelineOffset} setOffset={setTimelineOffset} />
          </div>
        </div>

        {/* Impact Metrics Row */}
        <div className="grid grid-cols-2 gap-4">
          <ImpactMetrics metrics={simulationState.ai_insights?.impact_metrics} />
          <PulseGauge score={simulationState.stadium_pulse_score} />
        </div>
      </div>

      {/* Right Column - AI Insights & Automation */}
      <div className="lg:col-span-4 space-y-6">
        <DemoController />
        <div className="h-[500px]">
          <ExplainableAIPanel aiInsights={simulationState.ai_insights} />
        </div>
      </div>
    </div>
  );
}
