import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ExternalLinkIcon
} from './AnimatedIcons';

interface EnhancedResultCardProps {
  item: {
    title?: string;
    snippet?: string;
    link: string;
    thumbnail?: string;
    image?: string;
    source?: string;
  };
  index: number;
  searchType: 'web' | 'image';
  onImageClick?: (item: any) => void;
}

const EnhancedResultCard: React.FC<EnhancedResultCardProps> = ({ 
  item, 
  index, 
  searchType, 
  onImageClick 
}) => {
  const { actualTheme } = useTheme();

  const cardClasses = `
    group relative overflow-hidden transition-all duration-300 hover-lift
    ${actualTheme === 'dark' 
      ? 'bg-gray-900/95 hover:bg-gray-800/95 border-gray-700/50 hover:border-gray-600/60' 
      : 'bg-white/95 hover:bg-white/98 border-white/30 hover:border-purple-300/50'
    }
    backdrop-blur-xl rounded-3xl shadow-depth-3 hover:shadow-depth-5
    ${actualTheme === 'dark' 
      ? 'hover:glow-purple' 
      : 'hover:glow-cyan'
    }
  `;

  const titleClasses = `
    font-bold leading-tight transition-colors duration-300 group-hover:text-gradient
    ${actualTheme === 'dark' 
      ? 'text-white group-hover:text-gradient' 
      : 'text-gray-900 group-hover:text-gradient'
    }
  `;

  const snippetClasses = `
    leading-relaxed font-medium text-base
    ${actualTheme === 'dark' 
      ? 'text-gray-200' 
      : 'text-gray-700'
    }
  `;

  const sourceClasses = `
    text-sm font-semibold truncate px-4 py-2 rounded-full shadow-depth-1
    ${actualTheme === 'dark' 
      ? 'text-emerald-300 bg-emerald-900/60 border border-emerald-700/50' 
      : 'text-emerald-700 bg-emerald-100 border border-emerald-300/70'
    }
  `;

  if (searchType === 'image') {
    return (
      <button 
        onClick={() => onImageClick?.(item)}
        className={`${cardClasses} touch-feedback`}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="aspect-square p-3 relative">
          <img
            src={item.image}
            alt={item.title || 'Search result image'}
            className="w-full h-full object-cover rounded-2xl group-hover:brightness-110 transition-all duration-300 shadow-depth-2"
            loading="lazy"
          />
          
          {/* Enhanced gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
          
          {/* Enhanced view image text */}
          <div className="absolute bottom-3 left-3 right-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className={`
              rounded-xl px-4 py-3 shadow-depth-3
              ${actualTheme === 'dark' 
                ? 'bg-gray-900/95 text-white border border-gray-700/50' 
                : 'bg-white/95 text-gray-900 border border-white/50'
              }
            `}>
              <p className="text-sm font-semibold flex items-center" style={{ textShadow: actualTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)' }}>
                <span>View Image</span>
                <ExternalLinkIcon className="ml-2 w-4 h-4" />
              </p>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div 
      className={`${cardClasses} touch-feedback`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Thumbnail */}
          {item.thumbnail && (
            <div className="flex-shrink-0 order-1 lg:order-none">
              <div className="relative overflow-hidden rounded-2xl group-hover:scale-105 transition-transform duration-300 shadow-depth-2">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full lg:w-40 lg:h-40 h-52 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          )}
          
          {/* Enhanced Content */}
          <div className="flex-1 min-w-0">
            {/* Enhanced Source indicator */}
            <div className="mb-4 flex items-center">
              <div className="w-4 h-4 bg-gradient-brand rounded-full mr-4 animate-pulse shadow-depth-1" />
              <p className={sourceClasses}>
                {item.source}
              </p>
            </div>
            
            {/* Enhanced Title */}
            <h3 className={`text-2xl mb-6 ${titleClasses}`}>
              <a 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline decoration-purple-400 decoration-2 underline-offset-4 flex items-start gap-3 focus-ring rounded-lg p-1 -m-1"
                style={{ textShadow: actualTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)' }}
              >
                <span className="flex-1">{item.title}</span>
                <ExternalLinkIcon className="flex-shrink-0 mt-1 w-5 h-5" />
              </a>
            </h3>
            
            {/* Enhanced Snippet */}
            <p 
              className={`line-clamp-3 mb-6 ${snippetClasses}`}
              style={{ textShadow: actualTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)' }}
            >
              {item.snippet}
            </p>
            
            {/* Enhanced Link preview */}
            <div className="flex items-center gap-3">
              <div className={`
                w-3 h-3 rounded-full shadow-depth-1
                ${actualTheme === 'dark' 
                  ? 'bg-green-400' 
                  : 'bg-green-500'
                }
              `} />
              <a 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  text-sm font-medium truncate hover:underline focus-ring rounded px-2 py-1 -m-1
                  ${actualTheme === 'dark' 
                    ? 'text-gray-300 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-800'
                  }
                `}
                style={{ textShadow: actualTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)' }}
              >
                {item.link}
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced hover effect border */}
      <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-gradient transition-all duration-300 pointer-events-none" />
    </div>
  );
};

export default EnhancedResultCard;
