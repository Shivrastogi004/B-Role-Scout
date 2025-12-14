import React, { useState, useEffect, useRef } from 'react';
import { ExternalLink, Image as ImageIcon, Loader2, Sparkles, Copy, Camera, Music, Video, Bookmark, BookmarkCheck, PlayCircle, Film, Search, MapPin, Lightbulb, View, Sliders, Monitor, Grid, Download, Palette, Aperture, Maximize, RefreshCw, Sun, Clock, MousePointerClick } from 'lucide-react';
import { BrollSearchResult, MapLocation } from '../types';
import { generateBrollPreview, generateBrollVideo, scoutLocations, generateBrollVariations, createLUTFile } from '../services/geminiService';

interface BrollCardProps {
  result: BrollSearchResult;
  onToggleSave: (result: BrollSearchResult) => void;
  isSaved: boolean;
}

type TabType = 'footage' | 'tech' | 'color' | 'locations';
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
  const [activeTab, setActiveTab] = useState<TabType>('footage');
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

  // Parallax Effect State
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  // Auto-generate main image on mount if not present
  useEffect(() => {
    if (!previewUrl && !isGeneratingImage) {
      handleGeneratePreview();
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isViewfinderOn) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation based on cursor position
    // Max rotation 10 degrees
    const rY = ((x - centerX) / centerX) * 5; 
    const rX = ((centerY - y) / centerY) * 5; 

    setRotateY(rY);
    setRotateX(rX);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleGeneratePreview = async (lensOverride?: string) => {
    setIsGeneratingImage(true);
    setError(null);
    try {
      const url = await generateBrollPreview(result.query, lensOverride || currentLens, result.referenceImage);
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
    <div 
      className="group relative glass-panel rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 flex flex-col md:flex-row mb-12 border-slate-800/60 perspective-1000"
      style={{ perspective: '1000px' }}
    >
      
      {/* Save Button */}
      <button 
        onClick={() => onToggleSave(result)}
        className="absolute top-5 right-5 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 hover:border-indigo-500/50 transition-all shadow-lg"
      >
        {isSaved ? <BookmarkCheck className="w-5 h-5 text-indigo-400 fill-indigo-400" /> : <Bookmark className="w-5 h-5" />}
      </button>

      {/* Visual Preview Section (Left) - With Parallax Effect */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full md:w-5/12 bg-black relative min-h-[400px] flex flex-col border-b md:border-b-0 md:border-r border-white/5 overflow-hidden transform-style-3d transition-transform duration-100 ease-out"
      >
        
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
               {/* LENS SWITCHER */}
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

        {/* Main Display Area with Parallax Transform */}
        <div 
           className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#050505] transform-style-3d"
           style={{ transform: isViewfinderOn ? 'none' : `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)` }}
        >
          {previewMode === 'still' ? (
            // STILL IMAGE MODE
            previewUrl ? (
              <div className="relative w-full h-full group/image flex items-center justify-center">
                {/* Image Container */}
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
                     <div className="absolute inset-0 z-20 pointer-events-none p-6 font-mono opacity-90">
                           {/* REC dot */}
                           <div className="absolute top-8 left-8 flex items-center gap-3">
                              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                              <span className="text-red-500 text-sm font-bold tracking-widest">REC</span>
                              <span className="text-white text-xs ml-2">TC 00:00:04:12</span>
                           </div>
                           {/* Crosshair */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50">
                              <div className="w-6 h-px bg-white"></div>
                              <div className="h-6 w-px bg-white -mt-3 ml-3"></div>
                           </div>
                           {/* Frame Guides */}
                           <div className="absolute inset-10 border border-white/20"></div>
                     </div>
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
                     <Monitor className="w-16 h-16 text-slate-800 mb-6" />
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
                <video src={videoUrl} controls loop autoPlay muted className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-black">
                 {isGeneratingVideo ? (
                   <div className="flex flex-col items-center">
                     <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-4" />
                     <p className="text-pink-200 font-medium tracking-widest text-sm animate-pulse">GENERATING MOTION...</p>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center group/btn">
                     <button
                       onClick={handleGenerateVideo}
                       className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center shadow-lg hover:shadow-purple-500/25 hover:scale-105 active:scale-95"
                     >
                       <Film className="w-4 h-4 mr-2" />
                       Generate Video
                     </button>
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
            { id: 'footage', icon: Video, label: 'Found Footage' },
            { id: 'tech', icon: Aperture, label: 'Specs' },
            { id: 'color', icon: Palette, label: 'Color Lab' },
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
          
          {/* TAB: FOOTAGE (VISUAL SEARCH) */}
          {activeTab === 'footage' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="mb-4">
                 <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Found Visuals</h4>
                 <p className="text-xs text-slate-400">External stock sources matched to your query.</p>
               </div>

               {result.foundClips ? (
                 <div className="grid grid-cols-2 gap-4">
                   {result.foundClips.map((clip) => (
                     <a 
                       key={clip.id} 
                       href={clip.url}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="group/clip relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-indigo-500 transition-all shadow-lg block"
                     >
                       {/* AI Generated Thumbnail representing the link content */}
                       <img src={clip.thumbnail} alt={clip.title} className="w-full h-full object-cover transition-transform duration-700 group-hover/clip:scale-110" />
                       
                       {/* Overlay */}
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                         <div className="flex justify-between items-end">
                            <div>
                               <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest bg-indigo-900/40 px-1.5 py-0.5 rounded border border-indigo-500/30 mb-1 inline-block">{clip.domain}</span>
                               <p className="text-xs font-bold text-white line-clamp-1">{clip.title}</p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-white/70" />
                         </div>
                       </div>

                       {/* Hover Action */}
                       <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover/clip:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                          <span className="px-3 py-1.5 bg-black/80 rounded-full text-[10px] text-white font-bold flex items-center gap-1 border border-white/20">
                             <MousePointerClick className="w-3 h-3" /> OPEN LINK
                          </span>
                       </div>
                     </a>
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-10 opacity-50">
                   <Search className="w-8 h-8 mb-2" />
                   <span className="text-xs">No visual sources found.</span>
                 </div>
               )}

               <div className="mt-6 pt-6 border-t border-white/5">
                 <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">Quick Search Links</h4>
                 <div className="flex flex-wrap gap-2">
                   {result.directLinks?.map((link, i) => (
                     <a 
                       key={i} 
                       href={link.url} 
                       target="_blank" 
                       rel="noreferrer"
                       className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors"
                     >
                       {link.platform}
                     </a>
                   ))}
                 </div>
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
                     <div 
                       key={idx}
                       className="p-4 bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/50 rounded-xl transition-all group"
                     >
                       <div className="flex items-start justify-between mb-2">
                         <div>
                           <h5 className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">{loc.title}</h5>
                           <a href={loc.uri} target="_blank" rel="noreferrer" className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-mono hover:text-white transition-colors">
                             <MapPin className="w-3 h-3" /> OPEN MAPS <ExternalLink className="w-3 h-3" />
                           </a>
                         </div>
                       </div>
                       
                       {/* Sun Tracker */}
                       {loc.sunData && (
                         <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 text-yellow-500/80 bg-yellow-500/10 p-2 rounded-lg">
                               <Sun className="w-4 h-4" />
                               <div>
                                 <span className="text-[8px] uppercase font-bold block opacity-70">Golden Hour</span>
                                 <span className="text-[10px] font-mono font-bold">{loc.sunData.goldenHourEvening}</span>
                               </div>
                            </div>
                            <div className="flex items-center gap-2 text-blue-400/80 bg-blue-500/10 p-2 rounded-lg">
                               <Clock className="w-4 h-4" />
                               <div>
                                 <span className="text-[8px] uppercase font-bold block opacity-70">Blue Hour</span>
                                 <span className="text-[10px] font-mono font-bold">{loc.sunData.blueHour}</span>
                               </div>
                            </div>
                         </div>
                       )}
                     </div>
                   ))}
                   {scoutError && <p className="text-red-400 text-xs text-center bg-red-950/30 p-2 rounded border border-red-900/50">{scoutError}</p>}
                 </div>
               )}
            </div>
          )}

          {(!result.techSpecs && activeTab !== 'footage' && activeTab !== 'locations') && (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm font-mono">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> ANALYZING SPECS...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};