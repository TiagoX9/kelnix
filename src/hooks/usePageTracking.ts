import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';
import { trackPageView as trackTelemetryPageView } from '../lib/telemetry';

/**
 * Fires a page_view on the initial load and on every client-side route change.
 * Must be rendered inside a Router so useLocation() has context.
 *
 * Two destinations, deliberately: GA4 (consent-gated, third-party) and the
 * first-party Kelnix telemetry service that backs /admin. The second one is
 * cookieless, so it runs regardless of the banner choice — see lib/telemetry.
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    // The operations dashboard is not a marketing page. Counting your own
    // admin sessions would inflate exactly the numbers you open it to read.
    if (location.pathname.startsWith('/admin')) return;

    const path = location.pathname + location.search;
    trackPageView(path);
    trackTelemetryPageView(path);
  }, [location.pathname, location.search]);
}
