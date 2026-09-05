import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// @vitest-environment happy-dom
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import Quiz from '../components/content/Quiz.vue'

const { recordAttempt, recordPass, quiz } = vi.hoisted(() => ({
  recordAttempt: vi.fn(),
  recordPass: vi.fn(),
  quiz: {
    id: 'checkpoint',
    title: 'Checkpoint',
    passThreshold: 100,
    feedback: 'submit',
    questions: [
      {
        id: 'sum',
        type: 'mcq',
        prompt: 'What is 2+2?',
        options: [
          { id: 'two', label: 'Two' },
          { id: 'four', label: 'Four' },
        ],
        answer: ['four'],
      },
      {
        id: 'ref-reactive',
        type: 'tf',
        prompt: 'Is ref() reactive?',
        options: [
          { id: 'true', label: 'True' },
          { id: 'false', label: 'False' },
        ],
        answer: ['true'],
      },
      {
        id: 'fw-choice',
        type: 'scq',
        prompt: 'Which framework?',
        options: [
          { id: 'vue', label: 'Vue' },
          { id: 'react', label: 'React' },
          { id: 'svelte', label: 'Svelte' },
        ],
        answer: ['vue'],
      },
    ],
  },
}))

vi.mock('~/composables/useQuiz', async (importOriginal) => {
  const original = await importOriginal<typeof import('../composables/useQuiz')>()
  return {
    ...original,
    useQuiz: () => ({ data: ref(quiz) }),
  }
})

vi.mock('~/composables/useQuizProgress', () => ({
  useQuizProgress: () => ({ isCompleted: () => false }),
}))

vi.mock('~/db/quizzes', () => ({
  quizzes: { recordPass, recordAttempt },
}))

beforeEach(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('onMounted', onMounted)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('useRoute', () => ({ path: '/en/basics/quiz' }))
  recordPass.mockClear()
  recordAttempt.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

const stubs = {
  MDC: { props: { value: String }, template: '<span>{{ value }}</span>' },
}
const mocks = {
  $t: (key: string, params?: Record<string, unknown>) =>
    key === 'quiz.score' ? `${params!.score}/${params!.total}` : key,
}

function mountQuiz() {
  return mount(Quiz, {
    props: { id: 'checkpoint', sessionName: 'quiz-x' },
    global: { stubs, mocks },
  })
}

function clickOption(wrapper: ReturnType<typeof mountQuiz>, label: string) {
  const opt = wrapper.findAll('label').find(l => l.text().includes(label))!
  return opt.find('input').setValue(true)
}

describe('quiz component', () => {
  it('does not reveal correct answers before submitting', () => {
    const wrapper = mountQuiz()
    expect(wrapper.find('.i-mynaui-check-solid').exists()).toBe(false)
    expect(wrapper.find('[data-testid="quiz-submit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quiz-score"]').exists()).toBe(false)
  })

  it('disables submit until all questions are answered, then records a failed attempt on wrong answers', async () => {
    const wrapper = mountQuiz()
    const submit = wrapper.find('[data-testid="quiz-submit"]')
    expect(submit.attributes('disabled')).toBeDefined()
    expect(recordAttempt).not.toHaveBeenCalled()
    await clickOption(wrapper, 'Two')
    await clickOption(wrapper, 'False')
    await clickOption(wrapper, 'React')
    expect(submit.attributes('disabled')).toBeUndefined()
    await submit.trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="quiz-score"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quiz-submit"]').exists()).toBe(false)
    expect(recordAttempt).toHaveBeenCalledWith('quiz-x', 0)
    expect(recordPass).not.toHaveBeenCalled()
  })

  it('grades correct selections, shows checkmarks and records a pass', async () => {
    const wrapper = mountQuiz()
    await clickOption(wrapper, 'Four')
    await clickOption(wrapper, 'True')
    await clickOption(wrapper, 'Vue')
    expect(wrapper.find('.i-mynaui-check-solid').exists()).toBe(false)
    await wrapper.find('[data-testid="quiz-submit"]').trigger('click')
    await nextTick()
    expect(wrapper.findAll('.i-mynaui-check-solid').length).toBe(3)
    expect(wrapper.find('[data-testid="quiz-score"]').text()).toContain('3/3')
    expect(recordPass).toHaveBeenCalledWith('quiz-x', 100)
    expect(recordAttempt).not.toHaveBeenCalled()
  })

  it('retake clears selections and returns to answer mode', async () => {
    const wrapper = mountQuiz()
    await clickOption(wrapper, 'Four')
    await clickOption(wrapper, 'True')
    await clickOption(wrapper, 'Vue')
    await wrapper.find('[data-testid="quiz-submit"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="quiz-retake"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="quiz-score"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="quiz-submit"]').exists()).toBe(true)
  })

  it('renders radio inputs for scq/tf and checkbox for mcq', () => {
    const wrapper = mountQuiz()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    const radios = wrapper.findAll('input[type="radio"]')
    expect(checkboxes.length).toBe(2)
    expect(radios.length).toBe(5)
  })

  it('reshuffles option order on retake', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.999)
    const wrapper = mountQuiz()
    await nextTick()
    const getTFOptions = () =>
      wrapper.findAll('label')
        .filter(l => ['True', 'False'].includes(l.text().trim()))
        .map(l => l.text().trim())
    const before = getTFOptions()
    randomSpy.mockReturnValue(0.001)
    await clickOption(wrapper, 'Four')
    await clickOption(wrapper, 'True')
    await clickOption(wrapper, 'Vue')
    await wrapper.find('[data-testid="quiz-submit"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="quiz-retake"]').trigger('click')
    await nextTick()
    const after = getTFOptions()
    expect(before).not.toEqual(after)
    randomSpy.mockRestore()
  })
})
