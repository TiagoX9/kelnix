import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';
import styles from './ProductDetail.module.css';

const tools = [
  { name: 'receipts.upload', desc: 'Upload receipt image or PDF', cost: 'free' },
  { name: 'receipts.process', desc: 'Extract structured data with AI vision', cost: '1 credit' },
  { name: 'receipts.upload_and_process', desc: 'Upload + process in one call', cost: '1 credit' },
  { name: 'receipts.get_markdown', desc: 'Get receipt as clean Markdown', cost: 'free' },
  { name: 'receipts.list', desc: 'List receipts with filters', cost: 'free' },
  { name: 'accounting.suggest_gl_account', desc: 'AI-suggest GL account code', cost: '1 credit' },
  { name: 'credits.check_balance', desc: 'Check credits and plan', cost: 'free' },
];

const pricing = [
  { credits: '50', price: 'Free', per: 'on signup' },
  { credits: '100', price: '$5', per: '$0.05/credit' },
  { credits: '500', price: '$20', per: '$0.04/credit' },
  { credits: '1,000', price: '$40', per: '$0.04/credit' },
  { credits: '5,000', price: '$150', per: '$0.03/credit' },
  { credits: '10,000', price: '$300', per: '$0.03/credit' },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function ReceiptMcpProduct() {
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
            <img src="/logos/receipt-mcp.png" alt="Kelnix Receipt MCP" className={styles.heroLogo} />
            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>Kelnix Receipt MCP API</h1>
              <span className={`pixel-font ${styles.heroType}`}>API / MCP SERVER</span>
            </div>
          </motion.div>

          <motion.p className={styles.heroDesc} {...fade} transition={{ duration: 0.5, delay: 0.1 }}>
            Turn any receipt into structured, accounting-ready JSON or clean Markdown with one API call.
            AI-powered vision extracts merchant, date, line items, tax breakdown, totals, currency, and
            confidence scores — then suggests the right GL account for instant bookkeeping.
          </motion.p>

          {/* CTAs */}
          <motion.div className={styles.ctas} {...fade} transition={{ duration: 0.5, delay: 0.2 }}>
            <a
              href="https://receipt-mcp-api.kelnix.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaPrimary}
            >
              <span className="pixel-font" style={{ fontSize: '0.6rem' }}>GET API KEY</span>
            </a>
            <a
              href="https://receipt-mcp-api.kelnix.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaSecondary}
            >
              Interactive Docs
            </a>
            <a
              href="https://github.com/kelnixsolutions/Kelnix-Receipt-MCP-API"
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
              <span className={styles.highlight}>50 free credits</span> on signup, no credit card required.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>One API call</span> — upload an image and get structured JSON back in seconds.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>MCP native</span> — works with Claude Desktop, Cursor, and any MCP-compatible client.
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
                    {tool.cost === 'free' ? 'FREE' : '1 CR'}
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
                href="https://smithery.ai/servers/kelnix/kelnix-receipt-mcp"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.registryLink}
              >
                <span className={`pixel-font ${styles.registryIcon}`}>01</span>
                Smithery
              </a>
              <a
                href="https://mcp.so/server/kelnix-receipt-mcp-api"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.registryLink}
              >
                <span className={`pixel-font ${styles.registryIcon}`}>02</span>
                mcp.so
              </a>
              <a
                href="https://glama.ai/mcp/servers"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.registryLink}
              >
                <span className={`pixel-font ${styles.registryIcon}`}>03</span>
                Glama
              </a>
              <a
                href="https://github.com/kelnixsolutions/Kelnix-Receipt-MCP-API"
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
