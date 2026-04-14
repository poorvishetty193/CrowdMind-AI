import React, { useState } from 'react';
import { Play, Coffee, LogOut } from 'lucide-react';

export function DemoController() {
  const [loading, setLoading] = useState<string | null>(null);

  const triggerPhase = async (phase: string) => {
    setLoading(phase);
    try {
      await fetch(`http://localhost:8000/api/demo/phase/${phase}`, { method: 'POST' });
    } catch (e) {
      console.error("Failed to trigger demo phase", e);
    }
    setLoading(null);
  };

  return (
    <div className="glass-panel p-4 border border-[#2a2a2a] flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Demo Controller
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
        <button 
          onClick={() => triggerPhase('pre-game')}
          disabled={!!loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm font-medium"
        >
          <Play className="w-4 h-4" /> Simulate Entry Rush
        </button>
        <button 
          onClick={() => triggerPhase('halftime')}
          disabled={!!loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg transition-colors text-sm font-medium"
        >
          <Coffee className="w-4 h-4" /> Simulate Halftime
        </button>
        <button 
          onClick={() => triggerPhase('post-game')}
          disabled={!!loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" /> Simulate Exit Rush
        </button>
      </div>
    </div>
  );
}
