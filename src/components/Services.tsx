import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import styles from './Services.module.css';

const services = [
  {
    icon: '{ }',
    title: 'Web Development',
    desc: 'Custom web apps, SPAs, and platforms built with modern frameworks and pixel-perfect precision.',
    tags: ['React', 'Next.js', 'Node.js'],
  },
  {
    icon: '[ ]',
    title: 'Mobile Apps',
    desc: 'Native and cross-platform mobile experiences that users actually enjoy using.',
    tags: ['iOS', 'Android', 'Flutter'],
  },
  {
    icon: '< >',
    title: 'Cloud & DevOps',
    desc: 'Scalable infrastructure, CI/CD pipelines, and cloud architecture that just works.',
    tags: ['AWS', 'Docker', 'K8s'],
  },
  {
    icon: '( )',
    title: 'AI & Automation',
    desc: 'Intelligent solutions powered by ML, LLMs, and automation to supercharge your workflow.',
    tags: ['ML', 'LLMs', 'RPA'],
  },
  {
    icon: '/ /',
    title: 'UI/UX Design',
    desc: 'Intuitive interfaces and beautiful experiences designed with users at the center.',
    tags: ['Figma', 'Design Systems', 'A11y'],
  },
  {
    icon: '# #',
    title: 'Consulting',
    desc: 'Technical strategy, architecture reviews, and hands-on guidance for your toughest challenges.',
    tags: ['Strategy', 'Architecture', 'Review'],
  },
];

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

    const glare = card.querySelector(`.${styles.glare}`) as HTMLElement;
    if (glare) {
      glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 107, 0, 0.15), transparent 60%)`;
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    const glare = card.querySelector(`.${styles.glare}`) as HTMLElement;
    if (glare) {
      glare.style.background = 'transparent';
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      style={{ transition: 'transform 0.15s ease-out' }}
    >
      <div className={styles.glare} />
      <span className={`pixel-font ${styles.icon}`}>{service.icon}</span>
      <h3 className={styles.cardTitle}>{service.title}</h3>
      <p className={styles.cardDesc}>{service.desc}</p>
      <div className={styles.tags}>
        {service.tags.map((tag) => (
          <span key={tag} className={`pixel-font ${styles.tag}`}>{tag}</span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="services" className={styles.section}>
      <div ref={ref} className={styles.header}>
        <motion.span
          className={`pixel-font ${styles.label}`}
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          {'> '}WHAT WE DO
        </motion.span>
        <motion.h2
          className={styles.title}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Services
        </motion.h2>
      </div>

      <div className={styles.grid}>
        {services.map((service, i) => (
          <ServiceCard key={service.title} service={service} index={i} />
        ))}
      </div>
    </section>
  );
}
