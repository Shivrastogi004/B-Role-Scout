import React, { useState } from 'react';
import { X, Github, Linkedin, Mail, Search, Clapperboard, MapPin, Film, User } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'how' | 'about'>('how');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-[#0b0f19] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('how')}
              className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${activeTab === 'how' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              How to Use
            </button>
            <button 
              onClick={() => setActiveTab('about')}
              className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${activeTab === 'about' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              About & Developer
            </button>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {activeTab === 'how' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Master Your Pre-Production</h2>
                <p className="text-slate-400">B-Roll Scout uses Gemini 2.5 to visualize shots, scout locations, and find stock footage instantly.</p>
              </div>

              <div className="grid gap-6">
                <div className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-400">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">1. Choose Your Mode</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      <strong>Single Shot:</strong> Perfect for specific visuals.<br/>
                      <strong>Scene:</strong> Generates a shot list from a scene idea.<br/>
                      <strong>Script:</strong> Pastes a script to auto-generate a visual breakdown.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-purple-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0 text-purple-400">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">2. Visual Intelligence</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      The AI generates <strong>Storyboards</strong>, finds <strong>Stock Footage</strong> sources, and even creates a <strong>Lighting Diagram</strong> and <strong>Tech Specs</strong> (Camera, Lens, Settings) for every shot.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-pink-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0 text-pink-400">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">3. Location Scouting</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Use the <strong>Locations</strong> tab to find real-world places nearby that match the vibe of your shot, complete with <strong>Golden Hour</strong> tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] mb-6 shadow-2xl shadow-indigo-500/20">
                <div className="w-full h-full rounded-full bg-[#0b0f19] flex items-center justify-center overflow-hidden relative">
                   <User className="w-10 h-10 text-slate-400" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-1">Shiv Rastogi</h2>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono tracking-widest uppercase mb-6">Lead Developer</span>
              
              <p className="text-slate-400 max-w-md leading-relaxed mb-8">
                Passionate about bridging the gap between creative vision and artificial intelligence. B-Roll Scout is designed to empower filmmakers with tools that were previously only available to big studios.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                 <a href="https://www.linkedin.com/in/shiv-rastogi-8285a5239/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-4 rounded-xl bg-[#0077b5]/10 border border-[#0077b5]/20 hover:bg-[#0077b5]/20 hover:border-[#0077b5]/50 transition-all group">
                   <Linkedin className="w-5 h-5 text-[#0077b5] group-hover:scale-110 transition-transform" />
                   <span className="text-sm font-bold text-[#e1e9ee]">LinkedIn</span>
                 </a>
                 
                 <a href="mailto:rastogishiv004@gmail.com" className="flex items-center justify-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50 transition-all group">
                   <Mail className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                   <span className="text-sm font-bold text-red-100">Email Me</span>
                 </a>

                 <a href="https://github.com/Shivrastogi004" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-all group col-span-1 sm:col-span-2">
                   <Github className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                   <span className="text-sm font-bold text-white">GitHub</span>
                 </a>
              </div>

              <div className="mt-10 pt-6 border-t border-white/5 w-full">
                 <p className="text-xs text-slate-500">Built with React, Tailwind, and Google Gemini API.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};