import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import styles from './ProductsHighlight.module.css';

// Mirrors the order and copy on /products — Revvify and Cladget lead because
// they serve humans and agents both, which is the whole Kelnix pitch.
const products = [
  {
    name: 'Revvify',
    logo: '/logos/revvify.png',
    route: '/revvify',
    label: 'HUMANS + AGENTS',
    desc: 'Your AI marketing & sales team. It plans, writes, schedules, publishes and sells — you approve.',
    tags: ['Web', 'iOS', 'Android', 'MCP'],
  },
  {
    name: 'Cladget',
    logo: '/logos/cladget.svg',
    route: '/cladget',
    label: 'HUMANS + AGENTS',
    desc: 'A financial dashboard that unifies revenue and costs from Stripe, AWS, OpenAI and more — profit, burn rate and runway, live.',
    tags: ['Web', 'iOS', 'Android', 'Finance'],
  },
  {
    name: 'Nibs',
    logo: '/logos/nibs.png',
    route: '/products/nibs',
    label: 'MOBILE GAME',
    desc: 'A fun, casual mobile game where you guide Nibs the bird through challenges. Simple to pick up, hard to put down.',
    tags: ['iOS', 'Android', 'Casual'],
  },
  {
    name: 'Receipt MCP',
    logo: '/logos/receipt-mcp.png',
    route: '/products/receipt-mcp',
    label: 'API / MCP SERVER',
    desc: 'Turn any receipt into accounting-ready JSON with one API call. AI vision extracts merchant, line items, tax and totals.',
    tags: ['MCP', 'API', 'AI Vision'],
  },
  {
    name: 'DataMind Curator',
    logo: '/logos/datamind-curator.png',
    route: '/products/datamind-curator',
    label: 'API / MCP SERVER',
    desc: 'AI-ready data and context engineering. Connect any source, query in natural language, clean data and redact PII.',
    tags: ['MCP', 'API', 'NLQ', 'RAG'],
  },
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

        <div className={styles.grid}>
          {products.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
            >
              <Link to={p.route} className={styles.card}>
                <span className={styles.cardArrow}>&rarr;</span>
                <div className={styles.cardHeader}>
                  <img src={p.logo} alt={p.name} className={styles.logo} />
                  <div className={styles.cardInfo}>
                    <h3 className={styles.productName}>{p.name}</h3>
                    <span className={`pixel-font ${styles.productLabel}`}>{p.label}</span>
                  </div>
                </div>
                <p className={styles.cardDesc}>{p.desc}</p>
                <div className={styles.cardTags}>
                  {p.tags.map((tag) => (
                    <span key={tag} className={`pixel-font ${styles.cardTag}`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          className={styles.cta}
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Link to="/products" className={styles.ctaButton}>
            <span className="pixel-font" style={{ fontSize: '0.65rem' }}>VIEW ALL PRODUCTS &rarr;</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
