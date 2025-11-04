// ============= Settings Panel Component =============
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Gauge, Volume, Mic } from 'lucide-react';

interface SettingsPanelProps {
  confidenceThreshold: number;
  onConfidenceChange: (value: number) => void;
  speechRate: number;
  onSpeechRateChange: (value: number) => void;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
}

export const SettingsPanel = ({
  confidenceThreshold,
  onConfidenceChange,
  speechRate,
  onSpeechRateChange,
  voices,
  selectedVoice,
  onVoiceChange,
}: SettingsPanelProps) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings2 className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Settings</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Confidence Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="confidence" className="flex items-center space-x-2">
              <Gauge className="w-4 h-4" />
              <span>AI Confidence</span>
            </Label>
            <span className="text-sm font-medium text-primary">
              {Math.round(confidenceThreshold * 100)}%
            </span>
          </div>
          <Slider
            id="confidence"
            value={[confidenceThreshold]}
            onValueChange={([value]) => onConfidenceChange(value)}
            min={0.5}
            max={0.95}
            step={0.05}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Higher = more accurate but fewer detections
          </p>
        </div>

        {/* Speech Rate */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="speech-rate" className="flex items-center space-x-2">
              <Volume className="w-4 h-4" />
              <span>Speech Speed</span>
            </Label>
            <span className="text-sm font-medium text-primary">
              {speechRate.toFixed(1)}x
            </span>
          </div>
          <Slider
            id="speech-rate"
            value={[speechRate]}
            onValueChange={([value]) => onSpeechRateChange(value)}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Adjust how fast the voice speaks
          </p>
        </div>

        {/* Voice Selection */}
        <div className="space-y-3">
          <Label htmlFor="voice-select" className="flex items-center space-x-2">
            <Mic className="w-4 h-4" />
            <span>Voice</span>
          </Label>
          <Select
            value={selectedVoice?.name || ''}
            onValueChange={(name) => {
              const voice = voices.find(v => v.name === name);
              if (voice) onVoiceChange(voice);
            }}
          >
            <SelectTrigger id="voice-select">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.length === 0 ? (
                <SelectItem value="none" disabled>
                  No voices available
                </SelectItem>
              ) : (
                voices.map((voice) => (
                  <SelectItem key={voice.name} value={voice.name}>
                    {voice.name} {voice.lang.startsWith('ta') ? '🇮🇳' : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {voices.filter(v => v.lang.startsWith('ta')).length} Tamil voice(s) available
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
