// ============= Prediction Display Component =============
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HandMetal, Sparkles } from 'lucide-react';

interface PredictionDisplayProps {
  currentSign: string;
  confidence: number;
  isDetecting: boolean;
}

export const PredictionDisplay = ({ currentSign, confidence, isDetecting }: PredictionDisplayProps) => {
  const isValid = currentSign && currentSign !== '...';
  const confidencePercent = Math.round(confidence * 100);

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <HandMetal className={`w-5 h-5 ${isDetecting ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            <h3 className="font-semibold text-lg">Current Detection</h3>
          </div>
          {isValid && (
            <Badge variant="secondary" className="space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>{confidencePercent}%</span>
            </Badge>
          )}
        </div>

        <div className="min-h-[60px] flex items-center justify-center">
          {isValid ? (
            <p className="text-2xl font-bold text-center text-primary">{currentSign}</p>
          ) : (
            <p className="text-2xl text-muted-foreground text-center">
              {isDetecting ? 'Watching for signs...' : 'Start to begin detection'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
