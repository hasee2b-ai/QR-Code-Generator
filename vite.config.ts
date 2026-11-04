import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {type Plugin} from 'vite';
import {defineConfig} from 'vitest/config';
import {buildFaqPageJsonLd, buildWebApplicationJsonLd} from './src/data/content';

/**
 * Injects JSON-LD built from src/data/content.ts into the region between the
 * JSON-LD:START / JSON-LD:END markers in index.html, so the visible copy and
 * the structured data can never drift apart.
 *
 * The site URL is read from the canonical tag (falling back to og:url), which
 * keeps index.html the single source of truth for the production domain.
 */
function seoJsonLd(): Plugin {
  const START = '<!-- JSON-LD:START -->';
  const END = '<!-- JSON-LD:END -->';

  return {
    name: 'seo-jsonld',
    transformIndexHtml(html) {
      const start = html.indexOf(START);
      const end = html.indexOf(END);

      if (start === -1 || end === -1 || end < start) {
        console.warn('[seo-jsonld] JSON-LD markers not found in index.html');
        return html;
      }

      const canonical =
        html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ??
        html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];

      if (!canonical) {
        console.warn('[seo-jsonld] No canonical/og:url found — JSON-LD left untouched');
        return html;
      }

      const blocks = [buildWebApplicationJsonLd(canonical), buildFaqPageJsonLd()]
        .map(
          (data) =>
            `    <script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n    </script>`
        )
        .join('\n');

      const injected = `${START}\n${blocks}\n    ${END}`;
      return html.slice(0, start) + injected + html.slice(end + END.length);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), seoJsonLd()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
