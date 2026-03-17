// src/components/layout/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  // Get the current location object, specifically the pathname
  const { pathname } = useLocation();

  // Use an effect that triggers whenever the pathname changes
  useEffect(() => {
    // Scroll the window to the top left corner (0, 0)
    window.scrollTo(0, 0);
  }, [pathname]); // Dependency array ensures this effect runs only when the pathname changes

  // This component doesn't render anything visual
  return null;
}