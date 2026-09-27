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
          <span className="brand-symbol">
            <span />
            <span />
            <span />
          </span>
          engineer<span className="brand-os">OS</span>
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
  useEffect(
    () =>
      setChosen(
        steps.find((step) => !state.sessions[sessionId(week, day)]?.[step]) ??
          null,
      ),
    [week, day, state.sessions],
  )
  const active = chosen ?? next
  const date = addDays(state.startDate, week * 7 + day)
  const weekDone = Array.from({ length: 6 }, (_, d) =>
    isComplete(state.sessions[sessionId(week, d)]),
  ).filter(Boolean).length
  const completedSteps = steps.filter((step) => progress[step]).length
  const names = {
    learn: 'Understand',
    build: 'Build it yourself',
    speak: 'Say it out loud',
  }
  const minutes = {
    learn: data.learnMinutes,
    build: data.buildMinutes,
    speak: 5,
  }
  const copy = {
    learn: data.learn,
    build: data.build,
    speak: communication[week][1],
  }
  const mood =
    day === 6
      ? 'idle'
      : done
        ? 'jump'
        : active === 'build'
          ? 'focus'
          : active === 'speak'
            ? 'waiting'
            : 'wave'
  function toggle(step: Step) {
    update((s) => setStep(s, id, step, !progress[step]))
  }

  return (
    <div className="screen today-screen">
      <div className="eyebrow page-date">
        {dateLabel(date, { weekday: 'long', day: 'numeric', month: 'long' })}
        {selected && (
          <button className="text-button" onClick={onToday}>
            Back to today
          </button>
        )}
      </div>
      <section className="today-hero">
        <div className="today-hero-copy">
          <div className="eyebrow accent">
            Week {String(week + 1).padStart(2, '0')} / 24 ·{' '}
            {phases[Math.floor(week / 4)].subject}
          </div>
          <h1>
            {day === 6
              ? 'Time to recharge.'
              : done
                ? 'You did it.'
                : data.title}
          </h1>
          <p>
            {day === 6
              ? 'No session today.'
              : `${data.minutes} min · Session ${day + 1} of 6`}
          </p>
        </div>
        <Leo mood={mood} size={116} />
      </section>
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
      <div
        className="today-track"
        role="progressbar"
        aria-label="Session steps completed"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={day === 6 ? 0 : completedSteps}
      >
        {steps.map((step) => (
          <span key={step} className={progress[step] ? 'filled' : ''} />
        ))}
      </div>
      {day === 6 ? (
        <div className="today-rest">
          <h2>Let it settle.</h2>
          <p>
            Rest today. If you feel like it, explain one thing you learned this
            week to someone.
          </p>
          <button className="primary" onClick={onRoadmap}>
            Explore your roadmap <Icon name="arrow" size={18} />
          </button>
        </div>
      ) : (
        <>
          {done && !active && (
            <div className="today-finished" role="status">
              <h2>Session complete</h2>
              <p>One more thing you can understand, build and explain.</p>
              <button
                className="primary"
                onClick={() =>
                  day < 5 ? openSession(week, day + 1) : openSession(week, 6)
                }
              >
                See the next day <Icon name="arrow" size={18} />
              </button>
            </div>
          )}
          {active && (
            <section
              className="today-focus"
              aria-labelledby="today-focus-heading"
            >
              <div className="focus-kicker">
                <span className="eyebrow">
                  {progress[active] ? 'Completed step' : 'Next up'}
                </span>
                <span>{minutes[active]} min</span>
              </div>
              <h2 id="today-focus-heading">{names[active]}</h2>
              <p className="focus-instruction">{copy[active]}</p>
              {active === 'learn' && (
                <a
                  className="resource-link"
                  href={resourceFor(week).url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open reference <Icon name="external" size={14} />
                </a>
              )}
              {active === 'build' && (
                <details className="focus-detail">
                  <summary>
                    What counts as done <Icon name="down" size={16} />
                  </summary>
                  <p>{data.check}</p>
                  <ol>
                    <li>Attempt it yourself first.</li>
                    <li>Ask AI for a hint if stuck.</li>
                    <li>Implement, request a review, then explain it aloud.</li>
                  </ol>
                </details>
              )}
              {active === 'speak' && (
                <p className="framework-inline">
                  Statement → Reason → Example → Consequence
                </p>
              )}
              {active === 'speak' && !progress.speak ? (
                <button className="primary" onClick={onSpeak}>
                  Start speaking practice <Icon name="arrow" size={18} />
                </button>
              ) : (
                <button
                  className={progress[active] ? 'secondary full' : 'primary'}
                  onClick={() => toggle(active)}
                >
                  {progress[active]
                    ? 'Mark as unfinished'
                    : active === 'learn'
                      ? 'Understood. Let’s build.'
                      : 'Built it. Let’s explain.'}
                  {!progress[active] && <Icon name="arrow" size={18} />}
                </button>
              )}
            </section>
          )}
          <div className="today-steps" aria-label="Session steps">
            {steps
              .filter((step) => step !== active)
              .map((step) => (
                <button
                  key={step}
                  onClick={() => setChosen(step)}
                  className="today-step-row"
                >
                  <span
                    className={`task-number ${progress[step] ? 'checked' : ''}`}
                  >
                    {progress[step] ? (
                      <Icon name="check" size={16} />
                    ) : (
                      steps.indexOf(step) + 1
                    )}
                  </span>
                  <span>
                    {names[step]}
                    <small>
                      {progress[step] ? 'Done' : `${minutes[step]} min`}
                    </small>
                  </span>
                  <Icon name="chevron" size={17} />
                </button>
              ))}
          </div>
        </>
      )}
      <div className="today-bottom">
        <span>
          Week {week + 1} · {weekDone} of 6 sessions
        </span>
        <button className="text-button" onClick={onRoadmap}>
          Roadmap <Icon name="arrow" size={15} />
        </button>
      </div>
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
      <header className="roadmap-hero">
        <div>
          <div className="eyebrow">24-week path</div>
          <h1>Your path, at a glance.</h1>
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
      <header className="speak-header">
        <div>
          <div className="eyebrow">Communication practice · Week {week + 1}</div>
          <h1>Say it clearly.</h1>
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
    <div className="screen">
      <div className="eyebrow">Proof of showing up</div>
      <h1>Your work adds up.</h1>
      <p className="page-intro">
        Measure what you can do, not just what you’ve seen.
      </p>
      <section className="progress-overview">
        <div className="progress-number">
          {percent}
          <span>%</span>
          <div>
            {complete === 0
              ? 'Your starting point'
              : complete === 144
                ? 'A foundation to build on'
                : 'Built one session at a time'}
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
        <p>{complete} of 144 sessions completed</p>
        <div className="stats-row">
          <div>
            <strong>
              {completedWeeks}
              <span>/24</span>
            </strong>
            <span>Weeks complete</span>
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
        <div className="empty-progress">
          <p>
            Your first session is the best place to start. Progress appears as
            you understand, build and explain.
          </p>
          <button className="text-button" onClick={onToday}>
            Go to today’s session <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
      <section className="skills-section">
        <div className="section-label">
          <h2>What you can do</h2>
          <span className="eyebrow">Self-assessed</span>
        </div>
        <p className="muted skill-help">
          Tap a skill to update it. Move up when you have evidence.
        </p>
        <div className="skill-legend">
          Seen <span>→</span> Practiced <span>→</span> Can explain{' '}
          <span>→</span> Can build
        </div>
        {skillNames.map((name, i) => {
          const level = state.skills[i] ?? 0
          return (
            <div className="skill" key={name}>
              <button
                className="skill-toggle"
                aria-expanded={openSkill === i}
                onClick={() => setOpenSkill(openSkill === i ? null : i)}
              >
                <span>
                  <strong>{name}</strong>
                  <span className="skill-meter" aria-hidden="true">
                    {[1, 2, 3, 4].map((n) => (
                      <i className={n <= level ? 'filled' : ''} key={n} />
                    ))}
                  </span>
                </span>
                <span className="skill-level">
                  {skillLevels[level]}
                  <Icon name="down" size={14} />
                </span>
              </button>
              {openSkill === i && (
                <div className="skill-editor">
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
                  <label htmlFor={`skill-${i}`}>Your current level</label>
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
      </section>
      <section className="speaking-progress">
        <div className="section-label">
          <h2>Your speaking practice</h2>
          <button
            className="text-button"
            onClick={() => setHistory(!history)}
            aria-expanded={history}
          >
            {history ? 'Hide history' : 'View history'}
          </button>
        </div>
        {!state.speaking.length ? (
          <p className="muted">
            After your first practice, your ratings and reflections will appear
            here.
          </p>
        ) : (
          <>
            <p className="muted">
              Latest self-rating · {dateLabel(state.speaking[0].date)}
            </p>
            <div className="rating-summary">
              {Object.entries(state.speaking[0].ratings).map(([key, value]) => (
                <div key={key}>
                  <span>{cap(key)}</span>
                  <strong>
                    {value}
                    <span>/5</span>
                  </strong>
                </div>
              ))}
            </div>
            {history && (
              <div className="practice-history">
                {state.speaking.slice(0, 20).map((entry) => (
                  <article key={entry.id}>
                    <div className="eyebrow">
                      {dateLabel(entry.date)} · {Math.floor(entry.seconds / 60)}
                      m {entry.seconds % 60}s
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
                  <p className="muted">
                    Showing the 20 most recent practices. All entries are
                    included in your backup.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>
      <p className="endnote">
        Rest days matter. A streak is context, not a grade.
      </p>
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
      className="settings-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose()
      }}
    >
      <div className="settings-content">
        <div className="dialog-header">
          <h2>Make it yours.</h2>
          <button
            className="icon-button"
            aria-label="Close settings"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <p className="muted">A program that fits around your life.</p>
        <form
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
          <label className="input-label" htmlFor="start-date">
            Program start date
          </label>
          <input
            id="start-date"
            type="date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <p className="field-help">
            Moving the start date shifts your schedule. Your completed sessions
            stay completed.
          </p>
          <button className="primary" type="submit">
            Save start date <Icon name="check" size={18} />
          </button>
        </form>
        <section className="settings-section">
          <h3>Your progress belongs to you.</h3>
          <p>
            Progress is stored in this browser on this device. It does not sync
            between devices. Clearing website data can remove it.
          </p>
          <div className="backup-actions">
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
            <div className="restore-confirm">
              <p>
                Replace current progress with this backup? It contains{' '}
                {Object.values(pending.sessions).filter(isComplete).length}{' '}
                completed sessions and {pending.speaking.length} speaking
                practices.
              </p>
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
          )}
          {error && (
            <button
              className="text-button"
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
        <section className="settings-section">
          <h3>Keep it on your Home Screen.</h3>
          <p>
            On iPhone, open the deployed app in Safari. Tap Share, then Add to
            Home Screen. Enable Open as Web App if offered, then tap Add.
          </p>
          <p className="field-help">
            {offlineReady
              ? 'Offline mode is ready.'
              : 'Open the deployed app online once to prepare offline mode.'}{' '}
            External learning resources still need a connection. Export a backup
            before switching browsers or opening as a new Home Screen app;
            restore it there if needed.
          </p>
        </section>
        <p className="settings-version">
          Engineer OS · v1.0
          <br />
          Built for deliberate practice.
        </p>
      </div>
    </dialog>
  )
}
