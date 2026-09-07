import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchSiteContent,
  filterCurrentEvents,
  resolveCollection,
  sortCoffees,
  type Coffee,
  type StageEvent,
} from './contentful'

afterEach(() => vi.unstubAllGlobals())

const event = (id: string, startTime: string, endTime: string): StageEvent => ({
  id,
  name: id,
  description: null,
  image: null,
  startTime,
  endTime,
})

const coffee = (name: string, caffeine: string, createdAt: string): Coffee => ({
  id: name,
  createdAt,
  name,
  caffeine,
  roaster: '',
  notes: '',
  origin: '',
  region: '',
  altitude: '',
  producer: '',
  farm: '',
  varietal: '',
  process: '',
  prices: [],
  houseEspresso: false,
  houseBatch: false,
  filter: false,
  retail: false,
})

describe('sortCoffees', () => {
  it('puts caffeinated coffees before decaf, then sorts newest first', () => {
    const result = sortCoffees([
      coffee('New decaf', 'Decaf', '2026-09-04T12:00:00Z'),
      coffee('Old caffeinated', 'Caffeinated', '2026-09-01T12:00:00Z'),
      coffee('New caffeinated', 'Caffeinated', '2026-09-03T12:00:00Z'),
      coffee('Old decaf', 'Decaf', '2026-09-02T12:00:00Z'),
    ])

    expect(result.map(({ name }) => name)).toEqual([
      'New caffeinated',
      'Old caffeinated',
      'New decaf',
      'Old decaf',
    ])
  })
})

describe('filterCurrentEvents', () => {
  it('retains ongoing events, removes finished events, and sorts the result', () => {
    const now = new Date('2026-09-03T12:00:00Z')
    const result = filterCurrentEvents(
      [
        event('future', '2026-09-04T18:00:00Z', '2026-09-04T20:00:00Z'),
        event('finished', '2026-09-02T18:00:00Z', '2026-09-02T20:00:00Z'),
        event('ongoing', '2026-09-03T11:00:00Z', '2026-09-03T13:00:00Z'),
      ],
      now
    )
    expect(result.map(({ id }) => id)).toEqual(['ongoing', 'future'])
  })
})

describe('resolveCollection', () => {
  it('resolves linked entries and assets and tolerates missing links', () => {
    const [item] = resolveCollection({
      items: [
        {
          sys: { id: 'home' },
          fields: {
            hero: { sys: { id: 'asset', type: 'Link' } },
            missing: { sys: { id: 'missing', type: 'Link' } },
          },
        },
      ],
      includes: {
        Asset: [{ sys: { id: 'asset' }, fields: { title: 'Coffee' } }],
      },
    })
    expect(
      (item.fields?.hero as { fields: { title: string } }).fields.title
    ).toBe('Coffee')
    expect(item.fields?.missing).toBeNull()
  })
})

describe('fetchSiteContent', () => {
  it('uses safe defaults for malformed optional fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const type = new URL(String(input)).searchParams.get('content_type')
        const items =
          type === 'websiteOrder'
            ? [
                {
                  sys: { id: 'home' },
                  fields: {
                    contentOrder: [null, { fields: { title: 42 } }],
                    contactFormText: 'not rich text',
                  },
                },
              ]
            : type === 'events'
              ? [
                  {
                    fields: {
                      displayName: null,
                      startTime: '2099-09-04T18:00:00Z',
                    },
                  },
                ]
              : type === 'foodMenu'
                ? [
                    {
                      fields: {
                        name: 42,
                        content: 'not rich text',
                      },
                    },
                  ]
                : type === 'coffee'
                  ? [
                      {
                        sys: { id: 'coffee-one' },
                        fields: {
                          coffeeName: 'Test Coffee',
                          coffeeRoaster: 'Test Roaster',
                          notes: 'Stone fruit.',
                          origin: 'Colombia',
                          prices: ['Filter — £5.00', 42],
                          houseEspresso: true,
                          houseBatch: 'not a boolean',
                          filter: true,
                          retail: false,
                        },
                      },
                    ]
                  : []
        return new Response(JSON.stringify({ items }), { status: 200 })
      })
    )

    const content = await fetchSiteContent({ space: 'space', token: 'token' })
    expect(content.homeSections[0].title).toBe('Stage Espresso')
    expect(content.contactFormText).toBeNull()
    expect(content.events[0]).toMatchObject({
      name: 'Untitled event',
      endTime: '2099-09-04T18:00:00Z',
    })
    expect(content.foodMenu).toMatchObject({
      name: 'Main food menu',
      content: null,
    })
    expect(content.coffees[0]).toMatchObject({
      name: 'Test Coffee',
      roaster: 'Test Roaster',
      process: '',
      prices: ['Filter — £5.00'],
      houseEspresso: true,
      houseBatch: false,
      filter: true,
      retail: false,
    })
  })

  it('fails instead of publishing an empty site when primary content fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 }))
    )

    await expect(
      fetchSiteContent({ space: 'space', token: 'token' })
    ).rejects.toThrow('Contentful websiteOrder request failed (503)')
  })
})
