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
    group relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1
    ${actualTheme === 'dark' 
      ? 'bg-gray-800/95 hover:bg-gray-700/95 border border-gray-700/50 hover:border-gray-600/50' 
      : 'bg-white/95 hover:bg-white border border-white/20 hover:border-purple-300/50'
    }
    backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl
    ${actualTheme === 'dark' 
      ? 'hover:shadow-purple-500/10' 
      : 'hover:shadow-purple-500/10'
    }
  `;

  const titleClasses = `
    font-bold leading-tight transition-colors duration-300 group-hover:text-purple-600
    ${actualTheme === 'dark' 
      ? 'text-gray-100 group-hover:text-purple-400' 
      : 'text-gray-800 group-hover:text-purple-700'
    }
  `;

  const snippetClasses = `
    leading-relaxed font-medium
    ${actualTheme === 'dark' 
      ? 'text-gray-300' 
      : 'text-gray-600'
    }
  `;

  const sourceClasses = `
    text-sm font-bold truncate px-3 py-1 rounded-full
    ${actualTheme === 'dark' 
      ? 'text-emerald-400 bg-emerald-900/30' 
      : 'text-emerald-600 bg-emerald-50'
    }
  `;

  if (searchType === 'image') {
    return (
      <button 
        onClick={() => onImageClick?.(item)}
        className={cardClasses}
        style={{ animationDelay: `${index * 30}ms` }}
      >
        <div className="aspect-square p-2 relative">
          <img
            src={item.image}
            alt={item.title || 'Search result image'}
            className="w-full h-full object-cover rounded-xl group-hover:brightness-110 transition-all duration-300"
            loading="lazy"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          
          {/* View image text */}
          <div className="absolute bottom-2 left-2 right-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className={`
              backdrop-blur-md rounded-lg px-3 py-2
              ${actualTheme === 'dark' 
                ? 'bg-gray-800/90 text-gray-100' 
                : 'bg-white/90 text-gray-800'
              }
            `}>
              <p className="text-sm font-medium flex items-center">
                <span>View Image</span>
                <ExternalLinkIcon className="ml-1" />
              </p>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div 
      className={cardClasses}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Thumbnail */}
          {item.thumbnail && (
            <div className="flex-shrink-0 order-1 lg:order-none">
              <div className="relative overflow-hidden rounded-xl group-hover:scale-105 transition-transform duration-300">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full lg:w-36 lg:h-36 h-48 object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Source indicator */}
            <div className="mb-3 flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3 animate-pulse" />
              <p className={sourceClasses}>
                {item.source}
              </p>
            </div>
            
            {/* Title */}
            <h3 className={`text-xl mb-4 ${titleClasses}`}>
              <a 
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline decoration-purple-400 decoration-2 underline-offset-4 flex items-start gap-2"
              >
                <span className="flex-1">{item.title}</span>
                <ExternalLinkIcon className="flex-shrink-0 mt-1" />
              </a>
            </h3>
            
            {/* Snippet */}
            <p className={`line-clamp-3 ${snippetClasses}`}>
              {item.snippet}
            </p>
            
            {/* Link preview */}
            <div className="mt-4 flex items-center gap-2">
              <div className={`
                w-2 h-2 rounded-full
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
                  text-sm font-medium truncate hover:underline
                  ${actualTheme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {item.link}
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hover effect border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-purple-400/20 transition-all duration-300 pointer-events-none" />
    </div>
  );
};

export default EnhancedResultCard;
