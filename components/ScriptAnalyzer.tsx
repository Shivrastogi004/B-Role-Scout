import React, { useState } from 'react';
import { ScriptSegment } from '../types';
import { Play, Search, Video, FileAudio, Loader2 } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface ScriptAnalyzerProps {
  segments: ScriptSegment[];
  onScoutShot: (query: string) => void;
}

export const ScriptAnalyzer: React.FC<ScriptAnalyzerProps> = ({ segments, onScoutShot }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);

  const handlePlayAudio = async (segment: ScriptSegment) => {
    try {
      if (playingId) return; // Simple debounce/prevent overlap
      setLoadingAudioId(segment.id);
      
      const audioBuffer = await generateSpeech(segment.narration);
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      const decodedBuffer = await audioContext.decodeAudioData(audioBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setPlayingId(null);
        audioContext.close();
      };

      setLoadingAudioId(null);
      setPlayingId(segment.id);
      source.start(0);

    } catch (error) {
      console.error("Audio playback failed", error);
      setLoadingAudioId(null);
      setPlayingId(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-pink-500/10 p-2 rounded-lg">
              <FileAudio className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-pink-400 uppercase tracking-wider">AI Script Analysis</h3>
              <p className="text-lg font-bold text-white">Visual Breakdown & Voiceover</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800">
          {segments.map((segment) => (
            <div key={segment.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 hover:bg-slate-800/30 transition-colors group">
              
              {/* Narration Column */}
              <div className="md:col-span-5 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Narration ({segment.estimatedDuration})</span>
                <p className="text-slate-200 font-serif text-lg leading-relaxed">"{segment.narration}"</p>
                <button 
                  onClick={() => handlePlayAudio(segment)}
                  disabled={!!loadingAudioId || !!playingId}
                  className="mt-3 flex items-center text-xs font-semibold text-pink-400 hover:text-pink-300 disabled:opacity-50 transition-colors w-fit"
                >
                  {loadingAudioId === segment.id ? (
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  ) : (
                    <Play className={`w-3 h-3 mr-2 ${playingId === segment.id ? 'fill-pink-400' : ''}`} />
                  )}
                  {playingId === segment.id ? 'Playing...' : 'Preview Voiceover'}
                </button>
              </div>

              {/* Arrow Connector (Desktop) */}
              <div className="hidden md:flex md:col-span-1 items-center justify-center opacity-20 group-hover:opacity-50 transition-opacity">
                <div className="h-full w-px bg-slate-700"></div>
              </div>

              {/* Visual Prompt Column */}
              <div className="md:col-span-6 bg-slate-950/50 rounded-xl p-4 border border-slate-800 group-hover:border-pink-500/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-2">
                     <Video className="w-3 h-3" /> Suggested Visual
                   </span>
                   <button 
                     onClick={() => onScoutShot(segment.visualPrompt)}
                     className="bg-pink-600 hover:bg-pink-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center shadow-lg shadow-pink-900/20"
                   >
                     <Search className="w-3 h-3 mr-1.5" /> Scout This
                   </button>
                </div>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{segment.visualPrompt}</p>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};