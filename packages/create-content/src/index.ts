#!/usr/bin/env node
import process from 'node:process'
import { cancel, intro, isCancel, outro, select } from '@clack/prompts'
import { createChallengeWizard } from './challenge'
import { createChapterWizard } from './chapter'
import { duplicateSolutionsWizard } from './duplicate-solutions'
import { createLessonWizard } from './lesson'
import { modifyLessonWizard } from './modify-lesson'
import { createQuizWizard } from './quiz'

async function main() {
  intro('Amoxtli Content Creator')

  const action = await select({
    message: 'What would you like to do?',
    options: [
      { value: 'chapter', label: 'Create a chapter (with optional lessons)' },
      { value: 'lesson', label: 'Create a lesson in an existing chapter' },
      { value: 'modify', label: 'Modify files for an existing lesson' },
      { value: 'quiz', label: 'Create a quiz (structure + English strings)' },
      { value: 'challenge', label: 'Create a challenge (bank structure + English strings)' },
      { value: 'duplicate', label: 'Duplicate files/ → solutions/ for a lesson' },
    ],
  })

  if (isCancel(action)) {
    cancel('Cancelled')
    process.exit(0)
  }

  switch (action) {
    case 'chapter':
      await createChapterWizard()
      break
    case 'lesson':
      await createLessonWizard()
      break
    case 'modify':
      await modifyLessonWizard()
      break
    case 'quiz':
      await createQuizWizard()
      break
    case 'challenge':
      await createChallengeWizard()
      break
    case 'duplicate':
      await duplicateSolutionsWizard()
      break
  }

  outro('Done!')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
