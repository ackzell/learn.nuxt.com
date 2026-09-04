import type { GuideMeta } from '~/types/guides'

export const meta: GuideMeta = {
  startingFile: 'index.html',
  features: {
    defaultLayout: 'split',
    terminal: false,
    fileTree: false,
    console: true,
  },
  template: 'html',
  ignoredFiles: ['package.json', 'main.js', 'style.css', 'server.js'],
  sessionName: 'basics-challenge',
  validation: {
    file: '/__challenge__/suite.js',
  },
}
