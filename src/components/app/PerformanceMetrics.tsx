// ============= Performance Metrics Component =============
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';
import type { PerformanceMetrics as Metrics } from '@/lib/types';

interface PerformanceMetricsProps {
  metrics: Metrics;
}

export const PerformanceMetrics = ({ metrics }: PerformanceMetricsProps) => {
  return (
    <Card className="border-2">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-medium">FPS</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {metrics.fps.toFixed(1)}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Prediction Time</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {metrics.predictionTime.toFixed(0)}ms
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
