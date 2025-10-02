import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useResponsive } from '../hooks/useResponsive';
import { useTouchGestures, useHapticFeedback } from '../hooks/useTouchGestures';
import { useTheme } from '../contexts/ThemeContext';
import { SearchIcon, RocketIcon } from './AnimatedIcons';

interface ResponsiveSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const ResponsiveSearchBar: React.FC<ResponsiveSearchBarProps> = ({
  query,
  onQueryChange,
  onSearch,
  onFocus,
  onBlur,
  placeholder = "Search the universe...",
  suggestions = [],
  onSuggestionClick,
  isLoading = false,
  disabled = false
}) => {
  const { isMobile, isTablet, isPortrait } = useResponsive();
  const { actualTheme } = useTheme();
  const { triggerHaptic } = useHapticFeedback();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isOrientationChanging, setIsOrientationChanging] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // Remove window.scrollY to make it fixed relative to viewport
        left: rect.left,
        width: rect.width
      });
    }
  };

  // Show suggestions when query changes (only if focused or has content, and not during orientation change)
  useEffect(() => {
    if (query.trim().length > 0 && (isFocused || suggestions.length > 0) && !isOrientationChanging) {
      setShowSuggestions(true);
      updateDropdownPosition();
    }
  }, [query, isFocused, suggestions.length, isOrientationChanging]);

  // Update position when suggestions show
  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();
    }
  }, [showSuggestions]);

  // Update position on window resize, scroll, and handle orientation changes
  useEffect(() => {
    const handleResize = () => {
      if (showSuggestions) {
        updateDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (showSuggestions) {
        updateDropdownPosition();
      }
    };

    const handleOrientationChange = () => {
      // Set orientation changing flag and hide suggestions
      setIsOrientationChanging(true);
      setShowSuggestions(false);
      // Small delay to allow orientation to settle, then update position if needed
      setTimeout(() => {
        setIsOrientationChanging(false);
        if (isFocused && query.trim().length > 0) {
          setShowSuggestions(true);
          updateDropdownPosition();
        }
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [showSuggestions, isFocused, query]);

  // Touch gestures for mobile
  const { handleTouchStart, handleTouchEnd } = useTouchGestures({
    onSwipeUp: () => {
      if (isMobile && isFocused) {
        inputRef.current?.blur();
        triggerHaptic('light');
      }
    },
    onSwipeDown: () => {
      if (isMobile && !isFocused) {
        inputRef.current?.focus();
        triggerHaptic('light');
      }
    }
  });

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    onFocus?.();
    if (isMobile) {
      triggerHaptic('light');
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
    onBlur?.();
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside the search bar container
      if (searchBarRef.current && !searchBarRef.current.contains(target)) {
        // Also check if click is on a suggestion (which is rendered in a portal)
        const isSuggestionClick = (target as Element).closest('[data-suggestion-dropdown]');
        if (!isSuggestionClick) {
          setShowSuggestions(false);
        }
      }
    };

    if (showSuggestions) {
      // Use a small delay to allow suggestion clicks to register first
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSuggestions]);

  // Handle input change - show suggestions when typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onQueryChange(newValue);
    
    // Show suggestions when user is typing
    if (newValue.trim().length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle search
  const handleSearch = () => {
    onSearch();
    if (isMobile) {
      triggerHaptic('medium');
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string, event?: React.MouseEvent) => {
    // Prevent the click-outside handler from interfering
    event?.stopPropagation();
    event?.preventDefault();
    
    onSuggestionClick?.(suggestion);
    setShowSuggestions(false);
    if (isMobile) {
      triggerHaptic('light');
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    onQueryChange('');
    inputRef.current?.focus();
    setShowSuggestions(false);
    if (isMobile) {
      triggerHaptic('light');
    }
  };

  // Get responsive classes with enhanced visual design
  const getSearchBarClasses = () => {
    const baseClasses = 'flex items-stretch rounded-3xl shadow-depth-4 transition-all duration-300 border hover-lift focus-ring';
    const themeClasses = actualTheme === 'dark' 
      ? 'bg-gray-900/95 hover:bg-gray-800/95 border-gray-700/50 hover:border-gray-600/60' 
      : 'bg-white/95 hover:bg-white/98 border-white/30 hover:border-purple-300/50';
    const focusClasses = isFocused ? 'ring-2 ring-purple-400/50 glow-purple shadow-depth-5' : '';
    
    let sizeClasses = '';
    if (isMobile) {
      sizeClasses = isPortrait ? 'rounded-2xl' : 'rounded-xl';
    } else if (isTablet) {
      sizeClasses = 'rounded-3xl';
    } else {
      sizeClasses = 'rounded-3xl';
    }
    
    return `${baseClasses} ${themeClasses} ${focusClasses} ${sizeClasses}`;
  };

  const getInputClasses = () => {
    const baseClasses = 'flex-1 outline-none bg-transparent font-medium transition-all duration-300 focus-ring';
    const themeClasses = actualTheme === 'dark' 
      ? 'placeholder-gray-400 text-white' 
      : 'placeholder-gray-500 text-gray-900';
    
    let sizeClasses = '';
    if (isMobile) {
      sizeClasses = isPortrait ? 'text-base px-4 py-4' : 'text-sm px-3 py-3';
    } else if (isTablet) {
      sizeClasses = 'text-lg px-6 py-5';
    } else {
      sizeClasses = 'text-lg px-6 py-5';
    }
    
    return `${baseClasses} ${themeClasses} ${sizeClasses}`;
  };

  const getButtonClasses = () => {
    const baseClasses = 'btn-primary hover-scale touch-feedback ripple-enhanced relative overflow-hidden';
    
    let sizeClasses = '';
    if (isMobile) {
      sizeClasses = isPortrait 
        ? 'px-6 py-4 rounded-r-2xl' 
        : 'px-4 py-3 rounded-r-xl';
    } else if (isTablet) {
      sizeClasses = 'px-8 py-5 rounded-r-3xl';
    } else {
      sizeClasses = 'px-8 py-5 rounded-r-3xl';
    }
    
    return `${baseClasses} ${sizeClasses}`;
  };

  const getIconClasses = () => {
    let sizeClasses = '';
    if (isMobile) {
      sizeClasses = isPortrait ? 'w-5 h-5' : 'w-4 h-4';
    } else {
      sizeClasses = 'w-5 h-5';
    }
    
    return `${sizeClasses} ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`;
  };

  const getClearButtonClasses = () => {
    const baseClasses = 'flex items-center justify-center transition-all duration-200 hover-scale touch-feedback focus-ring';
    const themeClasses = actualTheme === 'dark' 
      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50';
    
    let sizeClasses = '';
    if (isMobile) {
      sizeClasses = isPortrait ? 'w-10 h-10 rounded-full' : 'w-8 h-8 rounded-full';
    } else {
      sizeClasses = 'w-10 h-10 rounded-full';
    }
    
    return `${baseClasses} ${themeClasses} ${sizeClasses}`;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto" style={{ zIndex: 1000 }}>
      <div 
        ref={searchBarRef}
        className={getSearchBarClasses()}
        onTouchStart={handleTouchStart as any}
        onTouchEnd={handleTouchEnd as any}
      >
        {/* Search Icon */}
        <div className={`flex items-center ${isMobile ? 'pl-4' : 'pl-6'}`}>
          <SearchIcon className={getIconClasses()} />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={disabled ? "Search disabled" : placeholder}
          className={getInputClasses()}
          disabled={disabled}
        />

        {/* Clear Button - Only show when there's text */}
        {query.trim().length > 0 && (
          <button
            onClick={handleClearSearch}
            className={getClearButtonClasses()}
            title="Clear search"
            type="button"
          >
            <svg 
              className={isMobile && !isPortrait ? 'w-4 h-4' : 'w-5 h-5'} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isLoading || disabled}
          className={getButtonClasses()}
        >
          {isMobile && isPortrait ? (
            <span className="text-lg">🚀</span>
          ) : (
            <span className="flex items-center">
              <span className="hidden sm:inline">Search</span>
              <RocketIcon className="w-4 h-4 ml-2" />
            </span>
          )}
        </button>
      </div>

      {/* Suggestions Dropdown - Rendered via Portal */}
      {(() => {
        const shouldShow = showSuggestions && (suggestions.length > 0 || query.trim().length > 0);
        
        if (!shouldShow) return null;
        
        const suggestionsList = suggestions.length > 0 ? suggestions : [
          `${query} meaning`,
          `${query} definition`,
          `what is ${query}`,
          `${query} examples`,
          `${query} tutorial`
        ];
        
        return createPortal(
          <div 
            data-suggestion-dropdown
            className={`
              fixed border rounded-3xl shadow-depth-5 z-[9999] overflow-y-auto animate-slide-in-from-top
              ${actualTheme === 'dark' 
                ? 'bg-gray-900/95 border-gray-700/50' 
                : 'bg-white/95 border-white/30'
              }
              ${isMobile ? 'max-h-60' : 'max-h-80'}
              ${isMobile && isPortrait ? 'max-h-48' : ''}
            `}
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxWidth: '90vw',
              transform: 'translateZ(0)', // Force hardware acceleration
              backfaceVisibility: 'hidden'
            }}
          >
            {suggestionsList.map((suggestion, index) => (
              <button
                key={index}
                onClick={(e) => handleSuggestionClick(suggestion, e)}
                className={`
                  w-full px-6 py-4 text-left transition-all duration-200 border-b last:border-b-0 font-medium first:rounded-t-3xl last:rounded-b-3xl touch-feedback hover-lift
                  ${actualTheme === 'dark' 
                    ? 'hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-cyan-900/30 border-gray-700/50 text-white' 
                    : 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-cyan-50 border-gray-100/50 text-gray-900'
                  }
                  ${isMobile ? 'py-3' : 'py-4'}
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-4 rounded-full bg-gradient-brand flex items-center justify-center shadow-depth-2">
                    <SearchIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="truncate font-medium">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

export default ResponsiveSearchBar;
