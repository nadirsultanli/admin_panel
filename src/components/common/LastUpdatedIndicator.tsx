import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw } from 'lucide-react';

interface LastUpdatedIndicatorProps {
  timestamp: Date;
  onRefresh?: () => void;
  refreshInterval?: number; // in seconds
  autoRefresh?: boolean;
}

export function LastUpdatedIndicator({
  timestamp,
  onRefresh,
  refreshInterval = 60,
  autoRefresh = false
}: LastUpdatedIndicatorProps) {
  const [lastUpdated, setLastUpdated] = useState<Date>(timestamp);
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(refreshInterval);
  
  // Update the "time ago" text every minute
  useEffect(() => {
    setLastUpdated(timestamp);
    
    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      
      if (diffSec < 60) {
        setTimeAgo(`${diffSec} seconds ago`);
      } else {
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) {
          setTimeAgo(`${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`);
        } else {
          const diffHour = Math.floor(diffMin / 60);
          if (diffHour < 24) {
            setTimeAgo(`${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`);
          } else {
            setTimeAgo(lastUpdated.toLocaleString());
          }
        }
      }
    };
    
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 15000); // Update every 15 seconds
    
    return () => clearInterval(interval);
  }, [timestamp, lastUpdated]);
  
  // Handle auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;
    
    setCountdown(refreshInterval);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Time to refresh
          onRefresh?.();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [autoRefresh, refreshInterval, onRefresh]);
  
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Clock className="h-4 w-4" />
        <span>Last updated: {timeAgo}</span>
      </div>
      
      {autoRefresh && (
        <div className="text-xs">
          (Refreshing in {countdown}s)
        </div>
      )}
      
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="h-8 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Refresh
        </Button>
      )}
    </div>
  );
}