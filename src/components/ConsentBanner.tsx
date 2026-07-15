import { useEffect, useState } from 'react';
import {
  getStoredConsent,
  setStoredConsent,
  updateConsent,
  type ConsentChoice,
} from '../lib/analytics';
import styles from './ConsentBanner.module.css';

/**
 * Minimal EU cookie consent banner. Consent Mode v2 defaults to "denied"
 * (index.html); this banner is the only thing that can grant it. The choice is
 * persisted in localStorage and re-applied on return visits.
 */
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      // Re-apply the prior choice so gtag reflects it on return visits.
      updateConsent(stored);
    } else {
      setVisible(true);
    }
  }, []);

  const choose = (choice: ConsentChoice) => {
    setStoredConsent(choice);
    updateConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <p className={styles.text}>
        We use cookies for Google Analytics to understand how the site is used.
        You can accept or reject analytics cookies.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.reject}
          onClick={() => choose('denied')}
        >
          Reject
        </button>
        <button
          type="button"
          className={styles.accept}
          onClick={() => choose('granted')}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
