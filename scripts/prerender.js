import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const SITE = 'https://kelnix.org';
const dist = resolve(import.meta.dirname, '..', 'dist');

/**
 * Per-route SEO. This bakes real <head> metadata into each route's static
 * index.html at build time (SSG for the head), so crawlers get correct
 * titles/descriptions/canonicals/JSON-LD without running JS. The client-side
 * useSeo hook keeps these in sync during in-app SPA navigation.
 */
const routes = {
  products: {
    title: 'Products — Software for Humans, APIs for Agents | Kelnix',
    description:
      'Explore Kelnix products: Cladget financial dashboard, Receipt MCP API, DataMind Curator and Nibs. Software for humans and APIs for agents.',
    keywords:
      'Kelnix products, Cladget, Receipt MCP API, DataMind Curator, Nibs, APIs for agents, apps for humans',
  },
  cladget: {
    title: 'Cladget — Financial Dashboard for Revenue, Costs & Profit | Kelnix',
    description:
      'Cladget is software for humans and agents — a financial dashboard that unifies revenue and cost data from Stripe, AWS, OpenAI, Vercel, GitHub and more. Track profit, burn rate and runway in real time with AI-powered insights. Built by Kelnix.',
    keywords:
      'Cladget, financial dashboard, SaaS profit tracking, revenue and cost dashboard, burn rate tracker, runway forecast, Stripe dashboard, AWS cost tracking, software for humans and agents, MRR tracker, Kelnix',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Cladget',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web, iOS, Android',
      url: `${SITE}/cladget`,
      sameAs: ['https://cladget.app'],
      description:
        'Cladget is a financial dashboard for humans and agents that unifies revenue and cost data from Stripe, AWS, OpenAI, Vercel, GitHub, Google Cloud and more — real-time profit, burn rate, runway and AI-powered insights.',
      publisher: { '@type': 'Organization', name: 'Kelnix', url: SITE },
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
        { '@type': 'Offer', price: '12', priceCurrency: 'USD', name: 'Pro' },
        { '@type': 'Offer', price: '29', priceCurrency: 'USD', name: 'Pro AI' },
        { '@type': 'Offer', price: '79', priceCurrency: 'USD', name: 'Team' },
      ],
    },
  },
  'custom-ai-integration': {
    title: 'Custom AI Integration for Companies — Any Service | Kelnix',
    description:
      'Kelnix integrates AI into any company and any service: customer support, RAG over internal docs, workflow automation, data analysis, sales and more. LLM orchestration and autonomous agents connected to your existing tools. Get a free consultation.',
    keywords:
      'custom AI integration, AI integration for companies, enterprise AI, LLM integration, AI automation, RAG, AI chatbot, workflow automation, AI consulting, OpenAI integration, Anthropic integration, AI agents, Kelnix',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Custom AI Integration',
      name: 'Custom AI Integration for Companies',
      provider: { '@type': 'Organization', name: 'Kelnix', url: SITE },
      areaServed: 'Worldwide',
      url: `${SITE}/custom-ai-integration`,
      description:
        'Kelnix integrates AI into any company and any service — customer support, internal knowledge (RAG), workflow automation, data analysis, sales and more. From LLM orchestration to autonomous agents, connected to the tools you already use.',
    },
  },
  'products/receipt-mcp': {
    title: 'Kelnix Receipt MCP API — Receipts to Structured JSON',
    description:
      'Turn any receipt into structured, accounting-ready JSON or Markdown with one API call. AI vision extracts merchant, date, line items, tax and totals, and suggests GL accounts.',
    keywords:
      'receipt API, receipt OCR, MCP server, receipt to JSON, accounting API, AI vision receipts, Kelnix',
  },
  'products/datamind-curator': {
    title: 'Kelnix DataMind Curator — AI-Ready Data & Context API',
    description:
      'AI-Ready Data & Context Engineering API. Connect any data source, query with natural language, clean data, build AI context and redact PII.',
    keywords:
      'data curation API, RAG API, context engineering, natural language query, PII redaction, MCP, Kelnix',
  },
  'products/nibs': {
    title: 'Nibs — Fun Casual Mobile Game | Kelnix',
    description:
      'Nibs is a fun, casual mobile game where you guide Nibs the bird through challenges. Simple to pick up, hard to put down. Free on Google Play.',
    keywords: 'Nibs game, casual mobile game, Android game, Kelnix game',
  },
  nibs: {
    title: 'Nibs — Privacy Policy | Kelnix',
    description: 'Privacy policy for the Nibs mobile game by Kelnix.',
    keywords: 'Nibs privacy policy, Kelnix',
  },
};

const esc = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const template = readFileSync(resolve(dist, 'index.html'), 'utf8');

for (const [route, meta] of Object.entries(routes)) {
  const canonical = `${SITE}/${route}`;
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`);
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${esc(meta.description)}" />`,
  );
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace(
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
  );
  html = html.replace(
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
  );
  html = html.replace(
    /<meta name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
  );
  html = html.replace(
    /<meta name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
  );
  if (meta.keywords) {
    html = html.replace(
      /<meta name="keywords"[^>]*>/,
      `<meta name="keywords" content="${esc(meta.keywords)}" />`,
    );
  }
  if (meta.jsonLd) {
    const ld = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c');
    html = html.replace(
      '<!-- Single Page Apps for GitHub Pages -->',
      `<script type="application/ld+json">${ld}</script>\n    <!-- Single Page Apps for GitHub Pages -->`,
    );
  }

  const dir = resolve(dist, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html);
}

console.log(`Prerendered ${Object.keys(routes).length} routes with per-route SEO`);
