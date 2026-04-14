import React from 'react';
import { Clock } from 'lucide-react';

export function TimelineSlider({ offset, setOffset }: { offset: number, setOffset: (v: number) => void }) {
  const values = [0, 5, 10, 15]; // minutes
  
  return (
    <div className="bg-[#1C1C1C] rounded-lg p-4 border border-gray-800 w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" /> Predictive Timeline Explorer
        </label>
        <span className="text-cyan-400 font-semibold text-sm">
          {offset === 0 ? "LIVE" : `+${offset} Mins Predicted`}
        </span>
      </div>
      
      <div className="relative pt-1">
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          value={values.indexOf(offset)}
          onChange={(e) => setOffset(values[parseInt(e.target.value)])}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <div className="w-full flex justify-between text-xs text-gray-500 mt-2 px-1">
          <span>Now</span>
          <span>+5m</span>
          <span>+10m</span>
          <span>+15m</span>
        </div>
      </div>
    </div>
  );
}
