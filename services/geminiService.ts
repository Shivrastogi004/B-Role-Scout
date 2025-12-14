import { GoogleGenAI, Type, Modality } from "@google/genai";
import { BrollSearchResult, GroundingChunk, VibeMetadata, TechSpecs, AudioSpecs, DirectLink, ScriptSegment, LightNode, MapLocation, CameraSettings } from "../types";

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
async function getDeepAnalysis(query: string): Promise<DeepAnalysisResult | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a Director of Photography. Analyze this shot: "${query}". 
      Provide:
      1. Color palette & Mood.
      2. Tech specs (Lens, Light, FPS, Move).
      3. Audio suggestions.
      4. A Lighting Diagram (3-4 lights).
      5. Realistic Camera Settings for this specific shot environment (ISO, Aperture, Shutter Angle, White Balance).`,
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

    chunks.forEach((chunk: any) => { // Type assertion handling for dynamic API response
      if (chunk.web && chunk.web.uri.includes('google.com/maps')) {
         // Fallback if maps object isn't explicitly populated but web is
         locations.push({
           title: chunk.web.title,
           uri: chunk.web.uri
         });
      } else if (chunk.maps) {
         locations.push({
           title: chunk.maps.title,
           uri: chunk.maps.uri,
         });
      }
    });

    // Filter duplicates
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
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is a good narrator voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    // Decode base64 to ArrayBuffer
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


/**
 * Helper to generate a shot list from a scene description
 */
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
 * Searches for B-roll sources using Gemini with Google Search Grounding.
 * Also fetches Deep Analysis in parallel.
 */
export const searchBrollResources = async (query: string): Promise<BrollSearchResult> => {
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
    const analysisPromise = getDeepAnalysis(query);

    const [searchResponse, analysisData] = await Promise.all([searchPromise, analysisPromise]);

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

    // Generate Direct Links based on the query
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
      directLinks,
      vibe: analysisData?.vibe,
      techSpecs: analysisData?.techSpecs,
      cameraSettings: analysisData?.cameraSettings,
      lightingDiagram: analysisData?.lightingDiagram,
      audio: analysisData?.audio
    };

  } catch (error) {
    console.error("Error searching B-roll:", error);
    throw new Error("Failed to search for B-roll resources. Please try again.");
  }
};

/**
 * Generates a preview image (storyboard).
 */
export const generateBrollPreview = async (description: string): Promise<string> => {
  try {
    const model = "gemini-2.5-flash-image";
    const prompt = `Cinematic b-roll still frame: ${description}. High quality, photorealistic, 4k, professional lighting, cinematic composition.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
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

/**
 * Generates a video preview (Motion Storyboard) using Veo.
 */
export const generateBrollVideo = async (description: string): Promise<string> => {
  try {
    // Check if user has selected an API key for Veo
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
      await window.aistudio.openSelectKey();
    }
    
    // Create a NEW instance to pick up the potentially newly selected key
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

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await currentAi.operations.getVideosOperation({ operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned from Veo.");

    // The URI requires the API Key appended
    const videoRes = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await videoRes.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Error generating video:", error);
    // Explicitly handle the "key not found" error to prompt user
    if (error instanceof Error && error.message.includes("Requested entity was not found")) {
       if (window.aistudio) {
         await window.aistudio.openSelectKey();
         throw new Error("Please select a billing project and try again.");
       }
    }
    throw new Error("Failed to generate motion preview.");
  }
};