import { useState, useEffect } from 'react';

interface Breakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  largeDesktop: number;
}

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  orientation: 'portrait' | 'landscape';
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

const breakpoints: Breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  largeDesktop: 1920
};

export const useResponsive = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1024,
        height: 768,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        isLargeDesktop: false,
        isPortrait: false,
        isLandscape: true,
        orientation: 'landscape',
        deviceType: 'tablet'
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
      isDesktop: width >= breakpoints.tablet && width < breakpoints.desktop,
      isLargeDesktop: width >= breakpoints.desktop,
      isPortrait: height > width,
      isLandscape: width > height,
      orientation: width > height ? 'landscape' : 'portrait',
      deviceType: width < breakpoints.mobile ? 'mobile' : 
                  width < breakpoints.tablet ? 'tablet' : 'desktop'
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({
        width,
        height,
        isMobile: width < breakpoints.mobile,
        isTablet: width >= breakpoints.mobile && width < breakpoints.tablet,
        isDesktop: width >= breakpoints.tablet && width < breakpoints.desktop,
        isLargeDesktop: width >= breakpoints.desktop,
        isPortrait: height > width,
        isLandscape: width > height,
        orientation: width > height ? 'landscape' : 'portrait',
        deviceType: width < breakpoints.mobile ? 'mobile' : 
                    width < breakpoints.tablet ? 'tablet' : 'desktop'
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return screenSize;
};

export { breakpoints };
