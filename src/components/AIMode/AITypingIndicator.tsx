import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { PulsingDots } from '../AnimatedIcons';

interface AITypingIndicatorProps {
  message?: string;
}

const AITypingIndicator: React.FC<AITypingIndicatorProps> = ({ 
  message = 'AI is thinking...' 
}) => {
  const { actualTheme } = useTheme();

  return (
    <div className={`
      flex items-center space-x-3 px-6 py-4 rounded-2xl animate-fade-in-scale
      ${actualTheme === 'dark'
        ? 'bg-gray-800/50 border border-gray-700/50'
        : 'bg-white/50 border border-purple-200/50'
      }
    `}>
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center animate-pulse">
          <span className="text-white text-sm">🤖</span>
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 animate-ping opacity-20"></div>
      </div>
      
      <div className="flex-1">
        <span className={`
          font-medium text-sm
          ${actualTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
        `}>
          {message}
        </span>
        <PulsingDots count={3} color={actualTheme === 'dark' ? 'white' : 'primary'} className="mt-1" />
      </div>
    </div>
  );
};

export default AITypingIndicator;

