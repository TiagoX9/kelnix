/**
 * Kelnix telemetry — standalone browser tracker.
 *
 * For any Kelnix web property that is not this repo (Cladget web, Revvify,
 * Docubooks). Drop the file in and add one script tag:
 *
 *   <script src="/kelnix-telemetry.js"
 *           data-endpoint="https://telemetry.kelnix.org"
 *           data-key="klx_..."
 *           defer></script>
 *
 * Cookieless: it writes nothing that survives the tab closing, and the visitor
 * id is derived server-side from a daily-rotating hash. Nothing here needs to
 * sit behind a consent banner.
 *
 * Single-page apps: history.pushState and popstate are both hooked, so route
 * changes are counted without any framework integration.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var endpoint = (script.getAttribute('data-endpoint') || '').replace(/\/$/, '');
  var key = script.getAttribute('data-key') || '';
  if (!endpoint || !key) return;

  var SESSION_KEY = 'kelnix_telemetry_session';

  function sessionId() {
    try {
      var id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = (Math.random().toString(36) + Date.now().toString(36)).slice(2, 18);
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return undefined;
    }
  }

  function send(name, props) {
    var body = JSON.stringify({ name: name, session_id: sessionId(), props: props || {} });
    var url = endpoint + '/v1/ingest/events';

    // sendBeacon survives page unload; fetch does not. It cannot set headers,
    // so the key rides in the query string — it is a public, events-only key
    // and is already readable in this file.
    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'text/plain' });
      if (navigator.sendBeacon(url + '?k=' + encodeURIComponent(key), blob)) return;
    }

    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': key },
        body: body,
        keepalive: true,
      })['catch'](function () {});
    } catch (e) {
      /* telemetry must never surface an error to a visitor */
    }
  }

  var lastPath = null;

  function pageview() {
    var path = location.pathname + location.search;
    // pushState fires for in-page state changes too; only count real moves.
    if (path === lastPath) return;
    lastPath = path;
    send('pageview', {
      path: path,
      referrer: document.referrer || '',
      title: document.title,
    });
  }

  var pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(this, arguments);
    pageview();
  };

  var replaceState = history.replaceState;
  history.replaceState = function () {
    replaceState.apply(this, arguments);
    pageview();
  };

  window.addEventListener('popstate', pageview);

  window.addEventListener('error', function (event) {
    send('error', {
      message: String(event.message || 'unknown').slice(0, 500),
      path: location.pathname,
    });
  });

  // Public handle for custom events: kelnixTelemetry('signup_clicked', {...})
  window.kelnixTelemetry = send;

  pageview();
})();
