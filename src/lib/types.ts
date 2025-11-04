// ============= Type Definitions =============

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  isFromSign: boolean;
}

export interface AppState {
  model: any | null;
  classNames: string[];
  userName: string;
  isModelLoaded: boolean;
  isPredicting: boolean;
  audioPlaying: boolean;
  selectedVoice: SpeechSynthesisVoice | null;
  confidenceThreshold: number;
  speechRate: number;
  signCooldowns: Map<string, number>;
  lastDetectedSign: string;
  currentStableSign: string;
  predictionCounter: number;
}

export interface PerformanceMetrics {
  fps: number;
  predictionTime: number;
  lastUpdateTime: number;
}

export interface PredictionResult {
  className: string;
  confidence: number;
}
