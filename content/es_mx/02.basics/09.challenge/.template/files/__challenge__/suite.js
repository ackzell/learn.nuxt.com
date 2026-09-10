import { check, checks, expect } from './harness.js'

export default checks([
  check('Mounts a Vue app', {
    hint: 'Expected Vue to be mounted with createApp().mount()',
    run({ doc }) {
      const el = [...doc.querySelectorAll('*')].find(node => node.__vue_app__)
      expect(!!el).toBe(true)
      expect(el.textContent).toContain('Hola Vue!')
    },
  }),
  check('Renders the greeting', {
    hint: 'Expected "Hola Vue!" to be rendered on the page',
    run({ doc }) {
      const text = doc.body?.textContent ?? ''
      expect(text).toContain('Hola Vue!')
    },
  }),
  check('Shows the Vue version', {
    hint: 'Expected a Vue version number (like 3.5.32) to be shown',
    run({ doc }) {
      const text = doc.body?.textContent ?? ''
      if (!/3\.\d+\.\d+/.test(text))
        throw new Error('No Vue version was found on the page')
    },
  }),
])
