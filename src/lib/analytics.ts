// Google Analytics 4 (gtag.js) helpers.
//
// The gtag stub, Consent Mode v2 defaults and `config` call live in index.html
// so they run before this bundle loads. This module only wraps the runtime
// calls we make from React: manual page_view tracking and consent updates.

export const GA_MEASUREMENT_ID = 'G-ZLL567MV9Q';

type GtagArgs = [command: string, ...rest: unknown[]];

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: GtagArgs) => void;
  }
}

function gtag(...args: GtagArgs): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag(...args);
}

/**
 * Send a manual page_view. Called on every route change (including the initial
 * load) because automatic page_view is disabled in the gtag config.
 */
export function trackPageView(path: string): void {
  gtag('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export type ConsentChoice = 'granted' | 'denied';

export const CONSENT_STORAGE_KEY = 'kelnix_cookie_consent';

/**
 * Update Consent Mode v2 signals in response to the user's banner choice.
 * Everything defaults to "denied" in index.html, so this is what actually
 * unlocks analytics/ads storage when the user accepts.
 */
export function updateConsent(choice: ConsentChoice): void {
  gtag('consent', 'update', {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });
}

export function getStoredConsent(): ConsentChoice | null {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // localStorage can be unavailable (private mode, blocked cookies) — ignore.
  }
}
