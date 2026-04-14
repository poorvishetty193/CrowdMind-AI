import React from 'react';
import { Dashboard } from './Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans w-full p-4 md:p-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">CrowdMind AI</h1>
          <p className="text-gray-400 text-sm mt-1">Autonomous Event Logistics & Routing Engine</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Live Deployment: GCP Cloud Run
          </div>
        </div>
      </header>

      <main className="w-full">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
