import React from 'react';
import { Film, Layers, Zap, HelpCircle } from 'lucide-react';

interface HeaderProps {
  savedCount: number;
  onToggleSidebar: () => void;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ savedCount, onToggleSidebar, onOpenInfo }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#020617]/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-6">
        
        {/* Logo Area */}
        <div className="flex gap-3 items-center group cursor-default">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-2 rounded-xl border border-white/10 shadow-xl">
              <Film className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg tracking-tight leading-none">B-Roll<span className="text-indigo-400">Scout</span></span>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">AI Director Engine</span>
          </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 font-medium">
            <Zap className="w-3 h-3" />
            <span>Gen 2.5 Active</span>
          </div>
          
          <button 
            onClick={onOpenInfo}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="About & Help"
          >
             <HelpCircle className="w-5 h-5" />
          </button>

          <button 
            onClick={onToggleSidebar}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 hover:border-white/20 transition-all group"
          >
            <Layers className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
            <span className="text-sm font-medium">Project Reel</span>
            {savedCount > 0 ? (
              <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[1.25rem] text-center shadow-lg shadow-indigo-500/30">
                {savedCount}
              </span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 ml-1"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};