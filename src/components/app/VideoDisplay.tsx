// ============= Video Display Component =============
import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoDisplayProps {
  onVideoReady: (videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => void;
  isActive: boolean;
}

export const VideoDisplay = ({ onVideoReady, isActive }: VideoDisplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      console.log('Requesting camera access...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('Camera access granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => {
              console.log('Video playing');
              setStream(mediaStream);
              setIsCameraActive(true);
              
              if (videoRef.current && canvasRef.current) {
                onVideoReady(videoRef.current, canvasRef.current);
              }
            })
            .catch(err => {
              console.error('Error playing video:', err);
              setCameraError('Failed to start video playback');
            });
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let errorMessage = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions in your browser.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera device found.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }
      
      setCameraError(errorMessage);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
  };

  const retryCamera = () => {
    startCamera();
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden bg-black">
        <div className="relative aspect-video">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 p-6 space-y-4">
              <CameraOff className="w-16 h-16 text-muted-foreground" />
              <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
              <Button onClick={retryCamera} variant="outline">
                <Camera className="w-4 h-4 mr-2" />
                Retry Camera Access
              </Button>
            </div>
          ) : !isCameraActive ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="text-center space-y-2">
                <Camera className="w-12 h-12 mx-auto text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Initializing camera...</p>
              </div>
            </div>
          ) : null}
          
          <video
            ref={videoRef}
            className="w-full h-full object-cover transform -scale-x-100"
            playsInline
            muted
          />
          
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            className="hidden"
          />

          {isCameraActive && (
            <div className="absolute top-4 left-4">
              <div className="flex items-center space-x-2 bg-black/70 rounded-full px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white font-medium">LIVE</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
