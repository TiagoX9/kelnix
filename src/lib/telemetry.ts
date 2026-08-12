// First-party telemetry for kelnix.org.
//
// Runs alongside GA4 rather than replacing it, and differs from it in one
// important way: it sets nothing on the visitor's device that survives the tab
// closing, and it never sees an identifier the server could link back to a
// person. The visitor id is derived server-side from a daily-rotating hash of
// IP and user agent, so there is no cookie and no localStorage entry.
//
// That is why this does not sit behind the consent banner: there is nothing to
// consent to. GA4 still does — see ConsentBanner.

const ENDPOINT = (import.meta.env.VITE_TELEMETRY_URL ?? '').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_TELEMETRY_KEY ?? '';

const enabled = Boolean(ENDPOINT && API_KEY);

const SESSION_KEY = 'kelnix_telemetry_session';

/**
 * A per-tab session id, held in sessionStorage so it dies with the tab. This
 * is what separates "one visitor, six pages" from "six visitors".
 */
function sessionId(): string | undefined {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID().slice(0, 16);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Private mode or blocked storage. Sessions just go uncounted.
    return undefined;
  }
}

interface TelemetryEvent {
  name: string;
  session_id?: string;
  props?: Record<string, unknown>;
}

function send(event: TelemetryEvent): void {
  if (!enabled) return;

  const body = JSON.stringify({ ...event, session_id: event.session_id ?? sessionId() });
  const url = `${ENDPOINT}/v1/ingest/events`;

  // sendBeacon survives the page being closed, which fetch does not. It cannot
  // set headers, so the API key rides in the query string — it is a public,
  // events-only key that is already visible in this bundle.
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'text/plain' });
    if (navigator.sendBeacon(`${url}?k=${encodeURIComponent(API_KEY)}`, blob)) return;
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
    body,
    keepalive: true,
  }).catch(() => {
    // Telemetry must never surface an error to a visitor.
  });
}

/** Record a page view. Called on initial load and on every route change. */
export function trackPageView(path: string): void {
  send({
    name: 'pageview',
    props: {
      path,
      referrer: document.referrer || '',
      title: document.title,
    },
  });
}

/** Record any custom event, e.g. a contact-form submission. */
export function trackEvent(name: string, props: Record<string, unknown> = {}): void {
  send({ name, props });
}
