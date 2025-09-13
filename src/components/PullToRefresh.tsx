import React, { useState, useRef, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useHapticFeedback } from '../hooks/useTouchGestures';
import { useTheme } from '../contexts/ThemeContext';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false
}) => {
  const { isMobile } = useResponsive();
  const { actualTheme } = useTheme();
  const { triggerHaptic } = useHapticFeedback();
  
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [canPull, setCanPull] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pullIndicatorRef = useRef<HTMLDivElement>(null);

  // Check if we're at the top of the page
  const checkCanPull = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      setCanPull(scrollTop === 0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkCanPull);
      return () => container.removeEventListener('scroll', checkCanPull);
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || disabled || !canPull) return;
    
    setStartY(e.touches[0].clientY);
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || disabled || !isPulling || !canPull) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
      
      if (distance >= threshold && !isRefreshing) {
        triggerHaptic('light');
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isMobile || disabled || !isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('medium');
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const getPullIndicatorOpacity = () => {
    if (pullDistance < threshold) {
      return pullDistance / threshold;
    }
    return 1;
  };

  const getPullIndicatorScale = () => {
    if (pullDistance < threshold) {
      return 0.5 + (pullDistance / threshold) * 0.5;
    }
    return 1;
  };

  const getPullIndicatorRotation = () => {
    if (pullDistance < threshold) {
      return (pullDistance / threshold) * 180;
    }
    return 180;
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to Refresh Indicator */}
      <div
        ref={pullIndicatorRef}
        className={`
          absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full
          flex items-center justify-center w-12 h-12 rounded-full shadow-lg
          transition-all duration-200
          ${actualTheme === 'dark' 
            ? 'bg-gray-700 text-white' 
            : 'bg-white text-gray-800'
          }
        `}
        style={{
          opacity: getPullIndicatorOpacity(),
          transform: `translateX(-50%) translateY(-100%) scale(${getPullIndicatorScale()}) rotate(${getPullIndicatorRotation()}deg)`,
          marginTop: `${Math.min(pullDistance, threshold)}px`
        }}
      >
        {isRefreshing ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 14l-7 7m0 0l-7-7m7 7V3" 
            />
          </svg>
        )}
      </div>

      {/* Pull to Refresh Text */}
      {pullDistance > 20 && (
        <div
          className={`
            absolute top-2 left-1/2 transform -translate-x-1/2
            text-sm font-medium transition-opacity duration-200
            ${actualTheme === 'dark' 
              ? 'text-gray-300' 
              : 'text-gray-600'
            }
          `}
          style={{
            opacity: getPullIndicatorOpacity(),
            marginTop: `${Math.min(pullDistance, threshold)}px`
          }}
        >
          {pullDistance >= threshold 
            ? (isRefreshing ? 'Refreshing...' : 'Release to refresh')
            : 'Pull to refresh'
          }
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
