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

  // Desktop: not mobile and not iPad (Mac, Windows, Linux)
  const isDesktop = !isMobile && !isIPad && window.innerWidth >= 768;

  return isChromebook || isDesktop;
}
