import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomCursor from './CustomCursor';
import PixelGrid from './PixelGrid';
import { useSeo } from '../hooks/useSeo';
import styles from './ProductDetail.module.css';
import form from './Contact.module.css';

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const FORMSPREE_ENDPOINT =
  import.meta.env.VITE_FORMSPREE_ENDPOINT || 'https://formspree.io/f/xreaqebv';

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'Custom AI Integration',
  name: 'Custom AI Integration for Companies',
  provider: { '@type': 'Organization', name: 'Kelnix', url: 'https://kelnix.org' },
  areaServed: 'Worldwide',
  url: 'https://kelnix.org/custom-ai-integration',
  description:
    'Kelnix integrates AI into any company and any service — customer support, internal knowledge (RAG), workflow automation, data analysis, sales and more. From LLM orchestration to autonomous agents, connected to the tools you already use.',
};

const useCases = [
  {
    title: 'AI Customer Support',
    desc: 'Chatbots and assistants trained on your knowledge base to resolve tickets 24/7 across web, email and chat.',
  },
  {
    title: 'Knowledge & RAG',
    desc: 'Retrieval-augmented AI over your internal docs, wikis and databases — accurate answers with sources.',
  },
  {
    title: 'Workflow Automation',
    desc: 'Autonomous agents that handle repetitive back-office work and connect the tools you already use.',
  },
  {
    title: 'Data & Analytics',
    desc: 'Natural-language querying, reporting and insight generation over your business data.',
  },
  {
    title: 'Sales & Marketing AI',
    desc: 'Lead scoring, personalized outreach, content generation and CRM enrichment on autopilot.',
  },
  {
    title: 'Custom LLM Apps',
    desc: 'Bespoke AI products and APIs — from concept to production — integrated into your stack.',
  },
];

const stack = ['OpenAI', 'Anthropic', 'LangChain', 'RAG', 'Vector DBs', 'Slack', 'Salesforce', 'HubSpot', 'Zapier', 'AWS', 'GCP', 'Azure'];

export default function CustomAI() {
  useSeo({
    title: 'Custom AI Integration for Companies — Any Service | Kelnix',
    description:
      'Kelnix integrates AI into any company and any service: customer support, RAG over internal docs, workflow automation, data analysis, sales and more. LLM orchestration and autonomous agents connected to your existing tools. Get a free consultation.',
    canonical: 'https://kelnix.org/custom-ai-integration',
    keywords:
      'custom AI integration, AI integration for companies, enterprise AI, LLM integration, AI automation, RAG, AI chatbot, workflow automation, AI consulting, OpenAI integration, Anthropic integration, AI agents, Kelnix',
    jsonLd: JSON_LD,
  });

  const [formState, setFormState] = useState({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          company: formState.company,
          message: formState.message,
          _subject: `[Kelnix] Custom AI Integration inquiry from ${formState.name}`,
        }),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Something went wrong');
      setSubmitted(true);
      setFormState({ name: '', email: '', company: '', message: '' });
      setTimeout(() => setSubmitted(false), 4000);
    } catch {
      setError('Failed to send. Please email info@kelnix.org directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CustomCursor />
      <PixelGrid />
      <div className={styles.container}>
        <Link to="/" className={`pixel-font ${styles.backLink}`}>
          &larr; HOME
        </Link>

        <div className={styles.content}>
          {/* Hero */}
          <motion.span
            className={`pixel-font ${styles.heroType}`}
            {...fade}
            transition={{ duration: 0.5 }}
            style={{ display: 'block', marginBottom: 20 }}
          >
            {'> '}KELNIX SERVICE
          </motion.span>

          <motion.h1 className={styles.heroName} {...fade} transition={{ duration: 0.5, delay: 0.05 }}>
            Custom AI Integration for your company — any service, any tool
          </motion.h1>

          <motion.p className={styles.heroDesc} {...fade} transition={{ duration: 0.5, delay: 0.1 }}>
            We integrate AI into any company, with any service you need. From customer support and
            internal knowledge to workflow automation and data analysis, Kelnix designs, builds and
            ships production-grade AI — LLM orchestration and autonomous agents connected to the tools
            you already use.
          </motion.p>

          <motion.div className={styles.ctas} {...fade} transition={{ duration: 0.5, delay: 0.15 }}>
            <a href="#ai-contact" className={styles.ctaPrimary}>
              Book a free consultation &rarr;
            </a>
            <Link to="/products" className={styles.ctaSecondary}>
              See our products
            </Link>
          </motion.div>

          {/* Use cases */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.2 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}WHAT WE INTEGRATE</span>
            <div className={styles.toolGrid}>
              {useCases.map((u) => (
                <div key={u.title} className={styles.toolCard} style={{ paddingBottom: 16 }}>
                  <div className={styles.toolName}>{u.title}</div>
                  <p className={styles.toolDesc}>{u.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stack */}
          <motion.div className={styles.section} {...fade} transition={{ duration: 0.5, delay: 0.25 }}>
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}WORKS WITH YOUR STACK</span>
            <div className={styles.registryGrid}>
              {stack.map((name) => (
                <span key={name} className={styles.registryLink}>
                  {name}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            id="ai-contact"
            className={styles.section}
            {...fade}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span className={`pixel-font ${styles.sectionLabel}`}>{'> '}TELL US WHAT YOU NEED</span>
            <p className={styles.featureText} style={{ marginBottom: 24 }}>
              Send us your use case and we'll reply within 24 hours at{' '}
              <span className={styles.highlight}>info@kelnix.org</span>.
            </p>

            {submitted ? (
              <div className={form.success}>
                <span className={`pixel-font ${form.successIcon}`}>✓</span>
                <h3 className={form.successTitle}>Message Sent!</h3>
                <p className={form.successDesc}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form className={form.form} onSubmit={handleSubmit} style={{ maxWidth: 560 }}>
                <div className={form.formRow}>
                  <div className={form.field}>
                    <label className={`pixel-font ${form.fieldLabel}`}>NAME</label>
                    <input
                      type="text"
                      className={form.input}
                      placeholder="Your name"
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={form.field}>
                    <label className={`pixel-font ${form.fieldLabel}`}>EMAIL</label>
                    <input
                      type="email"
                      className={form.input}
                      placeholder="your@email.com"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={form.field}>
                  <label className={`pixel-font ${form.fieldLabel}`}>COMPANY</label>
                  <input
                    type="text"
                    className={form.input}
                    placeholder="Company name"
                    value={formState.company}
                    onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                  />
                </div>
                <div className={form.field}>
                  <label className={`pixel-font ${form.fieldLabel}`}>WHAT DO YOU WANT TO INTEGRATE?</label>
                  <textarea
                    className={`${form.input} ${form.textarea}`}
                    placeholder="Describe the service or workflow you'd like to add AI to..."
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    required
                  />
                </div>
                {error && (
                  <p className={form.error} role="alert">
                    {error}
                  </p>
                )}
                <motion.button
                  type="submit"
                  className={form.submit}
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.03, boxShadow: '0 0 30px rgba(255, 107, 0, 0.4)' } : undefined}
                  whileTap={!loading ? { scale: 0.97 } : undefined}
                >
                  <span className="pixel-font" style={{ fontSize: '0.7rem' }}>
                    {loading ? 'SENDING...' : 'SEND MESSAGE'}
                  </span>
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
