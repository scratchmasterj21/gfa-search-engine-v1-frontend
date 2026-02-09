/**
 * Detect if the device is a Chromebook or desktop (not mobile/tablet).
 * Used to show Google Sign-In only on Chromebooks/desktop for better user identification in logs.
 */
export function isChromebookOrDesktop(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }

  const userAgent = navigator.userAgent;

  // Detect Chromebook (Chrome OS)
  const isChromebook = /CrOS/.test(userAgent);

  // Detect mobile/tablet - exclude these (iPhone, iPad, Android phones, etc.)
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // Only treat as iPad when UA explicitly says iPad (avoid flagging Mac desktops with trackpads)
  const isIPad = /iPad/.test(userAgent);

  // Detect touch-primary devices (tablets pretending to be desktop, e.g. iPad in "Request Desktop Website" mode)
  // iPad in desktop mode has maxTouchPoints = 5 (touch-only)
  // Mac desktop with trackpad has maxTouchPoints = 0-2 (mouse-primary)
  const isTouchPrimary = navigator.maxTouchPoints >= 5;

  // Desktop: not mobile, not iPad, not touch-primary, and wide enough (Mac, Windows, Linux)
  const isDesktop = !isMobile && !isIPad && !isTouchPrimary && window.innerWidth >= 768;

  return isChromebook || isDesktop;
}
