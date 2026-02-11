import { motion } from 'framer-motion';
import RobotMascot from './RobotMascot';
import styles from './Hero.module.css';

export default function Hero() {
  const letterVariants = {
    hidden: { y: 80, opacity: 0, rotateX: -90 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        delay: i * 0.08 + 0.8,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
      },
    }),
  };

  const title = 'KELNIX';

  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <div className={styles.left}>
          <motion.div
            className={styles.tagline}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <span className={`pixel-font ${styles.tag}`}>{'> '}SOLUTIONS & SOFTWARE</span>
          </motion.div>

          <h1 className={styles.title}>
            {title.split('').map((char, i) => (
              <motion.span
                key={i}
                className={`pixel-font ${styles.titleChar}`}
                custom={i}
                variants={letterVariants}
                initial="hidden"
                animate="visible"
                whileHover={{
                  y: -12,
                  color: '#FF6B00',
                  transition: { duration: 0.15 },
                }}
              >
                {char}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            We build <span className={styles.highlight}>any technology</span>,{' '}
            <span className={styles.highlight}>any solution</span>.<br />
            From pixel to production.
          </motion.p>

          <motion.div
            className={styles.ctas}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.9, duration: 0.6 }}
          >
            <motion.a
              href="#contact"
              className={styles.ctaPrimary}
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 107, 0, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="pixel-font" style={{ fontSize: '0.7rem' }}>HIRE US</span>
            </motion.a>
            <motion.a
              href="#services"
              className={styles.ctaSecondary}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="pixel-font" style={{ fontSize: '0.7rem' }}>EXPLORE</span>
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          className={styles.right}
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <RobotMascot />
        </motion.div>
      </div>

      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        <motion.div
          className={styles.scrollDot}
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className={`pixel-font ${styles.scrollText}`}>SCROLL</span>
      </motion.div>
    </section>
  );
}
