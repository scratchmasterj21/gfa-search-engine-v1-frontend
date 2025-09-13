import { useRef, useCallback } from 'react';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onLongPress?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isLongPress: boolean;
  longPressTimer: NodeJS.Timeout | null;
  lastTapTime: number;
  tapCount: number;
}

export const useTouchGestures = (options: TouchGestureOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onLongPress,
    onTap,
    onDoubleTap,
    swipeThreshold = 50,
    longPressDelay = 500,
    doubleTapDelay = 300
  } = options;

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPress: false,
    longPressTimer: null,
    lastTapTime: 0,
    tapCount: 0
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchState.current.startX = touch.clientX;
    touchState.current.startY = touch.clientY;
    touchState.current.startTime = Date.now();
    touchState.current.isLongPress = false;

    // Start long press timer
    if (onLongPress) {
      touchState.current.longPressTimer = setTimeout(() => {
        touchState.current.isLongPress = true;
        onLongPress();
      }, longPressDelay);
    }
  }, [onLongPress, longPressDelay]);

  const handleTouchMove = useCallback((_e: TouchEvent) => {
    // Cancel long press if user moves
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;

    // Clear long press timer
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }

    // Handle swipe gestures
    if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
      return;
    }

    // Handle tap gestures
    if (deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      const currentTime = Date.now();
      const timeDiff = currentTime - touchState.current.lastTapTime;

      if (timeDiff < doubleTapDelay) {
        touchState.current.tapCount++;
        if (touchState.current.tapCount === 2) {
          onDoubleTap?.();
          touchState.current.tapCount = 0;
        }
      } else {
        touchState.current.tapCount = 1;
        setTimeout(() => {
          if (touchState.current.tapCount === 1) {
            onTap?.();
          }
          touchState.current.tapCount = 0;
        }, doubleTapDelay);
      }

      touchState.current.lastTapTime = currentTime;
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, swipeThreshold, doubleTapDelay]);

  const handlePinch = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && onPinch) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      // Store initial distance for comparison
      if (!touchState.current.startX) {
        touchState.current.startX = distance;
      } else {
        const scale = distance / touchState.current.startX;
        onPinch(scale);
      }
    }
  }, [onPinch]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handlePinch
  };
};

// Hook for haptic feedback
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  return { triggerHaptic };
};
