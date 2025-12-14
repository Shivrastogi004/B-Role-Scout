import React from 'react';
import { BrollSearchResult } from '../types';
import { Trash2, Copy, Film, X } from 'lucide-react';

interface CollectionSidebarProps {
  savedShots: BrollSearchResult[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export const CollectionSidebar: React.FC<CollectionSidebarProps> = ({ savedShots, isOpen, onClose, onRemove }) => {
  const copyAll = () => {
    const text = savedShots.map(s => `- ${s.query} (Lens: ${s.techSpecs?.lens || 'N/A'})`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 z-50 transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-400" />
              Project Reel
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedShots.length === 0 ? (
              <div className="text-center py-10 opacity-40">
                <Film className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-400">No shots pinned yet.</p>
              </div>
            ) : (
              savedShots.map(shot => (
                <div key={shot.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-all group">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-xs font-semibold text-slate-200 line-clamp-2">{shot.query}</p>
                    <button 
                      onClick={() => onRemove(shot.id)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {shot.techSpecs && (
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                         {shot.techSpecs.lens}
                       </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-900">
            <button 
              onClick={copyAll}
              disabled={savedShots.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Copy className="w-4 h-4" />
              Copy Shot List
            </button>
          </div>
        </div>
      </div>
    </>
  );
};