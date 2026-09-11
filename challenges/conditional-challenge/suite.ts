import { check, checks, expect } from 'harness'
import App from '../src/App.vue'
import AppSource from '../src/App.vue?raw'

export default checks([
  check('uses-v-if', {
    run() {
      expect(AppSource).toMatch(/v-if[\s=]/)
    },
  }),
  check('uses-v-else-if', {
    run() {
      expect(AppSource).toMatch(/v-else-if[\s=]/)
    },
  }),
  check('uses-v-else', {
    run() {
      expect(AppSource).toMatch(/v-else(?!-if)/)
    },
  }),
  check('renders-current-branch', {
    run({ mount }) {
      const wrapper = mount(App)
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.msg-new').exists()).toBe(false)
      expect(wrapper.find('.msg-mid').exists()).toBe(true)
      expect(wrapper.find('.msg-done').exists()).toBe(false)
    },
  }),
])
