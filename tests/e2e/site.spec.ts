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

test('find us section includes walking and cycling information', async ({
  page,
}) => {
  await page.goto('/')
  const findUs = page.locator('.visit-section')
  await expect(findUs.getByRole('heading', { name: 'Find us' })).toBeVisible()
  await expect(findUs.getByText('5-minute walk')).toBeVisible()
  await expect(findUs.getByText('Leeds City Museum')).toBeVisible()
  await expect(findUs.getByText('10-minute walk')).toBeVisible()
  await expect(findUs.getByText('Cycle parking is available.')).toBeVisible()
  const [findUsWidth, homepageCardWidth] = await Promise.all([
    findUs.evaluate((element) => element.getBoundingClientRect().width),
    page
      .locator('.home-introduction-panel')
      .evaluate((element) => element.getBoundingClientRect().width),
  ])
  expect(Math.abs(findUsWidth - homepageCardWidth)).toBeLessThan(1)
})

test('homepage menu tiles remain side by side and link to both menus', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Stage Espresso' }).first()
  ).toBeVisible()
  const menuHeading = page.getByRole('heading', { name: 'Our Menu' })
  await expect(menuHeading).toBeVisible()
  await expect(menuHeading).toHaveCSS('text-align', 'left')
  const retailSection = page.locator('.home-retail')
  await expect(
    retailSection.getByRole('heading', { name: 'Coffee at Home' })
  ).toBeVisible()
  await expect(retailSection.getByText(/whole bean or ground/)).toBeVisible()
  await expect(
    retailSection.getByText(/AeroPress, Chemex and Toddy/)
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Opening Hours' })
  ).toHaveCount(1)
  await expect(page.getByText('Monday to Friday')).toBeVisible()
  await expect(page.getByText('07:30 – 15:30')).toBeVisible()
  await expect(page.getByText('Saturday', { exact: true })).toBeVisible()
  await expect(page.getByText('10:00 – 15:30')).toBeVisible()
  await expect(page.getByText('Sunday', { exact: true })).toBeVisible()
  await expect(page.getByText('Closed', { exact: true })).toBeVisible()
  await expect(
    page.locator('.home-location').getByText(/corner of Great George Street/)
  ).toBeVisible()
  await expect(
    page.getByAltText('Decorative etched glass in the historic Stage building')
  ).toBeVisible()
  const boardGames = page.locator('.home-feature').filter({
    has: page.getByRole('heading', { name: 'Board Games' }),
  })
  const dogFriendly = page.locator('.home-feature').filter({
    has: page.getByRole('heading', { name: 'Dog Friendly' }),
  })
  await expect(boardGames).toHaveCount(1)
  await expect(dogFriendly).toHaveCount(1)
  await expect(boardGames.getByText(/grab a game/)).toBeVisible()
  await expect(boardGames.locator('img')).toHaveAttribute(
    'src',
    /3K0XmonKnvlmb8fEckqdet/
  )
  await expect(dogFriendly.getByText(/dogs are welcome/)).toBeVisible()
  await expect(
    page.locator('.editorial-row').filter({
      has: page.getByRole('heading', { name: 'Stage Espresso' }),
    })
  ).toHaveCount(0)

  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    const [hoursImage, hoursCopy, retailImage, retailCopy] = await Promise.all([
      page.locator('.home-hours-media').boundingBox(),
      page.locator('.home-hours-copy').boundingBox(),
      page.locator('.home-retail-media').boundingBox(),
      page.locator('.home-retail-copy').boundingBox(),
    ])
    const [gamesImage, gamesCopy, dogsImage, dogsCopy] = await Promise.all([
      boardGames.locator('.home-feature-media').boundingBox(),
      boardGames.locator('.home-feature-copy').boundingBox(),
      dogFriendly.locator('.home-feature-media').boundingBox(),
      dogFriendly.locator('.home-feature-copy').boundingBox(),
    ])
    expect(hoursImage!.x).toBeLessThan(hoursCopy!.x)
    expect(retailImage!.x).toBeGreaterThan(retailCopy!.x)
    expect(gamesImage!.x).toBeGreaterThan(gamesCopy!.x)
    expect(dogsImage!.x).toBeLessThan(dogsCopy!.x)
  }
  const tiles = page.locator('.home-menu-tile')
  await expect(tiles).toHaveCount(2)
  await expect(tiles.nth(0)).toHaveAttribute('href', '/coffee')
  await expect(tiles.nth(1)).toHaveAttribute('href', '/menu')
  await expect(tiles.locator('span')).toHaveText(['Coffee', 'Food'])

  const [coffeeBox, foodBox] = await Promise.all([
    tiles.nth(0).boundingBox(),
    tiles.nth(1).boundingBox(),
  ])
  expect(coffeeBox).not.toBeNull()
  expect(foodBox).not.toBeNull()
  expect(Math.abs(coffeeBox!.width - foodBox!.width)).toBeLessThan(1)
  expect(Math.abs(coffeeBox!.y - foodBox!.y)).toBeLessThan(1)

  const homepageCardBox = await page
    .locator('.home-introduction-panel')
    .boundingBox()
  expect(homepageCardBox).not.toBeNull()
  expect(Math.abs(coffeeBox!.x - homepageCardBox!.x)).toBeLessThan(1)
  expect(
    Math.abs(
      foodBox!.x +
        foodBox!.width -
        (homepageCardBox!.x + homepageCardBox!.width)
    )
  ).toBeLessThan(1)

  for (const selector of [
    '.home-introduction-panel',
    '.home-menu-tile',
    '.home-retail-panel',
    '.home-hours-panel',
    '.home-location-panel',
  ]) {
    await expect(page.locator(selector).first()).toHaveCSS('box-shadow', 'none')
  }

  const sectionWidths = await Promise.all(
    ['.home-introduction-panel', '.home-menu-inner', '.home-hours-panel'].map(
      (selector) =>
        page
          .locator(selector)
          .evaluate((element) => element.getBoundingClientRect().width)
    )
  )
  expect(Math.max(...sectionWidths) - Math.min(...sectionWidths)).toBeLessThan(
    1
  )
})

test('admin route is excluded from indexing and redirects only when configured', async ({
  page,
  request,
}) => {
  const response = await request.get('/admin')
  const html = await response.text()
  expect(html).toContain('content="noindex, nofollow"')

  const configured = html.includes('/apps/app_installations/')
  await page.route('https://app.contentful.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Contentful</h1>' })
  )
  await page.goto('/admin')

  if (configured) {
    await expect(page).toHaveURL(/app\.contentful\.com\/.+app_installations/)
  } else {
    await expect(
      page.getByRole('heading', { name: 'Website admin' })
    ).toBeVisible()
    await expect(
      page.getByText('The Contentful admin app has not been configured yet.')
    ).toBeVisible()
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
                  {
                    sys: { id: 'draft-menu-section' },
                    fields: {
                      title: 'Menu',
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
                                value: 'Breakfast and lunch, made to order.',
                                marks: [],
                                data: {},
                              },
                            ],
                          },
                          {
                            nodeType: 'paragraph',
                            data: {},
                            content: [
                              {
                                nodeType: 'text',
                                value: '[[menu]]',
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
                    intro:
                      'Fresh pastries and vegan cakes, made in-house daily.',
                    bannerImage: {
                      fields: {
                        title: 'Fresh food at Stage',
                        file: {
                          url: '//images.ctfassets.net/test/menu-banner.jpg',
                          details: { image: { width: 1600, height: 700 } },
                        },
                      },
                    },
                    contentMarkdown:
                      '## Draft menu\n\n### Draft menu dish — £5.95\n\n*Allergens: Gluten.*',
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
  await expect(
    page.getByRole('link', { name: 'Menu', exact: true })
  ).toHaveAttribute('href', '/preview/menu')
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
  await expect(
    page.locator('.editorial-row-text-only .home-menu-link')
  ).toHaveAttribute('href', '/preview/menu')
  await expect(page.locator('.home-menu-tile').nth(0)).toHaveAttribute(
    'href',
    '/preview/coffee'
  )
  await expect(page.locator('.home-menu-tile').nth(1)).toHaveAttribute(
    'href',
    '/preview/menu'
  )
  expect(previewRequests).toBe(6)

  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Saved draft section' })
  ).toBeVisible()
  await expect(page.getByLabel('Password')).toHaveCount(0)
  expect(previewRequests).toBe(12)

  await page.getByRole('link', { name: 'Menu', exact: true }).click()
  await expect(page).toHaveURL(/\/preview\/menu$/)
  await expect(
    page.getByRole('heading', { name: 'Draft menu dish — £5.95' })
  ).toBeVisible()
  await expect(
    page.getByText('Fresh pastries and vegan cakes, made in-house daily.')
  ).toBeVisible()
  await expect(page.locator('.menu-banner img')).toHaveAttribute(
    'alt',
    'Fresh food at Stage'
  )
  const menuSheetPadding = await page
    .locator('.menu-sheet')
    .evaluate((sheet) => {
      const styles = window.getComputedStyle(sheet)
      return [styles.paddingTop, styles.paddingRight, styles.paddingBottom]
    })
  expect(new Set(menuSheetPadding).size).toBe(1)
  await expect(
    page.locator('.menu-content em').filter({ hasText: 'Allergens: Gluten.' })
  ).toHaveCSS('font-style', 'italic')
  expect(previewRequests).toBe(18)
  await expect(
    page.getByRole('link', { name: 'Home', exact: true })
  ).toHaveAttribute('href', '/preview')

  await page.getByRole('link', { name: 'Coffee', exact: true }).click()
  await expect(page).toHaveURL(/\/preview\/coffee$/)
  await expect(page.locator('.coffee-group > h2')).toHaveText([
    'Espresso',
    'Batch',
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
    has: page.getByRole('heading', { name: 'Espresso', exact: true }),
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
  const contactCard = page.locator('.contact-card')
  const [contactWidth, homepageCardWidth] = await Promise.all([
    contactCard.evaluate((element) => element.getBoundingClientRect().width),
    page
      .locator('.home-introduction-panel')
      .evaluate((element) => element.getBoundingClientRect().width),
  ])
  expect(Math.abs(contactWidth - homepageCardWidth)).toBeLessThan(1)
  await expect(contactCard).toHaveCSS('background-color', 'rgb(255, 253, 248)')
  await expect(contactCard).toHaveCSS('box-shadow', 'none')
  await expect(form.locator('input:invalid')).toHaveCount(1)
  await expect(form.locator('textarea:invalid')).toHaveCount(1)
  await form.getByLabel('Your email').fill('hello@example.com')
  await form.getByLabel('Your message').fill('Hello Stage')
  await form.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByText('Thanks for getting in touch.')).toBeVisible()
  await expect.poll(() => intercepted).toBe(true)
})
