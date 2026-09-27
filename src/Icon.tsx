export function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    today: (
      <>
        <rect x="4" y="5" width="16" height="16" rx="3" />
        <path d="M8 3v4m8-4v4M4 11h16m-11 5 2 2 4-4" />
      </>
    ),
    roadmap: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="19" r="2" />
        <path d="M8 5h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7" />
      </>
    ),
    speak: (
      <>
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3m-4 0h8" />
      </>
    ),
    progress: (
      <>
        <path d="M5 20V12m7 8V4m7 16v-6" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" />
        <circle cx="15" cy="17" r="3" />
      </>
    ),
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    down: <path d="m6 9 6 6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    book: (
      <>
        <path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15" />
      </>
    ),
    code: (
      <>
        <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14m0-10H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5" />
      </>
    ),
    play: <path d="m9 5 11 7-11 7V5Z" />,
    pause: <path d="M8 5v14M16 5v14" />,
    reset: (
      <>
        <path d="M3 10a9 9 0 1 1 1 7M3 4v6h6" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.arrow}
    </svg>
  )
}
