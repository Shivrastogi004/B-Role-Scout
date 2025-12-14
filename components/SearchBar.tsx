import React, { useState, useRef } from 'react';
import { Search, Loader2, Clapperboard, Video, FileText, Wand2, Sparkles, ImagePlus, X } from 'lucide-react';
import { SearchMode } from '../types';
import { enhancePrompt } from '../services/geminiService';

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode, referenceImage?: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState<SearchMode>(SearchMode.SINGLE);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Image Upload State
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim(), mode, referenceImage || undefined);
    }
  };

  const handleEnhance = async () => {
    if (!value.trim()) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(value);
      setValue(enhanced);
    } catch (e) {
      // Fail silently
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getPlaceholder = () => {
    switch (mode) {
      case SearchMode.SINGLE: return "Describe a shot... (e.g., 'Cyberpunk rainy street')";
      case SearchMode.SCENE: return "Describe a scene... (e.g., 'A heist planning montage')";
      case SearchMode.SCRIPT: return "Paste script here for auto-breakdown...";
      default: return "";
    }
  };

  const getButtonLabel = () => {
    if (isLoading) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing</>;
    switch (mode) {
      case SearchMode.SINGLE: return "Scout Shot";
      case SearchMode.SCENE: return "Breakdown Scene";
      case SearchMode.SCRIPT: return "Analyze Script";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-16 px-4 relative z-10">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Header Text */}
      <div className="text-center mb-10 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono uppercase tracking-widest mb-4">
          <Sparkles className="w-3 h-3" />
          <span>AI Visual Research Tool</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6 drop-shadow-2xl">
          Visualize Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-300 text-glow">
            Vision Instantly.
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The all-in-one <span className="text-slate-200 font-semibold">pre-production engine</span>. Generate storyboards, scout locations, and plan shots with cinematic intelligence.
        </p>
      </div>
      
      {/* Search Interface Container */}
      <div className="glass-panel p-2 rounded-3xl shadow-2xl shadow-black/50 transition-all duration-300">
        
        {/* Mode Switcher */}
        <div className="flex p-1 mb-2 bg-black/20 rounded-2xl">
          {[
            { id: SearchMode.SINGLE, icon: Video, label: 'Single Shot', color: 'indigo' },
            { id: SearchMode.SCENE, icon: Clapperboard, label: 'Scene List', color: 'purple' },
            { id: SearchMode.SCRIPT, icon: FileText, label: 'Script Viz', color: 'pink' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                mode === m.id 
                  ? `bg-slate-800 text-white shadow-lg ring-1 ring-white/10` 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <m.icon className={`w-4 h-4 mr-2 ${mode === m.id ? `text-${m.color}-400` : ''}`} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="relative group">
          <div className="relative flex items-center">
            {/* Left Icon or Uploaded Image Preview */}
            <div className="absolute left-6 z-10 flex items-center justify-center">
              {referenceImage ? (
                <div className="relative group/thumb">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-indigo-500 shadow-lg">
                    <img src={referenceImage} alt="Ref" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    type="button"
                    onClick={clearImage}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ) : (
                <Search className={`h-6 w-6 transition-colors duration-300 ${
                  mode === SearchMode.SINGLE ? 'text-indigo-400' : 
                  mode === SearchMode.SCENE ? 'text-purple-400' : 'text-pink-400'
                }`} />
              )}
            </div>
            
            {mode === SearchMode.SCRIPT ? (
              <textarea
                className="w-full bg-slate-900/50 hover:bg-slate-900/70 focus:bg-slate-900 border border-transparent focus:border-white/10 transition-all py-5 pl-20 pr-36 text-lg text-white placeholder-slate-600 focus:outline-none rounded-2xl min-h-[100px] resize-none font-medium"
                placeholder={getPlaceholder()}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isLoading}
              />
            ) : (
              <input
                type="text"
                className="w-full bg-slate-900/50 hover:bg-slate-900/70 focus:bg-slate-900 border border-transparent focus:border-white/10 transition-all py-5 pl-20 pr-36 text-lg text-white placeholder-slate-600 focus:outline-none rounded-2xl font-medium h-16"
                placeholder={getPlaceholder()}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isLoading}
              />
            )}

            <div className="absolute right-3 top-3 bottom-3 flex gap-2 items-center">
               
               {/* Image Upload Trigger */}
               {mode === SearchMode.SINGLE && (
                 <>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${referenceImage ? 'text-indigo-300 bg-indigo-500/20' : 'text-slate-500 hover:text-white hover:bg-white/10'}`}
                    title="Match Reference Image (Vibe Match)"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                 </>
               )}

               {mode === SearchMode.SINGLE && value.length > 5 && (
                 <button
                   type="button"
                   onClick={handleEnhance}
                   disabled={isEnhancing || isLoading}
                   className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl text-purple-400 hover:text-purple-200 hover:bg-purple-500/20 transition-all"
                   title="Enhance Prompt with AI"
                 >
                   {isEnhancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                 </button>
               )}

              <button
                type="submit"
                disabled={isLoading || !value.trim()}
                className={`h-full px-6 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-lg ${
                  mode === SearchMode.SINGLE ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:to-indigo-400' : 
                  mode === SearchMode.SCENE ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:to-purple-400' : 'bg-gradient-to-r from-pink-600 to-pink-500 hover:to-pink-400'
                }`}
              >
                {getButtonLabel()}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Suggested Chips */}
      {!value && mode === SearchMode.SINGLE && (
        <div className="flex flex-wrap justify-center gap-2 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
           {["Cyberpunk city rain", "Coffee shop cozy morning", "Drone shot beach sunset", "Chef cooking macro"].map(suggestion => (
             <button 
               key={suggestion}
               onClick={() => setValue(suggestion)}
               className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-400 hover:text-indigo-300 transition-colors"
             >
               {suggestion}
             </button>
           ))}
        </div>
      )}
    </div>
  );
};