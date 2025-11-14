// ============= Settings Panel Component =============
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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
          <Label htmlFor="voice-toggle" className="flex items-center space-x-2">
            <Mic className="w-4 h-4" />
            <span>Voice Gender</span>
          </Label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Male</span>
            <Switch
              id="voice-toggle"
              checked={selectedVoice?.name === 'Female Voice'}
              onCheckedChange={(checked) => {
                const targetVoice = checked 
                  ? voices.find(v => v.name === 'Female Voice')
                  : voices.find(v => v.name === 'Male Voice');
                if (targetVoice) onVoiceChange(targetVoice);
              }}
              disabled={voices.length === 0}
            />
            <span className="text-sm text-muted-foreground">Female</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Toggle to switch between male and female voice
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
