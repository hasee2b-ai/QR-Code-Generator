import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {readFileSync} from 'node:fs';
import path from 'path';
import {type Plugin} from 'vite';
import {defineConfig} from 'vitest/config';
import {buildFaqPageJsonLd, buildWebApplicationJsonLd} from './src/data/content';

/** App version, injected into the client as `__APP_VERSION__`. */
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')) as {
  version: string;
};

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
    // Exposes the package.json version to the client (see src/vite-env.d.ts).
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
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
      // Instrumented (coverage) runs are slower than plain runs.
      testTimeout: 30000,
      coverage: {
        provider: 'v8' as const,
        reporter: ['text', 'html', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/test/**',
          'src/vite-env.d.ts',
          'src/main.tsx',
        ],
        // Thresholds set from the measured run (60.52% stmts, 56.27% branch,
        // 54% funcs, 62.61% lines) — each sits below its measurement.
        thresholds: {
          statements: 58,
          branches: 54,
          functions: 52,
          lines: 60,
        },
      },
    },
  };
});
