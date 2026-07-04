import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const reports = [
  'Floodwater is rising around a residential building.',
  'Water has reached the entrance and three residents are trapped upstairs.',
  'A wheelchair user needs help because the elevator is offline.',
  'The south road is closed by standing water.',
]

type TestLocation = {
  id: string
  name: string
  region: string
  country: string
  displayName: string
  coordinate: { lat: number; lng: number }
  timezone: string
}

const montreal: TestLocation = {
  id: 'relation-1634158',
  name: 'Montréal',
  region: 'Québec',
  country: 'Canada',
  displayName: 'Montréal, Québec, Canada',
  coordinate: { lat: 45.5019, lng: -73.5674 },
  timezone: 'America/Toronto',
}

const nairobi: TestLocation = {
  id: 'relation-918509',
  name: 'Nairobi',
  region: 'Nairobi County',
  country: 'Kenya',
  displayName: 'Nairobi, Nairobi County, Kenya',
  coordinate: { lat: -1.2921, lng: 36.8219 },
  timezone: 'Africa/Nairobi',
}

const mockLiveServices = async (page: Page, location: TestLocation) => {
  const staging = {
    ...location,
    id: `${location.id}-staging`,
    displayName: `Operations Centre, ${location.name}, ${location.country}`,
    coordinate: {
      lat: location.coordinate.lat + 0.012,
      lng: location.coordinate.lng + 0.012,
    },
  }
  await page.route('**/api/geocode?*', (route) => {
    const query = new URL(route.request().url()).searchParams.get('q') ?? ''
    return route.fulfill({ json: query.includes('Operations') ? [staging] : [location] })
  })
  await page.route('**/api/weather?*', (route) =>
    route.fulfill({
      json: {
        temperature: 21,
        precipitation: 4.2,
        windSpeed: 18,
        observedAt: '14:30',
        timezone: location.timezone,
        source: 'Open-Meteo',
      },
    }),
  )
  await page.route('**/api/staging-sites?*', (route) =>
    route.fulfill({ json: [staging] }),
  )
  await page.route('**/api/route?*', (route) =>
    route.fulfill({
      json: {
        coordinates: [
          [location.coordinate.lng + 0.012, location.coordinate.lat + 0.009],
          [location.coordinate.lng, location.coordinate.lat],
        ],
        duration: 7,
        distance: 2.1,
        source: 'OSRM',
      },
    }),
  )
  await page.route('**/api/analyze', (route) =>
    route.fulfill({
      json: {
        summary:
          'Submitted reports indicate flooding, an access closure, and an accessibility need.',
        needs: ['Water rescue', 'Accessible evacuation', 'Medical standby'],
        hazards: ['Flood conditions', 'Access disruption'],
        recommendedAction: 'Verify reports and assign required local capabilities.',
        confidence: 88,
        source: 'Rules engine',
      },
    }),
  )
}

const configureOperation = async (
  page: Page,
  location: TestLocation = montreal,
) => {
  await mockLiveServices(page, location)
  await page.goto('/operations')
  await page.getByLabel('Operator name').fill('Alex Rivera')
  await page.getByLabel('Search exact incident address or landmark').fill(location.name)
  await page.getByRole('button', { name: 'Search' }).first().click()
  await page
    .getByRole('listbox', { name: 'Incident location results' })
    .getByRole('option')
    .click()
  await expect(
    page.getByRole('listbox', { name: 'Suggested staging sites' }).getByRole('option'),
  ).toBeVisible()
  await page
    .getByLabel('Incoming situation reports')
    .fill(reports.join('\n'))
  await page.getByRole('button', { name: 'Start operation' }).click()
  await expect(page.getByRole('heading', { name: 'Live operations' })).toBeVisible()
}

const assertViewportIntegrity = async (page: Page) => {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }))
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
}

test('complete emergency coordination workflow', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await configureOperation(page)
  await expect(page.getByText('Montréal Emergency Operations')).toBeVisible()
  await expect(page.getByLabel('Signed in as Alex Rivera')).toBeVisible()
  await assertViewportIntegrity(page)
  await page.screenshot({ path: 'test-results/01-live-operations.png', fullPage: true })

  await page
    .locator('.incident-queue')
    .getByRole('button', { name: /Flooding requires coordinated response/ })
    .click()
  await expect(page).toHaveURL(/\/operations\/incident$/)
  await expect(page.getByRole('heading', { name: 'What we know' })).toBeVisible()
  await assertViewportIntegrity(page)
  await page.screenshot({ path: 'test-results/02-incident-room.png', fullPage: true })

  await page.getByRole('button', { name: 'Verify and build response' }).click()
  await expect(page).toHaveURL(/\/operations\/response$/)
  await expect(page.getByRole('heading', { name: 'Response plan' })).toBeVisible()
  await expect(page.getByText('2.1 km')).toBeVisible()
  await assertViewportIntegrity(page)
  await page.screenshot({ path: 'test-results/03-response-plan.png', fullPage: true })

  await page.getByRole('button', { name: 'Approve response plan' }).click()
  await expect(page).toHaveURL(/\/operations\/alert$/)
  await expect(page.getByRole('heading', { name: 'Public alert' })).toBeVisible()
  await assertViewportIntegrity(page)
  await page.screenshot({ path: 'test-results/04-public-alert.png', fullPage: true })

  await page.getByRole('button', { name: 'Approve warning content' }).click()
  await expect(page).toHaveURL(/\/operations\/accountability$/)
  await expect(page.getByRole('heading', { name: 'Accountability' })).toBeVisible()
  await expect(page.getByText('Approved coordinated response')).toBeVisible()
  await expect(page.getByText('Approved public-warning content')).toBeVisible()
  await expect(page.getByText('Alex Rivera · Duty officer').first()).toBeVisible()
  await assertViewportIntegrity(page)
  await page.screenshot({ path: 'test-results/05-accountability.png', fullPage: true })

  expect(consoleErrors).toEqual([])
})

test('core pages remain usable at 1280 by 720', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 })
  await configureOperation(page)

  for (const route of ['/operations', '/operations/incident', '/operations/response', '/operations/alert', '/operations/accountability']) {
    await page.goto(route)
    await assertViewportIntegrity(page)
  }

  await page.getByRole('link', { name: 'Coordinate' }).click()
  await page.screenshot({ path: 'test-results/06-live-operations-1280.png', fullPage: true })
})

test('location inputs drive a different jurisdiction without code changes', async ({
  page,
}) => {
  await configureOperation(page, nairobi)
  await expect(page.getByText('Nairobi Emergency Operations')).toBeVisible()
  await expect(page.getByText('Nairobi, Nairobi County, Kenya')).toBeVisible()
  await page.getByRole('link', { name: 'Public alert' }).click()
  await expect(page.locator('.message-editor input')).toHaveValue(
    /Nairobi, Nairobi County, Kenya/,
  )
})

test('priority review is recorded and bilingual content is location-driven', async ({
  page,
}) => {
  await configureOperation(page)
  await page.getByRole('link', { name: 'Incident room' }).click()
  await page.getByRole('button', { name: 'Review priority' }).click()
  await page
    .getByLabel('Reason for review')
    .fill('Critical priority retained after confirming mobility constraints.')
  await page.getByRole('button', { name: 'Record decision' }).click()
  await page.getByRole('link', { name: 'Accountability' }).click()
  await expect(
    page.getByText(
      'Critical priority retained after confirming mobility constraints.',
    ),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Public alert' }).click()
  await page.getByRole('button', { name: 'FR' }).click()
  await expect(page.locator('.message-editor input')).toHaveValue(/Montréal/)
})

test('resident request and volunteer offer flow into coordinator matching', async ({
  page,
}) => {
  await mockLiveServices(page, montreal)

  await page.goto('/support')
  await page.getByLabel('Volunteer name').fill('Sam Volunteer')
  await page.getByLabel('Search address or landmark').fill('Montréal')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByRole('option').click()
  await page.getByLabel('Transportation', { exact: true }).check()
  await page.getByRole('button', { name: 'Submit availability' }).click()
  await expect(page.getByRole('heading', { name: 'Verification pending' })).toBeVisible()

  await page.goto('/help')
  await page.getByLabel('Name').fill('Resident A')
  await page.getByLabel('Search address or nearby landmark').fill('Montréal')
  await page.getByRole('button', { name: 'Search' }).click()
  await page.getByRole('option').click()
  await page.getByLabel('Transportation', { exact: true }).check()
  await page.getByLabel('Disability or mobility need').check()
  await page
    .getByLabel('What is happening?')
    .fill('Floodwater is rising and accessible transportation is required.')
  await page.getByRole('button', { name: 'Send help request' }).click()
  await expect(page.getByText('REQUEST RECEIVED')).toBeVisible()

  await page.getByRole('link', { name: 'Coordinate' }).click()
  await page.getByRole('button', { name: /Transportation/ }).click()
  await page.getByLabel('Operator name').fill('Alex Rivera')
  await expect(
    page.getByRole('listbox', { name: 'Suggested staging sites' }).getByRole('option'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Start operation' }).click()
  await page.getByRole('button', { name: 'Verify' }).click()
  await page
    .locator('.incident-queue')
    .getByRole('button', { name: /Flooding requires coordinated response/ })
    .click()
  await page.getByRole('button', { name: 'Verify and build response' }).click()
  await expect(page.getByText('Sam Volunteer')).toBeVisible()
  await expect(page.getByText('Verified volunteer')).toBeVisible()
})

test('configured pages have no serious accessibility violations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await configureOperation(page)

  for (const route of ['/operations', '/operations/incident', '/operations/response', '/operations/alert', '/operations/accountability']) {
    await page.goto(route)
    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast'])
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    const serious = results.violations.filter(
      (violation) =>
        violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(serious, `${route}: ${JSON.stringify(serious, null, 2)}`).toEqual([])
  }
})
