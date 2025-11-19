import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useTouchGestures, useHapticFeedback } from '../hooks/useTouchGestures';
import { useTheme } from '../contexts/ThemeContext';

interface ResponsiveNavigationProps {
  searchType: 'web' | 'image' | 'ai';
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

  // Enhanced Mobile navigation
  if (isMobile) {
    return (
      <div className="flex justify-center mb-6 animate-slide-in-from-bottom">
        <div 
          className={`
            flex rounded-3xl shadow-depth-4 border transition-all duration-300 hover-lift
            ${actualTheme === 'dark' 
              ? 'bg-gray-900/95 border-gray-700/50' 
              : 'bg-white/95 border-white/30'
            }
            ${isPortrait ? 'p-2' : 'p-1'}
          `}
          onTouchStart={handleTouchStart as any}
          onTouchEnd={handleTouchEnd as any}
        >
          <button
            onClick={() => handleTabChange('web')}
            className={`
              flex items-center transition-all duration-300 touch-feedback focus-ring relative overflow-hidden tab-slide
              ${isPortrait ? 'py-4 px-6 text-sm' : 'py-3 px-4 text-xs'}
              ${searchType === 'web' 
                ? 'bg-gradient-brand text-white shadow-depth-3 transform scale-105 glow-purple' 
                : actualTheme === 'dark' 
                  ? 'text-gray-200 hover:text-white hover:bg-gray-700/30 hover:scale-105' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 hover:scale-105'
              }
              rounded-2xl font-semibold
            `}
          >
            {/* Enhanced Web Icon */}
            <div className={`${isPortrait ? 'w-5 h-5 mr-3' : 'w-4 h-4 mr-2'} transition-transform duration-300 ${searchType === 'web' ? 'animate-pulse' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
              </svg>
            </div>
            <span className={`${isPortrait ? '' : 'hidden'} transition-all duration-300`}>Web</span>
            
            {/* Active state indicator */}
            {searchType === 'web' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-cyan-400/20 animate-pulse" />
            )}
          </button>
          
          <button
            onClick={() => handleTabChange('image')}
            className={`
              flex items-center transition-all duration-300 touch-feedback focus-ring relative overflow-hidden tab-slide
              ${isPortrait ? 'py-4 px-6 text-sm' : 'py-3 px-4 text-xs'}
              ${searchType === 'image' 
                ? 'bg-gradient-brand text-white shadow-depth-3 transform scale-105 glow-cyan' 
                : actualTheme === 'dark' 
                  ? 'text-gray-200 hover:text-white hover:bg-gray-700/30 hover:scale-105' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 hover:scale-105'
              }
              rounded-2xl font-semibold
            `}
          >
            {/* Enhanced Image Icon */}
            <div className={`${isPortrait ? 'w-5 h-5 mr-3' : 'w-4 h-4 mr-2'} transition-transform duration-300 ${searchType === 'image' ? 'animate-pulse' : ''}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className={`${isPortrait ? '' : 'hidden'} transition-all duration-300`}>Images</span>
            
            {/* Active state indicator */}
            {searchType === 'image' && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-cyan-400/20 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // Enhanced Tablet and Desktop navigation
  return (
    <div className="flex justify-center mb-8 animate-slide-in-from-bottom">
      <div className={`
        flex rounded-3xl shadow-depth-4 p-2 border transition-all duration-300 hover-lift
        ${actualTheme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-white/30'
        }
      `}>
        <button
          onClick={() => handleTabChange('web')}
          className={`
            flex items-center py-4 px-10 text-base font-semibold rounded-2xl transition-all duration-300 touch-feedback focus-ring relative overflow-hidden tab-slide
            ${searchType === 'web' 
              ? 'bg-gradient-brand text-white shadow-depth-3 transform scale-105 glow-purple' 
              : actualTheme === 'dark' 
                ? 'text-gray-200 hover:text-white hover:bg-gray-700/30 hover:scale-105' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 hover:scale-105'
            }
          `}
        >
          {/* Enhanced Web Icon */}
          <div className={`w-5 h-5 mr-3 transition-transform duration-300 ${searchType === 'web' ? 'animate-pulse' : ''}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
          </div>
          <span className="transition-all duration-300">Web</span>
          
          {/* Active state indicator */}
          {searchType === 'web' && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-cyan-400/20 animate-pulse" />
          )}
        </button>
        
        <button
          onClick={() => handleTabChange('image')}
          className={`
            flex items-center py-4 px-10 text-base font-semibold rounded-2xl transition-all duration-300 touch-feedback focus-ring relative overflow-hidden tab-slide
            ${searchType === 'image' 
              ? 'bg-gradient-brand text-white shadow-depth-3 transform scale-105 glow-cyan' 
              : actualTheme === 'dark' 
                ? 'text-gray-200 hover:text-white hover:bg-gray-700/30 hover:scale-105' 
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/50 hover:scale-105'
            }
          `}
        >
          {/* Enhanced Image Icon */}
          <div className={`w-5 h-5 mr-3 transition-transform duration-300 ${searchType === 'image' ? 'animate-pulse' : ''}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="transition-all duration-300">Images</span>
          
          {/* Active state indicator */}
          {searchType === 'image' && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400/20 to-cyan-400/20 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ResponsiveNavigation;
