"""Example: the endpoint Kelnix telemetry polls for an app's current levels.

Copy into any Python app, adapt the queries, register the route. This is the
whole integration for pull — no client library, no background thread, and it
cannot break a request path because nothing else calls it.

Pair with kelnix_telemetry.py when you also want *events* (errors, usage).
Push for flows, pull for levels.
"""

import os
import secrets
import sqlite3

from fastapi import APIRouter, Header, HTTPException

router = APIRouter()

# Generate with: openssl rand -base64 32
TELEMETRY_TOKEN = os.environ.get("TELEMETRY_TOKEN", "")


@router.get("/internal/telemetry")
def telemetry(authorization: str | None = Header(default=None)) -> dict[str, int]:
    expected = f"Bearer {TELEMETRY_TOKEN}"
    # compare_digest, not ==, so the check does not leak the token byte by byte
    # through response timing.
    if not TELEMETRY_TOKEN or not authorization or not secrets.compare_digest(
        authorization, expected
    ):
        raise HTTPException(status_code=401, detail="unauthorized")

    # RULE: aggregate numbers only. Never a record, never an email, never a
    # list. Kelnix holds a read credential to this app; the point is that a
    # Kelnix compromise leaks counts and nothing else.
    with sqlite3.connect(os.environ["DATABASE_PATH"]) as conn:
        documents = conn.execute("SELECT count(*) FROM documents").fetchone()[0]
        collections = conn.execute("SELECT count(*) FROM collections").fetchone()[0]
        failed = conn.execute(
            "SELECT count(*) FROM jobs WHERE state = 'failed'"
        ).fetchone()[0]

    # Flat object, integer values. Money in cents, never floats — the column on
    # the other side is a BIGINT and fractions are silently rounded.
    #
    # Any key you invent is accepted, stored and charted automatically; nothing
    # needs adding on the Kelnix side.
    return {
        "documents_total": documents,
        "collections_total": collections,
        "failed_jobs": failed,
    }
