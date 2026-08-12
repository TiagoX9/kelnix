import { useCallback, useEffect, useState } from 'react';
import { api, type AppRow, type KeyRow } from './api';
import { colorForIndex } from './palette';
import { formatTime } from './format';
import styles from './Admin.module.css';

/**
 * Onboarding a new Kelnix app happens entirely here: create it, mint a key,
 * paste the key into that app's environment. Nothing is deployed, no migration
 * runs, and the dashboard picks it up on the next rollup.
 */
export default function AppsPanel() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({ slug: '', name: '', kind: 'app', url: '' });

  const load = useCallback(() => {
    void api.apps().then((res) => setApps(res.apps));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    if (!selected) return;
    void api.keys(selected).then((res) => setKeys(res.keys));
  }, [selected]);

  // Clearing the revealed secret belongs to the act of switching apps, not to
  // an effect — a freshly minted key must not vanish on the render that shows it.
  function selectApp(slug: string) {
    setNewSecret(null);
    setSelected(selected === slug ? null : slug);
  }

  async function createApp() {
    setError(null);
    try {
      await api.createApp({
        slug: form.slug,
        name: form.name,
        kind: form.kind,
        ...(form.url ? { url: form.url } : {}),
      });
      setForm({ slug: '', name: '', kind: 'app', url: '' });
      load();
    } catch {
      setError('Could not create. Slug must be lowercase letters, numbers and dashes, and unique.');
    }
  }

  async function mintKey(isPublic: boolean) {
    if (!selected) return;
    const res = await api.createKey(selected, isPublic ? 'browser' : 'server', isPublic);
    setNewSecret(res.secret);
    void api.keys(selected).then((r) => setKeys(r.keys));
    load();
  }

  async function revoke(id: number) {
    await api.revokeKey(id);
    if (selected) void api.keys(selected).then((r) => setKeys(r.keys));
  }

  return (
    <>
      <section className={styles.card}>
        <p className={styles.chartTitle}>Applications</p>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>App</th>
                <th>Slug</th>
                <th>Kind</th>
                <th>Active keys</th>
                <th>Last data received</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {apps.map((app, index) => (
                <tr key={app.slug}>
                  <td>
                    <span
                      className={styles.swatch}
                      style={{ background: colorForIndex(index, app.slug) }}
                      aria-hidden="true"
                    />
                    {app.name}
                    {app.archived_at && <span className={styles.kindTag}>archived</span>}
                  </td>
                  <td>
                    <code>{app.slug}</code>
                  </td>
                  <td>{app.kind}</td>
                  <td>{app.active_keys}</td>
                  <td>
                    {/* The single most useful column: an app that stopped
                        reporting looks identical to an app with no traffic
                        unless you can see when it last checked in. */}
                    {formatTime(app.last_ingest_at)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => selectApp(app.slug)}
                    >
                      {selected === app.slug ? 'Hide keys' : 'Keys'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className={styles.card}>
          <p className={styles.chartTitle}>Keys — {selected}</p>

          {newSecret && (
            <div className={styles.secretBox}>
              <p>Copy this now — it is never shown again, only its hash is stored.</p>
              <code>{newSecret}</code>
            </div>
          )}

          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>Scope</th>
                  <th>Last used</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td>{key.name}</td>
                    <td>
                      <code>{key.key_prefix}…</code>
                    </td>
                    <td>{key.is_public ? 'public (events only)' : 'server (events + logs)'}</td>
                    <td>{formatTime(key.last_used_at)}</td>
                    <td>{key.revoked_at ? 'revoked' : 'active'}</td>
                    <td>
                      {!key.revoked_at && (
                        <button
                          type="button"
                          className={styles.linkButton}
                          onClick={() => revoke(key.id)}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.filterRow}>
            <button type="button" className={styles.primaryButton} onClick={() => mintKey(false)}>
              New server key
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => mintKey(true)}>
              New public (browser) key
            </button>
          </div>
        </section>
      )}

      <section className={styles.card}>
        <p className={styles.chartTitle}>Add an application</p>
        <div className={styles.filterRow}>
          <input
            className={styles.input}
            placeholder="slug (e.g. revvify)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <input
            className={styles.input}
            placeholder="Display name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={styles.input}
            placeholder="kind (web, api, mobile…)"
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
          />
          <input
            className={styles.input}
            placeholder="https://… (optional)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!form.slug || !form.name}
            onClick={createApp}
          >
            Create
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </section>
    </>
  );
}
