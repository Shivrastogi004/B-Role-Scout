import React, { useState } from 'react';
import { Search, Loader2, Clapperboard, Video, FileText, Wand2 } from 'lucide-react';
import { SearchMode } from '../types';
import { enhancePrompt } from '../services/geminiService';

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState<SearchMode>(SearchMode.SINGLE);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim(), mode);
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

  const getPlaceholder = () => {
    switch (mode) {
      case SearchMode.SINGLE: return "e.g., 'Coffee shop in rain' (Use Magic Wand ✨ to enhance)";
      case SearchMode.SCENE: return "e.g., 'A detective investigating a crime scene at night'";
      case SearchMode.SCRIPT: return "Paste your narration script here (e.g., 'In this video, I will show you...')";
      default: return "";
    }
  };

  const getButtonLabel = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      );
    }
    switch (mode) {
      case SearchMode.SINGLE: return "Search";
      case SearchMode.SCENE: return "Breakdown";
      case SearchMode.SCRIPT: return "Analyze Script";
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient-x">
            B-Roll Scout
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          AI-powered footage research. Visualize shots, find sources, and extract color palettes in seconds.
        </p>
      </div>
      
      <div className="bg-slate-900/50 p-1 rounded-2xl inline-flex flex-col sm:flex-row mx-auto w-full mb-4 border border-slate-800/50">
        <button
          onClick={() => setMode(SearchMode.SINGLE)}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === SearchMode.SINGLE 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <Video className="w-4 h-4 mr-2" />
          Single Shot
        </button>
        <button
          onClick={() => setMode(SearchMode.SCENE)}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === SearchMode.SCENE 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <Clapperboard className="w-4 h-4 mr-2" />
          Scene List
        </button>
        <button
          onClick={() => setMode(SearchMode.SCRIPT)}
          className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            mode === SearchMode.SCRIPT 
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Script to Viz
        </button>
      </div>

      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute -inset-1 bg-gradient-to-r rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-500 ${
          mode === SearchMode.SINGLE ? 'from-indigo-500 to-blue-600' : 
          mode === SearchMode.SCENE ? 'from-purple-500 to-pink-600' : 'from-pink-500 to-orange-500'
        }`}></div>
        <div className="relative flex items-center bg-slate-950 rounded-xl border border-slate-800 shadow-2xl">
          <Search className={`absolute left-5 h-6 w-6 ${
             mode === SearchMode.SINGLE ? 'text-indigo-500' : 
             mode === SearchMode.SCENE ? 'text-purple-500' : 'text-pink-500'
          }`} />
          
          {mode === SearchMode.SCRIPT ? (
            <textarea
              className="w-full bg-transparent py-4 pl-14 pr-32 text-lg text-white placeholder-slate-500 focus:outline-none rounded-xl min-h-[80px] resize-none"
              placeholder={getPlaceholder()}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          ) : (
            <input
              type="text"
              className="w-full bg-transparent py-5 pl-14 pr-32 text-lg text-white placeholder-slate-500 focus:outline-none rounded-xl"
              placeholder={getPlaceholder()}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isLoading}
            />
          )}

          <div className="absolute right-36 top-2 bottom-2 flex items-center">
             {mode === SearchMode.SINGLE && value.length > 3 && (
               <button
                 type="button"
                 onClick={handleEnhance}
                 disabled={isEnhancing || isLoading}
                 className="p-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-900/30 transition-colors"
                 title="Director's Polish: Enhance Prompt"
               >
                 {isEnhancing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
               </button>
             )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className={`absolute right-2 top-2 bottom-2 px-6 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-lg ${
               mode === SearchMode.SINGLE ? 'bg-indigo-600 hover:bg-indigo-500' : 
               mode === SearchMode.SCENE ? 'bg-purple-600 hover:bg-purple-500' : 'bg-pink-600 hover:bg-pink-500'
            }`}
          >
            {getButtonLabel()}
          </button>
        </div>
      </form>
    </div>
  );
};