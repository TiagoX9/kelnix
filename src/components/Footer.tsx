import { motion } from 'framer-motion';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.left}>
          <span className={`pixel-font ${styles.logo}`}>KELNIX</span>
          <p className={styles.tagline}>Software for Humans & Agents</p>
        </div>
        <div className={styles.links}>
          <a href="/products">Products</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#contact">Hire Us</a>
        </div>
        <div className={styles.right}>
          <p className={styles.copy}>
            &copy; {new Date().getFullYear()} Kelnix. All rights reserved.
          </p>
        </div>
      </div>
      <motion.div
        className={styles.pixelLine}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </footer>
  );
}
