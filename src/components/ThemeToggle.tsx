import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (actualTheme === 'dark') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  };

  const getTooltip = () => {
    if (theme === 'system') return 'System theme (click to cycle)';
    if (actualTheme === 'dark') return 'Dark theme (click to cycle)';
    return 'Light theme (click to cycle)';
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative p-3 rounded-xl transition-all duration-300 group
        ${actualTheme === 'dark' 
          ? 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-200 hover:text-white border border-gray-700/50 hover:border-gray-600/50' 
          : 'bg-white/50 hover:bg-white/70 text-gray-600 hover:text-gray-800 border border-gray-200/50 hover:border-gray-300/50'
        }
        backdrop-blur-md shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95
      `}
      title={getTooltip()}
    >
      <div className="relative">
        {getIcon()}
        {/* Animated ring effect */}
        <div className={`
          absolute inset-0 rounded-full transition-all duration-300
          ${actualTheme === 'dark' 
            ? 'group-hover:ring-2 group-hover:ring-purple-400/30' 
            : 'group-hover:ring-2 group-hover:ring-cyan-400/30'
          }
        `} />
      </div>
      
      {/* Theme indicator dot */}
      <div className={`
        absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300
        ${theme === 'system' 
          ? 'bg-blue-500' 
          : actualTheme === 'dark' 
            ? 'bg-purple-500' 
            : 'bg-yellow-500'
        }
        ${theme === 'system' ? 'animate-pulse' : ''}
      `} />
    </button>
  );
};

export default ThemeToggle;
