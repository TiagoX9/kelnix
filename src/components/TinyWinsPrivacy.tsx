import styles from './NibsPrivacy.module.css';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';

function TinyWinsPrivacy() {
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
        <h1>Privacy Policy for Tiny Wins</h1>
        <p className={styles.updated}>Last updated: March 16, 2026</p>

        <p>
          Tiny Wins is a habit tracking mobile app developed by Kelnix Solutions and Software.
        </p>
        <p>
          We are committed to protecting your privacy. This Privacy Policy explains how information is collected,
          used, and handled when you use the Tiny Wins mobile app ("the App").
        </p>

        <h2>Information We Collect</h2>
        <p>
          To provide the core habit tracking functionality, the App collects and stores the following information:
        </p>
        <ul>
          <li>Email address and display name (used for account creation and login)</li>
          <li>Habit data you create (habit names, check-ins, streaks, and completion history)</li>
          <li>Device identifiers for authentication and session management</li>
        </ul>
        <p>
          This data is stored securely on our servers and is associated with your account. You can delete
          your account and all associated data at any time from the Profile screen in the App.
        </p>

        <h2>Google Sign-In</h2>
        <p>
          The App offers Google Sign-In as a login option. When you sign in with Google, we receive your
          name and email address from Google. We do not receive or store your Google password. Google Sign-In
          is governed by <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.
        </p>

        <h2>AI-Powered Insights</h2>
        <p>
          The App uses artificial intelligence to generate personalized habit insights based on your check-in
          patterns. Your habit data may be processed by third-party AI services to generate these insights.
          No personally identifiable information (such as your name or email) is sent to AI providers — only
          anonymized habit completion data.
        </p>

        <h2>Advertising</h2>
        <p>
          The App uses Google AdMob and mediation partners (Meta Audience Network, Unity Ads, AppLovin) to
          display advertisements to free users. These services automatically collect and process the following
          types of data to serve ads, measure ad performance, and personalize advertisements (where permitted):
        </p>
        <ul>
          <li>Device and other identifiers (such as Android Advertising ID, IDFA)</li>
          <li>App interactions and usage information</li>
          <li>Approximate location derived from IP address</li>
          <li>Diagnostic and performance data</li>
        </ul>
        <p>
          This data is collected and handled by Google and its mediation partners in accordance with their
          respective privacy policies. Premium subscribers do not see advertisements and this data is not
          collected for them.
        </p>

        <h2>In-App Purchases</h2>
        <p>
          The App offers an optional premium subscription processed through the Apple App Store or Google Play
          Store. Payment information is handled entirely by Apple or Google — we do not collect, store, or have
          access to your payment details. Subscription status is managed through RevenueCat, which receives
          only an anonymous user identifier and subscription status.
        </p>

        <h2>Data Storage and Security</h2>
        <p>
          Your habit data is stored on secure servers and transmitted using HTTPS encryption. The App also
          stores data locally on your device for offline access. Local data is cleared when you log out.
        </p>

        <h2>Data Export and Deletion</h2>
        <p>
          You can export all your habit data as a CSV file from the Profile screen. You can also delete your
          account at any time, which permanently removes all your data from our servers. All user data is
          automatically and permanently deleted within 90 days of a deletion request.
        </p>
        <p>
          For detailed instructions on how to delete your account, visit our{' '}
          <a href="/tinywins/delete-account">Account Deletion page</a>.
        </p>

        <h2>Third-Party Services</h2>
        <p>
          <strong>Google AdMob:</strong> Used for displaying advertisements to free users.<br />
          See: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>
        </p>
        <p>
          <strong>RevenueCat:</strong> Used for managing in-app subscriptions.<br />
          See: <a href="https://www.revenuecat.com/privacy" target="_blank" rel="noopener noreferrer">RevenueCat Privacy Policy</a>
        </p>
        <p>
          <strong>Meta Audience Network, Unity Ads, AppLovin:</strong> Used as ad mediation partners.<br />
          Each operates under their own privacy policies.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          Tiny Wins is not directed to children under the age of 13 and we do not knowingly collect personal
          information from children. If you believe a child has provided us with personal information, please
          contact us so we can delete it.
        </p>

        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Any changes will be posted on this page with
          an updated "Last updated" date.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at:
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

export default TinyWinsPrivacy;
