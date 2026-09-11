import type { GuideMeta } from '~/types/guides'

export const meta: GuideMeta = {
  features: {
    defaultLayout: 'split',
    terminal: false,
    fileTree: false,
    console: true,
  },
  template: 'vue',
  startingFile: 'src/App.vue',
  ignoredFiles: ['package.json', 'main.js', 'tsconfig.node.json', 'vite.config.ts', 'App.vue', 'index.html', 'src/main.ts'],
  sessionName: 'conditional-challenge',
  validation: {
    challenge: 'conditional-challenge',
  },
}
