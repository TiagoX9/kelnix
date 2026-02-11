import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './Process.module.css';

const steps = [
  {
    num: '01',
    title: 'Discovery',
    desc: 'We listen, ask questions, and understand your goals. No assumptions, no fluff.',
    icon: '?',
  },
  {
    num: '02',
    title: 'Blueprint',
    desc: 'We architect the solution — stack, timeline, and milestones mapped out clearly.',
    icon: '#',
  },
  {
    num: '03',
    title: 'Build',
    desc: 'Heads down, code up. Iterative development with constant communication.',
    icon: '>',
  },
  {
    num: '04',
    title: 'Launch',
    desc: 'Ship it. We handle deployment, monitoring, and make sure everything runs smooth.',
    icon: '!',
  },
];

export default function Process() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="process" className={styles.section}>
      <div ref={ref} className={styles.container}>
        <div className={styles.header}>
          <motion.span
            className={`pixel-font ${styles.label}`}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            {'> '}HOW WE WORK
          </motion.span>
          <motion.h2
            className={styles.title}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our Process
          </motion.h2>
        </div>

        <div className={styles.timeline}>
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              className={styles.step}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
            >
              <motion.div
                className={styles.stepIcon}
                whileHover={{
                  scale: 1.15,
                  rotate: 360,
                  boxShadow: '0 0 30px rgba(255, 107, 0, 0.4)',
                }}
                transition={{ duration: 0.4 }}
              >
                <span className={`pixel-font ${styles.stepIconText}`}>{step.icon}</span>
              </motion.div>
              <div className={styles.stepContent}>
                <span className={`pixel-font ${styles.stepNum}`}>{step.num}</span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className={styles.connector} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
