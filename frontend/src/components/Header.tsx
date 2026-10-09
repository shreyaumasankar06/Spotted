import React from 'react';
import { Eye, Activity, Terminal } from 'lucide-react';

interface HeaderProps {
  apiOnline: boolean | null;
  activeTab: 'lab' | 'experiments';
  setActiveTab: (tab: 'lab' | 'experiments') => void;
}

export const Header: React.FC<HeaderProps> = ({ apiOnline, activeTab, setActiveTab }) => {
  return (
    <header className="h-16 border-b border-[#261A33] bg-[#120D18]/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-2xl">
      {/* Brand & Wordmark */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B1223] to-[#261A33] border border-[#A855F7]/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Eye className="w-5 h-5 text-[#A855F7]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-gossip tracking-tight font-bold text-[#F8F3FF]">
                Spotted<span className="text-[#FF3CAC] drop-shadow-[0_0_8px_rgba(255,60,172,0.8)]">.</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-widest bg-[#1B1223] text-[#A855F7] border border-[#A855F7]/30">
                INVESTIGATION PLATFORM
              </span>
            </div>
            <p className="text-[11px] text-[#B7A9C9]/70 hidden sm:block">
              Misinformation Propagation & Containment Simulator
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-[#08060B]/80 p-1 rounded-xl border border-[#261A33]">
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'lab'
                ? 'bg-[#1B1223] text-[#F8F3FF] border border-[#A855F7]/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                : 'text-[#B7A9C9] hover:text-[#F8F3FF]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#A855F7]" />
            <span>Network Lab</span>
          </button>
          <button
            onClick={() => setActiveTab('experiments')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === 'experiments'
                ? 'bg-[#1B1223] text-[#F8F3FF] border border-[#A855F7]/40 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                : 'text-[#B7A9C9] hover:text-[#F8F3FF]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#FF3CAC]" />
            <span>Strategy Experiments</span>
          </button>
        </nav>
      </div>

      {/* Right Side: System Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-xl border border-[#261A33] bg-[#08060B]/70">
          {apiOnline === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#39F5A5] animate-pulse shadow-[0_0_8px_#39F5A5]"></span>
              <span className="text-[#39F5A5] font-mono text-[11px] font-medium tracking-wide">API ONLINE</span>
            </>
          ) : apiOnline === false ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#FF365E] shadow-[0_0_8px_#FF365E]"></span>
              <span className="text-[#FF365E] font-mono text-[11px] font-medium tracking-wide">API OFFLINE</span>
            </>
          ) : (
            <span className="text-[#B7A9C9] font-mono text-[11px]">CONNECTING...</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
