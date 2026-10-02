import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// `--mode demo` builds a single self-contained HTML file that runs with no server (data in localStorage).
export default defineConfig(({ mode }) => {
  const demo = mode === 'demo';
  return {
    root: r('.'),
    plugins: [react(), tailwindcss(), ...(demo ? [viteSingleFile()] : [])],
    resolve: { alias: { '@shared': r('../shared') } },
    define: demo ? { 'import.meta.env.VITE_DEMO': JSON.stringify('1') } : {},
    server: {
      port: 5173,
      fs: { allow: [r('..')] },
      proxy: {
        '/api': 'http://localhost:4000',
        '/sites': 'http://localhost:4000',
      },
    },
    build: { outDir: r(demo ? 'dist-demo' : 'dist'), emptyOutDir: true },
  };
});
