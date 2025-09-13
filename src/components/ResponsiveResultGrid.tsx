import React, { useRef } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useTouchGestures, useHapticFeedback } from '../hooks/useTouchGestures';
import EnhancedResultCard from './EnhancedResultCard';

interface ResponsiveResultGridProps {
  results: any[];
  searchType: 'web' | 'image';
  onImageClick?: (item: any) => void;
  loading?: boolean;
}

const ResponsiveResultGrid: React.FC<ResponsiveResultGridProps> = ({
  results,
  searchType,
  onImageClick,
  loading = false
}) => {
  const { isMobile, isTablet, isPortrait } = useResponsive();
  const { triggerHaptic } = useHapticFeedback();
  const gridRef = useRef<HTMLDivElement>(null);

  // Touch gestures for mobile
  const { handleTouchStart, handleTouchEnd } = useTouchGestures({
    onSwipeLeft: () => {
      if (isMobile && searchType === 'web') {
        // Could implement horizontal scrolling or pagination
        triggerHaptic('light');
      }
    },
    onSwipeRight: () => {
      if (isMobile && searchType === 'web') {
        // Could implement horizontal scrolling or pagination
        triggerHaptic('light');
      }
    },
    onSwipeUp: () => {
      if (isMobile) {
        // Scroll to top or load more
        triggerHaptic('light');
      }
    }
  });

  // Get responsive grid classes
  const getGridClasses = () => {
    const baseClasses = 'transition-all duration-300';
    
    if (searchType === 'image') {
      if (isMobile) {
        return isPortrait 
          ? `${baseClasses} grid grid-cols-2 gap-3`
          : `${baseClasses} grid grid-cols-3 gap-4`;
      } else if (isTablet) {
        return isPortrait 
          ? `${baseClasses} grid grid-cols-3 gap-4`
          : `${baseClasses} grid grid-cols-4 gap-5`;
      } else {
        return `${baseClasses} grid grid-cols-5 gap-6`;
      }
    } else {
      // Web results
      if (isMobile) {
        return `${baseClasses} space-y-4`;
      } else if (isTablet) {
        return isPortrait 
          ? `${baseClasses} space-y-5`
          : `${baseClasses} space-y-6`;
      } else {
        return `${baseClasses} space-y-6`;
      }
    }
  };

  // Get container classes
  const getContainerClasses = () => {
    const baseClasses = 'w-full';
    
    if (isMobile) {
      return `${baseClasses} px-4`;
    } else if (isTablet) {
      return `${baseClasses} px-6`;
    } else {
      return `${baseClasses} px-8`;
    }
  };

  // Get result card animation delay
  const getAnimationDelay = (index: number) => {
    if (isMobile) {
      return index * 30; // Faster on mobile
    } else if (isTablet) {
      return index * 50;
    } else {
      return index * 50;
    }
  };

  if (loading) {
    return (
      <div className={getContainerClasses()}>
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={getContainerClasses()}>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No results found</h3>
          <p className="text-gray-500">Try adjusting your search terms</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={gridRef}
      className={getContainerClasses()}
      onTouchStart={handleTouchStart as any}
      onTouchEnd={handleTouchEnd as any}
    >
      <div className={getGridClasses()}>
        {results.map((item, index) => (
          <div
            key={`${item.link}-${index}`}
            className="animate-fade-in-scale"
            style={{ 
              animationDelay: `${getAnimationDelay(index)}ms`,
              animationFillMode: 'both'
            }}
          >
            <EnhancedResultCard
              item={item}
              index={index}
              searchType={searchType}
              onImageClick={onImageClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveResultGrid;
