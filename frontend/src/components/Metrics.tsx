import React from 'react';
import { Activity, Zap, TrendingDown } from 'lucide-react';

export function PulseGauge({ score }: { score: number }) {
  // Score 0-100: 0 = smooth, 100 = high stress
  const getColor = (s: number) => {
    if (s < 40) return 'text-emerald-400 stroke-emerald-400';
    if (s < 75) return 'text-amber-400 stroke-amber-400';
    return 'text-red-500 stroke-red-500';
  };

  const colorClass = getColor(score);
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const dashArray = `${normalizedScore}, 100`;

  return (
    <div className="glass-panel flex flex-col relative overflow-hidden h-full">
      <h3 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" /> Stadium Pulse Score
      </h3>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Simple SVG Radial gauge */}
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            <path
              className="stroke-gray-700"
              fill="none"
              strokeWidth="3"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${colorClass.split(' ')[1]} transition-all duration-1000 ease-out`}
              fill="none"
              strokeWidth="3"
              strokeDasharray={dashArray}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={`text-3xl font-bold ${colorClass.split(' ')[0]}`}>{score}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500 text-center max-w-[80%]">Aggregate stress index based on density variance and fill rates.</p>
      </div>
    </div>
  );
}

export function ImpactMetrics({ metrics }: { metrics: any }) {
  const waitSaved = metrics?.["Wait Time Saved"] || "0 mins";
  const congestion = metrics?.["Congestion Avoided"] || "None";

  return (
    <div className="glass-panel flex flex-col justify-center gap-4 h-full">
      <h3 className="text-gray-400 text-sm font-medium flex items-center gap-2 mb-2">
        <TrendingDown className="w-4 h-4" /> Cumulative Impact
      </h3>
      
      <div className="bg-[#1C1C1C] rounded-lg p-3 border border-gray-800">
        <div className="text-xs text-gray-500 mb-1">Total Wait Time Saved</div>
        <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-500/50" /> {waitSaved}
        </div>
      </div>
      
      <div className="bg-[#1C1C1C] rounded-lg p-3 border border-gray-800">
        <div className="text-xs text-gray-500 mb-1">Congestion Overrides</div>
        <div className="text-lg text-gray-200">
          {congestion}
        </div>
      </div>
    </div>
  );
}
