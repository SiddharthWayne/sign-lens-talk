// ============= Emergency Phrases Component =============
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface EmergencyPhrasesProps {
  onPhraseClick: (phrase: string) => void;
  isAudioPlaying: boolean;
}

const EMERGENCY_PHRASES = [
  "எனக்கு உதவி செய்யுங்கள்!",
  "காவல் துறையை அழைக்கவும்!",
  "ஆம்புலன்ஸ் அழைக்கவும்!",
  "எனக்கு உதவி தேவை!",
  "இங்கே தீ உள்ளது!",
  "தயவுசெய்து சீக்கிரம் வாருங்கள்!",
  "எனக்கு உடல்நலம் சரியில்லை",
];

export const EmergencyPhrases = ({ onPhraseClick, isAudioPlaying }: EmergencyPhrasesProps) => {
  return (
    <Card className="border-2 border-destructive/50">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <CardTitle className="text-lg text-destructive">Emergency Phrases</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {EMERGENCY_PHRASES.map((phrase, index) => (
          <Button
            key={index}
            variant="destructive"
            className="w-full justify-start text-left h-auto py-3"
            onClick={() => onPhraseClick(phrase)}
            disabled={isAudioPlaying}
          >
            {phrase}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
