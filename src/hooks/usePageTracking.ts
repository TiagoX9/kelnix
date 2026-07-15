import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

/**
 * Fires a GA4 page_view on the initial load and on every client-side route
 * change. Must be rendered inside a Router so useLocation() has context.
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
}
