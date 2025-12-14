export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  // Maps grounding returns specific map data
  maps?: {
    uri: string;
    title: string;
    placeId?: string;
  };
}

export interface TechSpecs {
  lens: string;
  lighting: string;
  frameRate: string;
  movement: string;
}

export interface LightNode {
  type: 'Key' | 'Fill' | 'Back' | 'Background';
  angle: number; // 0-360 degrees
  distance: number; // 1-10 relative
  color: string; // Hex
}

export interface CameraSettings {
  iso: string;
  aperture: string;
  shutter: string;
  wb: string;
}

export interface AudioSpecs {
  sfx: string[];
  musicMood: string;
}

export interface VibeMetadata {
  palette: string[];
  moods: string[];
}

export interface DirectLink {
  platform: string;
  url: string;
  type: 'free' | 'paid' | 'social';
}

export interface SunData {
  sunrise: string;
  goldenHourMorning: string;
  goldenHourEvening: string;
  sunset: string;
  blueHour: string;
}

export interface MapLocation {
  title: string;
  address?: string;
  uri: string;
  rating?: number;
  sunData?: SunData; // New feature
}

export interface BrollSearchResult {
  id: string;
  query: string;
  summary: string;
  sources: {
    title: string;
    url: string;
  }[];
  directLinks?: DirectLink[];
  generatedPreviewUrl?: string;
  generatedVideoUrl?: string;
  variations?: string[]; 
  isGeneratingPreview?: boolean;
  vibe?: VibeMetadata;
  techSpecs?: TechSpecs;
  lightingDiagram?: LightNode[];
  cameraSettings?: CameraSettings;
  audio?: AudioSpecs;
  currentFocalLength?: string; 
  referenceImage?: string; // Base64 reference
}

export interface ScriptSegment {
  id: string;
  narration: string;
  visualPrompt: string;
  estimatedDuration: string;
}

export interface SearchState {
  isLoading: boolean;
  error: string | null;
  results: BrollSearchResult[];
}

export enum SearchMode {
  SINGLE = 'SINGLE',
  SCENE = 'SCENE',
  SCRIPT = 'SCRIPT'
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    webkitAudioContext?: typeof AudioContext;
  }
}