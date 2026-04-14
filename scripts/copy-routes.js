import { cpSync, mkdirSync } from 'fs';
import { resolve } from 'path';

// SPA routes that need their own index.html for GitHub Pages to return 200
const routes = [
  'nibs',
  'tinywins',
  'tinywins/terms',
  'tinywins/delete-account',
  'products',
  'products/tinywins',
  'products/nibs',
  'products/receipt-mcp',
  'products/datamind-curator',
];

const dist = resolve(import.meta.dirname, '..', 'dist');

for (const route of routes) {
  const dir = resolve(dist, route);
  mkdirSync(dir, { recursive: true });
  cpSync(resolve(dist, 'index.html'), resolve(dir, 'index.html'));
}

console.log(`Copied index.html to ${routes.length} route directories`);
