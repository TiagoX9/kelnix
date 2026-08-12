// The shared event vocabulary.
//
// Apps may send ANY event name — nothing is rejected for being unknown, and
// unknown events are still stored, still queryable and still visible in the
// event explorer. What this list buys is the pre-built dashboard: send these
// names and the traffic, users, revenue and error tiles populate themselves
// with no dashboard work at all.
//
// Adding a new app therefore means emitting these names. Adding a new *metric*
// is the only thing that touches this file.

export const EVENT = {
  /**
   * A page or screen was viewed.
   * props: { path, referrer?, title?, visit_type?: 'new' | 'returning' }
   *
   * `visit_type` is classified on the client — the browser knows whether it has
   * been here before and sends only the label. No stable identifier is ever
   * transmitted or stored, so the server still cannot follow anyone across
   * days. It is absent unless the visitor accepted analytics storage.
   */
  PAGEVIEW: 'pageview',
  /** A visitor session began. Emitted once per session by the browser SDK. */
  SESSION_START: 'session_start',

  /** A new account was created. props: { plan? } */
  USER_REGISTERED: 'user_registered',
  /** An existing user signed in. Drives DAU/MAU via user_ref. */
  USER_LOGIN: 'user_login',
  /** An account was deleted or deactivated. */
  USER_DELETED: 'user_deleted',

  /** A paid subscription began. props: { plan, mrr_cents } */
  SUBSCRIPTION_STARTED: 'subscription_started',
  /** A paid subscription ended. props: { plan, mrr_cents } */
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  /**
   * Current total MRR for the app. props: { mrr_cents }
   *
   * MRR is a level, not a flow, so it cannot be derived by summing starts minus
   * cancellations once raw events start expiring. Apps report the real figure
   * on a schedule (a daily cron, or after each Stripe webhook) and the rollup
   * keeps the last value seen each day.
   */
  MRR_SNAPSHOT: 'mrr_snapshot',
  /** Money actually arrived. props: { amount_cents, currency } */
  PAYMENT_SUCCEEDED: 'payment_succeeded',
  /** A charge failed. props: { amount_cents, currency, reason? } */
  PAYMENT_FAILED: 'payment_failed',

  /** An unhandled error. props: { message, stack?, route? } */
  ERROR: 'error',
} as const;

export type EventName = (typeof EVENT)[keyof typeof EVENT];

/**
 * Metric keys written into metrics_daily. These are what the dashboard charts
 * and what survives raw-event retention, so the names are a stable contract.
 */
export const METRIC = {
  PAGEVIEWS: 'pageviews',
  VISITORS: 'visitors',
  /**
   * Visitors whose browser had not seen the site before, and those whose had.
   *
   * These two do NOT sum to `visitors`: they only count visitors who accepted
   * analytics storage, because classifying a return requires remembering
   * something on the device. Treat them as a sample, not a split.
   */
  VISITORS_NEW: 'visitors_new',
  VISITORS_RETURNING: 'visitors_returning',
  SESSIONS: 'sessions',
  REGISTRATIONS: 'registrations',
  ACTIVE_USERS: 'active_users',
  SUBS_STARTED: 'subs_started',
  SUBS_CANCELLED: 'subs_cancelled',
  MRR_CENTS: 'mrr_cents',
  REVENUE_CENTS: 'revenue_cents',
  ERRORS: 'errors',
} as const;

export type MetricName = (typeof METRIC)[keyof typeof METRIC];
