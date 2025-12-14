import React, { useState } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { BrollCard } from './components/BrollCard';
import { ShotGenerator } from './components/ShotGenerator';
import { CollectionSidebar } from './components/CollectionSidebar';
import { ScriptAnalyzer } from './components/ScriptAnalyzer';
import { InfoModal } from './components/InfoModal';
import { BrollSearchResult, SearchMode, ScriptSegment } from './types';
import { searchBrollResources, generateShotList, analyzeScript } from './services/geminiService';
import { AlertCircle } from 'lucide-react';

interface SceneState {
  description: string;
  shots: string[];
}

const App: React.FC = () => {
  const [results, setResults] = useState<BrollSearchResult[]>([]);
  const [savedShots, setSavedShots] = useState<BrollSearchResult[]>([]);
  
  const [sceneData, setSceneData] = useState<SceneState | null>(null);
  const [scriptData, setScriptData] = useState<ScriptSegment[] | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const handleSearch = async (query: string, mode: SearchMode, referenceImage?: string) => {
    setIsLoading(true);
    setError(null);
    setSceneData(null); 
    setScriptData(null);
    
    try {
      if (mode === SearchMode.SCENE) {
        const shots = await generateShotList(query);
        setSceneData({
          description: query,
          shots
        });
        setResults([]);
      } else if (mode === SearchMode.SCRIPT) {
        const segments = await analyzeScript(query);
        setScriptData(segments);
        setResults([]);
      } else {
        const result = await searchBrollResources(query, referenceImage);
        setResults(prev => [result, ...prev]);
      }
    } catch (err) {
      setError("We couldn't complete the request. Please check your API key or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoutShot = async (shotDescription: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await searchBrollResources(shotDescription);
      setResults(prev => [result, ...prev]);
      // Scroll result into view smoothly?
    } catch (err) {
      setError("Failed to scout this shot.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSaveShot = (result: BrollSearchResult) => {
    setSavedShots(prev => {
      const exists = prev.find(s => s.id === result.id);
      if (exists) {
        return prev.filter(s => s.id !== result.id);
      }
      // Open sidebar when adding first item
      if (prev.length === 0) setIsSidebarOpen(true);
      return [result, ...prev];
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none"></div>
      
      <Header 
        savedCount={savedShots.length} 
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        onOpenInfo={() => setIsInfoOpen(true)}
      />
      
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      
      <CollectionSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        savedShots={savedShots}
        onRemove={(id) => setSavedShots(prev => prev.filter(s => s.id !== id))}
      />
      
      <main className={`flex-1 container mx-auto px-4 pb-20 relative z-10 transition-all duration-300 ${isSidebarOpen ? 'lg:pr-80' : ''}`}>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        
        {error && (
          <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-200 backdrop-blur-sm animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-red-400" />
            {error}
          </div>
        )}

        {sceneData && (
          <ShotGenerator 
            scene={sceneData.description} 
            shots={sceneData.shots} 
            onScoutShot={handleScoutShot}
          />
        )}

        {scriptData && (
          <ScriptAnalyzer 
            segments={scriptData}
            onScoutShot={handleScoutShot}
          />
        )}

        <div className="max-w-5xl mx-auto">
          {results.length > 0 ? (
            results.map((result) => (
              <BrollCard 
                key={result.id} 
                result={result} 
                onToggleSave={toggleSaveShot}
                isSaved={savedShots.some(s => s.id === result.id)}
              />
            ))
          ) : (
            !isLoading && !sceneData && !scriptData && (
              <div className="text-center py-20 opacity-30 pointer-events-none">
                <div className="inline-block p-8 rounded-[2rem] bg-gradient-to-b from-slate-900 to-slate-900/0 mb-6 border border-slate-800/50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-900/50">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <path d="M7 3v18" />
                    <path d="M3 7.5h4" />
                    <path d="M3 12h18" />
                    <path d="M3 16.5h4" />
                    <path d="M17 3v18" />
                    <path d="M17 7.5h4" />
                    <path d="M17 16.5h4" />
                  </svg>
                </div>
              </div>
            )
          )}
        </div>
      </main>

      <footer className="border-t border-slate-900/50 bg-slate-950 py-8 text-center text-slate-600 text-sm relative z-10">
        <p>&copy; {new Date().getFullYear()} B-Roll Scout. Director AI Engine.</p>
      </footer>
    </div>
  );
};

export default App;