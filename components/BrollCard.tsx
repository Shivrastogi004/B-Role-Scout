import React, { useState } from 'react';
import { ExternalLink, Image as ImageIcon, Loader2, Sparkles, Copy, Camera, Music, Video, Bookmark, BookmarkCheck, PlayCircle, Film, Search, MapPin, Lightbulb, View, Sliders, Monitor } from 'lucide-react';
import { BrollSearchResult, MapLocation } from '../types';
import { generateBrollPreview, generateBrollVideo, scoutLocations } from '../services/geminiService';

interface BrollCardProps {
  result: BrollSearchResult;
  onToggleSave: (result: BrollSearchResult) => void;
  isSaved: boolean;
}

type TabType = 'sources' | 'tech' | 'audio' | 'locations';
type PreviewMode = 'still' | 'motion';
type AspectRatio = 'cinema' | 'wide' | 'social';
type ColorFilter = 'none' | 'teal-orange' | 'noir' | 'vintage';

export const BrollCard: React.FC<BrollCardProps> = ({ result, onToggleSave, isSaved }) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(result.generatedPreviewUrl);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(result.generatedVideoUrl);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('sources');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('still');

  // Viewfinder State
  const [isViewfinderOn, setIsViewfinderOn] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('wide');
  const [activeFilter, setActiveFilter] = useState<ColorFilter>('none');

  // Location Scout State
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [isScouting, setIsScouting] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    setIsGeneratingImage(true);
    setError(null);
    try {
      const url = await generateBrollPreview(result.query);
      setPreviewUrl(url);
    } catch (err) {
      setError("Failed to generate preview.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    setError(null);
    try {
      const url = await generateBrollVideo(result.query);
      setVideoUrl(url);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to generate video.");
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleScoutLocations = async () => {
    setIsScouting(true);
    setScoutError(null);
    try {
      let lat, lng;
      // Attempt to get location, but proceed if failed/denied
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
           navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (e) {
        console.log("Location denied or unavailable, using generic search");
      }

      const locs = await scoutLocations(result.query, lat, lng);
      setLocations(locs);
      if (locs.length === 0) setScoutError("No matching locations found nearby.");

    } catch (e) {
      setScoutError("Failed to scout locations.");
    } finally {
      setIsScouting(false);
    }
  };

  // Helper to render lighting diagram
  const renderLightingDiagram = () => {
    if (!result.lightingDiagram) return null;
    return (
      <div className="w-full aspect-square max-w-[200px] mx-auto relative bg-slate-900 rounded-full border border-slate-700 mt-4">
        {/* Subject */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold z-10 border-2 border-slate-700">
          SUBJ
        </div>
        {/* Camera */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <Camera className="w-4 h-4 text-slate-400" />
          <span className="text-[8px] text-slate-500">CAM</span>
        </div>

        {/* Lights */}
        {result.lightingDiagram.map((light, idx) => {
           const rotation = light.angle; 
           const distPerc = 20 + (light.distance * 2.5);
           return (
             <div 
               key={idx}
               className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-start origin-center"
               style={{ 
                 transform: `rotate(${rotation + 90}deg)`, 
                 zIndex: 5 
               }}
             >
               <div 
                 className="absolute flex flex-col items-center"
                 style={{ 
                   transform: `translate(${distPerc * 2}px) rotate(-${rotation + 90}deg)`
                 }}
               >
                 <Lightbulb 
                   className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,0,0.5)]" 
                   style={{ color: light.color, fill: light.color }} 
                 />
                 <span className="text-[9px] text-slate-300 font-bold bg-black/50 px-1 rounded whitespace-nowrap">{light.type}</span>
               </div>
             </div>
           );
        })}
      </div>
    );
  };

  // Styles for filters
  const getFilterStyle = () => {
    switch (activeFilter) {
      case 'teal-orange': return { filter: 'contrast(1.1) saturate(1.4) hue-rotate(-10deg) sepia(0.2)' };
      case 'noir': return { filter: 'grayscale(100%) contrast(1.2) brightness(0.9)' };
      case 'vintage': return { filter: 'sepia(0.5) contrast(0.9) brightness(1.1) saturate(0.8)' };
      default: return {};
    }
  };

  return (
    <div className="group relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-900/20 transition-all duration-500 flex flex-col md:flex-row mb-8">
      
      {/* Save Button Overlay */}
      <button 
        onClick={() => onToggleSave(result)}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur text-white border border-white/10 transition-colors"
      >
        {isSaved ? <BookmarkCheck className="w-5 h-5 text-indigo-400 fill-indigo-400" /> : <Bookmark className="w-5 h-5" />}
      </button>

      {/* Visual Preview Section */}
      <div className="w-full md:w-5/12 bg-black relative min-h-[350px] flex flex-col border-b md:border-b-0 md:border-r border-slate-700/50">
        
        {/* Top Controls */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
           {/* Mode Toggle */}
           <div className="bg-black/60 backdrop-blur-md rounded-full p-1 flex border border-white/10">
             <button 
               onClick={() => setPreviewMode('still')}
               className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${previewMode === 'still' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               <ImageIcon className="w-3 h-3" /> Still
             </button>
             <button 
               onClick={() => setPreviewMode('motion')}
               className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 ${previewMode === 'motion' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               <Film className="w-3 h-3" /> Motion
             </button>
           </div>
           
           {/* Viewfinder Toggle (Only in Still mode) */}
           {previewMode === 'still' && previewUrl && (
             <button 
               onClick={() => setIsViewfinderOn(!isViewfinderOn)}
               className={`p-1.5 rounded-full border border-white/10 transition-colors ${isViewfinderOn ? 'bg-red-600 text-white animate-pulse' : 'bg-black/60 text-slate-400 hover:text-white'}`}
               title="Director's Viewfinder"
             >
               <View className="w-4 h-4" />
             </button>
           )}
        </div>

        {/* Viewfinder Controls (Bottom overlay) */}
        {isViewfinderOn && previewMode === 'still' && previewUrl && (
          <div className="absolute bottom-16 left-0 right-0 z-30 flex justify-center gap-4 pointer-events-none">
             <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex gap-4 pointer-events-auto shadow-2xl">
               
               {/* Aspect Ratio */}
               <div className="flex items-center gap-2 border-r border-white/20 pr-4">
                 <span className="text-[9px] text-slate-500 uppercase font-bold">Aspect</span>
                 <button onClick={() => setAspectRatio('cinema')} className={`text-xs font-bold ${aspectRatio === 'cinema' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>2.39</button>
                 <button onClick={() => setAspectRatio('wide')} className={`text-xs font-bold ${aspectRatio === 'wide' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>16:9</button>
                 <button onClick={() => setAspectRatio('social')} className={`text-xs font-bold ${aspectRatio === 'social' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>9:16</button>
               </div>

               {/* Filters */}
               <div className="flex items-center gap-2">
                 <span className="text-[9px] text-slate-500 uppercase font-bold">Look</span>
                 <button onClick={() => setActiveFilter(activeFilter === 'none' ? 'teal-orange' : activeFilter === 'teal-orange' ? 'noir' : activeFilter === 'noir' ? 'vintage' : 'none')} className="text-slate-300 hover:text-white flex items-center gap-1 text-xs">
                   <Sliders className="w-3 h-3" />
                   {activeFilter === 'none' ? 'Normal' : activeFilter}
                 </button>
               </div>
             </div>
          </div>
        )}

        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
          {previewMode === 'still' ? (
            // STILL IMAGE MODE
            previewUrl ? (
              <div className="relative w-full h-full group/image flex items-center justify-center">
                {/* Image Container with potential Viewfinder Masks */}
                <div 
                  className={`relative w-full h-full transition-all duration-300 overflow-hidden ${isViewfinderOn ? 'scale-90' : ''}`}
                >
                  <img 
                    src={previewUrl} 
                    alt={`Preview for ${result.query}`} 
                    className="w-full h-full object-cover"
                    style={getFilterStyle()}
                  />

                  {/* Viewfinder Overlay Elements */}
                  {isViewfinderOn && (
                     <>
                        {/* Aspect Ratio Masks */}
                        {aspectRatio === 'cinema' && (
                          <>
                            <div className="absolute top-0 left-0 right-0 h-[12%] bg-black z-10"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-black z-10"></div>
                          </>
                        )}
                        {aspectRatio === 'social' && (
                          <>
                            <div className="absolute top-0 left-0 bottom-0 w-[35%] bg-black/90 z-10 backdrop-blur-sm"></div>
                            <div className="absolute top-0 right-0 bottom-0 w-[35%] bg-black/90 z-10 backdrop-blur-sm"></div>
                          </>
                        )}

                        {/* Camera UI Overlay */}
                        <div className="absolute inset-0 z-20 pointer-events-none p-4 opacity-80">
                           {/* Top Left: REC dot and Status */}
                           <div className="absolute top-6 left-6 flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                              <span className="text-red-500 font-mono text-sm font-bold tracking-widest">REC</span>
                              <span className="text-white font-mono text-xs ml-2">00:00:04:12</span>
                           </div>

                           {/* Top Right: Battery/Card */}
                           <div className="absolute top-6 right-6 flex flex-col items-end gap-1">
                              <span className="text-green-400 font-mono text-xs">BAT 14.4V</span>
                              <span className="text-white font-mono text-xs">A001_C004</span>
                           </div>

                           {/* Center Crosshair */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                              <div className="w-4 h-px bg-white/30"></div>
                              <div className="h-4 w-px bg-white/30 -mt-2 ml-2"></div>
                           </div>

                           {/* Bottom Telemetry Data (Smart AI Data) */}
                           <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end text-white font-mono text-xs">
                              <div className="flex gap-4">
                                 <div>
                                    <span className="block text-[9px] text-slate-400">ISO</span>
                                    <span className="text-lg font-bold">{result.cameraSettings?.iso || '800'}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[9px] text-slate-400">SHUTTER</span>
                                    <span className="text-lg font-bold">{result.cameraSettings?.shutter || '180°'}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[9px] text-slate-400">IRIS</span>
                                    <span className="text-lg font-bold">{result.cameraSettings?.aperture || 'T2.8'}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[9px] text-slate-400">WB</span>
                                    <span className="text-lg font-bold">{result.cameraSettings?.wb || '5600K'}</span>
                                 </div>
                              </div>
                              
                              <div className="text-right">
                                 <span className="block text-[9px] text-slate-400">LENS</span>
                                 <span className="text-lg font-bold text-yellow-400">{result.techSpecs?.lens ? result.techSpecs.lens.split(' ')[0] : '35mm'}</span>
                              </div>
                           </div>
                           
                           {/* Frame Guides */}
                           <div className="absolute inset-8 border border-white/20"></div>
                        </div>
                     </>
                  )}
                </div>

                {!isViewfinderOn && (
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white font-medium flex items-center">
                      <Sparkles className="w-3 h-3 mr-2 text-indigo-400" /> AI Storyboard
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/50 to-slate-950">
                 {isGeneratingImage ? (
                   <div className="flex flex-col items-center">
                     <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                     <p className="text-indigo-200 font-medium tracking-wide">Rendering Frame...</p>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center">
                     <Monitor className="w-12 h-12 text-slate-700 mb-4" />
                     <h3 className="text-slate-300 font-medium mb-2">Visual Storyboard</h3>
                     <button
                       onClick={handleGeneratePreview}
                       className="mt-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center"
                     >
                       <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
                       Generate Frame
                     </button>
                   </div>
                 )}
              </div>
            )
          ) : (
            // MOTION VIDEO MODE
            videoUrl ? (
              <div className="relative w-full h-full bg-black">
                <video 
                  src={videoUrl} 
                  controls 
                  loop 
                  autoPlay 
                  muted
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-14 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white font-medium flex items-center pointer-events-none">
                   <Film className="w-3 h-3 mr-2 text-pink-500" /> Veo Motion
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                 {isGeneratingVideo ? (
                   <div className="flex flex-col items-center">
                     <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 border-t-2 border-pink-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-r-2 border-purple-500 rounded-full animate-spin reverse"></div>
                     </div>
                     <p className="text-pink-200 font-medium tracking-wide animate-pulse">Generating Motion...</p>
                     <p className="text-slate-500 text-xs mt-2 max-w-[200px]">This uses Veo and may take up to a minute.</p>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center">
                     <PlayCircle className="w-12 h-12 text-slate-700 mb-4" />
                     <h3 className="text-slate-300 font-medium mb-2">Motion Preview</h3>
                     <p className="text-slate-500 text-sm mb-6 max-w-[200px] mx-auto">See how the camera moves. Requires billing project.</p>
                     <button
                       onClick={handleGenerateVideo}
                       className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center shadow-lg shadow-purple-900/20"
                     >
                       <Film className="w-4 h-4 mr-2" />
                       Generate Video
                     </button>
                     {error && (
                        <p className="text-red-400 text-xs mt-4 max-w-[220px] bg-red-950/50 p-2 rounded border border-red-900">
                          {error}
                        </p>
                      )}
                   </div>
                 )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col bg-slate-900/40">
        
        {/* Header Area */}
        <div className="p-6 pb-2">
          <h3 className="text-xl font-bold text-white leading-tight mb-3">"{result.query}"</h3>
          
          {/* Mood Tags */}
          {result.vibe && (
            <div className="flex flex-wrap gap-2 mb-4">
              {result.vibe.moods.map((mood, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {mood}
                </span>
              ))}
            </div>
          )}

          {/* Color Palette Strip */}
          {result.vibe && (
            <div className="flex gap-0 rounded-lg overflow-hidden h-1.5 w-full max-w-[200px] mb-4 opacity-70">
              {result.vibe.palette.map((color, idx) => (
                <div key={idx} style={{ backgroundColor: color }} className="flex-1" />
              ))}
            </div>
          )}
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center px-6 border-b border-slate-700/50 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('sources')}
            className={`mr-6 pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === 'sources' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="flex items-center gap-2"><Video className="w-4 h-4" /> Scout Links</span>
            {activeTab === 'sources' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('tech')}
            className={`mr-6 pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === 'tech' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
             <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> Tech Specs</span>
             {activeTab === 'tech' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('locations')}
            className={`mr-6 pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === 'locations' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
             <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Shoot It</span>
             {activeTab === 'locations' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('audio')}
            className={`pb-3 text-sm font-medium transition-all relative whitespace-nowrap ${activeTab === 'audio' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
             <span className="flex items-center gap-2"><Music className="w-4 h-4" /> Audio Vibe</span>
             {activeTab === 'audio' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 bg-slate-800/20">
          
          {/* TAB: SOURCES */}
          {activeTab === 'sources' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               
               {/* Direct Search Links */}
               {result.directLinks && result.directLinks.length > 0 && (
                 <div className="mb-6">
                    <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3">Instant Search</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {result.directLinks.map((link, idx) => (
                        <a 
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-2 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 hover:text-indigo-200 transition-all text-xs font-semibold group"
                        >
                          <Search className="w-3 h-3 mr-2 text-indigo-400 group-hover:text-indigo-300" />
                          {link.platform}
                          {link.type === 'free' && <span className="ml-auto text-[9px] bg-green-500/20 text-green-300 px-1 rounded">Free</span>}
                        </a>
                      ))}
                    </div>
                 </div>
               )}

               <div className="prose prose-invert prose-sm text-slate-400 max-w-none leading-relaxed mb-4 text-xs">
                 <p className="whitespace-pre-line line-clamp-3">{result.summary}</p>
               </div>
               
               <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-3">AI Recommended Pages</h4>
               <div className="grid grid-cols-1 gap-2">
                {result.sources.length > 0 ? (
                  result.sources.slice(0, 3).map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-500 transition-all group"
                    >
                      <span className="truncate text-sm font-medium pr-2">
                        {source.title.replace(/ \|.*/, '')}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                    </a>
                  ))
                ) : (
                  <div className="p-3 bg-slate-800/30 rounded border border-slate-800/50 text-slate-500 text-sm">No specific pages found. Try the Instant Search links above.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: TECH SPECS */}
          {activeTab === 'tech' && result.techSpecs && (
            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lens Choice</span>
                <p className="text-slate-200 font-medium text-sm mt-1">{result.techSpecs.lens}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Frame Rate</span>
                <p className="text-slate-200 font-medium text-sm mt-1">{result.techSpecs.frameRate}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 col-span-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Lighting Setup</span>
                <p className="text-slate-200 font-medium text-sm mt-1">{result.techSpecs.lighting}</p>
                {/* Visual Lighting Diagram */}
                {result.lightingDiagram && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block text-center">Schematic</span>
                    {renderLightingDiagram()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
               <div className="mb-4">
                 <p className="text-slate-400 text-xs mb-3">
                   Can't find specific stock footage? Scout real-world locations nearby to film it yourself.
                 </p>
                 {!isScouting && locations.length === 0 && (
                   <button 
                     onClick={handleScoutLocations}
                     className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                   >
                     <MapPin className="w-4 h-4" />
                     Scout Nearby Locations
                   </button>
                 )}
               </div>

               {isScouting ? (
                 <div className="flex flex-col items-center justify-center py-8 text-indigo-300">
                   <Loader2 className="w-6 h-6 animate-spin mb-2" />
                   <span className="text-xs">Analyzing maps & visuals...</span>
                 </div>
               ) : (
                 <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                   {locations.map((loc, idx) => (
                     <a 
                       key={idx}
                       href={loc.uri}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="block p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all group"
                     >
                       <div className="flex items-start justify-between">
                         <div>
                           <h5 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">{loc.title}</h5>
                           <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                             <MapPin className="w-3 h-3" /> View on Google Maps
                           </span>
                         </div>
                         <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400" />
                       </div>
                     </a>
                   ))}
                   {scoutError && <p className="text-red-400 text-xs text-center">{scoutError}</p>}
                 </div>
               )}
            </div>
          )}

          {/* TAB: AUDIO */}
          {activeTab === 'audio' && result.audio && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="mb-4">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-2 mb-2">
                    <Music className="w-3 h-3" /> Musical Tone
                  </span>
                  <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-3 rounded-lg border border-indigo-500/20 text-indigo-200 text-sm italic">
                    "{result.audio.musicMood}"
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">Required SFX</span>
                  <ul className="space-y-2">
                    {result.audio.sfx.map((sfx, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mr-2"></span>
                        {sfx}
                      </li>
                    ))}
                  </ul>
                </div>
             </div>
          )}

          {(!result.techSpecs && activeTab !== 'sources' && activeTab !== 'locations') && (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing director specs...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};