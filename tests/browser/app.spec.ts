import { test, expect } from '@playwright/test'
import { preview } from 'vite'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-28T12:00:00'))
  await page.goto('./')
})

test('daily session flows through building, speaking, ratings and persistent completion', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await expect(
    page.getByRole('heading', { name: 'Your first small program' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Start learning' }).click()
  await page.getByRole('button', { name: 'Got it. Let’s build.' }).click()
  await expect(
    page.getByText('Create a console project. Read a company'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Start building' }).click()
  await page.getByRole('button', { name: 'Built it. Let’s explain.' }).click()
  await page.getByRole('button', { name: 'Start speaking' }).click()
  await page
    .getByRole('button', { name: 'Start speaking', exact: true })
    .click()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await page.getByRole('button', { name: 'Resume', exact: true }).click()
  await page.getByRole('button', { name: 'Finish & reflect' }).click()
  await page.getByRole('button', { name: 'Save practice', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('all five')
  for (const label of ['clarity', 'volume', 'structure', 'pace', 'confidence'])
    await page.locator(`input[name="rating-${label}"][value="4"]`).check()
  await page
    .getByLabel('One thing to try next time')
    .fill('Pause between ideas.')
  await page.getByRole('button', { name: 'Save practice', exact: true }).click()
  await page.getByRole('button', { name: 'Back to your session' }).click()
  await expect(
    page.getByRole('heading', { name: 'Session complete' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Session complete' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Progress', exact: true }).click()
  await expect(page.getByText('1 of 144 sessions')).toBeVisible()
  await expect(page.locator('blockquote')).not.toBeVisible()
  await page.getByRole('button', { name: 'View history' }).click()
  await expect(page.locator('blockquote')).toHaveText('Pause between ideas.')
  await page.getByRole('button', { name: 'C# / .NET' }).click()
  await page.getByLabel('Current level').selectOption('3')
  await page.reload()
  await expect(page.getByRole('button', { name: 'C# / .NET' })).toContainText(
    'Can explain',
  )
  expect(errors).toEqual([])
})

test('roadmap opens any week, rest day is distinct, and date changes preserve progress', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Start learning' }).click()
  await page.getByRole('button', { name: 'Got it. Let’s build.' }).click()
  await page.getByRole('link', { name: 'Roadmap', exact: true }).click()
  await page.getByRole('button', { name: 'Show what you can do' }).click()
  await page
    .getByRole('button', { name: '24 Interview, reflect, move forward' })
    .click()
  await page.getByRole('button', { name: 'Revisit your baseline' }).click()
  await expect(
    page.getByRole('heading', { name: 'Revisit your baseline' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Back to today' }).click()
  await expect(
    page.getByRole('heading', { name: 'Your first small program' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByLabel('Program start date').fill('2026-09-22')
  await page.getByRole('button', { name: 'Save start date' }).click()
  await expect(
    page.getByRole('heading', { name: 'Let it settle.' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.getByLabel('Program start date').fill('2026-09-21')
  await page.getByRole('button', { name: 'Save start date' }).click()
  await page.getByRole('link', { name: 'Today', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Protect an invariant' }),
  ).toBeVisible()
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('engineer-os:v1')!),
  )
  expect(saved.sessions['w1-d1'].learn).toBe(true)
})

test('app reloads offline after installation with saved state and packaged icons', async ({
  page,
  context,
  browserName,
}) => {
  // Playwright's WebKit offline emulation currently rejects even a literal
  // service-worker response. A stopped origin exercises the real cache path.
  // https://github.com/microsoft/playwright/issues/42775
  const isolated =
    browserName === 'webkit'
      ? await preview({ preview: { host: '127.0.0.1', port: 0 } })
      : null
  if (isolated) {
    const address = isolated.httpServer.address()
    if (!address || typeof address === 'string')
      throw new Error('Missing preview port')
    await page.goto(`http://127.0.0.1:${address.port}/engineer-os/`)
  }
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await page.getByRole('button', { name: 'Start learning' }).click()
  await page.getByRole('button', { name: 'Got it. Let’s build.' }).click()
  if (isolated) {
    await new Promise<void>((resolve, reject) =>
      isolated.httpServer.close((error) => (error ? reject(error) : resolve())),
    )
  } else {
    await context.setOffline(true)
  }
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Start building' }),
  ).toBeVisible()
  if (!isolated) await expect(page.getByText('You’re offline.')).toBeVisible()
  await page.getByRole('link', { name: 'Roadmap', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Your roadmap.' }),
  ).toBeVisible()
  if (!isolated) await context.setOffline(false)
  for (const path of [
    'manifest.webmanifest',
    'apple-touch-icon.png',
    'icon-192.png',
    'icon-512.png',
  ]) {
    const response = await page.request.get(path)
    expect(response.ok()).toBe(true)
  }
})

test('backup import validates input, confirms replacement and restores state', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Open settings' }).click()
  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":2}'),
  })
  await expect(page.getByRole('alert')).toContainText('not a valid')
  const backup = {
    version: 1,
    startDate: '2026-09-28',
    sessions: {
      'w1-d1': {
        learn: true,
        build: true,
        speak: true,
        completedAt: '2026-09-28',
      },
    },
    skills: { 0: 3 },
    speaking: [],
  }
  await page.locator('input[type=file]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  })
  await expect(
    page.getByText('Replace current progress with this backup?'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Replace with backup' }).click()
  await expect(
    page.getByRole('heading', { name: 'Session complete' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Open settings' }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export backup' }).click()
  expect((await download).suggestedFilename()).toBe(
    'engineer-os-2026-09-28.json',
  )
})

test('all screens fit a narrow phone with usable navigation and no horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 })
  for (const screen of ['Today', 'Roadmap', 'Speak', 'Progress']) {
    await page.getByRole('link', { name: screen, exact: true }).click()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeVisible()
    await page.screenshot({
      path: `test-results/${test.info().project.name}-${screen.toLowerCase()}-320.png`,
      fullPage: true,
      animations: 'disabled',
    })
  }
})

test('timer accounts for elapsed wall-clock time and finishes after a background interval', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Speak', exact: true }).click()
  await page
    .getByRole('button', { name: 'Start speaking', exact: true })
    .click()
  await page.clock.setFixedTime(new Date('2026-09-28T12:02:01'))
  await expect(
    page.getByRole('heading', { name: 'How did that feel?' }),
  ).toBeVisible()
  await expect(page.getByRole('timer')).toContainText('0:00')
})

test('failed persistence is visible and does not prevent continued practice', async ({
  page,
}) => {
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    }
  })
  await page.getByRole('button', { name: 'Start learning' }).click()
  await page.getByRole('button', { name: 'Got it. Let’s build.' }).click()
  await expect(page.getByRole('alert')).toContainText('could not be saved')
  await expect(
    page.getByRole('button', { name: 'Start building' }),
  ).toBeVisible()
})

test('Leo changes animation with the task and respects reduced motion', async ({
  page,
}) => {
  const leo = page.locator('.premium-leo-wrap .leo-sprite')
  await expect(leo).toHaveClass(/leo-wave/)
  await expect(leo).toHaveCSS('animation-name', 'leo-motion')
  await page.getByRole('button', { name: 'Start learning' }).click()
  await page.getByRole('button', { name: 'Got it. Let’s build.' }).click()
  await expect(leo).toHaveClass(/leo-focus/)
  await page.getByRole('button', { name: 'Start building' }).click()
  await page.getByRole('button', { name: 'Built it. Let’s explain.' }).click()
  await expect(leo).toHaveClass(/leo-waiting/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(leo).toHaveCSS('animation-name', 'none')
})
