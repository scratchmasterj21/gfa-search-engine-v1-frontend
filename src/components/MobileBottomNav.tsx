import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useTouchGestures, useHapticFeedback } from '../hooks/useTouchGestures';
import { useTheme } from '../contexts/ThemeContext';

interface MobileBottomNavProps {
  searchType: 'web' | 'image';
  onSearchTypeChange: (type: 'web' | 'image') => void;
  onHomeClick?: () => void;
  onSettingsClick?: () => void;
  resultsCount?: number;
  visible?: boolean;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  searchType,
  onSearchTypeChange,
  onHomeClick,
  onSettingsClick,
  resultsCount = 0,
  visible = true
}) => {
  const { isMobile, isPortrait } = useResponsive();
  const { actualTheme } = useTheme();
  const { triggerHaptic } = useHapticFeedback();

  // Touch gestures for navigation
  const { handleTouchStart, handleTouchEnd } = useTouchGestures({
    onSwipeUp: () => {
      if (isMobile) {
        // Could implement quick actions
        triggerHaptic('light');
      }
    }
  });

  const handleTabChange = (type: 'web' | 'image') => {
    onSearchTypeChange(type);
    triggerHaptic('light');
  };

  const handleHomeClick = () => {
    onHomeClick?.();
    triggerHaptic('light');
  };

  const handleSettingsClick = () => {
    onSettingsClick?.();
    triggerHaptic('light');
  };

  if (!isMobile || !visible) return null;

  return (
    <div 
      className={`
        fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t transition-all duration-300
        ${actualTheme === 'dark' 
          ? 'bg-gray-900/95 border-gray-700/50' 
          : 'bg-white/95 border-gray-200/50'
        }
        ${isPortrait ? 'pb-safe' : 'pb-2'}
      `}
      onTouchStart={handleTouchStart as any}
      onTouchEnd={handleTouchEnd as any}
    >
      <div className="flex items-center justify-around py-2">
        {/* Home Button */}
        <button
          onClick={handleHomeClick}
          className={`
            flex flex-col items-center justify-center touch-target transition-all duration-200
            ${actualTheme === 'dark' 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-500 hover:text-gray-800'
            }
          `}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="text-xs font-medium mt-1">Home</span>
        </button>

        {/* Web Search Tab */}
        <button
          onClick={() => handleTabChange('web')}
          className={`
            flex flex-col items-center justify-center touch-target transition-all duration-200 relative
            ${searchType === 'web' 
              ? actualTheme === 'dark' 
                ? 'text-purple-400' 
                : 'text-purple-600'
              : actualTheme === 'dark' 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-500 hover:text-gray-800'
            }
          `}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
            {searchType === 'web' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-xs font-medium mt-1">Web</span>
        </button>

        {/* Image Search Tab */}
        <button
          onClick={() => handleTabChange('image')}
          className={`
            flex flex-col items-center justify-center touch-target transition-all duration-200 relative
            ${searchType === 'image' 
              ? actualTheme === 'dark' 
                ? 'text-cyan-400' 
                : 'text-cyan-600'
              : actualTheme === 'dark' 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-500 hover:text-gray-800'
            }
          `}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {searchType === 'image' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-xs font-medium mt-1">Images</span>
        </button>

        {/* Results Counter */}
        {resultsCount > 0 && (
          <button
            className={`
              flex flex-col items-center justify-center touch-target transition-all duration-200
              ${actualTheme === 'dark' 
                ? 'text-green-400' 
                : 'text-green-600'
              }
            `}
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {resultsCount > 99 ? '99+' : resultsCount}
              </div>
            </div>
            <span className="text-xs font-medium mt-1">Results</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={handleSettingsClick}
          className={`
            flex flex-col items-center justify-center touch-target transition-all duration-200
            ${actualTheme === 'dark' 
              ? 'text-gray-400 hover:text-white' 
              : 'text-gray-500 hover:text-gray-800'
            }
          `}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium mt-1">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
