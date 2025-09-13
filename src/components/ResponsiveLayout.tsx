import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../contexts/ThemeContext';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children, className = '' }) => {
  const { isMobile, isTablet, isPortrait } = useResponsive();
  const { actualTheme } = useTheme();

  const getLayoutClasses = () => {
    const baseClasses = 'min-h-screen transition-all duration-300';
    const themeClasses = actualTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
    
    let responsiveClasses = '';
    
    if (isMobile) {
      responsiveClasses = isPortrait 
        ? 'mobile-portrait' 
        : 'mobile-landscape';
    } else if (isTablet) {
      responsiveClasses = isPortrait 
        ? 'tablet-portrait' 
        : 'tablet-landscape';
    } else {
      responsiveClasses = 'desktop';
    }
    
    return `${baseClasses} ${themeClasses} ${responsiveClasses} ${className}`;
  };

  return (
    <div className={getLayoutClasses()}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;
