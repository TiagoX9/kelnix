import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import styles from './ProductsHighlight.module.css';

const products = [
  { name: 'Receipt MCP', logo: '/logos/receipt-mcp.png', route: '/products/receipt-mcp', label: 'API' },
  { name: 'DataMind', logo: '/logos/datamind-curator.png', route: '/products/datamind-curator', label: 'API' },
  { name: 'Nibs', logo: '/logos/nibs.png', route: '/products/nibs', label: 'GAME' },
  { name: 'Tiny Wins', logo: '/logos/tinywins.png', route: '/products/tinywins', label: 'APP' },
];

export default function ProductsHighlight() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className={styles.section}>
      <div ref={ref} className={styles.inner}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <span className={`pixel-font ${styles.label}`}>{'> '}OUR PRODUCTS</span>
          <h2 className={styles.title}>Built by us, used by everyone</h2>
          <p className={styles.subtitle}>
            From <span className={styles.highlight}>APIs for agents</span> to{' '}
            <span className={styles.highlight}>apps for humans</span> — explore what we've shipped.
          </p>
        </motion.div>

        <motion.div
          className={styles.logos}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {products.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            >
              <Link to={p.route} className={styles.product}>
                <img src={p.logo} alt={p.name} className={styles.logo} />
                <span className={styles.productName}>{p.name}</span>
                <span className={`pixel-font ${styles.productLabel}`}>{p.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className={styles.cta}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link to="/products" className={styles.ctaButton}>
            <span className="pixel-font" style={{ fontSize: '0.65rem' }}>VIEW ALL PRODUCTS &rarr;</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
