import { useState, type FormEvent } from 'react';
import { api, ApiError } from './api';
import { STATUS } from './palette';
import styles from './Admin.module.css';

interface Props {
  email: string;
  onClose: () => void;
}

const MIN_LENGTH = 12;

export default function ChangePassword({ email, onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    // Checked here as well as on the server, purely so the user finds out
    // before a round trip. The API enforces the real rule.
    if (next.length < MIN_LENGTH) {
      setError(`New password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      setError('The two new passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await api.changePassword(current, next);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Current password is incorrect.'
          : 'Could not change the password.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className={styles.card}>
        <p className={styles.chartTitle}>Password changed</p>
        <p className={styles.note} style={{ color: STATUS.good }}>
          ● Done. Every other session was signed out — changing a password after a
          suspected leak is the whole point, so this one is not optional.
        </p>
        <button type="button" className={styles.primaryButton} onClick={onClose}>
          Back to dashboard
        </button>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <p className={styles.chartTitle}>Change password</p>
      <p className={styles.note}>
        Signed in as <strong>{email}</strong>. There is no mail sender on this server, so
        there is no reset link — if you lose this password, recovery is the
        <code> create-admin </code> script over SSH. Changing it signs out every other
        session.
      </p>

      <form onSubmit={submit} className={styles.passwordForm}>
        <label className={styles.field}>
          <span>Current password</span>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className={styles.field}>
          <span>New password (min {MIN_LENGTH} characters)</span>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.filterRow}>
          <button type="submit" className={styles.primaryButton} disabled={busy}>
            {busy ? 'Changing…' : 'Change password'}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
