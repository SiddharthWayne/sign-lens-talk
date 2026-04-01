// ============= MediaPipe Background Segmentation Handler =============
// Uses MediaPipe Selfie Segmentation to isolate the signer from background
// This removes environmental noise and forces the AI to focus on hand/body only

import { SelfieSegmentation, Results } from '@mediapipe/selfie_segmentation';

interface SegmentationState {
  segmenter: SelfieSegmentation | null;
  isInitialized: boolean;
  isProcessing: boolean;
  outputCanvas: HTMLCanvasElement | null;
  outputCtx: CanvasRenderingContext2D | null;
  enabled: boolean;
  lastMask: ImageData | null;
}

const state: SegmentationState = {
  segmenter: null,
  isInitialized: false,
  isProcessing: false,
  outputCanvas: null,
  outputCtx: null,
  enabled: false,
  lastMask: null,
};

/**
 * Initialize MediaPipe Selfie Segmentation
 * Loads WASM + model files from CDN (no backend needed)
 */
export const initSegmentation = async (
  outputCanvas: HTMLCanvasElement,
  onReady: () => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    state.outputCanvas = outputCanvas;
    state.outputCtx = outputCanvas.getContext('2d', { willReadFrequently: true });

    if (!state.outputCtx) {
      throw new Error('Failed to get canvas 2D context for segmentation');
    }

    state.segmenter = new SelfieSegmentation({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    state.segmenter.setOptions({
      modelSelection: 1, // 1 = landscape model (more accurate, slightly slower)
      selfieMode: true,
    });

    state.segmenter.onResults(handleSegmentationResults);

    // Warm up the segmenter with a blank frame
    const warmupCanvas = document.createElement('canvas');
    warmupCanvas.width = 640;
    warmupCanvas.height = 480;
    const warmupCtx = warmupCanvas.getContext('2d');
    if (warmupCtx) {
      warmupCtx.fillStyle = '#000000';
      warmupCtx.fillRect(0, 0, 640, 480);
      await state.segmenter.send({ image: warmupCanvas });
    }

    state.isInitialized = true;
    console.log('MediaPipe Selfie Segmentation initialized successfully');
    onReady();
  } catch (error) {
    console.error('Segmentation initialization error:', error);
    onError(error as Error);
  }
};

/**
 * Process segmentation results from MediaPipe
 * Applies the mask to isolate the person and fill background with solid black
 */
const handleSegmentationResults = (results: Results): void => {
  if (!state.outputCanvas || !state.outputCtx) return;

  const ctx = state.outputCtx;
  const { width, height } = state.outputCanvas;

  ctx.save();

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Step 1: Draw the segmentation mask
  ctx.drawImage(results.segmentationMask, 0, 0, width, height);

  // Step 2: Use 'source-in' composite to keep only pixels where mask is white (person)
  ctx.globalCompositeOperation = 'source-in';
  ctx.drawImage(results.image, 0, 0, width, height);

  // Step 3: Use 'destination-over' to fill remaining transparent area with black
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  state.isProcessing = false;
};

/**
 * Process a single video frame through the segmentation pipeline
 * Returns the processed canvas with background removed
 */
export const processFrame = async (
  videoElement: HTMLVideoElement
): Promise<HTMLCanvasElement | null> => {
  if (!state.segmenter || !state.isInitialized || !state.outputCanvas || state.isProcessing) {
    return null;
  }

  if (videoElement.readyState !== 4) return null;

  state.isProcessing = true;

  try {
    await state.segmenter.send({ image: videoElement });
    return state.outputCanvas;
  } catch (error) {
    console.error('Segmentation frame processing error:', error);
    state.isProcessing = false;
    return null;
  }
};

/**
 * Enable/disable segmentation
 */
export const setEnabled = (enabled: boolean): void => {
  state.enabled = enabled;
};

export const isEnabled = (): boolean => {
  return state.enabled && state.isInitialized;
};

export const isInitializedState = (): boolean => {
  return state.isInitialized;
};

/**
 * Clean up segmentation resources
 */
export const destroySegmentation = (): void => {
  if (state.segmenter) {
    state.segmenter.close();
    state.segmenter = null;
  }
  state.isInitialized = false;
  state.isProcessing = false;
  state.outputCanvas = null;
  state.outputCtx = null;
  state.lastMask = null;
  console.log('Segmentation resources released');
};
