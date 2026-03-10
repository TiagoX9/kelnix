import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';
import styles from './ProductDetail.module.css';

const tools = [
  { name: 'sources.connect', desc: 'Connect a data source (PostgreSQL, CRM, API)', cost: '1 credit' },
  { name: 'sources.list', desc: 'List connected data sources', cost: 'free' },
  { name: 'sources.test', desc: 'Test source connectivity', cost: 'free' },
  { name: 'data.query', desc: 'Query with natural language or SQL', cost: '2 credits' },
  { name: 'data.fetch', desc: 'Fetch raw rows with filters & pagination', cost: '1 credit' },
  { name: 'data.search', desc: 'Semantic vector search across data', cost: '2 credits' },
  { name: 'pipeline.clean', desc: 'Standardize dates, phones, emails, currencies', cost: '2 credits' },
  { name: 'pipeline.deduplicate', desc: 'Remove duplicate records', cost: '1 credit' },
  { name: 'pipeline.redact_pii', desc: 'Auto-detect and redact PII', cost: '1 credit' },
  { name: 'context.build', desc: 'Build AI-ready context for RAG pipelines', cost: '3 credits' },
  { name: 'context.summarize', desc: 'AI-powered dataset summary with insights', cost: '2 credits' },
  { name: 'credits.check_balance', desc: 'Check credits and plan', cost: 'free' },
];

const pricing = [
  { credits: '25', price: 'Free', per: 'on signup' },
  { credits: '100', price: '$8', per: '$0.08/credit' },
  { credits: '500', price: '$30', per: '$0.06/credit' },
  { credits: '1,000', price: '$50', per: '$0.05/credit' },
  { credits: '5,000', price: '$200', per: '$0.04/credit' },
  { credits: '10,000', price: '$400', per: '$0.04/credit' },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function DataMindProduct() {
  return (
    <>
      <CustomCursor />
      <PixelGrid />
      <div className={styles.container}>
        <Link to="/products" className={`pixel-font ${styles.backLink}`}>
          &larr; ALL PRODUCTS
        </Link>

        <div className={styles.content}>
          {/* Hero */}
          <motion.div className={styles.hero} {...fade} transition={{ duration: 0.5 }}>
            <img src="/logos/datamind-curator.png" alt="Kelnix DataMind Curator" className={styles.heroLogo} />
            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>Kelnix DataMind Curator</h1>
              <span className={`pixel-font ${styles.heroType}`}>API / MCP SERVER</span>
            </div>
          </motion.div>

          <motion.p className={styles.heroDesc} {...fade} transition={{ duration: 0.5, delay: 0.1 }}>
            AI-Ready Data & Context Engineering API. Connect any data source — PostgreSQL, CRMs, APIs —
            and get clean, structured, AI-ready data in seconds. Natural language queries, semantic vector
            search, automated PII redaction, deduplication, and AI-powered context building for RAG pipelines.
          </motion.p>

          {/* CTAs */}
          <motion.div className={styles.ctas} {...fade} transition={{ duration: 0.5, delay: 0.2 }}>
            <a
              href="https://datamind-api.kelnix.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
            >
              <span className="pixel-font" style={{ fontSize: '0.6rem' }}>GET API KEY</span>
            </a>
            <a
              href="https://datamind-api.kelnix.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaSecondary}
            >
              Interactive Docs
            </a>
            <a
              href="https://github.com/kelnixsolutions/Kelnix-DataMind-Curator"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaSecondary}
            >
              GitHub
            </a>
          </motion.div>

          {/* Features */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.3 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}WHY THIS API</span>
            <p className={styles.featureText}>
              <span className={styles.highlight}>25 free credits</span> on signup, no credit card required.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Natural language queries</span> — ask questions in plain English, get SQL results back.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>MCP native</span> — works with Claude Desktop, Cursor, and any MCP-compatible client.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Built-in data pipeline</span> — clean, deduplicate, and redact PII in one flow.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Pay with anything</span> — Stripe cards or 300+ cryptocurrencies.
            </p>
          </motion.div>

          {/* Tools */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.35 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}TOOLS</span>
            <div className={styles.toolGrid}>
              {tools.map((tool) => (
                <div key={tool.name} className={styles.toolCard}>
                  <div style={{ flex: 1 }}>
                    <div className={`pixel-font ${styles.toolName}`}>{tool.name}</div>
                    <div className={styles.toolDesc}>{tool.desc}</div>
                  </div>
                  <span
                    className={`pixel-font ${styles.toolCost} ${
                      tool.cost === 'free' ? styles.toolFree : styles.toolPaid
                    }`}
                  >
                    {tool.cost === 'free' ? 'FREE' : tool.cost.replace(' credit', ' CR').replace('s', '')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Pricing */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.4 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}CREDIT PACKS</span>
            <div className={styles.pricingGrid}>
              {pricing.map((tier) => (
                <div key={tier.credits} className={styles.pricingCard}>
                  <div className={styles.pricingCredits}>{tier.credits}</div>
                  <div className={styles.pricingPrice}>{tier.price}</div>
                  <div className={styles.pricingPer}>{tier.per}</div>
                </div>
              ))}
            </div>
            <p className={styles.pricingNote}>
              Monthly plans also available: Basic (200/mo, $15) and Pro (2,000/mo, $99).
            </p>
          </motion.div>

          {/* Registries */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.45 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}FIND US ON</span>
            <div className={styles.registryGrid}>
              <a
                href="https://smithery.ai/servers/kelnix/kelnix-datamind-curator"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.registryLink}
              >
                <span className={`pixel-font ${styles.registryIcon}`}>01</span>
                Smithery
              </a>
              <a
                href="https://mcp.so/server/kelnix-datamind-curator/Kelnix"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.registryLink}
              >
                <span className={`pixel-font ${styles.registryIcon}`}>02</span>
                mcp.so
              </a>
              <a
                href="https://glama.ai/mcp/servers/kelnixsolutions/kelnix-datamind-curator"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.registryLink}
              >
                <span className={`pixel-font ${styles.registryIcon}`}>03</span>
                Glama
              </a>
              <a
                href="https://github.com/kelnixsolutions/Kelnix-DataMind-Curator"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.registryLink}
              >
                <span className={`pixel-font ${styles.registryIcon}`}>04</span>
                GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
