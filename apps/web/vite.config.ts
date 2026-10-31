import { fileURLToPath } from 'node:url';
import mdx from '@mdx-js/rollup';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig, type Plugin } from 'vite';
import { parse } from 'yaml';

// Versión publicada: la inyecta el despliegue (ver scripts/deploy.sh)
const commit = process.env.GIT_COMMIT ?? 'dev';
const buildDate = process.env.BUILD_DATE ?? new Date().toISOString();

const contentDir = fileURLToPath(new URL('../../content', import.meta.url));
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// Permite importar archivos .yaml de content/ como objetos
function yamlPlugin(): Plugin {
  return {
    name: 'content-yaml',
    transform(code, id) {
      if (!id.endsWith('.yaml')) return null;
      return { code: `export default ${JSON.stringify(parse(code))};`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [
    yamlPlugin(),
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
      }),
    },
    react({ include: /\.(mdx|tsx?)$/ }),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@content': contentDir },
  },
  define: {
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
  },
  server: {
    fs: { allow: [repoRoot] },
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
