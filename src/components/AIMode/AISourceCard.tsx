import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { ExternalLinkIcon } from '../AnimatedIcons';
import type { AISource } from '../../types/aiChat';

interface AISourceCardProps {
  source: AISource;
  index: number;
}

const AISourceCard: React.FC<AISourceCardProps> = ({ source, index }) => {
  const { actualTheme } = useTheme();

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        group block px-4 py-3 rounded-xl transition-all duration-200 hover-lift touch-feedback
        ${actualTheme === 'dark'
          ? 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600'
          : 'bg-white/80 hover:bg-white border border-purple-200/50 hover:border-purple-300'
        }
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start space-x-3">
        {/* Citation Number */}
        <div className={`
          flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs
          ${actualTheme === 'dark'
            ? 'bg-purple-600 text-white'
            : 'bg-gradient-brand text-white'
          }
        `}>
          {source.citationNumber}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`
              font-semibold text-sm line-clamp-1 group-hover:text-gradient transition-colors
              ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}
            `}>
              {source.title}
            </h4>
            <ExternalLinkIcon className={`
              flex-shrink-0 w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity
              ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
            `} />
          </div>

          <p className={`
            text-xs mt-1 line-clamp-2
            ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}
          `}>
            {source.snippet}
          </p>

          <div className={`
            text-xs mt-2 font-medium truncate
            ${actualTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}
          `}>
            {source.domain}
          </div>
        </div>
      </div>
    </a>
  );
};

export default AISourceCard;

