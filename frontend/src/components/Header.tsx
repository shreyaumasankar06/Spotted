import React from 'react';
import { ShieldCheck, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  apiOnline: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ apiOnline }) => {
  return (
    <header className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Spotted.</h1>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                v0.1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Misinformation Propagation & Strategic Intervention Simulator
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-[#080C14]/60">
            {apiOnline === true ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Backend Connected</span>
              </>
            ) : apiOnline === false ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400 font-medium">Backend Offline (Port 8000)</span>
              </>
            ) : (
              <span className="text-slate-500">Checking API...</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
