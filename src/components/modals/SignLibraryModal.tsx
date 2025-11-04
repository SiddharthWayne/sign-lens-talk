// ============= Sign Library Modal Component =============
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HandMetal } from 'lucide-react';

interface SignLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  signs: string[];
}

export const SignLibraryModal = ({ isOpen, onClose, signs }: SignLibraryModalProps) => {
  // Filter out "Nothing" sign
  const filteredSigns = signs.filter(sign => sign.toLowerCase() !== 'nothing');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-2xl">
            <HandMetal className="w-6 h-6 text-primary" />
            <span>Sign Library</span>
          </DialogTitle>
          <DialogDescription>
            Here are all the Tamil sign language phrases this model recognizes.
            Try performing these signs in front of your camera!
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-full max-h-[60vh] pr-4">
          <div className="space-y-3">
            {filteredSigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No signs loaded yet. Please upload a model first.</p>
              </div>
            ) : (
              filteredSigns.map((sign, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <Badge variant="outline" className="font-mono text-sm">
                    {index + 1}
                  </Badge>
                  <p className="text-lg flex-1">{sign}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Total signs:</strong> {filteredSigns.length}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
