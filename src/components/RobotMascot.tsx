import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useMousePosition } from '../hooks/useMousePosition';
import styles from './RobotMascot.module.css';

export default function RobotMascot() {
  const { x, y } = useMousePosition();
  const containerRef = useRef<HTMLDivElement>(null);

  const getEyeOffset = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const maxOffset = 8;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(distance, 300);
    const ratio = clampedDist / 300;
    return {
      x: (dx / (distance || 1)) * maxOffset * ratio,
      y: (dy / (distance || 1)) * maxOffset * ratio,
    };
  };

  const eyeOffset = getEyeOffset();

  return (
    <motion.div
      ref={containerRef}
      className={styles.robot}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
    >
      {/* Antenna */}
      <div className={styles.antenna}>
        <motion.div
          className={styles.antennaTop}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className={styles.antennaStick} />
      </div>

      {/* Head */}
      <div className={styles.head}>
        {/* Eyes */}
        <div className={styles.eyes}>
          <div className={styles.eye}>
            <motion.div
              className={styles.pupil}
              style={{ x: eyeOffset.x, y: eyeOffset.y }}
            />
          </div>
          <div className={styles.eye}>
            <motion.div
              className={styles.pupil}
              style={{ x: eyeOffset.x, y: eyeOffset.y }}
            />
          </div>
        </div>

        {/* Mouth */}
        <div className={styles.mouth}>
          <motion.div
            className={styles.mouthInner}
            animate={{ scaleY: [1, 0.6, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
