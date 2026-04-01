// ============= TensorFlow.js Model Handler =============
// Optimized with: Rolling Prediction Buffer, Temporal Stabilization,
// Cooldown Mechanism, and MediaPipe Background Subtraction support
import * as tf from '@tensorflow/tfjs';
import JSZip from 'jszip';
import * as segmentation from './backgroundSegmentation';
import type { PredictionResult } from './types';

const MODEL_IMAGE_SIZE = 224;
const PREDICTION_INTERVAL = 200; // 200ms = ~5 FPS

// ── Temporal Stabilization Config ──
const ROLLING_BUFFER_SIZE = 6;        // Store last 6 predictions
const STABILITY_THRESHOLD = 5;        // Need 5/6 agreeing predictions to trigger
const AUTO_SPEECH_COOLDOWN_MS = 3000;  // 3-second cooldown per sign (was 10s)

// ── Rolling Prediction Buffer ──
// Instead of a simple counter, we keep a circular buffer of recent predictions.
// A sign is only considered "stable" when it dominates the buffer.
interface RollingBuffer {
  predictions: string[];
  index: number;
}

interface ModelHandlerState {
  model: tf.LayersModel | null;
  classNames: string[];
  isPredicting: boolean;
  predictionLoopId: NodeJS.Timeout | null;
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  rollingBuffer: RollingBuffer;
  lastSpokenSign: string;
  signCooldowns: Map<string, number>;
  audioPlaying: boolean;
  confidenceThreshold: number;
  segmentationCanvas: HTMLCanvasElement | null;
}

const state: ModelHandlerState = {
  model: null,
  classNames: [],
  isPredicting: false,
  predictionLoopId: null,
  videoElement: null,
  canvasElement: null,
  rollingBuffer: {
    predictions: new Array(ROLLING_BUFFER_SIZE).fill(''),
    index: 0,
  },
  lastSpokenSign: '',
  signCooldowns: new Map(),
  audioPlaying: false,
  confidenceThreshold: 0.70,
  segmentationCanvas: null,
};

// ── Rolling Buffer Helpers ──

const pushToBuffer = (prediction: string): void => {
  state.rollingBuffer.predictions[state.rollingBuffer.index] = prediction;
  state.rollingBuffer.index = (state.rollingBuffer.index + 1) % ROLLING_BUFFER_SIZE;
};

const getBufferMajority = (): { sign: string; count: number } => {
  const counts = new Map<string, number>();
  for (const pred of state.rollingBuffer.predictions) {
    if (pred && pred !== '' && pred !== '...') {
      counts.set(pred, (counts.get(pred) || 0) + 1);
    }
  }

  let maxSign = '';
  let maxCount = 0;
  counts.forEach((count, sign) => {
    if (count > maxCount) {
      maxCount = count;
      maxSign = sign;
    }
  });

  return { sign: maxSign, count: maxCount };
};

const clearBuffer = (): void => {
  state.rollingBuffer.predictions.fill('');
  state.rollingBuffer.index = 0;
};

// ── Model Loading ──

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
    
    const rawLabels = metadata.labels || [];
    state.classNames = rawLabels.map((label: string) => {
      return label.replace(/^\d+\s*/, '').trim();
    });

    console.log('Loaded class names:', state.classNames);

    onProgress('Loading TensorFlow model...');
    
    const modelJsonBlob = await modelJsonFile.async('blob');
    const weightsBlob = await weightsFile.async('blob');
    
    const modelFile = new File([modelJsonBlob], 'model.json', { type: 'application/json' });
    const weightsFileObj = new File([weightsBlob], 'weights.bin', { type: 'application/octet-stream' });

    state.model = await tf.loadLayersModel(
      tf.io.browserFiles([modelFile, weightsFileObj])
    );

    onProgress('Warming up model...');
    
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

// ── Prediction Loop ──

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
  clearBuffer();

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

      // ── Step 1: Get frame source (segmented or raw) ──
      let frameSource: HTMLVideoElement | HTMLCanvasElement = state.videoElement;

      if (segmentation.isEnabled()) {
        const segCanvas = await segmentation.processFrame(state.videoElement);
        if (segCanvas) {
          frameSource = segCanvas;
        }
      }

      // ── Step 2: Draw frame to processing canvas ──
      if (frameSource === state.videoElement) {
        // Raw video: flip horizontally
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
      } else {
        // Segmented canvas: already processed, draw directly
        ctx.drawImage(
          frameSource,
          0,
          0,
          state.canvasElement.width,
          state.canvasElement.height
        );
      }

      const imageData = ctx.getImageData(0, 0, state.canvasElement.width, state.canvasElement.height);

      // ── Step 3: Preprocess for TensorFlow.js ──
      const imageTensor = tf.tidy(() => {
        const tensor = tf.browser.fromPixels(imageData, 3);
        const resized = tf.image.resizeBilinear(tensor, [MODEL_IMAGE_SIZE, MODEL_IMAGE_SIZE]);
        const normalized = resized.sub(127.5).div(127.5);
        return normalized.expandDims(0);
      });

      // ── Step 4: Run inference ──
      const predictions: any = state.model.predict(imageTensor);
      const scores = await predictions.data();
      predictions.dispose();
      imageTensor.dispose();

      // ── Step 5: Get best prediction ──
      const maxIndex = scores.indexOf(Math.max(...scores));
      const confidence = scores[maxIndex];
      const className = state.classNames[maxIndex] || 'Unknown';

      const endTime = performance.now();
      const predictionTime = endTime - startTime;
      const fps = 1000 / PREDICTION_INTERVAL;

      onPerformanceUpdate(fps, predictionTime);

      // ── Step 6: Temporal Stabilization + Cooldown ──
      handleStabilizedPrediction(
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

  if (state.predictionLoopId) {
    clearInterval(state.predictionLoopId);
  }
  
  state.predictionLoopId = setInterval(predict, PREDICTION_INTERVAL);
};

// ── Temporal Stabilization + Cooldown Handler ──

const handleStabilizedPrediction = (
  className: string,
  confidence: number,
  onPrediction: (result: PredictionResult) => void,
  onAutoSpeak: (text: string) => void,
  getAudioPlayingState: () => boolean
): void => {
  const isConfident = confidence >= state.confidenceThreshold && className !== 'Nothing';

  if (isConfident) {
    // Push to rolling buffer
    pushToBuffer(className);
    onPrediction({ className, confidence });

    // Check buffer majority for stable detection
    const { sign: stableSign, count: stableCount } = getBufferMajority();

    if (
      stableCount >= STABILITY_THRESHOLD &&
      !getAudioPlayingState() &&
      !isSignInCooldown(stableSign)
    ) {
      console.log(
        `[Stable] "${stableSign}" detected ${stableCount}/${ROLLING_BUFFER_SIZE} frames — speaking`
      );
      onAutoSpeak(stableSign);
      startCooldown(stableSign);
      clearBuffer(); // Reset buffer after speaking
    }
  } else {
    onPrediction({ className: '...', confidence });
    // Push empty to buffer to decay stale predictions
    pushToBuffer('');
  }
};

// ── Cooldown Mechanism ──

const isSignInCooldown = (sign: string): boolean => {
  const lastSpoken = state.signCooldowns.get(sign);
  if (!lastSpoken) return false;
  return (Date.now() - lastSpoken) < AUTO_SPEECH_COOLDOWN_MS;
};

const startCooldown = (sign: string): void => {
  state.signCooldowns.set(sign, Date.now());
};

// ── Control Functions ──

export const stopPredictionLoop = (): void => {
  state.isPredicting = false;
  if (state.predictionLoopId) {
    clearInterval(state.predictionLoopId);
    state.predictionLoopId = null;
  }
  clearBuffer();
};

export const updateConfidenceThreshold = (threshold: number): void => {
  state.confidenceThreshold = threshold;
};

export const getClassNames = (): string[] => {
  return state.classNames;
};
