// ============= Model Uploader Component =============
import { useRef, useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ModelUploaderProps {
  onModelSelect: (file: File) => void;
  isLoading: boolean;
  loadingStatus: string;
  error: string | null;
}

export const ModelUploader = ({ onModelSelect, isLoading, loadingStatus, error }: ModelUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.name.endsWith('.zip')) {
      onModelSelect(file);
    } else {
      alert('Please select a valid .zip model file');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
        <CardContent className="p-8">
          <div
            className={cn(
              'relative flex flex-col items-center justify-center space-y-4 rounded-lg p-8 transition-colors',
              isDragging && 'bg-primary/5',
              !isLoading && 'cursor-pointer'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isLoading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileInput}
              className="hidden"
              disabled={isLoading}
            />

            {!isLoading && !error && (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Upload Your AI Model</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Drag & drop your Teachable Machine model (.zip) here, or click to browse
                  </p>
                </div>
                <Button variant="outline" size="lg">
                  Choose File
                </Button>
              </>
            )}

            {isLoading && (
              <div className="w-full space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                  <FileCheck className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">{loadingStatus}</h3>
                  <Progress value={undefined} className="w-full" />
                </div>
              </div>
            )}

            {error && (
              <div className="w-full space-y-4">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-destructive">Error Loading Model</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" size="lg" className="mx-auto" onClick={() => fileInputRef.current?.click()}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>Model should contain: model.json, weights.bin, metadata.json</p>
      </div>
    </div>
  );
};
