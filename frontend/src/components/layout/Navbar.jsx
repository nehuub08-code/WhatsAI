import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Zap, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard & Analytics',
  '/conversations': 'WhatsApp Live Conversations',
  '/users': 'WhatsApp Contacts Directory',
  '/settings': 'AI Engine & Webhook Settings',
  '/security-logs': 'Security & Audit Trail',
  '/profile': 'Administrator Profile'
};

const Navbar = () => {
  const location = useLocation();
  const { autoReplyEnabled, toggleAutoReply, setSimulatorOpen } = useAuth();
  const currentTitle = pageTitles[location.pathname] || 'WhatsAI Platform';

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0B0F17]/90 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-white tracking-tight">{currentTitle}</h1>
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Cloud API Connected
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Latency SLA badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono text-[11px]">Gemini 2.5: ~240ms</span>
        </div>

        {/* Global Auto-Reply Switch */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Bot className={`w-3.5 h-3.5 ${autoReplyEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="text-xs font-medium text-slate-300 hidden sm:inline">AI Auto-Reply</span>
          <button
            onClick={() => toggleAutoReply(!autoReplyEnabled)}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none ${
              autoReplyEnabled ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            title={autoReplyEnabled ? "Disable AI Auto-Reply" : "Enable AI Auto-Reply"}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                autoReplyEnabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Simulator Modal Trigger */}
        <button
          onClick={() => setSimulatorOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Simulator</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
