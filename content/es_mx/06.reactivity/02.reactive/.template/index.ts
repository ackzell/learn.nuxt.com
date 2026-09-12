import type { GuideMeta } from '~/types/guides'

export const meta: GuideMeta = {
  features: {
    defaultLayout: 'split',
    fileTree: false,
    terminal: true,
    console: true,
  },
  template: 'vue',
  startingFile: 'src/App.vue',
  ignoredFiles: ['package.json', 'main.js', 'tsconfig.node.json', 'vite.config.ts', 'App.vue', 'index.html', 'src/main.ts'],
  sessionName: 'ref',
  buttonSolutionMessage: 'original-vs-reactive-object',
  buttonResetMessage: 'player-example',
}
