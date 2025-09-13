import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useTouchGestures, useHapticFeedback } from '../hooks/useTouchGestures';
import { useTheme } from '../contexts/ThemeContext';

interface ResponsiveNavigationProps {
  searchType: 'web' | 'image';
  onSearchTypeChange: (type: 'web' | 'image') => void;
  visible: boolean;
}

const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  searchType,
  onSearchTypeChange,
  visible
}) => {
  const { isMobile, isPortrait } = useResponsive();
  const { actualTheme } = useTheme();
  const { triggerHaptic } = useHapticFeedback();

  // Touch gestures for mobile
  const { handleTouchStart, handleTouchEnd } = useTouchGestures({
    onSwipeLeft: () => {
      if (isMobile && searchType === 'web') {
        onSearchTypeChange('image');
        triggerHaptic('light');
      }
    },
    onSwipeRight: () => {
      if (isMobile && searchType === 'image') {
        onSearchTypeChange('web');
        triggerHaptic('light');
      }
    }
  });

  const handleTabChange = (type: 'web' | 'image') => {
    onSearchTypeChange(type);
    if (isMobile) {
      triggerHaptic('light');
    }
  };

  if (!visible) return null;

  // Mobile navigation
  if (isMobile) {
    return (
      <div className="flex justify-center mb-6 animate-slide-in-bottom">
        <div 
          className={`
            flex backdrop-blur-md rounded-2xl shadow-xl border transition-all duration-300
            ${actualTheme === 'dark' 
              ? 'bg-gray-800/20 border-gray-700/30' 
              : 'bg-white/20 border-white/30'
            }
            ${isPortrait ? 'p-1' : 'p-0.5'}
          `}
          onTouchStart={handleTouchStart as any}
          onTouchEnd={handleTouchEnd as any}
        >
          <button
            onClick={() => handleTabChange('web')}
            className={`
              flex items-center transition-all duration-300 touch-target
              ${isPortrait ? 'py-3 px-6 text-sm' : 'py-2 px-4 text-xs'}
              ${searchType === 'web' 
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg transform scale-105' 
                : actualTheme === 'dark' 
                  ? 'text-gray-300/80 hover:text-white hover:bg-gray-700/20' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }
              rounded-xl font-bold
            `}
          >
            <svg className={`${isPortrait ? 'w-4 h-4 mr-2' : 'w-3 h-3 mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
            <span className={isPortrait ? '' : 'hidden'}>Web</span>
          </button>
          
          <button
            onClick={() => handleTabChange('image')}
            className={`
              flex items-center transition-all duration-300 touch-target
              ${isPortrait ? 'py-3 px-6 text-sm' : 'py-2 px-4 text-xs'}
              ${searchType === 'image' 
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg transform scale-105' 
                : actualTheme === 'dark' 
                  ? 'text-gray-300/80 hover:text-white hover:bg-gray-700/20' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }
              rounded-xl font-bold
            `}
          >
            <svg className={`${isPortrait ? 'w-4 h-4 mr-2' : 'w-3 h-3 mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={isPortrait ? '' : 'hidden'}>Images</span>
          </button>
        </div>
      </div>
    );
  }

  // Tablet and Desktop navigation
  return (
    <div className="flex justify-center mb-8 animate-slide-in-bottom">
      <div className={`
        flex backdrop-blur-md rounded-2xl shadow-xl p-1.5 border transition-all duration-300
        ${actualTheme === 'dark' 
          ? 'bg-gray-800/20 border-gray-700/30' 
          : 'bg-white/20 border-white/30'
        }
      `}>
        <button
          onClick={() => handleTabChange('web')}
          className={`
            flex items-center py-3 px-8 text-sm sm:text-base font-bold rounded-xl transition-all duration-300
            ${searchType === 'web' 
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg transform scale-105' 
              : actualTheme === 'dark' 
                ? 'text-gray-300/80 hover:text-white hover:bg-gray-700/20' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }
          `}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
          Web
        </button>
        
        <button
          onClick={() => handleTabChange('image')}
          className={`
            flex items-center py-3 px-8 text-sm sm:text-base font-bold rounded-xl transition-all duration-300
            ${searchType === 'image' 
              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg transform scale-105' 
              : actualTheme === 'dark' 
                ? 'text-gray-300/80 hover:text-white hover:bg-gray-700/20' 
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }
          `}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Images
        </button>
      </div>
    </div>
  );
};

export default ResponsiveNavigation;
