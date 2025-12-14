import React, { useState, useEffect } from 'react';
import { ExternalLink, Image as ImageIcon, Loader2, Sparkles, Copy, Camera, Music, Video, Bookmark, BookmarkCheck, PlayCircle, Film, Search, MapPin, Lightbulb, View, Sliders, Monitor, Grid, Download, Palette, Aperture, Maximize, RefreshCw } from 'lucide-react';
import { BrollSearchResult, MapLocation } from '../types';
import { generateBrollPreview, generateBrollVideo, scoutLocations, generateBrollVariations, createLUTFile } from '../services/geminiService';

interface BrollCardProps {
  result: BrollSearchResult;
  onToggleSave: (result: BrollSearchResult) => void;
  isSaved: boolean;
}

type TabType = 'gallery' | 'tech' | 'color' | 'locations';
type PreviewMode = 'still' | 'motion';
type AspectRatio = 'cinema' | 'wide' | 'social';
type ColorFilter = 'none' | 'teal-orange' | 'noir' | 'vintage';

export const BrollCard: React.FC<BrollCardProps> = ({ result, onToggleSave, isSaved }) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(result.generatedPreviewUrl);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(result.generatedVideoUrl);
  const [variations, setVariations] = useState<string[]>(result.variations || []);
  
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('gallery');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('still');

  // Viewfinder State
  const [isViewfinderOn, setIsViewfinderOn] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('wide');
  const [activeFilter, setActiveFilter] = useState<ColorFilter>('none');
  const [currentLens, setCurrentLens] = useState<string>('50mm');

  // Location Scout State
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [isScouting, setIsScouting] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);

  // Auto-generate main image on mount if not present
  useEffect(() => {
    if (!previewUrl && !isGeneratingImage) {
      handleGeneratePreview();
    }
  }, []);

  const handleGeneratePreview = async (lensOverride?: string) => {
    setIsGeneratingImage(true);
    setError(null);
    try {
      const url = await generateBrollPreview(result.query, lensOverride || currentLens);
      setPreviewUrl(url);
    } catch (err) {
      setError("Failed to generate preview.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleLensChange = (lens: string) => {
    setCurrentLens(lens);
    handleGeneratePreview(lens); // Trigger re-generation with new lens
  };

  const handleGenerateVariations = async () => {
    setIsGeneratingVariations(true);
    try {
      const newVars = await generateBrollVariations(result.query);
      setVariations(newVars);
    } catch (e) {
      //
    } finally {
      setIsGeneratingVariations(false);
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

  const handleDownloadLUT = () => {
    if (!result.vibe?.palette) return;
    const content = createLUTFile(result.vibe.palette);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Look_${result.query.slice(0, 10).replace(/\s/g, '_')}.cube`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper to render lighting diagram
  const renderLightingDiagram = () => {
    if (!result.lightingDiagram) return null;
    return (
      <div className="w-full aspect-square max-w-[240px] mx-auto relative bg-[#0b0f19] rounded-full border border-slate-800 mt-4 shadow-inner">
        {/* Grid lines */}
        <div className="absolute inset-0 rounded-full border border-slate-800/50 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* Subject */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold z-10 border-2 border-slate-800 shadow-xl">
          SUBJ
        </div>
        
        {/* Camera */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          <div className="bg-black p-1.5 rounded-lg border border-slate-700">
             <Camera className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        {/* Lights */}
        {result.lightingDiagram.map((light, idx) => {
           const rotation = light.angle; 
           const distPerc = 25 + (light.distance * 2.5);
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
                 <div className="relative group/light">
                    <Lightbulb 
                        className="w-6 h-6 drop-shadow-[0_0_12px_rgba(255,255,0,0.3)] transition-transform group-hover/light:scale-110" 
                        style={{ color: light.color, fill: light.color }} 
                    />
                    <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 text-[8px] text-slate-300 font-bold rounded border border-white/10 whitespace-nowrap backdrop-blur-md">
                        {light.type}
                    </div>
                 </div>
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
    <div className="group relative glass-panel rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 flex flex-col md:flex-row mb-12 border-slate-800/60">
      
      {/* Save Button */}
      <button 
        onClick={() => onToggleSave(result)}
        className="absolute top-5 right-5 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 hover:border-indigo-500/50 transition-all shadow-lg"
      >
        {isSaved ? <BookmarkCheck className="w-5 h-5 text-indigo-400 fill-indigo-400" /> : <Bookmark className="w-5 h-5" />}
      </button>

      {/* Visual Preview Section (Left) */}
      <div className="w-full md:w-5/12 bg-black relative min-h-[400px] flex flex-col border-b md:border-b-0 md:border-r border-white/5">
        
        {/* Top Floating Controls */}
        <div className="absolute top-5 left-5 z-20 flex gap-3">
           {/* Mode Toggle */}
           <div className="bg-black/60 backdrop-blur-md rounded-full p-1 flex border border-white/10 shadow-lg">
             <button 
               onClick={() => setPreviewMode('still')}
               className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${previewMode === 'still' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               <ImageIcon className="w-3.5 h-3.5" /> Still
             </button>
             <button 
               onClick={() => setPreviewMode('motion')}
               className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${previewMode === 'motion' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
               <Film className="w-3.5 h-3.5" /> Motion
             </button>
           </div>
           
           {/* Viewfinder Toggle (Only in Still mode) */}
           {previewMode === 'still' && previewUrl && (
             <button 
               onClick={() => setIsViewfinderOn(!isViewfinderOn)}
               className={`p-2 rounded-full border border-white/10 transition-colors shadow-lg ${isViewfinderOn ? 'bg-red-600 text-white animate-pulse' : 'bg-black/60 text-slate-400 hover:text-white backdrop-blur-md'}`}
               title="Director's Viewfinder"
             >
               <View className="w-4 h-4" />
             </button>
           )}
        </div>

        {/* Viewfinder Controls (Bottom overlay) */}
        {isViewfinderOn && previewMode === 'still' && previewUrl && (
          <div className="absolute bottom-20 left-0 right-0 z-30 flex justify-center pointer-events-none animate-in slide-in-from-bottom-4 fade-in duration-300">
             <div className="bg-black/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex gap-6 pointer-events-auto shadow-2xl">
               
               {/* LENS SWITCHER (Complex Feature) */}
               <div className="flex flex-col gap-1 border-r border-white/10 pr-6">
                  <span className="text-[9px] text-slate-500 uppercase font-mono tracking-widest">Lens Kit</span>
                  <div className="flex gap-1">
                    {['16mm', '35mm', '50mm', '85mm'].map(lens => (
                        <button 
                        key={lens}
                        onClick={() => handleLensChange(lens)}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${currentLens === lens ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-slate-400 hover:text-white bg-white/5'}`}
                        >
                        {lens}
                        </button>
                    ))}
                  </div>
               </div>

               {/* Aspect Ratio */}
               <div className="flex flex-col gap-1 border-r border-white/10 pr-6">
                 <span className="text-[9px] text-slate-500 uppercase font-mono tracking-widest">Ratio</span>
                 <div className="flex gap-2 items-center h-full">
                    <button onClick={() => setAspectRatio('cinema')} className={`text-[10px] font-bold ${aspectRatio === 'cinema' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>2.39</button>
                    <button onClick={() => setAspectRatio('wide')} className={`text-[10px] font-bold ${aspectRatio === 'wide' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>16:9</button>
                    <button onClick={() => setAspectRatio('social')} className={`text-[10px] font-bold ${aspectRatio === 'social' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}>9:16</button>
                 </div>
               </div>

               {/* Filters */}
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] text-slate-500 uppercase font-mono tracking-widest">LUT Monitor</span>
                 <button onClick={() => setActiveFilter(activeFilter === 'none' ? 'teal-orange' : activeFilter === 'teal-orange' ? 'noir' : activeFilter === 'noir' ? 'vintage' : 'none')} className="text-slate-300 hover:text-white flex items-center gap-2 text-[10px] font-bold bg-white/5 px-3 py-1 rounded h-full">
                   <Sliders className="w-3 h-3" />
                   {activeFilter === 'none' ? 'Rec.709' : activeFilter}
                 </button>
               </div>
             </div>
          </div>
        )}

        {/* Main Display Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#050505]">
          {previewMode === 'still' ? (
            // STILL IMAGE MODE
            previewUrl ? (
              <div className="relative w-full h-full group/image flex items-center justify-center">
                {/* Image Container with potential Viewfinder Masks */}
                <div 
                  className={`relative w-full h-full transition-all duration-500 overflow-hidden ${isViewfinderOn ? 'scale-90' : ''}`}
                >
                  {isGeneratingImage && (
                    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                       <div className="text-center">
                         <Loader2 className="w-10 h-10 animate-spin text-yellow-500 mx-auto mb-3" />
                         <span className="text-xs font-mono text-yellow-400 tracking-widest">MOUNTING {currentLens.toUpperCase()}...</span>
                       </div>
                    </div>
                  )}

                  <img 
                    src={previewUrl} 
                    alt={`Preview for ${result.query}`} 
                    className="w-full h-full object-cover transition-all duration-500"
                    style={getFilterStyle()}
                  />

                  {/* Viewfinder Overlay Elements */}
                  {isViewfinderOn && (
                     <>
                        {/* Aspect Ratio Masks */}
                        {aspectRatio === 'cinema' && (
                          <>
                            <div className="absolute top-0 left-0 right-0 h-[12%] bg-black z-10 transition-all duration-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-black z-10 transition-all duration-300"></div>
                          </>
                        )}
                        {aspectRatio === 'social' && (
                          <>
                            <div className="absolute top-0 left-0 bottom-0 w-[35%] bg-black/90 z-10 backdrop-blur-sm transition-all duration-300"></div>
                            <div className="absolute top-0 right-0 bottom-0 w-[35%] bg-black/90 z-10 backdrop-blur-sm transition-all duration-300"></div>
                          </>
                        )}

                        {/* Camera UI Overlay (JetBrains Mono) */}
                        <div className="absolute inset-0 z-20 pointer-events-none p-6 font-mono opacity-90">
                           {/* Top Left: REC dot and Status */}
                           <div className="absolute top-8 left-8 flex items-center gap-3">
                              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                              <span className="text-red-500 text-sm font-bold tracking-widest">REC</span>
                              <span className="text-white text-xs ml-2">TC 00:00:04:12</span>
                           </div>

                           {/* Top Right: Battery/Card */}
                           <div className="absolute top-8 right-8 flex flex-col items-end gap-1">
                              <span className="text-green-400 text-[10px] tracking-wider">BAT 14.4V</span>
                              <span className="text-white text-[10px] tracking-wider">A001_C004_RAW</span>
                           </div>

                           {/* Center Crosshair */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50">
                              <div className="w-6 h-px bg-white"></div>
                              <div className="h-6 w-px bg-white -mt-3 ml-3"></div>
                           </div>

                           {/* Bottom Telemetry Data (Smart AI Data) */}
                           <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end text-white text-xs">
                              <div className="flex gap-6">
                                 <div>
                                    <span className="block text-[8px] text-slate-400 mb-0.5">ISO</span>
                                    <span className="text-base font-bold">{result.cameraSettings?.iso || '800'}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[8px] text-slate-400 mb-0.5">SHUTTER</span>
                                    <span className="text-base font-bold">{result.cameraSettings?.shutter || '180°'}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[8px] text-slate-400 mb-0.5">IRIS</span>
                                    <span className="text-base font-bold">{result.cameraSettings?.aperture || 'T2.8'}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[8px] text-slate-400 mb-0.5">WB</span>
                                    <span className="text-base font-bold">{result.cameraSettings?.wb || '5600K'}</span>
                                 </div>
                              </div>
                              
                              <div className="text-right">
                                 <span className="block text-[8px] text-slate-400 mb-0.5">FOCAL LENGTH</span>
                                 <span className="text-xl font-bold text-yellow-400">{currentLens}</span>
                              </div>
                           </div>
                           
                           {/* Frame Guides */}
                           <div className="absolute inset-10 border border-white/20"></div>
                           <div className="absolute top-10 left-10 w-4 h-4 border-t-2 border-l-2 border-white/50"></div>
                           <div className="absolute top-10 right-10 w-4 h-4 border-t-2 border-r-2 border-white/50"></div>
                           <div className="absolute bottom-10 left-10 w-4 h-4 border-b-2 border-l-2 border-white/50"></div>
                           <div className="absolute bottom-10 right-10 w-4 h-4 border-b-2 border-r-2 border-white/50"></div>
                        </div>
                     </>
                  )}
                </div>

                {!isViewfinderOn && (
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-white font-medium flex items-center shadow-lg">
                      <Sparkles className="w-3 h-3 mr-2 text-indigo-400" /> AI Generated Storyboard
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                 {isGeneratingImage ? (
                   <div className="flex flex-col items-center">
                     <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                     <p className="text-indigo-200 font-medium tracking-widest text-sm animate-pulse">RENDERING PREVIEW...</p>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center group/btn">
                     <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 group-hover/btn:border-indigo-500/50 group-hover/btn:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-300">
                        <Monitor className="w-8 h-8 text-slate-600 group-hover/btn:text-indigo-400 transition-colors" />
                     </div>
                     <h3 className="text-white font-bold text-lg mb-2">Visual Storyboard</h3>
                     <p className="text-slate-500 text-sm mb-6 max-w-[200px]">Generate a photorealistic preview of this shot.</p>
                     <button
                       onClick={() => handleGeneratePreview()}
                       className="bg-white text-black hover:bg-indigo-50 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center shadow-xl hover:scale-105 active:scale-95"
                     >
                       <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
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
                <div className="absolute bottom-16 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-white font-medium flex items-center pointer-events-none">
                   <Film className="w-3 h-3 mr-2 text-pink-500" /> Veo Motion Preview
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                 {isGeneratingVideo ? (
                   <div className="flex flex-col items-center">
                     <div className="relative w-16 h-16 mb-6">
                        <div className="absolute inset-0 border-t-2 border-pink-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-2 border-r-2 border-purple-500 rounded-full animate-spin reverse"></div>
                     </div>
                     <p className="text-pink-200 font-medium tracking-widest text-sm animate-pulse">GENERATING MOTION...</p>
                     <p className="text-slate-500 text-[10px] mt-2 max-w-[200px]">Powered by Veo. This may take a minute.</p>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center group/btn">
                     <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 group-hover/btn:border-pink-500/50 group-hover/btn:shadow-[0_0_30px_rgba(236,72,153,0.3)] transition-all duration-300">
                        <PlayCircle className="w-8 h-8 text-slate-600 group-hover/btn:text-pink-400 transition-colors" />
                     </div>
                     <h3 className="text-white font-bold text-lg mb-2">Motion Preview</h3>
                     <p className="text-slate-500 text-sm mb-6 max-w-[200px]">Simulate camera movement and action.</p>
                     <button
                       onClick={handleGenerateVideo}
                       className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center shadow-lg hover:shadow-purple-500/25 hover:scale-105 active:scale-95"
                     >
                       <Film className="w-4 h-4 mr-2" />
                       Generate Video
                     </button>
                     {error && (
                        <p className="text-red-400 text-xs mt-4 max-w-[220px] bg-red-950/50 p-2 rounded border border-red-900/50">
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

      {/* Content Section (Right) */}
      <div className="flex-1 flex flex-col">
        
        {/* Header Area */}
        <div className="p-8 pb-4">
          <div className="flex items-start justify-between mb-4">
             <h3 className="text-2xl font-bold text-white leading-tight">"{result.query}"</h3>
          </div>
          
          {/* Mood Tags */}
          {result.vibe && (
            <div className="flex flex-wrap gap-2 mb-6">
              {result.vibe.moods.map((mood, idx) => (
                <span key={idx} className="px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-white/5 text-indigo-200 border border-white/10 hover:border-indigo-500/30 transition-colors">
                  {mood}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sleek Tabs Navigation */}
        <div className="flex items-center px-8 border-b border-white/5 overflow-x-auto hide-scrollbar gap-8">
          {[
            { id: 'gallery', icon: Grid, label: 'Gallery' },
            { id: 'color', icon: Palette, label: 'Color Lab' },
            { id: 'tech', icon: Aperture, label: 'Specs' },
            { id: 'locations', icon: MapPin, label: 'Locations' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`pb-4 text-sm font-medium transition-all relative whitespace-nowrap group ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="flex items-center gap-2">
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-400' : 'group-hover:text-indigo-300'}`} /> 
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-8 bg-black/20 overflow-y-auto custom-scrollbar h-[350px]">
          
          {/* TAB: GALLERY */}
          {activeTab === 'gallery' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="mb-4 flex items-center justify-between">
                 <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Variations</h4>
                 {variations.length === 0 && !isGeneratingVariations && (
                   <button 
                     onClick={handleGenerateVariations}
                     className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-500/20 transition-colors"
                   >
                     <RefreshCw className="w-3 h-3" /> GENERATE ANGLES
                   </button>
                 )}
               </div>

               <div className="grid grid-cols-3 gap-3 mb-8">
                 {variations.length > 0 ? (
                   variations.map((vUrl, i) => (
                     <button 
                       key={i} 
                       onClick={() => { setPreviewUrl(vUrl); setPreviewMode('still'); }}
                       className="aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all group relative"
                     >
                       <img src={vUrl} className="w-full h-full object-cover" alt="Variation" />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                         <Maximize className="w-4 h-4 text-white" />
                       </div>
                     </button>
                   ))
                 ) : (
                   [1, 2, 3].map((_, i) => (
                      <div key={i} className="aspect-video rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                        {isGeneratingVariations ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">ANGLE {i+1}</span>
                        )}
                      </div>
                   ))
                 )}
               </div>

               <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                 <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Director's Note</h4>
                 <p className="text-sm text-slate-300 leading-relaxed">{result.summary}</p>
               </div>
            </div>
          )}

          {/* TAB: COLOR LAB */}
          {activeTab === 'color' && result.vibe && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="flex justify-between items-start mb-6">
                 <div>
                    <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Color Grade Studio</h4>
                    <p className="text-xs text-slate-400">Analysis & LUT Generation</p>
                 </div>
                 <button 
                   onClick={handleDownloadLUT}
                   className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all"
                 >
                   <Download className="w-3 h-3" /> EXPORT .CUBE
                 </button>
               </div>
               
               {/* Color Palette Display */}
               <div className="flex h-20 rounded-xl overflow-hidden shadow-2xl mb-8 border border-white/10 ring-1 ring-black/50">
                 {result.vibe.palette.map((color, idx) => (
                   <div key={idx} className="flex-1 flex items-end justify-center pb-3 text-[9px] font-mono text-white/90 font-bold" style={{ backgroundColor: color }}>
                     {color}
                   </div>
                 ))}
               </div>

               {/* Simulated Histogram / Scope */}
               <div className="bg-black/40 rounded-xl p-5 border border-white/5">
                 <div className="flex justify-between text-[9px] text-slate-500 uppercase font-mono tracking-widest mb-3">
                   <span>Shadows</span>
                   <span>Midtones</span>
                   <span>Highlights</span>
                 </div>
                 <div className="flex items-end h-28 gap-[2px] opacity-80 mask-image-b">
                    {[...Array(40)].map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-gradient-to-t from-indigo-900/20 via-indigo-500/50 to-purple-400 rounded-t-[1px]" 
                        style={{ height: `${20 + Math.random() * 60 + (i > 15 && i < 25 ? 20 : 0)}%` }}
                      ></div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {/* TAB: TECH SPECS */}
          {activeTab === 'tech' && result.techSpecs && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Lens Choice</span>
                <p className="text-indigo-200 font-mono text-sm mt-1">{result.techSpecs.lens}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Frame Rate</span>
                <p className="text-indigo-200 font-mono text-sm mt-1">{result.techSpecs.frameRate}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 col-span-2">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Lighting Setup</span>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">{result.techSpecs.lighting}</p>
                
                {/* Visual Lighting Diagram */}
                {result.lightingDiagram && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block text-center mb-2">Lighting Schematic</span>
                    {renderLightingDiagram()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
               <div className="mb-6">
                 <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 mb-4">
                    <h4 className="text-indigo-300 text-sm font-bold flex items-center gap-2 mb-1"><MapPin className="w-4 h-4"/> Location Scout</h4>
                    <p className="text-indigo-200/60 text-xs">Find real-world matches nearby to film this shot yourself.</p>
                 </div>
                 
                 {!isScouting && locations.length === 0 && (
                   <button 
                     onClick={handleScoutLocations}
                     className="w-full py-3 bg-white text-black hover:bg-indigo-50 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                   >
                     <Search className="w-4 h-4" />
                     Search Nearby Locations
                   </button>
                 )}
               </div>

               {isScouting ? (
                 <div className="flex flex-col items-center justify-center py-12 text-indigo-400">
                   <Loader2 className="w-8 h-8 animate-spin mb-3" />
                   <span className="text-xs font-mono tracking-widest">SATELLITE SCANNING...</span>
                 </div>
               ) : (
                 <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                   {locations.map((loc, idx) => (
                     <a 
                       key={idx}
                       href={loc.uri}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="block p-4 bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/50 rounded-xl transition-all group"
                     >
                       <div className="flex items-start justify-between">
                         <div>
                           <h5 className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{loc.title}</h5>
                           <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                             <MapPin className="w-3 h-3" /> OPEN MAPS
                           </span>
                         </div>
                         <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-indigo-400" />
                       </div>
                     </a>
                   ))}
                   {scoutError && <p className="text-red-400 text-xs text-center bg-red-950/30 p-2 rounded border border-red-900/50">{scoutError}</p>}
                 </div>
               )}
            </div>
          )}

          {(!result.techSpecs && activeTab !== 'gallery' && activeTab !== 'locations') && (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm font-mono">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> ANALYZING SPECS...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};