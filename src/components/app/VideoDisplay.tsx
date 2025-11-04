// ============= Video Display Component =============
import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, Video, VideoOff } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VideoDisplayProps {
  onVideoReady: (videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => void;
  isActive: boolean;
  isCameraEnabled: boolean;
  onCameraToggle: () => void;
}

export const VideoDisplay = ({ onVideoReady, isActive, isCameraEnabled, onCameraToggle }: VideoDisplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (isActive && isCameraEnabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, isCameraEnabled]);

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
      <Card className="overflow-hidden">
        <CardHeader className="bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Camera Feed</CardTitle>
            </div>
            <div className="flex items-center space-x-3">
              {isCameraActive && isCameraEnabled && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              )}
              <Button
                variant={isCameraEnabled ? "default" : "outline"}
                size="sm"
                onClick={onCameraToggle}
                disabled={!isActive}
              >
                {isCameraEnabled ? (
                  <>
                    <Video className="w-4 h-4 mr-2" />
                    Camera On
                  </>
                ) : (
                  <>
                    <VideoOff className="w-4 h-4 mr-2" />
                    Camera Off
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <div className="relative aspect-video bg-black">
          {!isCameraEnabled && isActive ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="text-center space-y-2">
                <VideoOff className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Camera is turned off</p>
                <Button variant="outline" size="sm" onClick={onCameraToggle}>
                  Turn On Camera
                </Button>
              </div>
            </div>
          ) : cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 p-6 space-y-4 z-10">
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
          ) : !isCameraActive && isCameraEnabled ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
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
        </div>
      </Card>
    </div>
  );
};
