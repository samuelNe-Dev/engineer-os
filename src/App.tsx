import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  communication,
  phases,
  resourceFor,
  session,
  skillLevels,
  skillNames,
  speakingPrompts,
  weeks,
} from './curriculum'
import {
  addDays,
  emptyProgress,
  isComplete,
  loadState,
  localDate,
  programPosition,
  sessionId,
  setStep,
  steps,
  STORAGE_KEY,
  streak,
  validDate,
  validateState,
} from './model'
import type { Rating, State, Step } from './model'
import { Icon } from './Icon'
import { Leo } from './Leo'

type Screen = 'today' | 'roadmap' | 'speak' | 'progress'
type Update = Dispatch<SetStateAction<State>>
const screenNames: Screen[] = ['today', 'roadmap', 'speak', 'progress']
const dateLabel = (
  value: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
) => new Date(value + 'T12:00:00').toLocaleDateString('en-GB', options)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function App() {
  const [initial] = useState(loadState)
  const [state, setState] = useState(initial.state)
  const [storageError, setStorageError] = useState(initial.error)
  const [screen, setScreen] = useState<Screen>(() =>
    screenNames.includes(location.hash.slice(1) as Screen)
      ? (location.hash.slice(1) as Screen)
      : 'today',
  )
  const [today, setToday] = useState(localDate)
  const current = programPosition(state.startDate, today)
  const [selected, setSelected] = useState<{
    week: number
    day: number
  } | null>(null)
  const view = selected ?? current
  const [settings, setSettings] = useState(false)
  const [notice, setNotice] = useState('')
  const [worker, setWorker] = useState<ServiceWorker | null>(null)
  const [offline, setOffline] = useState(!navigator.onLine)
  const [offlineReady, setOfflineReady] = useState(false)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (initial.error && storageError === initial.error) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      setStorageError('')
    } catch {
      setStorageError(
        'Progress could not be saved on this device. Export a backup in Settings before closing the app.',
      )
    }
  }, [state, initial.error, storageError])
  useEffect(() => {
    const refresh = () => setToday(localDate())
    const timer = window.setInterval(refresh, 30000)
    const hash = () => {
      const next = location.hash.slice(1) as Screen
      if (screenNames.includes(next)) setScreen(next)
    }
    const network = () => setOffline(!navigator.onLine)
    const update = (e: Event) =>
      setWorker((e as CustomEvent<ServiceWorker>).detail)
    const failed = () =>
      setNotice(
        'Offline setup did not finish. Reopen while connected to try again.',
      )
    const ready = () => setOfflineReady(true)
    if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(ready)
    window.addEventListener('hashchange', hash)
    window.addEventListener('online', network)
    window.addEventListener('offline', network)
    window.addEventListener('engineer-update', update)
    window.addEventListener('engineer-offline-unavailable', failed)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      clearInterval(timer)
      window.removeEventListener('hashchange', hash)
      window.removeEventListener('online', network)
      window.removeEventListener('offline', network)
      window.removeEventListener('engineer-update', update)
      window.removeEventListener('engineer-offline-unavailable', failed)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(id)
  }, [notice])
  function navigate(next: Screen) {
    setScreen(next)
    location.hash = next
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function openSession(week: number, day: number) {
    setSelected({ week, day })
    navigate('today')
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="app-header">
        <a
          className="wordmark"
          href="#today"
          onClick={() => {
            setSelected(null)
            navigate('today')
          }}
          aria-label="Engineer OS home"
        >
          <span className="brand-leaf" aria-hidden="true">
            <span />
          </span>
          <span className="brand-name">Engineer OS</span>
        </a>
        <button
          className="icon-button"
          aria-label="Open settings"
          onClick={() => setSettings(true)}
        >
          <Icon name="settings" />
        </button>
      </header>
      {offline && (
        <div className="connection-note">
          You’re offline.{' '}
          {offlineReady
            ? 'Your practice and progress still work.'
            : 'Previously loaded content is available.'}
        </div>
      )}
      {storageError && (
        <div className="warning" role="alert">
          {storageError}{' '}
          <button onClick={() => setSettings(true)}>Open settings</button>
        </div>
      )}
      {worker && (
        <div className="update-note">
          A fresh version is ready.
          <button
            onClick={() => {
              navigator.serviceWorker.addEventListener(
                'controllerchange',
                () => location.reload(),
                { once: true },
              )
              worker.postMessage({ type: 'SKIP_WAITING' })
            }}
          >
            Update app
          </button>
        </div>
      )}
      <main id="main" tabIndex={-1}>
        {screen === 'today' && (
          <Today
            state={state}
            update={setState}
            week={view.week}
            day={view.day}
            current={current}
            selected={!!selected}
            onToday={() => {
              setSelected(null)
              window.scrollTo(0, 0)
            }}
            onSpeak={() => navigate('speak')}
            onRoadmap={() => navigate('roadmap')}
            openSession={openSession}
          />
        )}
        {screen === 'roadmap' && (
          <Roadmap
            state={state}
            currentWeek={current.week}
            openSession={openSession}
          />
        )}
        <div hidden={screen !== 'speak'}>
          <Speak
            state={state}
            update={setState}
            week={view.week}
            day={Math.min(view.day, 5)}
            onSaved={() =>
              setNotice('Speaking practice saved. One more rep in the bank.')
            }
            onToday={() => navigate('today')}
          />
        </div>
        {screen === 'progress' && (
          <Progress
            state={state}
            update={setState}
            today={today}
            onToday={() => {
              setSelected(null)
              navigate('today')
            }}
          />
        )}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {screenNames.map((name) => (
          <a
            key={name}
            href={`#${name}`}
            aria-current={screen === name ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault()
              if (name === 'today') setSelected(null)
              navigate(name)
            }}
          >
            <span className="nav-icon">
              <Icon name={name} />
            </span>
            <span>{cap(name)}</span>
          </a>
        ))}
      </nav>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {settings && (
        <Settings
          state={state}
          update={setState}
          error={storageError}
          recover={() => setStorageError('')}
          offlineReady={offlineReady}
          onClose={() => setSettings(false)}
          onNotice={setNotice}
        />
      )}
    </div>
  )
}

function Today({
  state,
  update,
  week,
  day,
  current,
  selected,
  onToday,
  onSpeak,
  onRoadmap,
  openSession,
}: {
  state: State
  update: Update
  week: number
  day: number
  current: ReturnType<typeof programPosition>
  selected: boolean
  onToday: () => void
  onSpeak: () => void
  onRoadmap: () => void
  openSession: (w: number, d: number) => void
}) {
  const id = sessionId(week, day)
  const data = session(week, day)
  const progress = state.sessions[id] ?? emptyProgress()
  const done = isComplete(progress)
  const next = steps.find((step) => !progress[step]) ?? null
  const [chosen, setChosen] = useState<Step | null>(next)
  const [engaged, setEngaged] = useState<Step | null>(null)

  useEffect(() => {
    const nextStep =
      steps.find((step) => !state.sessions[sessionId(week, day)]?.[step]) ?? null
    setChosen(nextStep)
    setEngaged(null)
  }, [week, day, state.sessions])

  const active = chosen ?? next
  const date = addDays(state.startDate, week * 7 + day)
  const weekDone = Array.from({ length: 6 }, (_, d) =>
    isComplete(state.sessions[sessionId(week, d)]),
  ).filter(Boolean).length
  const completedSteps = steps.filter((step) => progress[step]).length

  const stage = {
    learn: {
      label: 'Understand',
      hero: 'Let’s learn.',
      sub: 'Get the concept clear before you build.',
      bubble: 'Start here.',
      title: 'Get it clear.',
      icon: 'book',
      minutes: data.learnMinutes,
      copy: data.learn,
      start: 'Start learning',
      finish: 'Got it. Let’s build.',
      mood: 'wave' as const,
    },
    build: {
      label: 'Build',
      hero: 'Let’s build.',
      sub: 'Hands-on practice makes the concept real.',
      bubble: 'Build mode.',
      title: 'Apply it yourself.',
      icon: 'code',
      minutes: data.buildMinutes,
      copy: data.build,
      start: 'Start building',
      finish: 'Built it. Let’s explain.',
      mood: 'focus' as const,
    },
    speak: {
      label: 'Explain',
      hero: 'Let’s explain.',
      sub: 'Say it clearly to make it stick.',
      bubble: 'You’ve got this.',
      title: 'Say it clearly.',
      icon: 'speak',
      minutes: 5,
      copy: communication[week][1],
      start: 'Start speaking',
      finish: 'Start speaking',
      mood: 'waiting' as const,
    },
  }

  const currentStage = active ? stage[active] : null

  function complete(step: Step) {
    update((s) => setStep(s, id, step, true))
    setEngaged(null)
  }

  function selectStep(step: Step) {
    if (step === active || progress[step]) {
      setChosen(step)
      setEngaged(null)
    }
  }

  return (
    <div className="screen today-screen premium-today">
      <div className="today-context">
        <span>
          {dateLabel(date, { weekday: 'long' })} · Week {String(week + 1).padStart(2, '0')}
        </span>
        {selected && (
          <button className="text-button" onClick={onToday}>
            Back to today
          </button>
        )}
      </div>

      {!selected && current.before && (
        <div className="quiet-notice">
          Starts {dateLabel(state.startDate)}. You can begin early.
        </div>
      )}
      {!selected && current.after && (
        <div className="quiet-notice">
          Your 24 weeks are complete. Revisit sessions in Roadmap.
        </div>
      )}

      {day === 6 ? (
        <section className="premium-state premium-rest">
          <div className="premium-state-copy">
            <span className="premium-kicker">Rest day</span>
            <h1>Let it settle.</h1>
            <p>Recovery is part of getting better. One thought aloud is enough today.</p>
          </div>
          <div className="premium-leo-wrap">
            <span className="leo-bubble">Recharge.</span>
            <Leo mood="idle" size={100} />
          </div>
          <div className="premium-task-card">
            <div className="premium-card-top">
              <span className="premium-card-icon"><Icon name="book" size={24} /></span>
              <span className="premium-pill">Reflect</span>
              <span className="premium-time"><Icon name="clock" size={17} /> 5 min</span>
            </div>
            <h2>Keep one idea.</h2>
            <p>Explain one useful thing you learned this week to yourself or someone else.</p>
            <button className="primary" onClick={onRoadmap}>
              Open roadmap <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      ) : done && !active ? (
        <section className="premium-state premium-complete" role="status">
          <h2 className="sr-only">Session complete</h2>
          <div className="premium-state-copy">
            <span className="premium-kicker">Session complete</span>
            <h1>That one’s yours.</h1>
            <p>You understood it, built it and explained it.</p>
          </div>
          <div className="premium-leo-wrap">
            <span className="leo-bubble">Nice work.</span>
            <Leo mood="jump" size={104} />
          </div>
          <div className="premium-task-card premium-complete-card">
            <span className="premium-complete-mark"><Icon name="check" size={28} /></span>
            <h2>{data.title}</h2>
            <p>One more capability you can use without leaning on a checklist.</p>
            <button
              className="primary"
              onClick={() =>
                day < 5 ? openSession(week, day + 1) : openSession(week, 6)
              }
            >
              See the next day <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      ) : currentStage && active ? (
        <>
          <h2 className="sr-only">{data.title}</h2>
          <section className="premium-state">
            <div className="premium-state-copy">
              <span className="premium-kicker">
                {phases[Math.floor(week / 4)].subject}
              </span>
              <h1>{currentStage.hero}</h1>
              <p>{currentStage.sub}</p>
            </div>

            <div className="premium-leo-wrap">
              <span className="leo-bubble">{currentStage.bubble}</span>
              <Leo mood={currentStage.mood} size={102} />
            </div>

            <section
              className="premium-task-card"
              aria-labelledby="today-focus-heading"
            >
              <div className="premium-card-top">
                <span className="premium-card-icon">
                  <Icon name={currentStage.icon} size={25} />
                </span>
                <span className="premium-pill">{currentStage.label}</span>
                <span className="premium-time">
                  <Icon name="clock" size={17} /> {currentStage.minutes} min
                </span>
              </div>

              <h2 id="today-focus-heading">{currentStage.title}</h2>
              <p className="premium-task-copy">{currentStage.copy}</p>

              {engaged === active && active === 'learn' && (
                <a
                  className="premium-inline-action"
                  href={resourceFor(week).url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open reference <Icon name="external" size={15} />
                </a>
              )}

              {engaged === active && active === 'build' && (
                <details className="premium-detail">
                  <summary>
                    Definition of done <Icon name="down" size={15} />
                  </summary>
                  <p>{data.check}</p>
                </details>
              )}

              {active === 'speak' && (
                <div className="premium-mic" aria-hidden="true">
                  <span />
                  <Icon name="speak" size={31} />
                  <span />
                </div>
              )}

              {active === 'speak' ? (
                <button className="primary premium-cta" onClick={onSpeak}>
                  {currentStage.start} <Icon name="arrow" size={20} />
                </button>
              ) : engaged === active ? (
                <button
                  className="primary premium-cta"
                  onClick={() => complete(active)}
                >
                  {currentStage.finish} <Icon name="arrow" size={20} />
                </button>
              ) : (
                <button
                  className="primary premium-cta"
                  onClick={() => setEngaged(active)}
                >
                  {currentStage.start} <Icon name="arrow" size={20} />
                </button>
              )}
            </section>
          </section>

          <div
            className="premium-stepper"
            role="progressbar"
            aria-label="Session steps completed"
            aria-valuemin={0}
            aria-valuemax={3}
            aria-valuenow={completedSteps}
          >
            {steps.map((step, index) => {
              const completeStep = progress[step]
              const activeStep = step === active
              return (
                <button
                  key={step}
                  className={`premium-step ${completeStep ? 'is-done' : ''} ${activeStep ? 'is-active' : ''}`}
                  onClick={() => selectStep(step)}
                  disabled={!completeStep && !activeStep}
                >
                  <span className="premium-step-dot">
                    {completeStep ? <Icon name="check" size={16} /> : index + 1}
                  </span>
                  <span>{stage[step].label}</span>
                </button>
              )
            })}
          </div>

          <div className="today-week-meta">
            <span>{weekDone}/6 sessions this week</span>
            <button className="text-button" onClick={onRoadmap}>
              Roadmap <Icon name="arrow" size={15} />
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}

function Roadmap({
  state,
  currentWeek,
  openSession,
}: {
  state: State
  currentWeek: number
  openSession: (w: number, d: number) => void
}) {
  const safeCurrentWeek = Math.min(Math.max(currentWeek, 0), 23)
  const currentPhase = Math.floor(safeCurrentWeek / 4)
  const [open, setOpen] = useState<number | null>(safeCurrentWeek)
  const [openPhase, setOpenPhase] = useState<number | null>(currentPhase)
  const totalComplete = Object.values(state.sessions).filter(isComplete).length

  return (
    <div className="screen roadmap-screen">
      <header className="roadmap-hero premium-page-hero">
        <div className="premium-page-copy">
          <div className="eyebrow">24-week path</div>
          <h1>Your roadmap.</h1>
          <p>Six phases. One capability at a time.</p>
        </div>
        <div className="premium-page-mascot">
          <span className="leo-bubble">Keep going.</span>
          <Leo mood="wave" size={78} />
        </div>
        <div className="roadmap-week-badge" aria-label={`Current week ${safeCurrentWeek + 1} of 24`}>
          <strong>{String(safeCurrentWeek + 1).padStart(2, '0')}</strong>
          <span>/24</span>
        </div>
      </header>

      <section className="roadmap-overview" aria-label="Program progress">
        <div className="roadmap-overview-top">
          <div>
            <span className="eyebrow">Current phase</span>
            <strong>{phases[currentPhase].name}</strong>
          </div>
          <span>{totalComplete}/144 sessions</span>
        </div>
        <div
          className="roadmap-overview-track"
          role="progressbar"
          aria-label="Program completion"
          aria-valuemin={0}
          aria-valuemax={144}
          aria-valuenow={totalComplete}
        >
          <span style={{ width: `${Math.round((totalComplete / 144) * 100)}%` }} />
        </div>
      </section>

      <div className="roadmap-phase-list">
        {phases.map((phase, pi) => {
          const phaseStart = pi * 4
          const phaseWeeks = weeks.slice(phaseStart, phaseStart + 4)
          const phaseDone = Array.from({ length: 24 }, (_, i) => {
            const week = phaseStart + Math.floor(i / 6)
            const day = i % 6
            return isComplete(state.sessions[sessionId(week, day)])
          }).filter(Boolean).length
          const isCurrent = pi === currentPhase
          const phaseState =
            phaseDone === 24 ? 'Complete' : isCurrent ? 'Current' : pi < currentPhase ? 'Revisit' : 'Upcoming'

          return (
            <section
              className={`roadmap-phase ${isCurrent ? 'is-current' : ''}`}
              key={phase.name}
            >
              <button
                className="roadmap-phase-toggle"
                aria-expanded={openPhase === pi}
                aria-controls={`phase-${pi}`}
                onClick={() => setOpenPhase(openPhase === pi ? null : pi)}
              >
                <span className="roadmap-phase-index">0{pi + 1}</span>
                <span className="roadmap-phase-copy">
                  <span className="roadmap-phase-meta">
                    Weeks {phase.range} · {phaseState}
                  </span>
                  <strong>{phase.name}</strong>
                </span>
                <span className="roadmap-phase-count">{phaseDone}/24</span>
                <Icon name="down" size={17} />
              </button>

              {openPhase === pi && (
                <div className="roadmap-weeks" id={`phase-${pi}`}>
                  {phaseWeeks.map((w, index) => {
                    const wi = phaseStart + index
                    const count = Array.from({ length: 6 }, (_, d) =>
                      isComplete(state.sessions[sessionId(wi, d)]),
                    ).filter(Boolean).length
                    const weekState =
                      count === 6
                        ? 'Complete'
                        : wi === safeCurrentWeek
                          ? 'This week'
                          : count
                            ? `${count}/6 done`
                            : wi < safeCurrentWeek
                              ? 'Ready to revisit'
                              : 'Upcoming'

                    return (
                      <div
                        className={`roadmap-week ${wi === safeCurrentWeek ? 'is-current' : ''}`}
                        key={wi}
                      >
                        <button
                          className="roadmap-week-toggle"
                          aria-expanded={open === wi}
                          aria-controls={`week-${wi}`}
                          onClick={() => setOpen(open === wi ? null : wi)}
                        >
                          <span className={`roadmap-week-number ${count === 6 ? 'is-complete' : ''}`}>
                            {count === 6 ? <Icon name="check" size={15} /> : wi + 1}
                          </span>
                          <span className="roadmap-week-copy">
                            <strong>{w.title}</strong>
                            <small>{weekState}</small>
                          </span>
                          <Icon name="chevron" size={16} />
                        </button>

                        {open === wi && (
                          <div className="roadmap-week-detail" id={`week-${wi}`}>
                            <div className="roadmap-week-brief">
                              <span className="eyebrow">Outcome</span>
                              <p>{w.outcome}</p>
                            </div>

                            <div className="roadmap-week-brief">
                              <span className="eyebrow">Weekly build · 150 min</span>
                              <p>{w.ship}</p>
                            </div>

                            <div className="roadmap-session-list" aria-label={`Week ${wi + 1} sessions`}>
                              {Array.from({ length: 6 }, (_, d) => {
                                const complete = isComplete(
                                  state.sessions[sessionId(wi, d)],
                                )
                                return (
                                  <button key={d} onClick={() => openSession(wi, d)}>
                                    <span className={`roadmap-session-dot ${complete ? 'is-complete' : ''}`}>
                                      {complete ? <Icon name="check" size={13} /> : d + 1}
                                    </span>
                                    <span>{session(wi, d).title}</span>
                                    <Icon name="chevron" size={15} />
                                  </button>
                                )
                              })}
                            </div>

                            <div className="roadmap-speaking-focus">
                              <Icon name="speak" size={16} />
                              <span>{communication[wi][0]}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <details className="roadmap-rhythm">
        <summary>
          How the week works <Icon name="down" size={16} />
        </summary>
        <p>
          Five focused sessions, one longer build and one rest day. Speaking
          practice runs through the whole program.
        </p>
      </details>
    </div>
  )
}

function Speak({
  state,
  update,
  week,
  day,
  onSaved,
  onToday,
}: {
  state: State
  update: Update
  week: number
  day: number
  onSaved: () => void
  onToday: () => void
}) {
  const [promptIndex, setPromptIndex] = useState(0)
  const [duration, setDuration] = useState(120)
  const [remaining, setRemaining] = useState(120)
  const [deadline, setDeadline] = useState<number | null>(null)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [ratings, setRatings] = useState<Partial<Rating>>({})
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [ratingError, setRatingError] = useState(false)
  const id = sessionId(week, day)
  const prompt = speakingPrompts(week, day)[promptIndex]
  useEffect(() => {
    setDeadline(null)
    setStarted(false)
    setFinished(false)
    setRemaining(duration)
    setRatings({})
    setSaved(false)
    setNote('')
    setRatingError(false)
  }, [id, duration])
  useEffect(() => {
    if (!deadline) return
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds === 0) {
        setDeadline(null)
        setFinished(true)
      }
    }
    tick()
    const timer = setInterval(tick, 200)
    return () => clearInterval(timer)
  }, [deadline])
  function reset() {
    setDeadline(null)
    setRemaining(duration)
    setStarted(false)
    setFinished(false)
    setSaved(false)
    setRatings({})
    setNote('')
  }
  function save() {
    if (Object.keys(ratings).length !== 5) {
      setRatingError(true)
      document.getElementById('rating-clarity')?.focus()
      return
    }
    update((s) => {
      const next = setStep(s, id, 'speak', true)
      return {
        ...next,
        speaking: [
          {
            id: crypto.randomUUID(),
            sessionId: id,
            date: localDate(),
            prompt,
            seconds: duration - remaining,
            ratings: ratings as Rating,
            note: note.trim(),
          },
          ...s.speaking,
        ],
      }
    })
    setSaved(true)
    onSaved()
  }
  const labels: (keyof Rating)[] = [
    'clarity',
    'volume',
    'structure',
    'pace',
    'confidence',
  ]
  const hints = {
    clarity: 'My words were easy to understand.',
    volume: 'I could be comfortably heard across a room.',
    structure: 'My point, reason and example connected.',
    pace: 'I left room for pauses.',
    confidence: 'I finished my thoughts without trailing off.',
  }
  return (
    <div
      className={`screen speak-screen${started ? ' is-started' : ''}${finished ? ' is-finished' : ''}${saved ? ' is-saved' : ''}`}
    >
      <header className="speak-header premium-page-hero">
        <div className="premium-page-copy">
          <div className="eyebrow">Communication · Week {week + 1}</div>
          <h1>Say it clearly.</h1>
          <p>Structure the thought. Then give it your voice.</p>
        </div>
        <div className="premium-page-mascot">
          <span className="leo-bubble">I’m listening.</span>
          <Leo mood={deadline ? 'focus' : 'waiting'} size={78} />
        </div>
      </header>

      <div className="speak-focus">
        <Icon name="speak" size={15} />
        <span>{communication[week][0]}</span>
      </div>

      <section className="speak-prompt-card" aria-labelledby="speaking-prompt-title">
        <div className="speak-prompt-top">
          <span className="eyebrow">Your prompt</span>
          <button
            className="text-button"
            disabled={started && !saved}
            onClick={() => {
              setPromptIndex((promptIndex + 1) % 3)
              reset()
            }}
          >
            New prompt <Icon name="reset" size={14} />
          </button>
        </div>
        <h2 id="speaking-prompt-title">{prompt}</h2>
        <p className="speak-framework-line">
          Point → Reason → Example → Consequence
        </p>
        <details className="speaking-guide">
          <summary>
            Need a structure? <Icon name="down" size={16} />
          </summary>
          <ol className="framework">
            {[
              ['Statement', 'The main point is…'],
              ['Reason', 'This matters because…'],
              ['Example', 'For example, in my tracker…'],
              ['Consequence', 'So the trade-off / next step is…'],
            ].map(([name, example], i) => (
              <li key={name}>
                <span>{i + 1}</span>
                <div>
                  <strong>{name}</strong>
                  <p>{example}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="speaking-tip">{communication[week][1]}</p>
        </details>
      </section>

      <div className="timer-panel">
        <div className="timer-pet">
          <Leo
            mood={
              saved
                ? 'jump'
                : finished
                  ? 'review'
                  : deadline
                    ? 'focus'
                    : started
                      ? 'waiting'
                      : 'wave'
            }
            size={70}
          />
        </div>
        <div className="timer-top">
          <span className="eyebrow">
            {saved
              ? 'Practice saved'
              : finished
                ? 'Take a breath. Reflect.'
                : deadline
                  ? 'Speak. You have the floor.'
                  : started
                    ? 'Paused. Take your time.'
                    : 'A small space to practice'}
          </span>
        </div>
        <div
          className="timer"
          role="timer"
          aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
        >
          {Math.floor(remaining / 60)}
          <span>:</span>
          {String(remaining % 60).padStart(2, '0')}
        </div>
        <div
          role="group"
          aria-label="Practice duration"
          className="duration-picker"
        >
          {[120, 180, 300].map((seconds) => (
            <button
              key={seconds}
              disabled={started && !saved}
              aria-pressed={duration === seconds}
              onClick={() => {
                setDuration(seconds)
                reset()
                setRemaining(seconds)
              }}
            >
              {seconds / 60} min
            </button>
          ))}
        </div>
        {!finished && !saved ? (
          <div className="timer-actions">
            <button
              className="timer-start"
              onClick={() => {
                if (deadline) {
                  setRemaining(
                    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
                  )
                  setDeadline(null)
                } else {
                  setStarted(true)
                  setDeadline(Date.now() + remaining * 1000)
                }
              }}
            >
              <Icon name={deadline ? 'pause' : 'play'} size={18} />
              {deadline ? 'Pause' : started ? 'Resume' : 'Start speaking'}
            </button>
            {started && (
              <button
                className="timer-reset"
                aria-label="Reset speaking timer"
                onClick={reset}
              >
                <Icon name="reset" size={20} />
              </button>
            )}
          </div>
        ) : (
          <div className="timer-finished">
            <Icon name="check" size={18} />
            {saved ? 'Another idea, better explained.' : 'Practice complete'}
          </div>
        )}
        {started && !finished && !saved && (
          <button
            className="finish-early"
            onClick={() => {
              if (deadline)
                setRemaining(
                  Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
                )
              setDeadline(null)
              setFinished(true)
            }}
          >
            Finish & reflect
          </button>
        )}
      </div>
      <p className="privacy-note">
        No microphone access. No recording. Just practice.
      </p>
      {finished && !saved && (
        <section className="reflection" aria-labelledby="reflection-title">
          <div className="section-label">
            <h2 id="reflection-title">How did that feel?</h2>
            <span className="muted">Be honest, not harsh.</span>
          </div>
          <p className="rating-legend">
            1 · Needs work <span>5 · Felt strong</span>
          </p>
          {labels.map((label) => (
            <fieldset key={label} className="rating-field">
              <legend>{cap(label)}</legend>
              <p>{hints[label]}</p>
              <div className="rating-options">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n}>
                    <input
                      id={n === 1 ? `rating-${label}` : undefined}
                      type="radio"
                      name={`rating-${label}`}
                      value={n}
                      checked={ratings[label] === n}
                      onChange={() => {
                        setRatings({ ...ratings, [label]: n })
                        setRatingError(false)
                      }}
                    />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <label className="input-label" htmlFor="reflection-note">
            One thing to try next time <span className="muted">(optional)</span>
          </label>
          <textarea
            id="reflection-note"
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Pause after the first sentence…"
          />
          {ratingError && (
            <p className="error-text" role="alert">
              Choose a rating for all five skills before saving.
            </p>
          )}
          <button className="primary" onClick={save}>
            Save practice <Icon name="check" size={18} />
          </button>
        </section>
      )}
      {saved && (
        <div className="speak-saved" role="status">
          <h2>That’s one more rep.</h2>
          <p>
            Your ratings are saved and this session’s speaking step is complete.
          </p>
          <button className="primary" onClick={onToday}>
            Back to your session <Icon name="arrow" size={18} />
          </button>
          <button className="text-button" onClick={reset}>
            Practice again
          </button>
        </div>
      )}
      {state.speaking[0] && !started && (
        <div className="last-practice">
          <span className="eyebrow">
            Last practice · {dateLabel(state.speaking[0].date)}
          </span>
          <p>
            {state.speaking[0].note ||
              'You made time to practice. Keep showing up.'}
          </p>
        </div>
      )}
    </div>
  )
}

function Progress({
  state,
  update,
  today,
  onToday,
}: {
  state: State
  update: Update
  today: string
  onToday: () => void
}) {
  const complete = Object.values(state.sessions).filter(isComplete).length
  const countStreak = streak(state, today)
  const percent = Math.round((complete / 144) * 100)
  const [openSkill, setOpenSkill] = useState<number | null>(null)
  const [history, setHistory] = useState(false)
  const completedWeeks = weeks.filter((_, w) =>
    Array.from({ length: 6 }, (_, d) =>
      isComplete(state.sessions[sessionId(w, d)]),
    ).every(Boolean),
  ).length

  return (
    <div className="screen progress-screen">
      <header className="progress-header premium-page-hero">
        <div className="premium-page-copy">
          <div className="eyebrow">Progress</div>
          <h1>See what’s getting stronger.</h1>
          <p>Track evidence, not activity for activity’s sake.</p>
        </div>
        <div className="premium-page-mascot">
          <span className="leo-bubble">Look at that.</span>
          <Leo mood={complete > 0 ? 'jump' : 'wave'} size={78} />
        </div>
      </header>

      <section className="progress-hero" aria-label="Program progress">
        <div className="progress-hero-top">
          <div className="progress-percent">
            {percent}
            <span>%</span>
          </div>
          <div className="progress-hero-copy">
            <strong>{complete} of 144 sessions</strong>
            <span>
              {complete === 0
                ? 'Your baseline'
                : complete === 144
                  ? 'Program complete'
                  : 'Built one session at a time'}
            </span>
          </div>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-label="Program completion"
          aria-valuenow={complete}
          aria-valuemin={0}
          aria-valuemax={144}
        >
          <span style={{ width: `${percent}%` }} />
        </div>

        <div className="progress-stats">
          <div>
            <strong>{completedWeeks}<span>/24</span></strong>
            <span>Weeks</span>
          </div>
          <div>
            <strong>{state.speaking.length}</strong>
            <span>Speaking reps</span>
          </div>
          <div>
            <strong>{countStreak}</strong>
            <span>Day streak</span>
          </div>
        </div>
      </section>

      {complete === 0 && (
        <div className="progress-empty">
          <span>Your first completed session will show up here.</span>
          <button className="text-button" onClick={onToday}>
            Start today <Icon name="arrow" size={15} />
          </button>
        </div>
      )}

      <section className="progress-section">
        <div className="progress-section-heading">
          <div>
            <span className="eyebrow">Self-assessed</span>
            <h2>Skills</h2>
          </div>
          <details className="skill-scale-help">
            <summary>Levels</summary>
            <p>Seen → Practiced → Can explain → Can build</p>
          </details>
        </div>

        <div className="progress-skill-list">
          {skillNames.map((name, i) => {
            const level = state.skills[i] ?? 0
            return (
              <div className="progress-skill" key={name}>
                <button
                  className="progress-skill-toggle"
                  aria-expanded={openSkill === i}
                  onClick={() => setOpenSkill(openSkill === i ? null : i)}
                >
                  <span className="progress-skill-main">
                    <strong>{name}</strong>
                    <span className="progress-skill-meter" aria-hidden="true">
                      {[1, 2, 3, 4].map((n) => (
                        <i className={n <= level ? 'filled' : ''} key={n} />
                      ))}
                    </span>
                  </span>
                  <span className="progress-skill-level">
                    {skillLevels[level]}
                    <Icon name="down" size={14} />
                  </span>
                </button>

                {openSkill === i && (
                  <div className="progress-skill-editor">
                    <p>
                      {
                        [
                          'No evidence yet. That’s your starting point.',
                          'You recognize the concept and its purpose.',
                          'You have attempted a concrete exercise.',
                          'You can explain it unaided, including a trade-off.',
                          'You can implement and test it independently.',
                        ][level]
                      }
                    </p>
                    <label htmlFor={`skill-${i}`}>Current level</label>
                    <select
                      id={`skill-${i}`}
                      value={level}
                      onChange={(e) =>
                        update((s) => ({
                          ...s,
                          skills: { ...s.skills, [i]: Number(e.target.value) },
                        }))
                      }
                    >
                      {skillLevels.map((label, n) => (
                        <option value={n} key={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="progress-section speaking-progress-v3">
        <div className="progress-section-heading">
          <div>
            <span className="eyebrow">Communication</span>
            <h2>Speaking</h2>
          </div>
          {state.speaking.length > 0 && (
            <button
              className="text-button"
              onClick={() => setHistory(!history)}
              aria-expanded={history}
            >
              {history ? 'Hide history' : 'View history'}
            </button>
          )}
        </div>

        {!state.speaking.length ? (
          <div className="progress-speaking-empty">
            Your first speaking reflection will appear here.
          </div>
        ) : (
          <>
            <div className="progress-latest-speaking">
              <div className="progress-latest-meta">
                <span>Latest · {dateLabel(state.speaking[0].date)}</span>
                <span>{Math.floor(state.speaking[0].seconds / 60)}m {state.speaking[0].seconds % 60}s</span>
              </div>
              <div className="progress-rating-grid">
                {Object.entries(state.speaking[0].ratings).map(([key, value]) => (
                  <div key={key}>
                    <span>{cap(key)}</span>
                    <strong>{value}<small>/5</small></strong>
                  </div>
                ))}
              </div>
            </div>

            {history && (
              <div className="practice-history progress-history">
                {state.speaking.slice(0, 20).map((entry) => (
                  <article key={entry.id}>
                    <div className="eyebrow">
                      {dateLabel(entry.date)} · {Math.floor(entry.seconds / 60)}m {entry.seconds % 60}s
                    </div>
                    <p>{entry.prompt}</p>
                    <span className="history-ratings">
                      {Object.entries(entry.ratings)
                        .map(([key, value]) => `${cap(key)} ${value}`)
                        .join(' · ')}
                    </span>
                    {entry.note && <blockquote>{entry.note}</blockquote>}
                  </article>
                ))}
                {state.speaking.length > 20 && (
                  <p className="muted">Showing the 20 most recent practices.</p>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function Settings({
  state,
  update,
  error,
  recover,
  offlineReady,
  onClose,
  onNotice,
}: {
  state: State
  update: Update
  error: string
  recover: () => void
  offlineReady: boolean
  onClose: () => void
  onNotice: (s: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const [start, setStart] = useState(state.startDate)
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState<State | null>(null)
  useEffect(() => {
    const el = dialog.current
    el?.showModal()
    return () => el?.close()
  }, [])
  function exportBackup() {
    let text = JSON.stringify(state, null, 2)
    if (error) {
      try {
        text = localStorage.getItem(STORAGE_KEY) ?? text
      } catch {
        /* Export in-memory state if storage is inaccessible. */
      }
    }
    const url = URL.createObjectURL(
      new Blob([text], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `engineer-os-${localDate()}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    onNotice('Backup exported. Keep it somewhere safe.')
  }
  async function importFile(f: File | undefined) {
    if (!f) return
    try {
      if (f.size > 5_000_000)
        throw new Error('Choose a backup smaller than 5 MB.')
      setPending(validateState(JSON.parse(await f.text())))
      setMessage('')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to read this backup.')
    }
    if (file.current) file.current.value = ''
  }
  return (
    <dialog
      ref={dialog}
      className="settings-dialog settings-v3-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose()
      }}
    >
      <div className="settings-sheet-handle" aria-hidden="true" />
      <div className="settings-content settings-v3-content">
        <header className="settings-v3-header">
          <div>
            <span className="eyebrow">Engineer OS</span>
            <h2>Settings</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close settings"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>

        <form
          className="settings-v3-section"
          onSubmit={(e) => {
            e.preventDefault()
            if (!validDate(start)) {
              setMessage('Choose a valid start date.')
              return
            }
            update((s) => ({ ...s, startDate: start }))
            onNotice(
              'Program start updated. Completed work stays with its session.',
            )
            onClose()
          }}
        >
          <div className="settings-v3-section-title">
            <div>
              <span className="eyebrow">Schedule</span>
              <h3>Program start</h3>
            </div>
          </div>

          <label className="settings-v3-label" htmlFor="start-date">
            Program start date
          </label>
          <input
            id="start-date"
            type="date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <p className="settings-v3-help">
            Shifts your calendar without changing completed work.
          </p>
          <button
            className="primary settings-v3-save"
            type="submit"
            disabled={start === state.startDate}
          >
            Save start date <Icon name="check" size={18} />
          </button>
        </form>

        <section className="settings-v3-section">
          <div className="settings-v3-section-title">
            <div>
              <span className="eyebrow">Data</span>
              <h3>Progress & backup</h3>
            </div>
            <span className="settings-v3-state">
              {error ? 'Needs attention' : 'On this device'}
            </span>
          </div>

          <p className="settings-v3-help settings-v3-help-top">
            Your progress stays in this browser. Export a backup before
            switching devices or browsers.
          </p>

          <div className="settings-v3-actions">
            <button className="secondary" onClick={exportBackup}>
              Export backup
            </button>
            <button className="secondary" onClick={() => file.current?.click()}>
              Restore backup
            </button>
          </div>

          <input
            ref={file}
            hidden
            type="file"
            accept=".json,application/json"
            onChange={(e) => void importFile(e.target.files?.[0])}
          />

          {pending && (
            <div className="restore-confirm settings-v3-confirm">
              <p>
                Replace current progress with this backup? It contains{' '}
                {Object.values(pending.sessions).filter(isComplete).length}{' '}
                completed sessions and {pending.speaking.length} speaking
                practices.
              </p>
              <div className="settings-v3-confirm-actions">
                <button
                  className="primary"
                  onClick={() => {
                    recover()
                    update(pending)
                    setStart(pending.startDate)
                    setPending(null)
                    onNotice('Backup restored.')
                    onClose()
                  }}
                >
                  Replace with backup
                </button>
                <button className="text-button" onClick={() => setPending(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <button
              className="text-button settings-v3-recovery"
              onClick={() => {
                if (
                  window.confirm(
                    'Use the currently displayed progress and overwrite unreadable saved data? Export the original first if you want to keep it.',
                  )
                ) {
                  recover()
                  update((s) => ({ ...s }))
                  onNotice('Progress saving re-enabled.')
                }
              }}
            >
              Use current progress and re-enable saving
            </button>
          )}

          {message && (
            <p className="error-text" role="alert">
              {message}
            </p>
          )}
        </section>

        <details className="settings-v3-section settings-v3-install">
          <summary>
            <span>
              <span className="eyebrow">App</span>
              <strong>Home Screen & offline</strong>
            </span>
            <span className={`settings-v3-dot ${offlineReady ? 'ready' : ''}`} />
            <Icon name="down" size={16} />
          </summary>
          <div className="settings-v3-install-body">
            <p>
              On iPhone, open Engineer OS in Safari, tap Share, then Add to Home
              Screen.
            </p>
            <p>
              {offlineReady
                ? 'Offline mode is ready on this device.'
                : 'Open the deployed app online once to prepare offline mode.'}
            </p>
            <p>External learning resources still need a connection.</p>
          </div>
        </details>

        <footer className="settings-v3-footer">
          Engineer OS · v1.0
          <span>Deliberate practice, one session at a time.</span>
        </footer>
      </div>
    </dialog>
  )
}
