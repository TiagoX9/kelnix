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
          Nibs is a simple casual mobile game developed by [Your Name or Your Company Name].
        </p>
        <p>
          We are committed to protecting your privacy. This Privacy Policy explains how we handle 
          information when you use the Nibs mobile app ("the App").
        </p>
        
        <h2>Information We Collect</h2>
        <p>
          The App does not collect, store, or transmit any personal information from you. This includes:
        </p>
        <ul>
          <li>No names, email addresses, phone numbers, or other identifying details</li>
          <li>No device identifiers, IP addresses, or location data</li>
          <li>No usage analytics, crash reports, or performance data</li>
          <li>No cookies, tracking pixels, or similar technologies</li>
        </ul>
        <p>
          The game runs entirely offline on your device. No data leaves your device to us or any third parties.
        </p>
        
        <h2>Social Sharing Feature</h2>
        <p>
          Nibs includes an optional feature that allows you to share your game results (such as your score 
          or a screenshot) on social media or with friends. This sharing is performed directly by your device 
          using standard Android sharing tools (e.g., to apps like WhatsApp, Facebook, Twitter/X, Instagram, etc.).
        </p>
        <ul>
          <li>We do not collect, view, store, or receive any shared content.</li>
          <li>We do not receive any information about what you share, with whom, or when.</li>
          <li>The content you share is created and sent entirely by you — we have no control over it once you choose to share.</li>
        </ul>
        
        <h2>Third-Party Services</h2>
        <p>
          The App does not integrate with any third-party services, SDKs, advertising networks, or analytics 
          tools that collect or process data.
        </p>
        
        <h2>Children's Privacy</h2>
        <p>
          Nibs is not directed to children under the age of 13, and we do not knowingly collect personal 
          information from children. The social sharing feature is optional and uses only your device's 
          standard sharing capabilities. If you believe we have collected information from a child under 13, 
          please contact us immediately.
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
