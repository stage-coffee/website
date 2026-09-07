import { expect, test } from '@playwright/test'

test('public routes render useful headings and metadata', async ({ page }) => {
  for (const path of ['/', '/events/', '/jobs/', '/menu', '/coffee']) {
    await page.goto(path)
    await expect(page.locator('h1').first()).toHaveCount(1)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /.+/
    )
  }
})

test('preview content is gated and excluded from indexing', async ({
  page,
}) => {
  let previewRequests = 0
  await page.route(
    /\/preview(?:\/(?:events|jobs|menu|coffee))?$/,
    async (route) => {
      const response = await route.fetch()
      const body = (await response.text())
        .replace(
          /&quot;space&quot;:\[0,&quot;.*?&quot;\]/,
          '&quot;space&quot;:[0,&quot;test-space&quot;]'
        )
        .replace(
          /&quot;token&quot;:\[0,&quot;.*?&quot;\]/,
          '&quot;token&quot;:[0,&quot;test-preview-token&quot;]'
        )
        .replace(
          /&quot;passwordHash&quot;:\[0,&quot;.*?&quot;\]/,
          '&quot;passwordHash&quot;:[0,&quot;fc854058676fcddbf002517d0491768e3bc8fad2647745a674eb57e68dbbded1&quot;]'
        )
      await route.fulfill({ response, body })
    }
  )
  await page.route('https://preview.contentful.com/**', async (route) => {
    previewRequests += 1
    const type = new URL(route.request().url()).searchParams.get('content_type')
    const items =
      type === 'websiteOrder'
        ? [
            {
              sys: { id: 'draft-home' },
              fields: {
                contentOrder: [
                  {
                    sys: { id: 'draft-section' },
                    fields: {
                      title: 'Saved draft section',
                      text: {
                        nodeType: 'document',
                        data: {},
                        content: [
                          {
                            nodeType: 'paragraph',
                            data: {},
                            content: [
                              {
                                nodeType: 'text',
                                value: '[[events]]',
                                marks: [],
                                data: {},
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ]
        : type === 'events'
          ? [
              {
                sys: { id: 'draft-event' },
                fields: {
                  displayName: 'Draft preview event',
                  startTime: '2099-09-04T18:00:00Z',
                  endTime: '2099-09-04T20:00:00Z',
                },
              },
            ]
          : type === 'foodMenu'
            ? [
                {
                  sys: { id: 'draft-menu' },
                  fields: {
                    name: 'Main food menu',
                    content: {
                      nodeType: 'document',
                      data: {},
                      content: [
                        {
                          nodeType: 'heading-2',
                          data: {},
                          content: [
                            {
                              nodeType: 'text',
                              value: 'Draft menu dish — £5.95',
                              marks: [],
                              data: {},
                            },
                          ],
                        },
                      ],
                    },
                  },
                },
              ]
            : type === 'coffee'
              ? [
                  {
                    sys: {
                      id: 'draft-coffee',
                      createdAt: '2026-09-01T12:00:00Z',
                    },
                    fields: {
                      coffeeName: 'Draft Coffee',
                      coffeeRoaster: 'Preview Roaster',
                      notes: 'Peach and chocolate.',
                      origin: 'Colombia',
                      region: 'Huila',
                      process: 'Natural',
                      caffeine: 'Caffeinated',
                      prices: ['Filter — £5.00', '250g beans — £14.00'],
                      houseEspresso: true,
                      houseBatch: false,
                      filter: true,
                      retail: true,
                    },
                  },
                  {
                    sys: {
                      id: 'draft-decaf',
                      createdAt: '2026-09-04T12:00:00Z',
                    },
                    fields: {
                      coffeeName: 'Draft Decaf',
                      coffeeRoaster: 'Decaf Roaster',
                      notes: 'Chocolate and orange.',
                      origin: 'Brazil',
                      process: 'CO2 Decaf',
                      caffeine: 'Decaf',
                      prices: ['Filter — £5.00'],
                      houseEspresso: false,
                      houseBatch: true,
                      filter: true,
                      retail: false,
                    },
                  },
                ]
              : []
    await route.fulfill({ json: { items } })
  })

  await page.goto('/preview')
  await expect(page.getByLabel('Password')).toBeVisible()
  await expect(page.getByLabel('Preview mode')).toContainText(
    /Preview\s*Unpublished content/
  )
  await expect(
    page.getByRole('link', { name: 'Home', exact: true })
  ).toHaveAttribute('href', '/preview')
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Events' })
  ).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Menu' })).toHaveAttribute(
    'href',
    '/preview/menu'
  )
  await expect(
    page.getByRole('link', { name: 'Coffee', exact: true })
  ).toHaveAttribute('href', '/preview/coffee')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow'
  )
  await expect(page.getByText('Loading draft content…')).toHaveCount(0)
  expect(previewRequests).toBe(0)

  await page.getByLabel('Password').fill('stage-test-preview')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(
    page.getByRole('heading', { name: 'Seriously good coffee' })
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Saved draft section' })
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Draft preview event/ })
  ).toHaveAttribute('href', '/preview/events')
  expect(previewRequests).toBe(6)

  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Saved draft section' })
  ).toBeVisible()
  await expect(page.getByLabel('Password')).toHaveCount(0)
  expect(previewRequests).toBe(12)

  await page.getByRole('link', { name: 'Menu' }).click()
  await expect(page).toHaveURL(/\/preview\/menu$/)
  await expect(
    page.getByRole('heading', { name: 'Draft menu dish — £5.95' })
  ).toBeVisible()
  expect(previewRequests).toBe(18)
  await expect(
    page.getByRole('link', { name: 'Home', exact: true })
  ).toHaveAttribute('href', '/preview')

  await page.getByRole('link', { name: 'Coffee', exact: true }).click()
  await expect(page).toHaveURL(/\/preview\/coffee$/)
  await expect(page.locator('.coffee-group > h2')).toHaveText([
    'House Espresso',
    'House Batch',
    'Pour Over',
    'Retail',
  ])
  const filtersSection = page.locator('.coffee-group').filter({
    has: page.getByRole('heading', { name: 'Pour Over' }),
  })
  await expect(filtersSection.locator('.coffee-card-title')).toHaveText([
    'Draft Coffee',
    'Draft Decaf',
  ])
  const espressoSection = page.locator('.coffee-group').filter({
    has: page.getByRole('heading', { name: 'House Espresso' }),
  })
  const coffeeCard = espressoSection.locator('.coffee-card').filter({
    has: page.locator('.coffee-card-title', { hasText: 'Draft Coffee' }),
  })
  await expect(coffeeCard.locator('.coffee-card-title')).toBeVisible()
  await expect(coffeeCard.locator('.coffee-roaster')).toHaveText(
    'Roasted by Preview Roaster'
  )
  await expect(coffeeCard.locator('.coffee-card-summary')).toHaveText(
    'Colombia · Natural'
  )
  await expect(
    coffeeCard.getByText('Caffeinated', { exact: true })
  ).toHaveCount(0)
  await expect(
    filtersSection
      .locator('.coffee-card')
      .filter({ hasText: 'Draft Decaf' })
      .locator('.coffee-decaf')
  ).toHaveText('Decaf')
  await coffeeCard.locator('summary').click()
  await expect(coffeeCard.getByText('Peach and chocolate.')).toBeVisible()
  await expect(coffeeCard.getByText('250g beans — £14.00')).toBeVisible()
  expect(previewRequests).toBe(24)
})

test('contact form validates locally without sending a message', async ({
  page,
}) => {
  let intercepted = false
  await page.route('https://docs.google.com/**', async (route) => {
    intercepted = true
    await route.fulfill({ status: 204, body: '' })
  })
  await page.goto('/')
  const form = page.locator('.contact-form')
  await expect(form.locator('input:invalid')).toHaveCount(1)
  await expect(form.locator('textarea:invalid')).toHaveCount(1)
  await form.getByLabel('Your email').fill('hello@example.com')
  await form.getByLabel('Your message').fill('Hello Stage')
  await form.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByText('Thanks for getting in touch.')).toBeVisible()
  await expect.poll(() => intercepted).toBe(true)
})
