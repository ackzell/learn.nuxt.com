import type { QuizMapEntry } from '~/types/quiz'

import { describe, expect, it } from 'vitest'
import { gradeQuiz, normalizeLessonPath, resolveQuiz } from '~/composables/useQuiz'
import { validateQuizStrings, validateQuizStructure } from '~/lib/quiz-validation'

const scqFixture: QuizMapEntry = {
  id: 'scq-demo',
  structure: {
    passThreshold: 80,
    feedback: 'submit',
    questions: [
      { id: 'framework', type: 'scq', options: ['vue', 'react', 'svelte'], answer: ['vue'] },
    ],
  },
  strings: {
    en: {
      title: 'scq demo',
      questions: {
        framework: {
          prompt: 'Which framework is this app built with?',
          options: { vue: 'Vue', react: 'React', svelte: 'Svelte' },
          explanation: 'Vue',
        },
      },
    },
  },
}

const fixtureMap: Record<string, QuizMapEntry> = {
  'ref-unwrapping': {
    id: 'ref-unwrapping',
    structure: {
      passThreshold: 80,
      feedback: 'submit',
      questions: [
        { id: 'script-access', type: 'mcq', options: ['dot-value', 'auto-unwrapped', 'proxies'], answer: ['dot-value'] },
        { id: 'template-access', type: 'tf', options: ['true', 'false'], answer: ['true'] },
      ],
    },
    strings: {
      en: {
        title: 'ref() check',
        questions: {
          'script-access': {
            prompt: 'How do we read it?',
            options: { 'dot-value': '`message.value`', 'auto-unwrapped': 'message', 'proxies': 'proxies' },
            explanation: 'Use .value',
          },
          'template-access': {
            prompt: 'True or false?',
            options: { true: 'True', false: 'False' },
            explanation: 'Yes',
          },
        },
      },
      es_mx: {
        title: 'Comprobación de ref()',
        questions: {
          'script-access': {
            prompt: '¿Cómo lo leemos?',
            options: { 'dot-value': '`message.value`', 'auto-unwrapped': 'message', 'proxies': 'proxies' },
            explanation: 'Usa .value',
          },
          'template-access': {
            prompt: '¿Verdadero o falso?',
            options: { true: 'Verdadero', false: 'Falso' },
            explanation: 'Sí',
          },
        },
      },
    },
  },
}

describe('resolveQuiz', () => {
  it('merges structure with strings for the requested locale', () => {
    const quiz = resolveQuiz(fixtureMap, 'ref-unwrapping', 'en')!
    expect(quiz.title).toBe('ref() check')
    expect(quiz.questions).toHaveLength(2)
    expect(quiz.questions[0]!.prompt).toBe('How do we read it?')
    expect(quiz.questions[0]!.options[0]).toEqual({ id: 'dot-value', label: '`message.value`' })
    expect(quiz.questions[0]!.answer).toEqual(['dot-value'])
  })

  it('resolves es_mx strings when that locale is requested', () => {
    const quiz = resolveQuiz(fixtureMap, 'ref-unwrapping', 'es_mx')!
    expect(quiz.questions[0]!.prompt).toBe('¿Cómo lo leemos?')
    expect(quiz.questions[1]!.options.find(o => o.id === 'true')!.label).toBe('Verdadero')
  })

  it('falls back to en strings when the locale has none', () => {
    const quiz = resolveQuiz(fixtureMap, 'ref-unwrapping', 'de')!
    expect(quiz.questions[0]!.prompt).toBe('How do we read it?')
  })

  it('falls back to raw option ids for missing labels', () => {
    const map: any = structuredClone(fixtureMap)
    delete map['ref-unwrapping'].strings.en.questions['script-access'].options
    const quiz = resolveQuiz(map, 'ref-unwrapping', 'en')!
    expect(quiz.questions[0]!.options).toEqual([
      { id: 'dot-value', label: 'dot-value' },
      { id: 'auto-unwrapped', label: 'auto-unwrapped' },
      { id: 'proxies', label: 'proxies' },
    ])
  })

  it('returns null for an unknown quiz id', () => {
    expect(resolveQuiz(fixtureMap, 'nope', 'en')).toBeNull()
  })
})

describe('gradeQuiz', () => {
  function resolvedQuiz(): ReturnType<typeof resolveQuiz> {
    return resolveQuiz(fixtureMap, 'ref-unwrapping', 'en')
  }

  it('passes when every question matches exactly', () => {
    const res = gradeQuiz(resolvedQuiz()!, {
      'script-access': ['dot-value'],
      'template-access': ['true'],
    })
    expect(res.score).toBe(2)
    expect(res.total).toBe(2)
    expect(res.percentage).toBe(100)
    expect(res.passed).toBe(true)
    expect(res.questions.every(q => q.correct)).toBe(true)
  })

  it('fails below the pass threshold', () => {
    const res = gradeQuiz(resolvedQuiz()!, {
      'script-access': ['auto-unwrapped'],
      'template-access': ['true'],
    })
    expect(res.score).toBe(1)
    expect(res.percentage).toBe(50)
    expect(res.passed).toBe(false)
    expect(res.questions[0]!.correct).toBe(false)
  })

  it('requires exact option set equality for multi-select (no partial credit)', () => {
    const res = gradeQuiz(resolvedQuiz()!, {
      'script-access': ['dot-value', 'proxies'],
      'template-access': ['true'],
    })
    expect(res.questions[0]!.correct).toBe(false)
    expect(res.score).toBe(1)
  })

  it('grades an scq question by exact single-answer match', () => {
    const quiz = resolveQuiz({ 'scq-demo': scqFixture }, 'scq-demo', 'en')!
    expect(gradeQuiz(quiz, { framework: ['vue'] }).questions[0]!.correct).toBe(true)
    expect(gradeQuiz(quiz, { framework: ['react'] }).questions[0]!.correct).toBe(false)
  })

  it('rounds the percentage and honors the threshold boundary', () => {
    const res = gradeQuiz(resolvedQuiz()!, {
      'script-access': ['dot-value'],
      'template-access': ['true'],
    })
    expect(res.percentage).toBe(100)
    expect(res.passed).toBe(true)
  })

  it('treats unanswered questions as incorrect', () => {
    const res = gradeQuiz(resolvedQuiz()!, {})
    expect(res.score).toBe(0)
    expect(res.percentage).toBe(0)
    expect(res.passed).toBe(false)
  })
})

describe('normalizeLessonPath', () => {
  it('strips numeric lesson prefixes', () => {
    expect(normalizeLessonPath('/en/02.basics/11.quiz')).toBe('/en/basics/quiz')
  })
  it('handle multi-part logic-less paths and trailing slashes', () => {
    expect(normalizeLessonPath('/es_mx/06.reactivity/01.ref/')).toBe('/es_mx/reactivity/ref')
  })
})

describe('validateQuizStructure', () => {
  it('accepts a valid structure', () => {
    expect(() => validateQuizStructure(fixtureMap['ref-unwrapping']!.structure)).not.toThrow()
  })

  it('accepts a valid scq structure', () => {
    expect(() => validateQuizStructure(scqFixture.structure)).not.toThrow()
  })

  it('rejects an scq question with fewer than 2 options', () => {
    expect(() => validateQuizStructure({
      passThreshold: 80,
      feedback: 'submit',
      questions: [{ id: 'q', type: 'scq', options: ['a'], answer: ['a'] }],
    })).toThrow(/at least 2 options/)
  })

  it('rejects an scq question with more than one answer', () => {
    expect(() => validateQuizStructure({
      passThreshold: 80,
      feedback: 'submit',
      questions: [{ id: 'q', type: 'scq', options: ['a', 'b'], answer: ['a', 'b'] }],
    })).toThrow(/exactly one answer/)
  })

  it('rejects a tf question without exactly 2 options', () => {
    expect(() => validateQuizStructure({
      passThreshold: 80,
      feedback: 'submit',
      questions: [{ id: 'q', type: 'tf', options: ['true'], answer: ['true'] }],
    })).toThrow(/exactly 2 options/)
  })

  it('rejects answers that are not options', () => {
    expect(() => validateQuizStructure({
      passThreshold: 80,
      feedback: 'submit',
      questions: [{ id: 'q', type: 'mcq', options: ['a', 'b'], answer: ['z'] }],
    })).toThrow(/not one of the options/)
  })

  it('rejects a passThreshold outside 0-100', () => {
    expect(() => validateQuizStructure({
      passThreshold: 120,
      feedback: 'submit',
      questions: [{ id: 'q', type: 'mcq', options: ['a'], answer: ['a'] }],
    })).toThrow(/passThreshold/)
  })

  it('rejects duplicate question ids', () => {
    expect(() => validateQuizStructure({
      passThreshold: 80,
      feedback: 'submit',
      questions: [
        { id: 'q', type: 'mcq', options: ['a'], answer: ['a'] },
        { id: 'q', type: 'mcq', options: ['a'], answer: ['a'] },
      ],
    })).toThrow(/duplicate question id/)
  })

  it('rejects a tf question with more than one answer', () => {
    expect(() => validateQuizStructure({
      passThreshold: 80,
      feedback: 'submit',
      questions: [{ id: 'q', type: 'tf', options: ['true', 'false'], answer: ['true', 'false'] }],
    })).toThrow(/exactly one answer/)
  })

  it('rejects feedback modes other than submit', () => {
    expect(() => validateQuizStructure({
      passThreshold: 80,
      feedback: 'immediate' as any,
      questions: [{ id: 'q', type: 'mcq', options: ['a'], answer: ['a'] }],
    })).toThrow(/immediate mode is not supported yet/)
  })
})

describe('validateQuizStrings', () => {
  it('returns no problems when strings fully cover the structure', () => {
    const problems = validateQuizStrings(
      fixtureMap['ref-unwrapping']!.structure,
      fixtureMap['ref-unwrapping']!.strings.en!,
    )
    expect(problems).toEqual([])
  })

  it('reports a missing prompt', () => {
    const strings: any = structuredClone(fixtureMap['ref-unwrapping']!.strings.en!)
    delete strings.questions['script-access'].prompt
    const problems = validateQuizStrings(fixtureMap['ref-unwrapping']!.structure, strings)
    expect(problems.some(p => p.includes('missing prompt'))).toBe(true)
  })

  it('reports a missing option label', () => {
    const strings: any = structuredClone(fixtureMap['ref-unwrapping']!.strings.es_mx!)
    delete strings.questions['template-access'].options.true
    const problems = validateQuizStrings(fixtureMap['ref-unwrapping']!.structure, strings)
    expect(problems.some(p => p.includes('option label "true"'))).toBe(true)
  })

  it('reports a question with no strings at all', () => {
    const strings = { title: 'x', questions: {} }
    const problems = validateQuizStrings(fixtureMap['ref-unwrapping']!.structure, strings)
    expect(problems.some(p => p.includes('missing strings for'))).toBe(true)
  })
})
