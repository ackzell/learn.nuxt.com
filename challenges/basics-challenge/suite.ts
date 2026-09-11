import { check, checks, expect } from 'harness'

export default checks([
  check('mounts-app', {
    run({ doc }) {
      const el = [...doc.querySelectorAll('*')].find(node => (node as any).__vue_app__)
      expect(!!el).toBe(true)
    },
  }),
  check('renders-greeting', {
    run({ doc }) {
      const text = doc.body?.querySelector('div')?.textContent
      expect(text).toContain('Hola Vue!')
    },
  }),
  check('shows-version', {
    run({ doc }) {
      const text = doc.body?.textContent ?? ''
      if (!/3\.\d+\.\d+/.test(text))
        throw new Error('No Vue version was found on the page')
    },
  }),
])
