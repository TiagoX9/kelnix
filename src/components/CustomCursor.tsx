import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { useMousePosition } from '../hooks/useMousePosition';

export default function CustomCursor() {
  const { x, y } = useMousePosition();
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const springX = useSpring(0, { stiffness: 500, damping: 28 });
  const springY = useSpring(0, { stiffness: 500, damping: 28 });

  const trailX = useSpring(0, { stiffness: 150, damping: 20 });
  const trailY = useSpring(0, { stiffness: 150, damping: 20 });

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    springX.set(x);
    springY.set(y);
    trailX.set(x);
    trailY.set(y);
  }, [x, y, springX, springY, trailX, trailY]);

  useEffect(() => {
    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-cursor-hover], input, textarea, select')) {
        setIsHovering(true);
      }
    };
    const handleOut = () => setIsHovering(false);
    const handleDown = () => setIsClicking(true);
    const handleUp = () => setIsClicking(false);

    document.addEventListener('mouseover', handleOver);
    document.addEventListener('mouseout', handleOut);
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('mouseup', handleUp);

    return () => {
      document.removeEventListener('mouseover', handleOver);
      document.removeEventListener('mouseout', handleOut);
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('mouseup', handleUp);
    };
  }, []);

  if (isMobile) return null;

  return (
    <>
      {/* Main cursor - pixel square */}
      <motion.div
        style={{
          position: 'fixed',
          left: springX,
          top: springY,
          width: isHovering ? 40 : 16,
          height: isHovering ? 40 : 16,
          backgroundColor: isClicking ? '#FF6B00' : 'transparent',
          border: `3px solid #FF6B00`,
          borderRadius: isHovering ? '12px' : '4px',
          pointerEvents: 'none',
          zIndex: 99999,
          translateX: '-50%',
          translateY: '-50%',
          mixBlendMode: 'difference',
        }}
        animate={{
          scale: isClicking ? 0.8 : 1,
          rotate: isHovering ? 45 : 0,
        }}
        transition={{ duration: 0.15 }}
      />
      {/* Trail cursor */}
      <motion.div
        style={{
          position: 'fixed',
          left: trailX,
          top: trailY,
          width: 8,
          height: 8,
          backgroundColor: '#FF6B00',
          borderRadius: '2px',
          pointerEvents: 'none',
          zIndex: 99998,
          translateX: '-50%',
          translateY: '-50%',
          opacity: 0.5,
        }}
      />
    </>
  );
}
