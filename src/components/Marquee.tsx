import { motion } from 'framer-motion';
import styles from './Marquee.module.css';

export default function Marquee() {
  const items = [
    'WEB APPS', 'MOBILE', 'CLOUD', 'AI', 'DEVOPS', 'UI/UX',
    'APIs', 'DATABASES', 'SECURITY', 'BLOCKCHAIN', 'IOT', 'ML',
  ];

  const content = items.map((item, i) => (
    <span key={i} className={styles.item}>
      <span className={`pixel-font ${styles.text}`}>{item}</span>
      <span className={styles.dot} />
    </span>
  ));

  return (
    <div className={styles.wrapper}>
      <motion.div
        className={styles.track}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {content}
        {content}
      </motion.div>
    </div>
  );
}
