import styles from './NibsPrivacy.module.css';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';

function TinyWinsDeleteAccount() {
  return (
    <>
      <CustomCursor />
      <PixelGrid />
      <div className={styles.container}>
        <div className={styles.header}>
          <img
            src="/logos/tinywins.png"
            alt="Tiny Wins Logo"
            className={styles.bird}
          />
        </div>

        <div className={styles.content}>
          <h1>Delete Your Account</h1>
          <p className={styles.updated}>Tiny Wins by Kelnix</p>

          <h2>How to Delete Your Account in the App</h2>
          <p>
            You can delete your account directly from the Tiny Wins app by following these steps:
          </p>
          <ul>
            <li>Open the Tiny Wins app on your device.</li>
            <li>Go to the <strong>Profile</strong> tab (bottom navigation).</li>
            <li>Scroll down and tap <strong>"Delete Account"</strong>.</li>
            <li>Confirm by tapping <strong>"Delete"</strong> in the confirmation dialog.</li>
          </ul>

          <h2>What Data Is Deleted</h2>
          <p>
            When you delete your account, the following data will be permanently removed from our servers:
          </p>
          <ul>
            <li>Your account information (email, name)</li>
            <li>All habits you created</li>
            <li>All check-in history</li>
            <li>AI-generated insights and weekly summaries</li>
            <li>Badges and achievements</li>
            <li>Subscription and payment records</li>
          </ul>

          <h2>Data Retention</h2>
          <p>
            All user data is automatically and permanently deleted within <strong>90 days</strong> of
            your deletion request. Most data is removed immediately upon request.
          </p>

          <h2>Active Subscriptions</h2>
          <p>
            Deleting your Tiny Wins account does not automatically cancel your subscription. To avoid
            future charges, please cancel your subscription through the Google Play Store or Apple App
            Store before deleting your account.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you need help deleting your account or have any questions, please contact us at:
          </p>
          <p>
            Email: <a href="mailto:info@kelnix.org">info@kelnix.org</a>
          </p>

          <p>
            <a href="/tinywins">&larr; Back to Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default TinyWinsDeleteAccount;
