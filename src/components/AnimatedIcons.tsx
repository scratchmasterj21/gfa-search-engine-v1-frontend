import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-purple-200 border-t-purple-600',
    secondary: 'border-cyan-200 border-t-cyan-600',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div className={`animate-spin rounded-full border-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`} />
  );
};

interface PulsingDotsProps {
  count?: number;
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const PulsingDots: React.FC<PulsingDotsProps> = ({ 
  count = 3, 
  color = 'primary',
  className = '' 
}) => {
  const colorClasses = {
    primary: 'bg-purple-400',
    secondary: 'bg-cyan-400',
    white: 'bg-white'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full ${colorClasses[color]} animate-bounce`}
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </div>
  );
};

interface SearchIconProps {
  className?: string;
  animated?: boolean;
}

export const SearchIcon: React.FC<SearchIconProps> = ({ className = '', animated = false }) => {
  return (
    <svg 
      className={`w-5 h-5 ${animated ? 'animate-pulse' : ''} ${className}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
      />
    </svg>
  );
};

interface RocketIconProps {
  className?: string;
  animated?: boolean;
}

export const RocketIcon: React.FC<RocketIconProps> = ({ className = '', animated = false }) => {
  return (
    <svg 
      className={`w-5 h-5 ${animated ? 'animate-bounce' : ''} ${className}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M13 7l5 5m0 0l-5 5m5-5H6" 
      />
    </svg>
  );
};

interface CheckIconProps {
  className?: string;
  animated?: boolean;
}

export const CheckIcon: React.FC<CheckIconProps> = ({ className = '', animated = false }) => {
  return (
    <svg 
      className={`w-5 h-5 ${animated ? 'animate-pulse' : ''} ${className}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M5 13l4 4L19 7" 
      />
    </svg>
  );
};

interface ArrowDownIconProps {
  className?: string;
  animated?: boolean;
}

export const ArrowDownIcon: React.FC<ArrowDownIconProps> = ({ className = '', animated = false }) => {
  return (
    <svg 
      className={`w-4 h-4 ${animated ? 'animate-bounce' : ''} ${className}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M19 14l-7 7m0 0l-7-7m7 7V3" 
      />
    </svg>
  );
};


interface ExternalLinkIconProps {
  className?: string;
  animated?: boolean;
}

export const ExternalLinkIcon: React.FC<ExternalLinkIconProps> = ({ className = '', animated = false }) => {
  return (
    <svg 
      className={`w-3 h-3 ${animated ? 'animate-pulse' : ''} ${className}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
      />
    </svg>
  );
};
