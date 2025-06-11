import { AlertCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function ErrorDisplay({ 
  title = 'An error occurred', 
  message, 
  onDismiss, 
  onRetry 
}: ErrorDisplayProps) {
  return (
    <Card className="border-destructive animate-in fade-in-50 duration-300 w-full">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-destructive mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRetry}
                className="h-8"
              >
                Try Again
              </Button>
            )}
            
            {onDismiss && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss}
                className="h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}