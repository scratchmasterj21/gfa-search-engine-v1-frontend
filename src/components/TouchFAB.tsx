import React from 'react';
import { createPortal } from 'react-dom';
import { useResponsive } from '../hooks/useResponsive';
import { useHapticFeedback } from '../hooks/useTouchGestures';
import { useTheme } from '../contexts/ThemeContext';

interface TouchFABProps {
  onScrollToTop?: () => void;
  resultsCount?: number;
}

const TouchFAB: React.FC<TouchFABProps> = ({
  onScrollToTop,
  resultsCount = 0
}) => {
  const { isMobile } = useResponsive();
  const { actualTheme } = useTheme();
  const { triggerHaptic } = useHapticFeedback();

  if (!isMobile) return null;

  const handleScrollToTop = () => {
    onScrollToTop?.();
    triggerHaptic('light');
  };

  const fabContent = (
    <div 
      className="fixed bottom-6 right-6 z-[9999]"
      style={{ 
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        pointerEvents: 'auto'
      }}
    >
      {/* Result counter and go to top button */}
      <div className="space-y-3">
        {/* Results Counter - Always visible */}
        {resultsCount > 0 && (
          <div className={`
            flex items-center justify-center w-12 h-12 rounded-full shadow-2xl border-2 border-white animate-in slide-in-from-bottom-2 duration-300
            ${actualTheme === 'dark' 
              ? 'bg-cyan-600 text-white' 
              : 'bg-cyan-600 text-white'
            }
          `}>
            <span className="text-xs font-bold">{resultsCount}</span>
          </div>
        )}

        {/* Go to Top - Always visible */}
        <button
          onClick={handleScrollToTop}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full shadow-2xl border-2 border-white transition-all duration-300 touch-target animate-in slide-in-from-bottom-2 duration-300
            ${actualTheme === 'dark' 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-purple-600 hover:bg-purple-700 text-white'
            }
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  );

  // Render using Portal to document.body
  return createPortal(fabContent, document.body);
};

export default TouchFAB;
