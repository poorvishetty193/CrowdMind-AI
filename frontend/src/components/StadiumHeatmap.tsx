import React from 'react';

export const StadiumHeatmap = React.memo(function StadiumHeatmap({ zones, aiInsights, timelineOffset }: { zones: any[], aiInsights: any, timelineOffset: number }) {
  // Helper to determine what value to show
  const getWaitTime = (zone: any) => {
    if (timelineOffset === 0) return zone.wait_time_mins;
    
    // Attempt to find prediction from AI
    const pred = aiInsights?.zone_predictions?.find((z: any) => z.zone_id === zone.id);
    if (pred && Object.keys(pred).includes('predicted_wait_time_10m')) {
      // Smoothly interpolate dummy vs AI
      const diff = pred.predicted_wait_time_10m - zone.wait_time_mins;
      const step = diff / 15; // diff per minute
      return Math.round(zone.wait_time_mins + (step * timelineOffset));
    }
    return zone.wait_time_mins; // Fallback
  };

  const getStatus = (waitTime: number) => {
    if (waitTime < 5) return { color: 'bg-emerald-500 shadow-emerald-500/50', label: 'Low', textColor: 'text-emerald-400' };
    if (waitTime < 15) return { color: 'bg-yellow-500 shadow-yellow-500/50', label: 'Medium', textColor: 'text-yellow-400' };
    return { color: 'bg-red-500 shadow-red-500/50 animate-pulse', label: 'High', textColor: 'text-red-400' };
  };

  // We'll hardcode some logical SVG paths to demonstrate "Routing"
  const isRoutingActive = aiInsights?.auto_decisions?.length > 0;

  return (
    <div className="relative w-full aspect-video bg-[#111] rounded-xl overflow-hidden border border-[#2a2a2a]" aria-label="Live Stadium Crowd Heatmap Visualization">
      {/* Decal background */}
      <div className="absolute inset-x-0 bottom-0 top-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-500 via-[#111] to-[#111]"></div>
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl rounded-b-none pointer-events-none"></div>
      
      {/* SVG Path Layer (Routing Visualization) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        
        {/* Fake routing paths */}
        <path d="M 25% 10% Q 15% 20% 20% 30%" stroke={isRoutingActive ? "#10B981" : "#333"} strokeWidth="2" fill="none" strokeDasharray={isRoutingActive ? "5,5" : ""} className={isRoutingActive ? "animate-[dash_2s_linear_infinite]" : ""} />
        <path d="M 50% 10% Q 40% 15% 35% 20%" stroke={isRoutingActive ? "#3B82F6" : "#333"} strokeWidth="2" fill="none" strokeDasharray={isRoutingActive ? "5,5" : ""} className={isRoutingActive ? "animate-[dash_3s_linear_infinite]" : ""} />
        <path d="M 50% 90% Q 70% 85% 80% 30%" stroke={isRoutingActive ? "#10B981" : "#333"} strokeWidth="2" fill="none" strokeDasharray={isRoutingActive ? "5,5" : ""} className={isRoutingActive ? "animate-[dash_4s_linear_infinite]" : ""} />
        
        <style>{`
          @keyframes dash {
            to { stroke-dashoffset: -20; }
          }
        `}</style>
      </svg>

      {/* Nodes Layer */}
      <div className="absolute inset-0">
        {zones.map((zone: any) => {
          const waitVal = getWaitTime(zone);
          const status = getStatus(waitVal);
          
          return (
            <div 
              key={zone.id} 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-700 ease-in-out"
              style={{ left: `${zone.coordinates.x}%`, top: `${zone.coordinates.y}%` }}
              aria-label={`${zone.name} - ${status.label} congestion, ${waitVal} minutes wait`}
              role="img"
            >
              {/* Node Visual */}
              <div className={`w-8 h-8 rounded-full ${status.color} shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ring-4 ring-black/40`}>
                <span className="text-[10px] font-bold text-white shadow-sm" aria-hidden="true">{waitVal}m</span>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-700">
                <p className="font-semibold text-emerald-400">{zone.name}</p>
                <div className="mt-1 flex justify-between gap-4 text-gray-300">
                  <span>Occupancy:</span>
                  <span>{zone.current_occupancy} / {zone.capacity}</span>
                </div>
                <div className="mt-1 flex justify-between gap-4 text-gray-300">
                  <span>Wait {timelineOffset === 0 ? "(Live)" : `(+${timelineOffset}m)`}:</span>
                  <span className="font-bold">{waitVal} mins <span className={status.textColor}>({status.label})</span></span>
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/90"></div>
              </div>
              
              {/* Label below node indicating accessibility text as requested */}
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="whitespace-nowrap bg-black/60 px-2 py-0.5 rounded text-[10px] text-gray-300 font-medium tracking-wide">
                  {zone.name.split(' ')[0]} {/* Short name */}
                </span>
                <span className={`text-[9px] font-bold mt-0.5 ${status.textColor} drop-shadow-md`} aria-hidden="true">
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
