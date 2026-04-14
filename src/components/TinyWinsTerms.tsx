import styles from './NibsPrivacy.module.css';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';

function TinyWinsTerms() {
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
        <h1>Terms of Service</h1>
        <p className={styles.updated}>Last updated: April 14, 2026</p>

        <h2>Acceptance of Terms</h2>
        <p>
          By using TinyWins, you agree to these terms. If you do not agree, please do not use the app.
        </p>

        <h2>Description of Service</h2>
        <p>
          TinyWins is a habit tracking app with optional premium features. The service allows you to
          create habits, track daily check-ins, earn badges, and receive AI-powered insights.
        </p>

        <h2>User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials. You agree
          to notify us immediately of any unauthorized use of your account.
        </p>

        <h2>Premium Subscription</h2>
        <p>
          TinyWins Premium is available as an auto-renewable subscription:
        </p>
        <ul>
          <li><strong>Price:</strong> $3.00 per month</li>
          <li><strong>Free trial:</strong> 7-day free trial for new subscribers</li>
          <li><strong>Billing:</strong> Payment is charged to your Apple ID or Google Play account at confirmation of purchase</li>
          <li><strong>Renewal:</strong> Subscription automatically renews unless canceled at least 24 hours before the end of the current period</li>
          <li><strong>Cancellation:</strong> You can cancel at any time through your device's subscription settings (Settings → Apple ID → Subscriptions on iOS, or Google Play Store → Subscriptions on Android)</li>
          <li><strong>Trial:</strong> Any unused portion of the free trial period is forfeited when you purchase a subscription</li>
        </ul>

        <h2>AI Features</h2>
        <p>
          AI insights are generated using Claude by Anthropic. Your habit data is processed securely to
          generate personalized insights. No data is shared with third parties for advertising purposes.
        </p>

        <h2>Data & Privacy</h2>
        <p>
          We collect habit data to provide the service. We do not sell your data. Your information is
          stored securely and used only to deliver and improve the TinyWins experience. For full details,
          see our <a href="/tinywins">Privacy Policy</a>.
        </p>

        <h2>Termination</h2>
        <p>
          You can delete your account at any time from the Profile page. Upon deletion, all your data
          will be permanently removed from our servers.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about these terms, please reach out to us at:
        </p>
        <p>
          Email: <a href="mailto:info@kelnix.org">info@kelnix.org</a>
        </p>

        <p className={styles.thanks}>Thank you for using Tiny Wins!</p>
        </div>
      </div>
    </>
  );
}

export default TinyWinsTerms;
