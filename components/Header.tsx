import React from 'react';
import { Film, Video, Layers } from 'lucide-react';

interface HeaderProps {
  savedCount: number;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ savedCount, onToggleSidebar }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
        <div className="flex gap-2 items-center text-slate-100 font-bold text-xl">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Film className="h-5 w-5 text-white" />
          </div>
          <span className="tracking-tight">B-Roll <span className="text-slate-400 font-normal">Scout</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-500/50 transition-all"
          >
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Reel</span>
            {savedCount > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};