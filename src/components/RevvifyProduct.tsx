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
  name: 'Revvify',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  url: 'https://kelnix.org/revvify',
  sameAs: ['https://revvify.io'],
  description:
    'Revvify is an AI marketing and sales platform for humans and AI agents. It plans, writes, schedules, publishes and sells — you approve. Agent-native with an MCP server and REST API.',
  publisher: { '@type': 'Organization', name: 'Kelnix', url: 'https://kelnix.org' },
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'EUR', name: 'Free' },
    { '@type': 'Offer', price: '12', priceCurrency: 'EUR', name: 'Starter' },
    { '@type': 'Offer', price: '49', priceCurrency: 'EUR', name: 'Pro' },
    { '@type': 'Offer', price: '149', priceCurrency: 'EUR', name: 'Agency' },
  ],
};

const channels = [
  'LinkedIn',
  'TikTok',
  'Email',
  'MCP Server',
  'REST API',
  'Anthropic',
  'OpenAI',
  'OpenRouter',
];

export default function RevvifyProduct() {
  useSeo({
    title: 'Revvify — AI Marketing & Sales for Humans and Agents | Kelnix',
    description:
      'Revvify is your AI marketing and sales team. It plans, writes, schedules, publishes and sells — you approve. Agent-native with an MCP server and REST API, multi-channel posting, lead scoring and self-improving AI Loops. Built by Kelnix.',
    canonical: 'https://kelnix.org/revvify',
    keywords:
      'Revvify, AI marketing, AI sales, marketing automation, content scheduling, lead scoring, MCP server, agent-native, LinkedIn automation, TikTok marketing, email newsletter, brand voice AI, Kelnix',
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
              src="/logos/revvify-with-text.png"
              alt="Revvify — AI marketing and sales by Kelnix"
              style={{ width: 'min(320px, 80%)', height: 'auto', display: 'block' }}
            />
          </motion.div>

          <motion.span
            className={`pixel-font ${styles.heroType}`}
            {...fade}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{ display: 'block', marginBottom: 24 }}
          >
            AI MARKETING &amp; SALES · FOR HUMANS &amp; AGENTS
          </motion.span>

          <motion.h1
            className={styles.heroName}
            {...fade}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            Your AI marketing &amp; sales team
          </motion.h1>

          <motion.p className={styles.heroDesc} {...fade} transition={{ duration: 0.5, delay: 0.1 }}>
            Revvify plans, writes, schedules, publishes and sells — you approve. It watches the
            topics that matter to you, drafts in your brand voice, fills a content calendar and
            posts to every channel with the right tone for each one. On the sales side it tracks
            links, scores leads and drafts the follow-ups. Nothing goes out without your say-so.
          </motion.p>

          {/* CTAs / Store buttons */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.2 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}GET REVVIFY</span>
            <div className={styles.storeButtons}>
              <a
                href="https://revvify.io"
                className={styles.storeButton}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div>
                  <span className={`pixel-font ${styles.storeLabel}`}>VISIT</span>
                  <div className={styles.storeName}>revvify.io</div>
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
              <span className={styles.highlight}>Plans and writes for you</span> — topic monitoring
              spots what's worth saying, then drafts it in your brand voice and slots it into the
              content calendar.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Publishes everywhere, natively</span> — one idea
              becomes a LinkedIn post, a TikTok script and a newsletter, each rewritten for the tone
              that channel expects.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Sells, not just posts</span> — tracked links and
              landing pages feed lead scoring, and Revvify drafts the responses and follow-ups.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>AI Loops</span> — campaigns measure what actually
              got published and how it performed, then improve themselves on the next pass.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Human in the loop, always</span> — every draft
              waits for your approval. Nothing is auto-messaged on your behalf.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Agent-native</span> — an MCP server, a REST API and
              capability discovery, so it runs just as well from inside Claude as it does in the
              browser.
            </p>
            <p className={styles.featureText}>
              <span className={styles.highlight}>Bring your own keys</span> — plug in Anthropic,
              OpenAI or OpenRouter and pay your provider directly, with no markup from us.
            </p>
          </motion.div>

          {/* Channels & integrations */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.35 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}CHANNELS &amp; ACCESS</span>
            <div className={styles.registryGrid}>
              {channels.map((name) => (
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
                <div className={styles.pricingPrice}>€0</div>
                <div className={styles.pricingPer}>no card required</div>
              </div>
              <div className={styles.pricingCard}>
                <div className={styles.pricingCredits}>Starter</div>
                <div className={styles.pricingPrice}>€12</div>
                <div className={styles.pricingPer}>per month · solo creators</div>
              </div>
              <div className={styles.pricingCard}>
                <div className={styles.pricingCredits}>Pro</div>
                <div className={styles.pricingPrice}>€49</div>
                <div className={styles.pricingPer}>up to 3 clients</div>
              </div>
              <div className={styles.pricingCard}>
                <div className={styles.pricingCredits}>Agency</div>
                <div className={styles.pricingPrice}>€149</div>
                <div className={styles.pricingPer}>up to 10 clients</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
