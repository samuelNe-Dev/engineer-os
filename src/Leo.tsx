import type { CSSProperties } from 'react'

type Mood = 'idle' | 'wave' | 'jump' | 'waiting' | 'focus' | 'review'
const rows: Record<Mood, { row: number; frames: number; seconds: number }> = {
  idle: { row: 0, frames: 6, seconds: 1.5 },
  wave: { row: 1, frames: 4, seconds: 1.2 },
  jump: { row: 2, frames: 5, seconds: 1.1 },
  waiting: { row: 3, frames: 6, seconds: 1.5 },
  focus: { row: 4, frames: 6, seconds: 1.7 },
  review: { row: 5, frames: 6, seconds: 1.6 },
}

/** Cropped from Samuel's own Leo v2 pet atlas: native cells are 192 × 208. */
export function Leo({ mood, size = 112 }: { mood: Mood; size?: number }) {
  const { row, frames, seconds } = rows[mood]
  const height = Math.round((size * 208) / 192)
  const style = {
    width: size,
    height,
    backgroundSize: `${size * 8}px ${height * 6}px`,
    backgroundImage: `url(${import.meta.env.BASE_URL}leo-atlas.webp)`,
    backgroundPositionY: -row * height,
    '--leo-travel': `${-size * frames}px`,
    '--leo-duration': `${seconds}s`,
    '--leo-frames': `steps(${frames})`,
  } as CSSProperties
  return (
    <span
      className={`leo-sprite leo-${mood}`}
      style={style}
      aria-hidden="true"
    />
  )
}
