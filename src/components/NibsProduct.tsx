import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';
import styles from './ProductDetail.module.css';

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function NibsProduct() {
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
            <img src="/logos/nibs.png" alt="Nibs" className={styles.heroLogo} />
            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>Nibs</h1>
              <span className={`pixel-font ${styles.heroType}`}>MOBILE GAME</span>
            </div>
          </motion.div>

          <motion.p className={styles.heroDesc} {...fade} transition={{ duration: 0.5, delay: 0.1 }}>
            A fun, casual mobile game where you guide Nibs the bird through challenges.
            Simple to pick up, hard to put down. Share your scores with friends and compete
            for the top spot.
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
              <a href="https://play.google.com/store/apps/details?id=com.kelnix.nibs" className={styles.storeButton} target="_blank" rel="noopener noreferrer">
                <div>
                  <span className={`pixel-font ${styles.storeLabel}`}>GET IT ON</span>
                  <div className={styles.storeName}>Google Play</div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.3 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}FEATURES</span>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Simple controls</span> — tap to play, easy for anyone to pick up.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Share your scores</span> — challenge friends via WhatsApp, Instagram, and more.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Offline play</span> — no internet required, play anywhere.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Free to play</span> — supported by non-intrusive ads.
            </p>
          </motion.div>

          {/* Links */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.35 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}LINKS</span>
            <div className={styles.registryGrid}>
              <Link to="/nibs" className={styles.registryLink}>
                <span className={`pixel-font ${styles.registryIcon}`}>01</span>
                Privacy Policy
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
