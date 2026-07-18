import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';
import { useSeo } from '../hooks/useSeo';
import styles from './ProductDetail.module.css';

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Cladget',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web, iOS, Android',
  url: 'https://kelnix.org/cladget',
  sameAs: ['https://cladget.app'],
  description:
    'Cladget is a financial dashboard that unifies revenue and cost data from Stripe, AWS, OpenAI, Vercel, GitHub, Google Cloud and more into one place — real-time profit, burn rate, runway and AI-powered insights.',
  publisher: { '@type': 'Organization', name: 'Kelnix', url: 'https://kelnix.org' },
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
    { '@type': 'Offer', price: '12', priceCurrency: 'USD', name: 'Pro' },
    { '@type': 'Offer', price: '29', priceCurrency: 'USD', name: 'Pro AI' },
    { '@type': 'Offer', price: '79', priceCurrency: 'USD', name: 'Team' },
  ],
};

const integrations = [
  'Stripe',
  'AWS',
  'OpenAI',
  'Vercel',
  'GitHub',
  'Google Cloud',
  'Datadog',
];

export default function CladgetProduct() {
  useSeo({
    title: 'Cladget — Financial Dashboard for Revenue, Costs & Profit | Kelnix',
    description:
      'Cladget is software for humans and agents — a financial dashboard that unifies revenue and cost data from Stripe, AWS, OpenAI, Vercel, GitHub and more. Track profit, burn rate and runway in real time with AI-powered insights. Built by Kelnix.',
    canonical: 'https://kelnix.org/cladget',
    keywords:
      'Cladget, financial dashboard, SaaS profit tracking, revenue and cost dashboard, burn rate tracker, runway forecast, Stripe dashboard, AWS cost tracking, startup finance app, MRR tracker, Kelnix',
    jsonLd: JSON_LD,
  });

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
          <motion.div {...fade} transition={{ duration: 0.5 }} style={{ marginBottom: 24 }}>
            <img
              src="/logos/cladget-with-text.svg"
              alt="Cladget — financial dashboard by Kelnix"
              style={{ width: 'min(320px, 80%)', height: 'auto', display: 'block' }}
            />
          </motion.div>

          <motion.span
            className={`pixel-font ${styles.heroType}`}
            {...fade}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{ display: 'block', marginBottom: 24 }}
          >
            FINANCIAL DASHBOARD · FOR HUMANS &amp; AGENTS
          </motion.span>

          <motion.h1
            className={styles.heroName}
            {...fade}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            Know exactly what you earn, spend &amp; keep — in one dashboard
          </motion.h1>

          <motion.p className={styles.heroDesc} {...fade} transition={{ duration: 0.5, delay: 0.1 }}>
            Cladget aggregates revenue and cost data from all your services into a single, real-time
            financial dashboard. No more scattered spreadsheets — get complete visibility into your
            SaaS financial stack, track profit and burn rate, and see your runway at a glance. Built
            for humans and the AI agents that work alongside them.
          </motion.p>

          {/* CTAs / Store buttons */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.2 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}GET CLADGET</span>
            <div className={styles.storeButtons}>
              <a
                href="https://cladget.app"
                className={styles.storeButton}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div>
                  <span className={`pixel-font ${styles.storeLabel}`}>VISIT</span>
                  <div className={styles.storeName}>cladget.app</div>
                </div>
              </a>
              <a href="#" className={styles.storeButton} aria-disabled="true">
                <div>
                  <span className={`pixel-font ${styles.storeLabel}`}>COMING SOON</span>
                  <div className={styles.storeName}>App Store</div>
                </div>
              </a>
              <a href="#" className={styles.storeButton} aria-disabled="true">
                <div>
                  <span className={`pixel-font ${styles.storeLabel}`}>COMING SOON</span>
                  <div className={styles.storeName}>Google Play</div>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.3 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}FEATURES</span>
            <p className={styles.featureText}>
              <span className={styles.highlight}>All your data in one place</span> — connect Stripe, AWS, OpenAI, Vercel, GitHub, Google Cloud and Datadog and unify revenue and costs automatically.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Real-time profit tracking</span> — see revenue, costs, profit and burn rate update live, without manual spreadsheets.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>AI-powered insights</span> — automatic cost-spike explanations and anomaly detection so nothing slips by.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Runway &amp; forecasting</span> — trend analysis and runway projections up to a year ahead.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Smart alerts</span> — get notified via email, Slack or Discord the moment thresholds are crossed.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Secure by design</span> — AES-256-GCM encryption and SOC 2 compliance keep your financial data safe.
            </p>
          </motion.div>

          {/* Integrations */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.35 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}INTEGRATIONS</span>
            <div className={styles.registryGrid}>
              {integrations.map((name) => (
                <span key={name} className={styles.registryLink}>
                  {name}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Pricing */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.4 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}PRICING</span>
            <div className={styles.pricingGrid}>
              <div className={styles.pricingCard}>
                <div className={styles.pricingCredits}>Free</div>
                <div className={styles.pricingPrice}>$0</div>
                <div className={styles.pricingPer}>1 workspace · 3 integrations</div>
              </div>
              <div className={styles.pricingCard}>
                <div className={styles.pricingCredits}>Pro</div>
                <div className={styles.pricingPrice}>$12</div>
                <div className={styles.pricingPer}>per month</div>
              </div>
              <div className={styles.pricingCard}>
                <div className={styles.pricingCredits}>Pro AI</div>
                <div className={styles.pricingPrice}>$29</div>
                <div className={styles.pricingPer}>most popular</div>
              </div>
              <div className={styles.pricingCard}>
                <div className={styles.pricingCredits}>Team</div>
                <div className={styles.pricingPrice}>$79</div>
                <div className={styles.pricingPer}>per month</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
