// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import {
  check,
  checks,
  expect as hExpect,
  mount as hMount,
  runSuiteModule,
} from '../templates/vue/__challenge__/harness.ts'

describe('vue harness — checks with ctx.mount', () => {
  it('can mount a Vue component and assert against its rendered DOM', async () => {
    const mod = checks([
      check('mounts and renders greeting', {
        run({ mount }) {
          const wrapper = mount({
            template: '<h1>Hello from test</h1>',
          })
          hExpect(wrapper.text()).toContain('Hello from test')
          hExpect(wrapper.find('h1').exists()).toBeTruthy()
        },
      }),
    ])
    const result = await runSuiteModule(mod)
    expect(result.passed).toBe(true)
    expect(result.tests[0]!.passed).toBe(true)
  })

  it('fails a mount check that asserts wrong content', async () => {
    const mod = checks([
      check('wrong content fails', {
        run({ mount }) {
          const wrapper = mount({ template: '<p>actual</p>' })
          hExpect(wrapper.text()).toBe('expected')
        },
      }),
    ])
    const result = await runSuiteModule(mod)
    expect(result.passed).toBe(false)
    expect(result.tests[0]!.passed).toBe(false)
    expect(result.tests[0]!.message.length).toBeGreaterThan(0)
  })

  it('exposes hMount as the Vue Test Utils mount', () => {
    expect(typeof hMount).toBe('function')
  })

  it('explicitly fails an empty checks() suite', async () => {
    const result = await runSuiteModule(checks([]))
    expect(result.passed).toBe(false)
    expect(result.empty).toBe(true)
    expect(result.tests[0]!.message).toContain('Empty suite')
  })

  it('supports a failing async check', async () => {
    const mod = checks([
      check('async', {
        async run() {
          await new Promise(r => setTimeout(r, 5))
          hExpect([1, 2, 3]).toContain(99)
        },
      }),
    ])
    const result = await runSuiteModule(mod)
    expect(result.passed).toBe(false)
    expect(result.tests[0]!.passed).toBe(false)
  })
})
