import React from 'react';
import { BrainCircuit, Beaker, ShieldAlert, GitBranch, AlertTriangle, Fingerprint } from 'lucide-react';

export function ExplainableAIPanel({ aiInsights, isAiMode }: { aiInsights: any, isAiMode: boolean }) {
  if (!isAiMode) {
     return <div className="glass-panel p-6 bg-red-950/20 h-full border border-red-500/30 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-bold text-red-500">AI SYSTEM DISABLED</h2>
        <p className="text-gray-400 mt-2 text-sm max-w-[80%]">Simulation is running on physical limits without intelligent balancing. Wait times will spiral out of control!</p>
     </div>
  }

  if (!aiInsights) return <div className="glass-panel p-6 animate-pulse bg-[#171717]/50 h-full border border-[#2a2a2a]" />;

  const decisions = aiInsights.decisions?.slice(0, 3) || []; // Last 3 AI Interventions mapping
  const preds = aiInsights.zone_predictions || [];
  
  const criticalZone = [...preds].sort((a: any, b: any) => b.wait_time - a.wait_time)[0];

  return (
    <div className="glass-panel flex flex-col h-full gap-4 border border-[#2a2a2a] overflow-hidden bg-gradient-to-br from-[#111] to-[#1a1a1a]">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-400 animate-pulse" />
          <h2 className="text-lg font-bold tracking-tight text-gray-100 uppercase">Gemini AI Decision Replay</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono tracking-tighter">ENGINE: GEMINI-2.0-FLASH</span>
          <span className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-widest">Active</span>
        </div>
      </div>

      {criticalZone && criticalZone.wait_time > 30 && (
         <div className="bg-red-900/40 border border-red-500/60 rounded-lg p-3 flex flex-col shadow-[0_0_20px_rgba(239,68,68,0.3)] mb-2 animate-pulse">
            <div className="flex justify-between items-center w-full">
               <div className="flex items-center gap-2">
                  <AlertTriangle className="text-red-400 w-4 h-4" />
                  <span className="text-xs text-red-200 font-bold uppercase tracking-wider">🚨 Emergency Mode Activated</span>
               </div>
               <span className="text-[10px] text-red-400 font-extrabold uppercase">AI Prioritizing Safety</span>
            </div>
            <div className="mt-2 text-xs text-red-100 border-l border-red-500/30 pl-2">
               {criticalZone.zone_id.toUpperCase()} exceeded limits ({criticalZone.wait_time}m predicted bottleneck). Pushing 50% aggressive overflow bounds!
            </div>
         </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {decisions.map((decision: any, idx: number) => (
          <div key={idx} className="bg-[#161616] border border-[#2a2a2a] hover:border-blue-500/50 transition-colors duration-300 p-4 rounded-xl text-sm text-gray-300 shadow-md">
            
            <div className="flex justify-between items-start mb-3 border-b border-gray-800 pb-2">
               <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                  <Fingerprint className="w-3 h-3 text-blue-500" /> ID: {decision.decision_id || "A29Z-99X-GEMINI"}
               </span>
               <div className="flex flex-col items-end gap-1">
                 <span className="text-[9px] uppercase font-black text-white bg-emerald-600 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.4)]">AI DECISION APPLIED</span>
                 <span className="text-[9px] uppercase font-bold text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/20">Source: Google Gemini AI</span>
               </div>
            </div>

            <div className="mb-3">
              <span className="text-[10px] font-bold text-amber-500/80 uppercase flex items-center justify-between gap-1 mb-1">
                 <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-amber-500" /> Trigger Detected</span>
                 <span className="text-[9px] text-emerald-400 px-1 border border-emerald-500/30 rounded">Conf: {decision.confidence_score}%</span>
              </span>
              <p className="border-l-2 border-amber-500 pl-2 ml-1 text-amber-100/90 leading-snug">{decision.trigger}</p>
            </div>

            <div className="mb-3">
              <span className="text-[10px] font-bold text-emerald-500/80 uppercase flex items-center gap-1 mb-1">
                <ZapIcon className="w-3 h-3 text-emerald-500" /> Autonomous Action
              </span>
              <p className="border-l-2 border-emerald-500 pl-2 ml-1 text-emerald-100/90 font-medium leading-snug bg-emerald-500/5 p-2 rounded-r">
                {decision.action} <span className="text-emerald-500/70 block mt-1 text-xs">{decision.people > 0 ? `(${decision.people} routed: ${decision.from_zone} → ${decision.to_zone})` : ''}</span>
              </p>
            </div>

            <div className="mb-3">
              <span className="text-[10px] font-bold text-cyan-400/80 uppercase flex items-center gap-1 mb-1">
                <Beaker className="w-3 h-3 text-cyan-400" /> Evaluated Reasoning
              </span>
              <p className="text-xs text-gray-300 bg-black/40 p-2.5 rounded-lg leading-relaxed border border-[#222]">
                {decision.reasoning}
              </p>
            </div>

            {decision.alternatives_considered && decision.alternatives_considered.length > 0 && (
               <div>
                  <span className="text-[10px] font-bold text-purple-400/80 uppercase flex items-center gap-1 mb-1">
                  <GitBranch className="w-3 h-3 text-purple-400" /> Alternatives Processed
                  </span>
                  <ul className="text-xs text-purple-200/60 italic pl-4 list-disc marker:text-purple-500/50">
                     {decision.alternatives_considered.map((alt: string, i: number) => <li key={i}>{alt}</li>)}
                  </ul>
               </div>
            )}
            
            <div className="mt-3 text-right">
               <span className="text-[8px] uppercase tracking-widest text-gray-600">Generated by Google Gemini AI</span>
            </div>
          </div>
        ))}

        {!decisions.length && (
          <div className="flex flex-col items-center justify-center p-10 text-gray-600">
            <BrainCircuit className="w-10 h-10 mb-3 opacity-20 animate-bounce" />
            <p className="text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
               Monitoring Metrics
               <span className="flex gap-1"><span className="w-1 h-1 rounded-full bg-gray-600 animate-ping"></span><span className="w-1 h-1 rounded-full bg-gray-600 animate-ping delay-100"></span><span className="w-1 h-1 rounded-full bg-gray-600 animate-ping delay-200"></span></span>
            </p>
          </div>
        )}
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
