import React, { useState } from 'react';
import { BrollSearchResult } from '../types';
import { Trash2, Copy, Film, X, Calendar, ClipboardList, Download, Loader2 } from 'lucide-react';
import { generateProductionSchedule } from '../services/geminiService';

interface CollectionSidebarProps {
  savedShots: BrollSearchResult[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export const CollectionSidebar: React.FC<CollectionSidebarProps> = ({ savedShots, isOpen, onClose, onRemove }) => {
  const [schedule, setSchedule] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const copyAll = () => {
    const text = savedShots.map(s => `- ${s.query} (Lens: ${s.techSpecs?.lens || 'N/A'})`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleGenerateSchedule = async () => {
    if (savedShots.length === 0) return;
    setIsGenerating(true);
    try {
      const result = await generateProductionSchedule(savedShots);
      setSchedule(result);
    } catch (e) {
      // error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[450px] bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-500 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              Production Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1">Manage saved shots & logistics</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Schedule Section */}
          {schedule ? (
            <div className="p-6 border-b border-slate-800">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                   <Calendar className="w-4 h-4" /> Call Sheet
                 </h3>
                 <button onClick={() => setSchedule(null)} className="text-xs text-slate-500 hover:text-white">Close</button>
               </div>
               <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 font-mono whitespace-pre-line leading-relaxed overflow-x-auto">
                 {schedule}
               </div>
               <button className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-white py-2 border border-slate-700 rounded-lg hover:bg-slate-800 transition-all">
                 <Download className="w-3 h-3" /> Export to PDF (Simulated)
               </button>
            </div>
          ) : (
            <div className="p-6 border-b border-slate-800 bg-indigo-900/10">
               <div className="flex justify-between items-center">
                 <h3 className="text-sm font-bold text-indigo-300">Smart Schedule</h3>
                 <button 
                   onClick={handleGenerateSchedule}
                   disabled={savedShots.length === 0 || isGenerating}
                   className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                 >
                   {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calendar className="w-3 h-3" />}
                   Generate
                 </button>
               </div>
               <p className="text-xs text-slate-400 mt-2">
                 AI will analyze your saved shots and create an optimized filming order to save time on set.
               </p>
            </div>
          )}

          {/* Shot List */}
          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Shot List ({savedShots.length})</h3>
            
            <div className="space-y-3">
              {savedShots.length === 0 ? (
                <div className="text-center py-10 opacity-40 border-2 border-dashed border-slate-800 rounded-xl">
                  <Film className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm text-slate-400">Your reel is empty.</p>
                </div>
              ) : (
                savedShots.map((shot, idx) => (
                  <div key={shot.id} className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all group flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0 border border-slate-700">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug mb-1">{shot.query}</p>
                      <div className="flex flex-wrap gap-2">
                         {shot.techSpecs?.lens && (
                           <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                             {shot.techSpecs.lens.split(' ')[0]}
                           </span>
                         )}
                         {shot.techSpecs?.lighting && (
                           <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                             {shot.techSpecs.lighting.split(' ')[0]}
                           </span>
                         )}
                      </div>
                    </div>
                    <button 
                      onClick={() => onRemove(shot.id)}
                      className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950">
          <button 
            onClick={copyAll}
            disabled={savedShots.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Copy All to Clipboard
          </button>
        </div>
      </div>
    </>
  );
};