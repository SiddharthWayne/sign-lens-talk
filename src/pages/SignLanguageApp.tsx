// ============= Main Sign Language Application =============
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { Moon, Sun, Play, HelpCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

// Components
import { ModelUploader } from '@/components/app/ModelUploader';
import { VideoDisplay } from '@/components/app/VideoDisplay';
import { PredictionDisplay } from '@/components/app/PredictionDisplay';
import { ConversationLog } from '@/components/app/ConversationLog';
import { TextInput } from '@/components/app/TextInput';
import { SettingsPanel } from '@/components/app/SettingsPanel';
import { PerformanceMetrics } from '@/components/app/PerformanceMetrics';
import { SignLibraryModal } from '@/components/modals/SignLibraryModal';
import { EmergencyPhrases } from '@/components/app/EmergencyPhrases';

// Lib
import * as modelHandler from '@/lib/modelHandler';
import * as speechHandler from '@/lib/speechHandler';
import type { Message, PerformanceMetrics as Metrics, PredictionResult } from '@/lib/types';

const SignLanguageApp = () => {
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // App State
  const [userName, setUserName] = useState('');
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [classNames, setClassNames] = useState<string[]>([]);
  
  // Prediction State
  const [isAppStarted, setIsAppStarted] = useState(false);
  const [currentSign, setCurrentSign] = useState('...');
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const isAudioPlayingRef = useRef(false);
  const speakRef = useRef<(text: string, isFromSign: boolean) => void>(() => {});
  
  // Settings State
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.70);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  // Performance State
  const [metrics, setMetrics] = useState<Metrics>({
    fps: 0,
    predictionTime: 0,
    lastUpdateTime: 0,
  });
  
  // UI State
  const [showSignLibrary, setShowSignLibrary] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  // Initialize
  useEffect(() => {
    const name = localStorage.getItem('sign-language-user-name');
    if (!name) {
      navigate('/');
      return;
    }
    setUserName(name);

    // Initialize speech
    speechHandler.initSpeech().then((loadedVoices) => {
      setVoices(loadedVoices);
      
      // Try to find Tamil voice
      const tamilVoice = speechHandler.getTamilVoices()[0];
      if (tamilVoice) {
        setSelectedVoice(tamilVoice);
      } else if (loadedVoices.length > 0) {
        setSelectedVoice(loadedVoices[0]);
      }
    });
  }, [navigate]);

  // Model Upload Handler
  const handleModelUpload = useCallback((file: File) => {
    setIsModelLoading(true);
    setLoadError(null);
    
    modelHandler.loadModel(
      file,
      (status) => setLoadingStatus(status),
      (loadedClassNames) => {
        setClassNames(loadedClassNames);
        setIsModelLoaded(true);
        setIsModelLoading(false);
        toast({
          title: 'Model Loaded Successfully!',
          description: `${loadedClassNames.length} signs recognized.`,
        });
      },
      (error) => {
        setLoadError(error.message);
        setIsModelLoading(false);
        toast({
          title: 'Model Loading Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    );
  }, [toast]);

  // Start App Handler
  const handleStartApp = useCallback(() => {
    setIsAppStarted(true);
    speechHandler.resumeSpeech();
  }, []);

  // Video Ready Handler
  const handleVideoReady = useCallback((videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) => {
    const handlePrediction = (result: PredictionResult) => {
      setCurrentSign(result.className);
      setCurrentConfidence(result.confidence);
      
      // Add to history only for real signs (not "...")
      if (result.className !== '...') {
        setMessages(prev => {
          // Check if this is a duplicate of the last message
          if (prev.length > 0 && prev[prev.length - 1].text === result.className && prev[prev.length - 1].isFromSign) {
            return prev;
          }
          
          return [...prev, {
            id: `${Date.now()}-${Math.random()}`,
            text: result.className,
            timestamp: Date.now(),
            isFromSign: true,
          }];
        });
      }
    };

    const handlePerformanceUpdate = (fps: number, predictionTime: number) => {
      setMetrics({
        fps,
        predictionTime,
        lastUpdateTime: Date.now(),
      });
    };

    const handleAutoSpeak = (text: string) => {
      speakRef.current(text, true);
    };

    const getAudioState = () => isAudioPlayingRef.current;

    modelHandler.startPredictionLoop(
      videoElement,
      canvasElement,
      confidenceThreshold,
      handlePrediction,
      handlePerformanceUpdate,
      handleAutoSpeak,
      getAudioState
    );
  }, [confidenceThreshold]);

  // Helper to update both state and ref
  const setAudioPlaying = useCallback((playing: boolean) => {
    isAudioPlayingRef.current = playing;
    setIsAudioPlaying(playing);
  }, []);

  // Speak Function
  const speak = useCallback((text: string, isFromSign: boolean) => {
    if (!text) return;
    
    // Cancel any ongoing speech first
    speechHandler.cancelSpeech();
    setAudioPlaying(false);

    // Small delay to let cancel take effect
    setTimeout(() => {
      setAudioPlaying(true);
      
      speechHandler.speak(
        text,
        selectedVoice,
        speechRate,
        () => {
          console.log('Speech onStart fired for:', text);
          setAudioPlaying(true);
        },
        () => {
          console.log('Speech onEnd fired');
          setAudioPlaying(false);
        },
        (error) => {
          console.error('Speech error:', error);
          setAudioPlaying(false);
          toast({
            title: 'Speech Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      );
    }, 50);
  }, [selectedVoice, speechRate, toast, setAudioPlaying]);

  // Keep speakRef always pointing to latest speak function
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  // Manual Text Speech
  const handleManualSpeak = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text,
      timestamp: Date.now(),
      isFromSign: false,
    }]);
    speak(text, false);
  }, [speak]);

  // Emergency Phrase Handler
  const handleEmergencyPhrase = useCallback((phrase: string) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      text: phrase,
      timestamp: Date.now(),
      isFromSign: false,
    }]);
    speak(phrase, false);
  }, [speak]);

  // Camera Toggle Handler
  const handleCameraToggle = useCallback(() => {
    setIsCameraEnabled(prev => !prev);
  }, []);

  // Message Click Handler
  const handleMessageClick = useCallback((text: string) => {
    if (!isAudioPlaying) {
      speak(text, false);
    }
  }, [isAudioPlaying, speak]);

  // Clear History
  const handleClearHistory = useCallback(() => {
    setMessages([]);
    toast({
      title: 'History Cleared',
      description: 'All conversation messages have been removed.',
    });
  }, [toast]);

  // Update Confidence Threshold
  useEffect(() => {
    if (isAppStarted) {
      modelHandler.updateConfidenceThreshold(confidenceThreshold);
    }
  }, [confidenceThreshold, isAppStarted]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Tamil Sign Bridge</h1>
              <p className="text-xs text-muted-foreground">Welcome back, {userName}!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isModelLoaded && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignLibrary(true)}
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Signs
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isModelLoaded ? (
          /* Model Upload Screen */
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Upload Your AI Model</h2>
              <p className="text-muted-foreground">
                Upload your Teachable Machine model to start recognizing Tamil signs
              </p>
            </div>
            
            <ModelUploader
              onModelSelect={handleModelUpload}
              isLoading={isModelLoading}
              loadingStatus={loadingStatus}
              error={loadError}
            />
          </div>
        ) : !isAppStarted ? (
          /* Start Screen */
          <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Model Loaded Successfully!</h2>
              <p className="text-lg text-muted-foreground">
                {classNames.length} Tamil sign phrases are ready to be recognized
              </p>
            </div>
            
            <Button
              size="lg"
              onClick={handleStartApp}
              className="px-8 h-14 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Application
            </Button>
          </div>
        ) : (
          /* Main App */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Video & Prediction */}
            <div className="lg:col-span-2 space-y-6">
              <VideoDisplay
                onVideoReady={handleVideoReady}
                isActive={isAppStarted}
                isCameraEnabled={isCameraEnabled}
                onCameraToggle={handleCameraToggle}
              />
              <PredictionDisplay
                currentSign={currentSign}
                confidence={currentConfidence}
                isDetecting={isAppStarted}
              />
              <PerformanceMetrics metrics={metrics} />
              <TextInput
                onSpeak={handleManualSpeak}
                isAudioPlaying={isAudioPlaying}
                disabled={!isAppStarted}
              />
            </div>

            {/* Right Column - Log & Settings */}
            <div className="space-y-6">
              <div className="h-[400px]">
                <ConversationLog
                  messages={messages}
                  onMessageClick={handleMessageClick}
                  onClear={handleClearHistory}
                  isAudioPlaying={isAudioPlaying}
                />
              </div>
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={() => setShowEmergencyModal(true)}
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                Emergency Phrases
              </Button>
              <SettingsPanel
                confidenceThreshold={confidenceThreshold}
                onConfidenceChange={setConfidenceThreshold}
                speechRate={speechRate}
                onSpeechRateChange={setSpeechRate}
                voices={voices}
                selectedVoice={selectedVoice}
                onVoiceChange={setSelectedVoice}
              />
            </div>
          </div>
        )}
      </main>

      {/* Sign Library Modal */}
      <SignLibraryModal
        isOpen={showSignLibrary}
        onClose={() => setShowSignLibrary(false)}
        signs={classNames}
      />
      
      {/* Emergency Phrases Modal */}
      <EmergencyPhrases
        open={showEmergencyModal}
        onOpenChange={setShowEmergencyModal}
        onPhraseClick={handleEmergencyPhrase}
        isAudioPlaying={isAudioPlaying}
      />
    </div>
  );
};

export default SignLanguageApp;
