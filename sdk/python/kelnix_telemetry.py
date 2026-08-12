"""Kelnix telemetry — Python client.

Copy this file into any Python Kelnix app (DataMind, Receipt MCP). Standard
library only, no dependencies.

    from kelnix_telemetry import telemetry

    telemetry.track("user_registered", user_ref=user.id, props={"plan": plan})
    telemetry.log("error", "OCR failed", {"doc_id": doc.id})

Design rules, in priority order:
  1. Never raise into the host application. Telemetry failing must never be the
     reason a request 500s.
  2. Never block the caller. A background thread does all the network I/O.
  3. Never send personal data. `user_ref` is your internal id, not an email.
"""

from __future__ import annotations

import atexit
import json
import os
import queue
import threading
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any, Literal

LogLevel = Literal["debug", "info", "warn", "error", "fatal"]

_FLUSH_INTERVAL_S = 5.0
_BATCH_SIZE = 20
_TIMEOUT_S = 5.0
# Bounded so a telemetry outage costs a fixed amount of memory rather than
# growing until the process is killed. Overflow drops the newest item.
_MAX_QUEUE = 10_000


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class KelnixTelemetry:
    def __init__(
        self,
        endpoint: str,
        api_key: str,
        *,
        debug: bool = False,
    ) -> None:
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key
        self.debug = debug
        # No key configured means telemetry is simply off, so local development
        # and CI need no special casing.
        self.enabled = bool(endpoint and api_key)

        self._queue: queue.Queue[tuple[str, dict[str, Any]]] = queue.Queue(maxsize=_MAX_QUEUE)
        self._stop = threading.Event()

        if self.enabled:
            self._worker = threading.Thread(
                target=self._run, name="kelnix-telemetry", daemon=True
            )
            self._worker.start()
            atexit.register(self.flush)

    # ── Public API ────────────────────────────────────────────────────────────

    def track(
        self,
        name: str,
        *,
        user_ref: str | None = None,
        anon_id: str | None = None,
        session_id: str | None = None,
        props: dict[str, Any] | None = None,
    ) -> None:
        event: dict[str, Any] = {"name": name, "ts": _now(), "props": props or {}}
        if user_ref:
            event["user_ref"] = user_ref
        if anon_id:
            event["anon_id"] = anon_id
        if session_id:
            event["session_id"] = session_id
        self._enqueue("event", event)

    def log(
        self, level: LogLevel, message: str, context: dict[str, Any] | None = None
    ) -> None:
        self._enqueue(
            "log",
            {
                "level": level,
                "message": message[:4000],
                "ts": _now(),
                "context": context or {},
            },
        )

    def report_mrr(self, mrr_cents: int) -> None:
        """Report current MRR. Call from a daily cron or a Stripe webhook."""
        self.track("mrr_snapshot", props={"mrr_cents": int(mrr_cents)})

    def flush(self) -> None:
        """Drain the queue now. Safe to call at any time; never raises."""
        if not self.enabled:
            return
        events, logs = self._drain()
        self._send(events, logs)

    def close(self) -> None:
        self._stop.set()
        self.flush()

    # ── Internals ─────────────────────────────────────────────────────────────

    def _enqueue(self, kind: str, payload: dict[str, Any]) -> None:
        if not self.enabled:
            return
        try:
            self._queue.put_nowait((kind, payload))
        except queue.Full:
            # Dropping is the correct failure mode: blocking the caller to make
            # room for an analytics event would be strictly worse.
            if self.debug:
                print("[telemetry] queue full, dropping")

    def _drain(self) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        events: list[dict[str, Any]] = []
        logs: list[dict[str, Any]] = []
        while True:
            try:
                kind, payload = self._queue.get_nowait()
            except queue.Empty:
                break
            (events if kind == "event" else logs).append(payload)
        return events, logs

    def _run(self) -> None:
        while not self._stop.wait(_FLUSH_INTERVAL_S):
            try:
                events, logs = self._drain()
                if events or logs:
                    self._send(events, logs)
            except Exception as err:  # noqa: BLE001 — the worker must never die
                if self.debug:
                    print(f"[telemetry] worker error: {err}")

    def _send(self, events: list[dict[str, Any]], logs: list[dict[str, Any]]) -> None:
        for path, key, items in (
            ("/v1/ingest/events", "events", events),
            ("/v1/ingest/logs", "logs", logs),
        ):
            for i in range(0, len(items), _BATCH_SIZE * 5):
                chunk = items[i : i + _BATCH_SIZE * 5]
                if chunk:
                    self._post(path, {key: chunk})

    def _post(self, path: str, body: dict[str, Any]) -> None:
        request = urllib.request.Request(
            f"{self.endpoint}{path}",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json", "X-Api-Key": self.api_key},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=_TIMEOUT_S) as response:
                if response.status >= 300 and self.debug:
                    print(f"[telemetry] {path} -> {response.status}")
        except (urllib.error.URLError, OSError) as err:
            # Dropped on the floor by design — see rule 1 in the module docstring.
            if self.debug:
                print(f"[telemetry] transport failed: {err}")


telemetry = KelnixTelemetry(
    endpoint=os.environ.get("KELNIX_TELEMETRY_URL", ""),
    api_key=os.environ.get("KELNIX_TELEMETRY_KEY", ""),
    debug=os.environ.get("KELNIX_TELEMETRY_DEBUG") == "true",
)
