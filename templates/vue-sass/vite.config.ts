import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    noDiscovery: true,
    include: ['@vitest/expect', 'chai'],
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'legacy',
        silenceDeprecations: ['legacy-js-api'],
      },
      scss: {
        api: 'legacy',
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  plugins: [
    vue(),
    {
      name: 'playground-color-mode',
      transformIndexHtml(html) {
        return {
          html,
          tags: [
            {
              tag: 'style',
              attrs: {},
              injectTo: 'head',
              children: `
                html:not(.dark) body { background: #ffffff; color: #2c3e50; }
                html.dark body { background: #101010; color: #e5e7eb; }
                body { transition: background-color 0.15s, color 0.15s; }
              `,
            },
            {
              tag: 'script',
              attrs: {},
              injectTo: 'head',
              children: `
                window.addEventListener('message', function(e) {
                  if (e.data && e.data.source === 'nuxt-playground-color-mode') {
                    document.documentElement.classList.toggle('dark', e.data.mode === 'dark');
                  }
                });
                window.parent.postMessage({ source: 'nuxt-playground-color-mode-request' }, '*');
              `,
            },
          ],
        }
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
