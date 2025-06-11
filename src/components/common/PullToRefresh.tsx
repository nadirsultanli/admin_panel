import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  
  const THRESHOLD = 80; // Minimum pull distance to trigger refresh
  
  useEffect(() => {
    if (!disabled && containerRef.current) {
      const container = containerRef.current;
      
      const handleTouchStart = (e: TouchEvent) => {
        // Only enable pull to refresh when at the top of the page
        if (window.scrollY === 0) {
          startY.current = e.touches[0].clientY;
        } else {
          startY.current = null;
        }
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        if (startY.current !== null) {
          const currentY = e.touches[0].clientY;
          const distance = currentY - startY.current;
          
          // Only allow pulling down, not up
          if (distance > 0) {
            // Apply resistance to make the pull feel natural
            const pullWithResistance = Math.min(distance * 0.4, THRESHOLD * 1.5);
            setPullDistance(pullWithResistance);
            setIsPulling(true);
            
            // Prevent default scrolling behavior
            e.preventDefault();
          }
        }
      };
      
      const handleTouchEnd = async () => {
        if (isPulling) {
          if (pullDistance >= THRESHOLD) {
            setIsRefreshing(true);
            setPullDistance(THRESHOLD); // Keep indicator visible during refresh
            
            try {
              await onRefresh();
            } catch (error) {
              console.error('Refresh failed:', error);
            } finally {
              setIsRefreshing(false);
              setPullDistance(0);
              setIsPulling(false);
            }
          } else {
            // Not pulled far enough, reset
            setPullDistance(0);
            setIsPulling(false);
          }
        }
        
        startY.current = null;
      };
      
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isPulling, pullDistance, onRefresh, disabled]);
  
  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute left-0 right-0 flex justify-center transition-transform duration-200 ease-out z-10"
          style={{ 
            transform: `translateY(${pullDistance}px)`,
            top: '-40px'
          }}
        >
          <div className="bg-background rounded-full shadow-md p-2 flex items-center justify-center">
            {isRefreshing ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <div 
                className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent"
                style={{ 
                  transform: `rotate(${(pullDistance / THRESHOLD) * 360}deg)`,
                  opacity: Math.min(pullDistance / THRESHOLD, 1)
                }}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Content with pull down effect */}
      <div 
        style={{ 
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
}