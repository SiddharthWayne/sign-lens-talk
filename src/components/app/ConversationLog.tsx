// ============= Conversation Log Component =============
import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Volume2, Trash2 } from 'lucide-react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ConversationLogProps {
  messages: Message[];
  onMessageClick: (text: string) => void;
  onClear: () => void;
  isAudioPlaying: boolean;
}

export const ConversationLog = ({ messages, onMessageClick, onClear, isAudioPlaying }: ConversationLogProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="border-2 h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Conversation History</CardTitle>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-3" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your conversation will appear here</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'group relative p-3 rounded-lg transition-all duration-200 cursor-pointer',
                    message.isFromSign
                      ? 'bg-primary/10 hover:bg-primary/20 border border-primary/20'
                      : 'bg-secondary hover:bg-secondary/80',
                    !isAudioPlaying && 'hover:shadow-md'
                  )}
                  onClick={() => !isAudioPlaying && onMessageClick(message.text)}
                >
                  <div className="flex items-start justify-between space-x-2">
                    <p className="text-sm font-medium flex-1">{message.text}</p>
                    <Volume2 className={cn(
                      'w-4 h-4 flex-shrink-0 transition-opacity',
                      isAudioPlaying ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'
                    )} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()} • {message.isFromSign ? 'Sign' : 'Typed'}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
