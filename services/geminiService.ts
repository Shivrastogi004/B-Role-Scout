import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BrollSearchResult, GroundingChunk, VibeMetadata, TechSpecs, AudioSpecs, DirectLink, ScriptSegment, LightNode, MapLocation, CameraSettings, SunData, FoundClip } from "../types";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

interface DeepAnalysisResult {
  vibe: VibeMetadata;
  techSpecs: TechSpecs;
  cameraSettings: CameraSettings;
  audio: AudioSpecs;
  lightingDiagram: LightNode[];
}

/**
 * Calculates fake but plausible sun data based on randomness (simulating lat/lng calc)
 * In a real app, this would use the 'suncalc' library with actual lat/lng
 */
const calculateSunData = (): SunData => {
  // Simulating times for a typical day
  return {
    sunrise: "06:15 AM",
    goldenHourMorning: "06:15 AM - 07:00 AM",
    goldenHourEvening: "06:45 PM - 07:30 PM",
    sunset: "07:30 PM",
    blueHour: "07:30 PM - 07:50 PM"
  };
};

/**
 * Enhances a basic user prompt into a professional cinematic description
 */
export const enhancePrompt = async (simpleQuery: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rewrite this video search query into a professional Director of Photography prompt. 
      Add details about lighting, lens type, camera movement, and texture. Keep it under 20 words.
      Input: "${simpleQuery}"`,
    });
    return response.text?.replace(/^"|"$/g, '') || simpleQuery;
  } catch (e) {
    return simpleQuery;
  }
};

/**
 * Helper to get deep analysis (Vibe, Tech Specs, Audio, Lighting, Camera) using JSON mode
 */
async function getDeepAnalysis(query: string, referenceImage?: string): Promise<DeepAnalysisResult | undefined> {
  try {
    const parts: any[] = [];
    
    // If reference image exists, we add it to the analysis prompt
    if (referenceImage) {
      const base64Data = referenceImage.split(',')[1];
      parts.push({
        inlineData: {
          mimeType: "image/jpeg", // Assuming jpeg/png
          data: base64Data
        }
      });
      parts.push({
        text: "Analyze this reference image and extract its visual style to answer the following based on the user's query."
      });
    }

    parts.push({
      text: `Act as a Director of Photography. Analyze this shot idea: "${query}". 
      Provide:
      1. Color palette & Mood (If reference image provided, match it).
      2. Tech specs (Lens, Light, FPS, Move).
      3. Audio suggestions.
      4. A Lighting Diagram (3-4 lights).
      5. Realistic Camera Settings for this specific shot environment (ISO, Aperture, Shutter Angle, White Balance).`
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: parts
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vibe: {
              type: Type.OBJECT,
              properties: {
                palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                moods: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            techSpecs: {
              type: Type.OBJECT,
              properties: {
                lens: { type: Type.STRING },
                lighting: { type: Type.STRING },
                frameRate: { type: Type.STRING },
                movement: { type: Type.STRING }
              }
            },
            cameraSettings: {
              type: Type.OBJECT,
              properties: {
                iso: { type: Type.STRING, description: "e.g. 800" },
                aperture: { type: Type.STRING, description: "e.g. T2.8" },
                shutter: { type: Type.STRING, description: "e.g. 180°" },
                wb: { type: Type.STRING, description: "e.g. 5600K" }
              }
            },
            lightingDiagram: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["Key", "Fill", "Back", "Background"] },
                  angle: { type: Type.NUMBER },
                  distance: { type: Type.NUMBER },
                  color: { type: Type.STRING }
                }
              }
            },
            audio: {
              type: Type.OBJECT,
              properties: {
                sfx: { type: Type.ARRAY, items: { type: Type.STRING } },
                musicMood: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as DeepAnalysisResult;
    }
    return undefined;
  } catch (e) {
    console.warn("Failed to generate deep analysis", e);
    return undefined;
  }
}

/**
 * Scouts real-world locations using Google Maps Grounding
 */
export const scoutLocations = async (query: string, lat?: number, lng?: number): Promise<MapLocation[]> => {
  try {
    const locationPrompt = lat && lng 
      ? `Find real-world places near ${lat}, ${lng} that visually match this vibe: "${query}". Look for public locations, parks, architecture, or businesses.`
      : `Find real-world places in a major city like Los Angeles or New York that visually match this vibe: "${query}".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: locationPrompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: lat && lng ? {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        } : undefined
      }
    });

    // Extract Maps chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const locations: MapLocation[] = [];

    chunks.forEach((chunk: any) => { 
      if (chunk.web && chunk.web.uri.includes('google.com/maps')) {
         locations.push({
           title: chunk.web.title,
           uri: chunk.web.uri,
           sunData: calculateSunData()
         });
      } else if (chunk.maps) {
         locations.push({
           title: chunk.maps.title,
           uri: chunk.maps.uri,
           sunData: calculateSunData()
         });
      }
    });

    return locations.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

  } catch (e) {
    console.error("Location scouting failed", e);
    throw new Error("Could not find locations.");
  }
};

/**
 * Analyzes a full script and breaks it down into AV beats
 */
export const analyzeScript = async (scriptText: string): Promise<ScriptSegment[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a Video Director. Break down this script into visual beats. For every sentence or two of narration, suggest a specific, creative B-roll visual.
      
      Script: "${scriptText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              narration: { type: Type.STRING, description: "The specific line from the script" },
              visualPrompt: { type: Type.STRING, description: "A detailed B-roll search query for this line" },
              estimatedDuration: { type: Type.STRING, description: "e.g. 3s" }
            }
          }
        }
      }
    });

    if (response.text) {
      const raw = JSON.parse(response.text);
      return raw.map((item: any) => ({
        ...item,
        id: crypto.randomUUID()
      }));
    }
    return [];
  } catch (e) {
    console.error("Failed to analyze script", e);
    throw new Error("Could not analyze script.");
  }
};

/**
 * Generates Speech from text using Gemini TTS
 */
export const generateSpeech = async (text: string): Promise<ArrayBuffer> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;

  } catch (e) {
    console.error("TTS Error", e);
    throw new Error("Failed to generate speech");
  }
};


export const generateShotList = async (sceneDescription: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down this video scene into 4 distinct, specific B-roll shot descriptions: "${sceneDescription}". Return just the list.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of shot descriptions"
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as string[];
    }
    return [];
  } catch (e) {
    console.error("Failed to generate shot list", e);
    throw new Error("Could not generate shot list.");
  }
};

/**
 * Searches for B-roll sources and generates visual thumbnails for them.
 */
export const searchBrollResources = async (query: string, referenceImage?: string): Promise<BrollSearchResult> => {
  try {
    // 1. Main Search Request
    const searchPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find specific video pages and stock footage clips for: "${query}". I want direct URLs to pages where I can watch or download the video on sites like Pexels, Shutterstock, or YouTube.`,
      config: {
        systemInstruction: `
          You are a footage researcher.
          1. Use Google Search to find specific video pages matching the user's B-roll request.
          2. Prioritize free stock footage sites (Pexels, Pixabay, Mixkit) or specific YouTube video clips.
          3. Return a list of specific pages found.
        `,
        tools: [{ googleSearch: {} }],
      },
    });

    // 2. Deep Analysis Request (Parallel)
    const analysisPromise = getDeepAnalysis(query, referenceImage);

    // 3. Generate Visual Thumbnails (Parallel) - Create 4 distinct thumbnails to use for results
    const thumbnailsPromise = generateBrollVariations(query);

    const [searchResponse, analysisData, thumbnails] = await Promise.all([searchPromise, analysisPromise, thumbnailsPromise]);

    const summary = searchResponse.text || "No summary available.";
    
    // Extract sources
    const sources: { title: string; url: string }[] = [];
    const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: GroundingChunk) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title,
          url: chunk.web.uri,
        });
      }
    });

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

    // Create "Found Clips" by merging sources with generated thumbnails
    // This simulates "scraping" the image by providing a high-quality visual representation of what the link contains
    const foundClips: FoundClip[] = uniqueSources.slice(0, 4).map((source, index) => {
      const urlObj = new URL(source.url);
      return {
        id: crypto.randomUUID(),
        title: source.title.replace(/ \| .*$/, '').replace(/ - .*$/, '').substring(0, 40),
        url: source.url,
        domain: urlObj.hostname.replace('www.', ''),
        // Cycle through thumbnails if we have more sources than generated images
        thumbnail: thumbnails[index % thumbnails.length] || thumbnails[0] 
      };
    });

    const q = encodeURIComponent(query);
    const directLinks: DirectLink[] = [
      { platform: 'Pexels', url: `https://www.pexels.com/search/videos/${q}/`, type: 'free' },
      { platform: 'Pixabay', url: `https://pixabay.com/videos/search/${q}/`, type: 'free' },
      { platform: 'YouTube', url: `https://www.youtube.com/results?search_query=${q}+cinematic+b-roll`, type: 'social' },
      { platform: 'Pond5', url: `https://www.pond5.com/stock-footage/${q}`, type: 'paid' },
    ];

    return {
      id: crypto.randomUUID(),
      query,
      summary,
      sources: uniqueSources,
      foundClips: foundClips.length > 0 ? foundClips : undefined,
      directLinks,
      vibe: analysisData?.vibe,
      techSpecs: analysisData?.techSpecs,
      cameraSettings: analysisData?.cameraSettings,
      lightingDiagram: analysisData?.lightingDiagram,
      audio: analysisData?.audio,
      currentFocalLength: '50mm',
      referenceImage,
      // Use the first thumbnail as the main preview if available, otherwise generate one later
      generatedPreviewUrl: thumbnails[0]
    };

  } catch (error) {
    console.error("Error searching B-roll:", error);
    throw new Error("Failed to search for B-roll resources. Please try again.");
  }
};

/**
 * Generates a preview image (storyboard).
 * Accepts optional focalLength and referenceImage.
 */
export const generateBrollPreview = async (description: string, focalLength?: string, referenceImage?: string): Promise<string> => {
  try {
    const model = "gemini-2.5-flash-image";
    let textPrompt = `Cinematic b-roll still frame: ${description}. High quality, photorealistic, 4k, professional lighting, cinematic composition.`;
    
    // Inject focal length characteristics
    if (focalLength) {
      if (focalLength === '16mm') textPrompt += " Shot on 16mm wide-angle lens, expansive field of view, slight distortion.";
      if (focalLength === '35mm') textPrompt += " Shot on 35mm lens, street photography style, natural field of view.";
      if (focalLength === '50mm') textPrompt += " Shot on 50mm prime lens, human eye perspective, sharp subject.";
      if (focalLength === '85mm') textPrompt += " Shot on 85mm portrait lens, compressed background, shallow depth of field, bokeh.";
    }

    const parts: any[] = [];
    
    // Add reference image for "style transfer" / composition matching
    if (referenceImage) {
        const base64Data = referenceImage.split(',')[1];
        parts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: base64Data
            }
        });
        textPrompt += " Match the lighting style, color palette, and composition of this reference image.";
    }

    parts.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: {
        role: "user",
        parts: parts
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of responseParts) {
      if (part.inlineData && part.inlineData.data) {
        const base64Data = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || "image/png";
        return `data:${mimeType};base64,${base64Data}`;
      }
    }

    throw new Error("No image data returned from API");
  } catch (error) {
    console.error("Error generating preview:", error);
    throw new Error("Failed to generate preview image.");
  }
};

export const generateBrollVariations = async (query: string): Promise<string[]> => {
  const variations = [
    `Cinematic shot: ${query}`,
    `Close-up detail: ${query}`,
    `Wide establishing shot: ${query}`,
    `Artistic angle: ${query}`
  ];

  try {
    const promises = variations.map(prompt => generateBrollPreview(prompt));
    const results = await Promise.all(promises);
    return results;
  } catch (e) {
    console.error("Error generating variations", e);
    return [];
  }
};


export const generateBrollVideo = async (description: string): Promise<string> => {
  try {
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }
    
    const currentAi = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

    let operation = await currentAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic b-roll footage, high quality, 4k: ${description}`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); 
      operation = await currentAi.operations.getVideosOperation({ operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned from Veo.");

    const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await videoRes.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Error generating video:", error);
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
       if (window.aistudio) {
         await window.aistudio.openSelectKey();
         throw new Error("Please select a billing project and try again.");
       }
    }
    throw new Error("Failed to generate motion preview.");
  }
};

export const generateProductionSchedule = async (shots: BrollSearchResult[]): Promise<string> => {
  try {
    const shotDescriptions = shots.map((s, i) => `${i+1}. ${s.query} (Specs: ${s.techSpecs?.lighting || 'Standard'})`).join('\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a First AD (Assistant Director). Create a logical filming schedule (Call Sheet) for these shots.
      Group them efficiently by lighting setup (e.g. all Day Exterior together) to minimize movement.
      Add estimated times assuming a 10-hour day starting at 08:00.
      Return the output as a clean Markdown table.
      
      Shots:
      ${shotDescriptions}`,
    });

    return response.text || "Could not generate schedule.";
  } catch (e) {
    return "Error generating schedule.";
  }
};

export const createLUTFile = (palette: string[]): string => {
  let lut = `TITLE "GenAI_B-Roll_Grade"\nLUT_3D_SIZE 2\n\n`;
  lut += "0.000000 0.000000 0.000000\n"; // Black
  lut += "1.000000 0.000000 0.000000\n"; // Red
  lut += "0.000000 1.000000 0.000000\n"; // Green
  lut += "1.000000 1.000000 0.000000\n"; // Yellow
  lut += "0.000000 0.000000 1.000000\n"; // Blue
  lut += "1.000000 0.000000 1.000000\n"; // Magenta
  lut += "0.000000 1.000000 1.000000\n"; // Cyan
  lut += "1.000000 1.000000 1.000000\n"; // White
  return lut;
};