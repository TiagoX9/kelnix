import styles from './NibsPrivacy.module.css';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';

function NibsPrivacy() {
  return (
    <>
      <CustomCursor />
      <PixelGrid />
      <div className={styles.container}>
        <div className={styles.header}>
          <img 
            src="/logos/nibs_logo.png" 
            alt="Nibs Logo" 
            className={styles.logo}
          />
          <img 
            src="/logos/nibs.png" 
            alt="Nibs Bird" 
            className={styles.bird}
          />
        </div>
        
        <div className={styles.content}>
        <h1>Privacy Policy for Nibs</h1>
        <p className={styles.updated}>Last updated: February 17, 2026</p>
        
        <p>
          Nibs is a simple casual mobile game developed by Kelnix Solutions and Software.
        </p>
        <p>
          We are committed to protecting your privacy. This Privacy Policy explains how information is handled 
          when you use the Nibs mobile app ("the App").
        </p>
        
        <h2>Information We Collect</h2>
        <p>
          The App itself does not directly collect or store personal information. However, the App uses Google 
          AdMob to display advertisements. AdMob automatically collects and processes the following types of 
          data to serve ads, measure ad performance, personalize advertisements (where permitted), and help 
          prevent fraud:
        </p>
        <ul>
          <li>Device and other identifiers (such as Android Advertising ID, App Set ID)</li>
          <li>App interactions and usage information</li>
          <li>Approximate location derived from IP address</li>
          <li>Diagnostic and performance data</li>
        </ul>
        <p>
          This data is collected and handled by Google in accordance with the Google Privacy Policy. We do not 
          receive, access, or store any of this data ourselves.
        </p>
        <p>
          The game is otherwise fully offline. We do not collect names, email addresses, phone numbers, precise 
          location, contacts, photos, or any other personal or sensitive information.
        </p>
        
        <h2>Social Sharing Feature</h2>
        <p>
          The App includes an optional feature that lets you share your game results (such as your score or a 
          screenshot) using your device's standard sharing tools (for example to WhatsApp, Facebook, Twitter/X, 
          Instagram, etc.).
        </p>
        <ul>
          <li>We do not collect, view, store, or receive the content you share or any details about who you share it with.</li>
          <li>Sharing is controlled entirely by you and handled by your device and the apps you choose.</li>
        </ul>
        
        <h2>Third-Party Services</h2>
        <p>
          <strong>Google AdMob:</strong> Used only for displaying advertisements.<br />
          For more information see: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a>
        </p>
        <p>
          No other third-party services, SDKs, or analytics tools are used in the App.
        </p>
        
        <h2>Children's Privacy</h2>
        <p>
          Nibs is not directed to children under the age of 13 and we do not knowingly collect personal information 
          from children. Advertisements displayed via AdMob follow Google's content policies.
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
        
        <p className={styles.thanks}>Thank you for playing Nibs!</p>
        </div>
      </div>
    </>
  );
}

export default NibsPrivacy;
