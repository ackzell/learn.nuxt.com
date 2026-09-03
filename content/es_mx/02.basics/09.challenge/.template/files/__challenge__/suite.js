import { check, checks, expect } from './harness.js'

export default checks([
  check('Renders the greeting', {
    run({ doc }) {
      const el = doc.querySelector('#myApp p')
      expect(el && el.textContent).toContain('Hola Vue!')
    },
  }),
  check('Shows the Vue version', {
    run({ doc }) {
      const el = doc.querySelector('#myApp code')
      expect(el && el.textContent).toMatch(/3\.\d+\.\d+/)
    },
  }),
])
