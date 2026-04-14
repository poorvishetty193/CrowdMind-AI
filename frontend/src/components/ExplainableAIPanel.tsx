import React from 'react';
import { BrainCircuit, Beaker, BellRing } from 'lucide-react';

export function ExplainableAIPanel({ aiInsights }: { aiInsights: any }) {
  if (!aiInsights) return <div className="glass-panel p-6 animate-pulse bg-[#171717]/50 h-full border border-[#2a2a2a]" />;

  return (
    <div className="glass-panel flex flex-col h-full gap-4 border border-[#2a2a2a]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
        <BrainCircuit className="w-5 h-5 text-purple-400" />
        <h2 className="text-lg font-medium tracking-wide">Auto Decision Engine</h2>
      </div>

      {/* Real-time Alerts */}
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
          <BellRing className="w-3 h-3" /> Predictive Alerts
        </h3>
        <ul className="space-y-2 mb-6">
          {aiInsights.alerts?.map((alert: string, idx: number) => (
            <li key={idx} className="bg-red-500/10 border-l-2 border-red-500 text-red-200 text-sm p-2 rounded-r">
              {alert}
            </li>
          ))}
          {!aiInsights.alerts?.length && <li className="text-gray-500 text-sm">No critical alerts currently.</li>}
        </ul>

        {/* AI Actions */}
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
          <ZapIcon className="w-3 h-3 text-amber-500" /> Automated Interventions
        </h3>
        <ul className="space-y-2 mb-6">
          {aiInsights.auto_decisions?.map((decision: string, idx: number) => (
            <li key={idx} className="bg-emerald-500/10 border-l-2 border-emerald-500 text-emerald-200 text-sm p-2 rounded-r">
              System logic updated: {decision}
            </li>
          ))}
        </ul>

        {/* XAI Context */}
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Beaker className="w-3 h-3 text-cyan-400" /> Reasoning Log
        </h3>
        <div className="bg-[#111] p-3 rounded text-xs text-cyan-50/70 border border-[#2a2a2a] leading-relaxed font-mono">
          {aiInsights.explainable_ai_reasoning || "Analyzing data streams..."}
        </div>
      </div>
    </div>
  );
}

function ZapIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
