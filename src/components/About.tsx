import { useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import styles from './About.module.css';

const stats = [
  { value: '50+', label: 'Projects Delivered' },
  { value: '99%', label: 'Client Satisfaction' },
  { value: '24/7', label: 'Support Available' },
  { value: '∞', label: 'Technologies' },
];

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const parallaxY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section id="about" className={styles.section}>
      <div ref={ref} className={styles.container}>
        <div className={styles.left}>
          <motion.span
            className={`pixel-font ${styles.label}`}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            {'> '}WHO WE ARE
          </motion.span>
          <motion.h2
            className={styles.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            We turn ideas into
            <span className={styles.highlight}> reality</span>
          </motion.h2>
          <motion.p
            className={styles.desc}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Kelnix is a team of engineers, designers, and problem-solvers who thrive on turning complex challenges into elegant, working solutions. We don't limit ourselves to one stack or one industry — if it involves technology, we build it.
          </motion.p>
          <motion.p
            className={styles.desc}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            From startups to enterprise, we partner with teams who want to move fast without breaking things. Our approach is direct, our code is clean, and our results speak for themselves.
          </motion.p>
        </div>

        <motion.div className={styles.right} style={{ y: parallaxY }}>
          <div className={styles.statsGrid}>
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className={styles.stat}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                whileHover={{
                  scale: 1.08,
                  borderColor: 'rgba(255, 107, 0, 0.5)',
                }}
              >
                <span className={`pixel-font ${styles.statValue}`}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
