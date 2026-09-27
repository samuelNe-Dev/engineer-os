export const STORAGE_KEY = 'engineer-os:v1'
export const steps = ['learn', 'build', 'speak'] as const
export type Step = (typeof steps)[number]
export type SessionProgress = {
  learn: boolean
  build: boolean
  speak: boolean
  completedAt?: string
}
export type Rating = {
  clarity: number
  volume: number
  structure: number
  pace: number
  confidence: number
}
export type SpeakingEntry = {
  id: string
  sessionId: string
  date: string
  prompt: string
  seconds: number
  ratings: Rating
  note: string
}
export type State = {
  version: 1
  startDate: string
  sessions: Record<string, SessionProgress>
  skills: Record<string, number>
  speaking: SpeakingEntry[]
}
export const emptyState = (): State => ({
  version: 1,
  startDate: '2026-09-28',
  sessions: {},
  skills: {},
  speaking: [],
})
export const emptyProgress = (): SessionProgress => ({
  learn: false,
  build: false,
  speak: false,
})
export const sessionId = (week: number, day: number) =>
  `w${week + 1}-d${day + 1}`
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function validDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  )
}
export function dayDiff(a: string, b: string) {
  return Math.round(
    (Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 86400000,
  )
}
export function addDays(date: string, days: number) {
  return new Date(Date.parse(date + 'T12:00:00Z') + days * 86400000)
    .toISOString()
    .slice(0, 10)
}
export function programPosition(start: string, today = localDate()) {
  const offset = dayDiff(today, start)
  const bounded = Math.max(0, Math.min(167, offset))
  return {
    week: Math.floor(bounded / 7),
    day: bounded % 7,
    before: offset < 0,
    after: offset >= 168,
    offset,
  }
}
export function isComplete(p?: SessionProgress) {
  return !!p && steps.every((step) => p[step])
}
export function setStep(
  state: State,
  id: string,
  step: Step,
  value: boolean,
  date = localDate(),
): State {
  const progress = { ...(state.sessions[id] ?? emptyProgress()), [step]: value }
  if (isComplete(progress)) progress.completedAt ??= date
  else delete progress.completedAt
  return { ...state, sessions: { ...state.sessions, [id]: progress } }
}
export function streak(state: State, today = localDate()) {
  const dates = new Set(
    Object.values(state.sessions)
      .filter(isComplete)
      .map((p) => p.completedAt),
  )
  let date = dates.has(today) ? today : addDays(today, -1)
  let count = 0
  while (dates.has(date)) {
    count++
    date = addDays(date, -1)
  }
  return count
}
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
export function validateState(value: unknown): State {
  if (
    !isObject(value) ||
    value.version !== 1 ||
    !validDate(value.startDate) ||
    !isObject(value.sessions) ||
    !isObject(value.skills) ||
    !Array.isArray(value.speaking)
  )
    throw new Error('This is not a valid Engineer OS backup.')
  const result = emptyState()
  result.startDate = value.startDate
  for (const [key, p] of Object.entries(value.sessions)) {
    if (
      !/^w([1-9]|1[0-9]|2[0-4])-d[1-6]$/.test(key) ||
      !isObject(p) ||
      !steps.every((s) => typeof p[s] === 'boolean') ||
      (p.completedAt !== undefined && !validDate(p.completedAt))
    )
      throw new Error('The backup contains invalid session data.')
    result.sessions[key] = {
      learn: p.learn as boolean,
      build: p.build as boolean,
      speak: p.speak as boolean,
      ...(typeof p.completedAt === 'string'
        ? { completedAt: p.completedAt }
        : {}),
    }
  }
  for (const [key, level] of Object.entries(value.skills)) {
    if (
      !/^([0-9])$/.test(key) ||
      !Number.isInteger(level) ||
      (level as number) < 0 ||
      (level as number) > 4
    )
      throw new Error('The backup contains an invalid skill level.')
    result.skills[key] = level as number
  }
  if (value.speaking.length > 10000) throw new Error('The backup is too large.')
  result.speaking = value.speaking.map((entry) => {
    if (
      !isObject(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.sessionId !== 'string' ||
      !/^w([1-9]|1[0-9]|2[0-4])-d[1-6]$/.test(entry.sessionId) ||
      !validDate(entry.date) ||
      typeof entry.prompt !== 'string' ||
      entry.prompt.length > 2000 ||
      typeof entry.seconds !== 'number' ||
      !Number.isFinite(entry.seconds) ||
      entry.seconds < 0 ||
      entry.seconds > 3600 ||
      typeof entry.note !== 'string' ||
      entry.note.length > 2000 ||
      !isObject(entry.ratings) ||
      !['clarity', 'volume', 'structure', 'pace', 'confidence'].every(
        (k) =>
          Number.isInteger((entry.ratings as Record<string, unknown>)[k]) &&
          (entry.ratings as Record<string, number>)[k] >= 1 &&
          (entry.ratings as Record<string, number>)[k] <= 5,
      )
    )
      throw new Error('The backup contains invalid speaking data.')
    return entry as SpeakingEntry
  })
  return result
}
export function loadState(): { state: State; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return {
      state: raw ? validateState(JSON.parse(raw)) : emptyState(),
      error: '',
    }
  } catch {
    return {
      state: emptyState(),
      error:
        'Saved progress could not be read. Export or restore a backup in Settings before saving new progress.',
    }
  }
}
