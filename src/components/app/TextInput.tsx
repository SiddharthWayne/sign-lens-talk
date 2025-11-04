// ============= Text Input Component =============
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';

interface TextInputProps {
  onSpeak: (text: string) => void;
  isAudioPlaying: boolean;
  disabled: boolean;
}

export const TextInput = ({ onSpeak, isAudioPlaying, disabled }: TextInputProps) => {
  const [text, setText] = useState('');

  const handleSpeak = () => {
    if (text.trim() && !isAudioPlaying) {
      onSpeak(text.trim());
      setText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && text.trim() && !isAudioPlaying) {
      handleSpeak();
    }
  };

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Type a message to speak..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isAudioPlaying}
            className="h-11"
          />
          <Button
            onClick={handleSpeak}
            disabled={!text.trim() || isAudioPlaying || disabled}
            size="lg"
            className="px-6"
          >
            {isAudioPlaying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            <span className="ml-2">{isAudioPlaying ? 'Speaking...' : 'Speak'}</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Type your message and press Enter or click Speak
        </p>
      </CardContent>
    </Card>
  );
};
