import { useState, type FormEvent } from 'react';
import { api, ApiError } from './api';
import styles from './Admin.module.css';

interface Props {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.login(email, password);
      onSuccess();
    } catch (err) {
      // Never distinguish "no such user" from "wrong password" in the UI —
      // the API already refuses to, and echoing a difference here would undo it.
      setError(
        err instanceof ApiError && err.status === 429
          ? 'Too many attempts. Wait a few minutes.'
          : 'Incorrect email or password.',
      );
      setBusy(false);
    }
  }

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginCard} onSubmit={submit}>
        <h1 className={styles.loginTitle}>KELNIX</h1>
        <p className={styles.loginSub}>Operations dashboard</p>

        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.primaryButton} disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
