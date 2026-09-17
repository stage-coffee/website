import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchBlogPostBySlug,
  fetchBlogPosts,
  fetchSiteContent,
  filterCurrentEvents,
  getBlogDisplayDate,
  getRelatedBlogPosts,
  isValidBlogSlug,
  resolveCollection,
  sortBlogPosts,
  sortCoffees,
  type BlogPost,
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

const blogPost = (
  id: string,
  publishedDate = '',
  firstPublishedAt = '',
  createdAt = ''
): BlogPost => ({
  id,
  createdAt,
  firstPublishedAt,
  title: id,
  slug: id,
  coverImage: null,
  publishedDate,
  shortIntro: '',
  content: null,
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

describe('blog content', () => {
  it('sorts by the effective date and selects two other newest posts', () => {
    const posts = [
      blogPost('created', '', '', '2026-09-14T12:00:00Z'),
      blogPost('field-date', '2026-09-16', '', '2026-09-01T12:00:00Z'),
      blogPost('first-published', '', '2026-09-15T12:00:00Z'),
      blogPost('invalid', 'not-a-date'),
    ]

    expect(sortBlogPosts(posts).map(({ id }) => id)).toEqual([
      'field-date',
      'first-published',
      'created',
      'invalid',
    ])
    expect(getBlogDisplayDate(posts[2])).toBe('2026-09-15T12:00:00Z')
    expect(
      getRelatedBlogPosts(posts, 'field-date').map(({ id }) => id)
    ).toEqual(['first-published', 'created'])
  })

  it('uses a stable title and id order when dates match', () => {
    const posts = [blogPost('zulu'), blogPost('alpha'), blogPost('bravo')]
    expect(sortBlogPosts(posts).map(({ id }) => id)).toEqual([
      'alpha',
      'bravo',
      'zulu',
    ])
  })

  it('maps valid posts and resolves cover and embedded image assets', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          total: 1,
          limit: 1000,
          items: [
            {
              sys: {
                id: 'post-one',
                createdAt: '2026-09-14T10:00:00Z',
                firstPublishedAt: '2026-09-15T10:00:00Z',
              },
              fields: {
                title: 'A Stage update',
                slug: 'a-stage-update',
                coverImage: {
                  sys: { id: 'cover', type: 'Link', linkType: 'Asset' },
                },
                publishedDate: '2026-09-16',
                shortIntro: 'News from Stage.',
                content: {
                  nodeType: 'document',
                  data: {},
                  content: [
                    {
                      nodeType: 'embedded-asset-block',
                      data: {
                        target: {
                          sys: {
                            id: 'inline-image',
                            type: 'Link',
                            linkType: 'Asset',
                          },
                        },
                      },
                      content: [],
                    },
                  ],
                },
              },
            },
          ],
          includes: {
            Asset: [
              {
                sys: { id: 'cover' },
                fields: {
                  title: 'Outside Stage',
                  description: 'The exterior of Stage coffee shop',
                  file: {
                    url: '//images.ctfassets.net/test/cover.jpg',
                    details: { image: { width: 1600, height: 900 } },
                  },
                },
              },
              {
                sys: { id: 'inline-image' },
                fields: {
                  title: 'Autumn at Stage',
                  file: {
                    url: '//images.ctfassets.net/test/autumn.jpg',
                    details: { image: { width: 1200, height: 800 } },
                  },
                },
              },
            ],
          },
        })
      )
    )

    const [post] = await fetchBlogPosts({ space: 'space', token: 'token' })
    expect(post).toMatchObject({
      id: 'post-one',
      createdAt: '2026-09-14T10:00:00Z',
      firstPublishedAt: '2026-09-15T10:00:00Z',
      title: 'A Stage update',
      slug: 'a-stage-update',
      publishedDate: '2026-09-16',
      shortIntro: 'News from Stage.',
      coverImage: {
        url: 'https://images.ctfassets.net/test/cover.jpg',
        title: 'Outside Stage',
        description: 'The exterior of Stage coffee shop',
        width: 1600,
        height: 900,
      },
    })
    expect(
      (
        post.content?.content[0].data.target as {
          fields: { title: string }
        }
      ).fields.title
    ).toBe('Autumn at Stage')
  })

  it('excludes missing, unsafe, and duplicate slugs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          items: [
            { sys: { id: 'valid' }, fields: { slug: 'valid-post' } },
            { sys: { id: 'missing' }, fields: {} },
            { sys: { id: 'unsafe' }, fields: { slug: '../unsafe' } },
            { sys: { id: 'duplicate' }, fields: { slug: 'valid-post' } },
          ],
        })
      )
    )

    const posts = await fetchBlogPosts({ space: 'space', token: 'token' })
    expect(posts.map(({ id }) => id)).toEqual(['valid'])
    expect(isValidBlogSlug('the-stage-blog')).toBe(true)
    expect(isValidBlogSlug('The Stage Blog')).toBe(false)
  })

  it('uses the Preview API and filters by slug for a draft lookup', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request) =>
      Response.json({
        items: [
          {
            sys: { id: 'draft' },
            fields: { title: 'Draft post', slug: 'draft-post' },
          },
        ],
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const post = await fetchBlogPostBySlug(
      { space: 'space', token: 'preview-token', preview: true },
      'draft-post'
    )
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]))
    expect(requestUrl.host).toBe('preview.contentful.com')
    expect(requestUrl.searchParams.get('fields.slug')).toBe('draft-post')
    expect(requestUrl.searchParams.get('limit')).toBe('1')
    expect(post?.title).toBe('Draft post')
  })

  it('returns safe defaults and reports Contentful failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ items: [{ fields: { slug: 'post' } }] })
      )
    )
    await expect(
      fetchBlogPostBySlug({ space: 'space', token: 'token' }, 'post')
    ).resolves.toMatchObject({
      title: 'Untitled post',
      coverImage: null,
      publishedDate: '',
      shortIntro: '',
      content: null,
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 }))
    )
    await expect(
      fetchBlogPosts({ space: 'space', token: 'token' })
    ).rejects.toThrow('Contentful blog request failed (503)')
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
                        contentMarkdown: 42,
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
      intro: '',
      bannerImage: null,
      markdown: '',
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
