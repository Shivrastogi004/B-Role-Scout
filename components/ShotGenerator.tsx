import React from 'react';
import { Play, Sparkles } from 'lucide-react';

interface ShotGeneratorProps {
  scene: string;
  shots: string[];
  onScoutShot: (shot: string) => void;
}

export const ShotGenerator: React.FC<ShotGeneratorProps> = ({ scene, shots, onScoutShot }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-500/10 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-purple-400 uppercase tracking-wider">Scene Breakdown</h3>
            <p className="text-xl font-bold text-white">"{scene}"</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shots.map((shot, idx) => (
            <div 
              key={idx}
              className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-300 cursor-pointer"
              onClick={() => onScoutShot(shot)}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-400 mb-2 group-hover:bg-purple-500/20 group-hover:text-purple-300 transition-colors">
                    SHOT {idx + 1}
                  </span>
                  <p className="text-slate-200 font-medium leading-snug">{shot}</p>
                </div>
                <div className="bg-slate-950 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <Play className="w-4 h-4 text-purple-400 fill-purple-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};