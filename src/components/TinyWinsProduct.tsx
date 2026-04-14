import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';
import styles from './ProductDetail.module.css';

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function TinyWinsProduct() {
  return (
    <>
      <CustomCursor />
      <PixelGrid />
      <div className={styles.container}>
        <Link to="/products" className={`pixel-font ${styles.backLink}`}>
          &larr; ALL PRODUCTS
        </Link>

        <div className={styles.content}>
          {/* Hero */}
          <motion.div className={styles.hero} {...fade} transition={{ duration: 0.5 }}>
            <img src="/logos/tinywins.png" alt="Tiny Wins" className={styles.heroLogo} />
            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>Tiny Wins</h1>
              <span className={`pixel-font ${styles.heroType}`}>HABIT TRACKER</span>
            </div>
          </motion.div>

          <motion.p className={styles.heroDesc} {...fade} transition={{ duration: 0.5, delay: 0.1 }}>
            Build better habits, one tiny win at a time. Track your daily habits, visualize your
            progress with beautiful charts, and get AI-powered insights to stay on track. Celebrate
            streaks and earn badges as you build consistency.
          </motion.p>

          {/* CTAs / Store buttons */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.2 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}DOWNLOAD</span>
            <div className={styles.storeButtons}>
              <a href="#" className={styles.storeButton}>
                <div>
                  <span className={`pixel-font ${styles.storeLabel}`}>COMING SOON</span>
                  <div className={styles.storeName}>App Store</div>
                </div>
              </a>
              <a href="#" className={styles.storeButton}>
                <div>
                  <span className={`pixel-font ${styles.storeLabel}`}>COMING SOON</span>
                  <div className={styles.storeName}>Google Play</div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.3 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}FEATURES</span>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Daily habit tracking</span> — check in with one tap, build streaks, and see your progress.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>AI-powered insights</span> — get personalized tips based on your habit patterns.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Beautiful charts</span> — visualize weekly and monthly completion rates at a glance.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Badges & streaks</span> — earn rewards as you build consistency and hit milestones.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Cross-platform sync</span> — your habits sync across iOS and Android seamlessly.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Free to use</span> — core features are free, with optional premium for AI insights.
            </p>
          </motion.div>

          {/* Links */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.35 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}LINKS</span>
            <div className={styles.registryGrid}>
              <Link to="/tinywins" className={styles.registryLink}>
                <span className={`pixel-font ${styles.registryIcon}`}>01</span>
                Privacy Policy
              </Link>
              <Link to="/tinywins/terms" className={styles.registryLink}>
                <span className={`pixel-font ${styles.registryIcon}`}>02</span>
                Terms of Service
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
