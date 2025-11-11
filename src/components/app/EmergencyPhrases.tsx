// ============= Emergency Phrases Modal Component =============
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface EmergencyPhrasesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const EmergencyPhrases = ({ 
  open, 
  onOpenChange, 
  onPhraseClick, 
  isAudioPlaying 
}: EmergencyPhrasesProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            <DialogTitle className="text-xl">Emergency Phrases</DialogTitle>
          </div>
          <DialogDescription>
            Click any phrase to speak it immediately
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {EMERGENCY_PHRASES.map((phrase, index) => (
            <Button
              key={index}
              variant="destructive"
              className="w-full justify-start text-left h-auto py-4 text-base"
              onClick={() => {
                onPhraseClick(phrase);
                onOpenChange(false);
              }}
              disabled={isAudioPlaying}
            >
              {phrase}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
