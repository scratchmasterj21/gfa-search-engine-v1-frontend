import React, { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useTouchGestures, useHapticFeedback } from '../hooks/useTouchGestures';
import { useTheme } from '../contexts/ThemeContext';

interface TouchFABProps {
  onScrollToTop?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  resultsCount?: number;
}

const TouchFAB: React.FC<TouchFABProps> = ({
  onScrollToTop,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  resultsCount = 0
}) => {
  const { isMobile } = useResponsive();
  const { actualTheme } = useTheme();
  const { triggerHaptic } = useHapticFeedback();
  const [isExpanded, setIsExpanded] = useState(false);

  // Touch gestures for FAB
  const { handleTouchStart, handleTouchEnd } = useTouchGestures({
    onLongPress: () => {
      if (isMobile) {
        setIsExpanded(!isExpanded);
        triggerHaptic('medium');
      }
    },
    onDoubleTap: () => {
      if (isMobile && onScrollToTop) {
        onScrollToTop();
        triggerHaptic('heavy');
      }
    }
  });

  if (!isMobile) return null;

  const handleScrollToTop = () => {
    onScrollToTop?.();
    triggerHaptic('light');
    setIsExpanded(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      onLoadMore?.();
      triggerHaptic('medium');
    }
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-slide-in-bottom">
          {/* Scroll to Top */}
          <button
            onClick={handleScrollToTop}
            className={`
              flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 touch-target
              ${actualTheme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-800'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>

          {/* Load More */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={`
                flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 touch-target
                ${loadingMore 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : actualTheme === 'dark' 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }
              `}
            >
              {loadingMore ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
            </button>
          )}

          {/* Results Counter */}
          {resultsCount > 0 && (
            <div className={`
              flex items-center justify-center w-12 h-12 rounded-full shadow-lg
              ${actualTheme === 'dark' 
                ? 'bg-cyan-600 text-white' 
                : 'bg-cyan-600 text-white'
              }
            `}>
              <span className="text-xs font-bold">{resultsCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        onTouchStart={handleTouchStart as any}
        onTouchEnd={handleTouchEnd as any}
        className={`
          flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 touch-target-comfortable
          ${isExpanded 
            ? 'rotate-45' 
            : 'rotate-0'
          }
          ${actualTheme === 'dark' 
            ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700' 
            : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700'
          }
        `}
      >
        <svg 
          className={`w-6 h-6 text-white transition-transform duration-300 ${
            isExpanded ? 'rotate-0' : 'rotate-0'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Ripple Effect */}
      <div className="absolute inset-0 rounded-full pointer-events-none">
        <div className={`
          absolute inset-0 rounded-full animate-ping opacity-20
          ${actualTheme === 'dark' 
            ? 'bg-purple-400' 
            : 'bg-purple-400'
          }
        `} />
      </div>
    </div>
  );
};

export default TouchFAB;
