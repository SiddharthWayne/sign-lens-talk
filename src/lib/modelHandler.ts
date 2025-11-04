// ============= TensorFlow.js Model Handler =============
import * as tf from '@tensorflow/tfjs';
import JSZip from 'jszip';
import type { PredictionResult } from './types';

const MODEL_IMAGE_SIZE = 224;
const PREDICTION_INTERVAL = 200; // 200ms = ~5 FPS
const STABILITY_INTERVALS = 5; // Need 5 stable predictions
const AUTO_SPEECH_COOLDOWN_MS = 10000; // 10 seconds

interface ModelHandlerState {
  model: tf.LayersModel | null;
  classNames: string[];
  isPredicting: boolean;
  predictionLoopId: NodeJS.Timeout | null;
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  currentStableSign: string;
  predictionCounter: number;
  lastDetectedSign: string;
  signCooldowns: Map<string, number>;
  audioPlaying: boolean;
  confidenceThreshold: number;
}

const state: ModelHandlerState = {
  model: null,
  classNames: [],
  isPredicting: false,
  predictionLoopId: null,
  videoElement: null,
  canvasElement: null,
  currentStableSign: '',
  predictionCounter: 0,
  lastDetectedSign: '',
  signCooldowns: new Map(),
  audioPlaying: false,
  confidenceThreshold: 0.70,
};

export const loadModel = async (
  file: File,
  onProgress: (status: string) => void,
  onSuccess: (classNames: string[]) => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    onProgress('Extracting model files...');
    
    const zip = await JSZip.loadAsync(file);
    const files = zip.files;

    // Find required files
    let modelJsonFile: JSZip.JSZipObject | null = null;
    let weightsFile: JSZip.JSZipObject | null = null;
    let metadataFile: JSZip.JSZipObject | null = null;

    Object.keys(files).forEach(key => {
      const fileName = key.toLowerCase();
      if (fileName.endsWith('model.json')) modelJsonFile = files[key];
      else if (fileName.endsWith('weights.bin') || fileName.endsWith('.bin')) weightsFile = files[key];
      else if (fileName.endsWith('metadata.json')) metadataFile = files[key];
    });

    if (!modelJsonFile || !weightsFile || !metadataFile) {
      throw new Error('Required model files not found in ZIP (model.json, weights.bin, metadata.json)');
    }

    onProgress('Reading metadata...');
    const metadataText = await metadataFile.async('string');
    const metadata = JSON.parse(metadataText);
    
    // Extract and clean class names
    const rawLabels = metadata.labels || [];
    state.classNames = rawLabels.map((label: string) => {
      return label.replace(/^\d+\s*/, '').trim();
    });

    console.log('Loaded class names:', state.classNames);

    onProgress('Loading TensorFlow model...');
    
    // Create File objects for TensorFlow.js
    const modelJsonBlob = await modelJsonFile.async('blob');
    const weightsBlob = await weightsFile.async('blob');
    
    const modelFile = new File([modelJsonBlob], 'model.json', { type: 'application/json' });
    const weightsFileObj = new File([weightsBlob], 'weights.bin', { type: 'application/octet-stream' });

    state.model = await tf.loadLayersModel(
      tf.io.browserFiles([modelFile, weightsFileObj])
    );

    onProgress('Warming up model...');
    
    // Warm-up prediction
    const dummyInput = tf.zeros([1, MODEL_IMAGE_SIZE, MODEL_IMAGE_SIZE, 3]);
    state.model.predict(dummyInput);
    dummyInput.dispose();

    onSuccess(state.classNames);
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Model loading error:', error);
    onError(error as Error);
  }
};

export const startPredictionLoop = (
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  confidenceThreshold: number,
  onPrediction: (result: PredictionResult) => void,
  onPerformanceUpdate: (fps: number, time: number) => void,
  onAutoSpeak: (text: string) => void,
  getAudioPlayingState: () => boolean
): void => {
  state.videoElement = videoElement;
  state.canvasElement = canvasElement;
  state.confidenceThreshold = confidenceThreshold;
  state.isPredicting = true;

  const predict = async () => {
    if (!state.isPredicting || !state.model || !state.videoElement || !state.canvasElement) {
      return;
    }

    if (state.videoElement.readyState !== 4) {
      return;
    }

    const startTime = performance.now();

    try {
      const ctx = state.canvasElement.getContext('2d');
      if (!ctx) return;

      // Draw video frame (flipped horizontally)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        state.videoElement,
        -state.canvasElement.width,
        0,
        state.canvasElement.width,
        state.canvasElement.height
      );
      ctx.restore();

      const imageData = ctx.getImageData(0, 0, state.canvasElement.width, state.canvasElement.height);

      // Preprocess image
      const imageTensor = tf.tidy(() => {
        const tensor = tf.browser.fromPixels(imageData, 3);
        const resized = tf.image.resizeBilinear(tensor, [MODEL_IMAGE_SIZE, MODEL_IMAGE_SIZE]);
        const normalized = resized.sub(127.5).div(127.5);
        return normalized.expandDims(0);
      });

      // Run prediction
      const predictions: any = state.model.predict(imageTensor);
      const scores = await predictions.data();
      predictions.dispose();
      imageTensor.dispose();

      // Get best prediction
      const maxIndex = scores.indexOf(Math.max(...scores));
      const confidence = scores[maxIndex];
      const className = state.classNames[maxIndex] || 'Unknown';

      const endTime = performance.now();
      const predictionTime = endTime - startTime;
      const fps = 1000 / PREDICTION_INTERVAL;

      onPerformanceUpdate(fps, predictionTime);

      // Handle prediction result
      handlePrediction(
        className,
        confidence,
        onPrediction,
        onAutoSpeak,
        getAudioPlayingState
      );

    } catch (error) {
      console.error('Prediction error:', error);
    }
  };

  // Start prediction loop
  if (state.predictionLoopId) {
    clearInterval(state.predictionLoopId);
  }
  
  state.predictionLoopId = setInterval(predict, PREDICTION_INTERVAL);
};

const handlePrediction = (
  className: string,
  confidence: number,
  onPrediction: (result: PredictionResult) => void,
  onAutoSpeak: (text: string) => void,
  getAudioPlayingState: () => boolean
): void => {
  const isConfident = confidence >= state.confidenceThreshold && className !== 'Nothing';

  if (isConfident) {
    onPrediction({ className, confidence });

    // Update stability tracking
    if (className === state.currentStableSign) {
      state.predictionCounter++;
    } else {
      state.currentStableSign = className;
      state.predictionCounter = 1;
    }

    // Check if we should trigger auto-speech
    if (
      state.predictionCounter >= STABILITY_INTERVALS &&
      !getAudioPlayingState() &&
      !isSignInCooldown(className)
    ) {
      console.log(`Auto-speaking: "${className}" (${state.predictionCounter} stable frames)`);
      onAutoSpeak(className);
      startCooldown(className);
      state.predictionCounter = 0;
    }

    state.lastDetectedSign = className;
  } else {
    onPrediction({ className: '...', confidence });
    state.currentStableSign = '';
    state.predictionCounter = 0;
  }
};

const isSignInCooldown = (sign: string): boolean => {
  const lastSpoken = state.signCooldowns.get(sign);
  if (!lastSpoken) return false;
  
  const elapsed = Date.now() - lastSpoken;
  return elapsed < AUTO_SPEECH_COOLDOWN_MS;
};

const startCooldown = (sign: string): void => {
  state.signCooldowns.set(sign, Date.now());
};

export const stopPredictionLoop = (): void => {
  state.isPredicting = false;
  if (state.predictionLoopId) {
    clearInterval(state.predictionLoopId);
    state.predictionLoopId = null;
  }
};

export const updateConfidenceThreshold = (threshold: number): void => {
  state.confidenceThreshold = threshold;
};

export const getClassNames = (): string[] => {
  return state.classNames;
};
