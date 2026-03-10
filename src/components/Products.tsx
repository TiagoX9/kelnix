import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';
import styles from './Products.module.css';

type ProductTab = 'agents' | 'humans';

interface Product {
  id: string;
  name: string;
  desc: string;
  logo: string;
  tab: ProductTab;
  tags: string[];
  route: string;
}

const products: Product[] = [
  {
    id: 'receipt-mcp',
    name: 'Kelnix Receipt MCP API',
    desc: 'Turn any receipt into structured, accounting-ready JSON or Markdown with one API call. AI vision extracts merchant, date, line items, tax, totals, and suggests GL accounts.',
    logo: '/logos/receipt-mcp.png',
    tab: 'agents',
    tags: ['MCP', 'API', 'AI Vision', 'Accounting'],
    route: '/products/receipt-mcp',
  },
  {
    id: 'datamind-curator',
    name: 'Kelnix DataMind Curator',
    desc: 'AI-Ready Data & Context Engineering API. Connect any data source, query with natural language, clean data, build AI context, redact PII.',
    logo: '/logos/datamind-curator.png',
    tab: 'agents',
    tags: ['MCP', 'API', 'NLQ', 'Data', 'RAG'],
    route: '/products/datamind-curator',
  },
  {
    id: 'nibs',
    name: 'Nibs',
    desc: 'A fun, casual mobile game where you guide Nibs the bird through challenges. Simple to pick up, hard to put down.',
    logo: '/logos/nibs.png',
    tab: 'humans',
    tags: ['iOS', 'Android', 'Game', 'Casual'],
    route: '/products/nibs',
  },
];

export default function Products() {
  const [activeTab, setActiveTab] = useState<ProductTab>('agents');
  const filtered = products.filter((p) => p.tab === activeTab);

  return (
    <>
      <CustomCursor />
      <PixelGrid />
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className={`pixel-font ${styles.label}`}>{'> '}OUR PRODUCTS</span>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>
            Software for humans, APIs for agents. Pick your side.
          </p>
        </motion.div>

        <motion.div
          className={styles.tabs}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button
            className={`pixel-font ${styles.tab} ${activeTab === 'agents' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            FOR AGENTS
          </button>
          <button
            className={`pixel-font ${styles.tab} ${activeTab === 'humans' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('humans')}
          >
            FOR HUMANS
          </button>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className={styles.grid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {filtered.length > 0 ? (
              filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Link to={product.route} className={styles.card}>
                    <span className={styles.cardArrow}>&rarr;</span>
                    <div className={styles.cardHeader}>
                      <img
                        src={product.logo}
                        alt={product.name}
                        className={styles.cardLogo}
                      />
                      <div className={styles.cardInfo}>
                        <h3 className={styles.cardName}>{product.name}</h3>
                        <span className={`pixel-font ${styles.cardType}`}>
                          {product.tab === 'agents' ? 'API / MCP SERVER' : 'MOBILE APP'}
                        </span>
                      </div>
                    </div>
                    <p className={styles.cardDesc}>{product.desc}</p>
                    <div className={styles.cardTags}>
                      {product.tags.map((tag) => (
                        <span key={tag} className={`pixel-font ${styles.cardTag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <span className={`pixel-font ${styles.emptyIcon}`}>...</span>
                <span className={`pixel-font ${styles.emptyText}`}>MORE COMING SOON</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
