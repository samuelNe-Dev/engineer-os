import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addDays,
  dayDiff,
  emptyState,
  isComplete,
  programPosition,
  setStep,
  streak,
  validateState,
  validDate,
} from '../src/model.ts'
import { communication, phases, session, weeks } from '../src/curriculum.ts'

test('curriculum supplies 144 actionable sessions and 375 minutes each week', () => {
  assert.equal(weeks.length, 24)
  assert.equal(phases.length, 6)
  assert.equal(communication.length, 24)
  for (let w = 0; w < 24; w++) {
    assert.equal(weeks[w].lessons.length, 5)
    let minutes = 0
    for (let d = 0; d < 6; d++) {
      const s = session(w, d)
      assert.ok(s.title && s.learn && s.build && s.check)
      assert.equal(s.minutes, s.learnMinutes + s.buildMinutes + 5)
      minutes += s.minutes
    }
    assert.equal(minutes, 375)
  }
})
test('program handles pre-start, rest day, all 24 weeks and end', () => {
  const start = '2026-09-28'
  assert.deepEqual(programPosition(start, '2026-09-27'), {
    week: 0,
    day: 0,
    before: true,
    after: false,
    offset: -1,
  })
  assert.equal(programPosition(start, start).day, 0)
  assert.equal(programPosition(start, '2026-10-04').day, 6)
  assert.equal(programPosition(start, '2027-03-14').week, 23)
  assert.equal(programPosition(start, '2027-03-15').after, true)
})
test('calendar arithmetic is stable across DST and leap dates', () => {
  assert.equal(dayDiff('2026-10-26', '2026-10-24'), 2)
  assert.equal(addDays('2028-02-28', 1), '2028-02-29')
  assert.equal(addDays('2026-09-28', 167), '2027-03-14')
  assert.equal(validDate('2026-02-29'), false)
  assert.equal(validDate('not-a-date'), false)
})
test('completion requires all steps and supports undo without losing other work', () => {
  let s = emptyState()
  s = setStep(s, 'w1-d1', 'learn', true, '2026-09-28')
  s = setStep(s, 'w1-d1', 'build', true, '2026-09-28')
  assert.equal(isComplete(s.sessions['w1-d1']), false)
  s = setStep(s, 'w1-d1', 'speak', true, '2026-09-28')
  assert.equal(s.sessions['w1-d1'].completedAt, '2026-09-28')
  s = setStep(s, 'w1-d1', 'speak', true, '2026-09-29')
  assert.equal(s.sessions['w1-d1'].completedAt, '2026-09-28')
  s = setStep(s, 'w1-d1', 'build', false)
  assert.equal(s.sessions['w1-d1'].completedAt, undefined)
  assert.equal(s.sessions['w1-d1'].learn, true)
})
test('multiple sessions in one day count as one streak day', () => {
  let s = emptyState()
  for (const [id, date] of [
    ['w1-d1', '2026-09-28'],
    ['w1-d2', '2026-09-28'],
    ['w1-d3', '2026-09-29'],
  ])
    for (const step of ['learn', 'build', 'speak'])
      s = setStep(s, id, step, true, date)
  assert.equal(streak(s, '2026-09-29'), 2)
  assert.equal(streak(s, '2026-09-30'), 2)
  assert.equal(streak(s, '2026-10-01'), 0)
})
test('backup round trip preserves state and rejects corrupt/unsupported input', () => {
  const s = setStep(emptyState(), 'w24-d6', 'learn', true)
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))), s)
  for (const invalid of [
    null,
    { ...s, version: 2 },
    { ...s, startDate: '2026-02-31' },
    {
      ...s,
      sessions: { 'w25-d1': { learn: true, build: false, speak: false } },
    },
    { ...s, skills: { 0: 9 } },
    { ...s, speaking: [{ ratings: { clarity: NaN } }] },
  ])
    assert.throws(() => validateState(invalid))
})
test('speaking backup validates every rating and limits imported data', () => {
  const s = emptyState()
  s.speaking = [
    {
      id: 'test',
      sessionId: 'w1-d1',
      date: '2026-09-28',
      prompt: 'Explain a variable',
      seconds: 120,
      ratings: { clarity: 3, volume: 4, structure: 5, pace: 2, confidence: 3 },
      note: 'Pause more',
    },
  ]
  assert.deepEqual(validateState(s), s)
  assert.throws(() =>
    validateState({
      ...s,
      speaking: [
        { ...s.speaking[0], ratings: { ...s.speaking[0].ratings, pace: 0 } },
      ],
    }),
  )
})
