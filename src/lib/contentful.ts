import type { Document } from '@contentful/rich-text-types'

export type ImageAsset = {
  url: string
  title: string
  description?: string
  width?: number
  height?: number
}

export type HomeSection = {
  id: string
  title: string
  text: Document | null
  image: ImageAsset | null
}

export type StageEvent = {
  id: string
  name: string
  description: Document | null
  image: ImageAsset | null
  startTime: string
  endTime: string
}

export type StageJob = {
  id: string
  position: string
  description: Document | null
  link: string
}

export type FoodMenu = {
  id: string
  name: string
  intro: string
  bannerImage: ImageAsset | null
  markdown: string
}

export type Coffee = {
  id: string
  createdAt: string
  name: string
  roaster: string
  notes: string
  origin: string
  region: string
  altitude: string
  producer: string
  farm: string
  varietal: string
  process: string
  caffeine: string
  prices: string[]
  houseEspresso: boolean
  houseBatch: boolean
  filter: boolean
  retail: boolean
}

export type BlogPost = {
  id: string
  createdAt: string
  firstPublishedAt: string
  title: string
  slug: string
  coverImage: ImageAsset | null
  publishedDate: string
  shortIntro: string
  content: Document | null
}

export type SiteContent = {
  banners: ImageAsset[]
  homeSections: HomeSection[]
  contactFormText: Document | null
  events: StageEvent[]
  jobs: StageJob[]
  foodMenu: FoodMenu | null
  coffees: Coffee[]
}

type RawRecord = {
  sys?: {
    id?: string
    type?: string
    linkType?: string
    createdAt?: string
    firstPublishedAt?: string
  }
  fields?: Record<string, unknown>
  [key: string]: unknown
}

type RawCollection = {
  items?: RawRecord[]
  includes?: { Entry?: RawRecord[]; Asset?: RawRecord[] }
  total?: number
  skip?: number
  limit?: number
}

export type ContentfulConfig = {
  space: string
  token: string
  environment?: string
  preview?: boolean
}

const emptyContent: SiteContent = {
  banners: [],
  homeSections: [],
  contactFormText: null,
  events: [],
  jobs: [],
  foodMenu: null,
  coffees: [],
}

const isRecord = (input: unknown): input is RawRecord =>
  Boolean(input && typeof input === 'object' && !Array.isArray(input))

const asString = (input: unknown, fallback = '') =>
  typeof input === 'string' ? input : fallback

const asStringArray = (input: unknown): string[] =>
  Array.isArray(input) ? input.filter((item) => typeof item === 'string') : []

const asBoolean = (input: unknown) => input === true

const asRecordArray = (input: unknown): RawRecord[] =>
  Array.isArray(input) ? input.filter(isRecord) : []

const asDocument = (input: unknown): Document | null => {
  if (!isRecord(input)) return null
  return input.nodeType === 'document' && Array.isArray(input.content)
    ? (input as unknown as Document)
    : null
}

const imageFrom = (input: unknown): ImageAsset | null => {
  const asset = input as RawRecord | undefined
  const file = asset?.fields?.file as
    | {
        url?: string
        details?: { image?: { width?: number; height?: number } }
      }
    | undefined
  if (!file?.url) return null

  return {
    url: file.url.startsWith('//') ? `https:${file.url}` : file.url,
    title: asString(asset?.fields?.title),
    description: asString(asset?.fields?.description),
    width: file.details?.image?.width,
    height: file.details?.image?.height,
  }
}

export const resolveCollection = (collection: RawCollection): RawRecord[] => {
  const records = [
    ...(collection.items ?? []),
    ...(collection.includes?.Entry ?? []),
    ...(collection.includes?.Asset ?? []),
  ]
  const byId = new Map(
    records
      .filter((record) => record.sys?.id)
      .map((record) => [record.sys!.id!, record])
  )

  const resolve = (input: unknown, trail = new Set<string>()): unknown => {
    if (Array.isArray(input)) return input.map((item) => resolve(item, trail))
    if (!input || typeof input !== 'object') return input

    const record = input as RawRecord
    if (record.sys?.type === 'Link' && record.sys.id) {
      const linked = byId.get(record.sys.id)
      if (!linked || trail.has(record.sys.id)) return null
      return resolve(linked, new Set([...trail, record.sys.id]))
    }

    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => [key, resolve(item, trail)])
    )
  }

  return (collection.items ?? []).map((item) => resolve(item) as RawRecord)
}

const fetchEntries = async (
  contentType: string,
  config: ContentfulConfig,
  filters: Record<string, string> = {}
): Promise<RawRecord[]> => {
  const host = config.preview ? 'preview.contentful.com' : 'cdn.contentful.com'
  const environment = config.environment || 'master'
  const query = new URLSearchParams({
    access_token: config.token,
    content_type: contentType,
    include: '10',
    limit: '1000',
    ...filters,
  })
  const entries: RawRecord[] = []
  let skip = 0
  let total = 0

  do {
    query.set('skip', String(skip))
    const response = await fetch(
      `https://${host}/spaces/${config.space}/environments/${environment}/entries?${query}`
    )

    if (!response.ok) {
      throw new Error(
        `Contentful ${contentType} request failed (${response.status})`
      )
    }

    const collection = (await response.json()) as RawCollection
    const page = resolveCollection(collection)
    entries.push(...page)
    total = collection.total ?? page.length
    skip += collection.limit ?? page.length
  } while (skip < total && skip > 0)

  return entries
}

const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const isValidBlogSlug = (slug: string) => BLOG_SLUG_PATTERN.test(slug)

const blogPostFrom = (entry: RawRecord, index = 0): BlogPost => ({
  id: asString(entry.sys?.id, `blog-${index}`),
  createdAt: asString(entry.sys?.createdAt),
  firstPublishedAt: asString(entry.sys?.firstPublishedAt),
  title: asString(entry.fields?.title, 'Untitled post'),
  slug: asString(entry.fields?.slug),
  coverImage: imageFrom(entry.fields?.coverImage),
  publishedDate: asString(entry.fields?.publishedDate),
  shortIntro: asString(entry.fields?.shortIntro),
  content: asDocument(entry.fields?.content),
})

const validDateValue = (value: string) =>
  value && Number.isFinite(new Date(value).getTime()) ? value : ''

export const getBlogDisplayDate = (post: BlogPost) =>
  validDateValue(post.publishedDate) ||
  validDateValue(post.firstPublishedAt) ||
  validDateValue(post.createdAt)

export const sortBlogPosts = (posts: BlogPost[]) =>
  [...posts].sort((left, right) => {
    const dateDifference =
      new Date(getBlogDisplayDate(right) || 0).getTime() -
      new Date(getBlogDisplayDate(left) || 0).getTime()
    if (dateDifference) return dateDifference

    const titleDifference = left.title.localeCompare(right.title, 'en-GB')
    return titleDifference || left.id.localeCompare(right.id, 'en-GB')
  })

export const getRelatedBlogPosts = (posts: BlogPost[], currentId: string) =>
  sortBlogPosts(posts)
    .filter(({ id }) => id !== currentId)
    .slice(0, 2)

export const fetchBlogPosts = async (
  config: ContentfulConfig
): Promise<BlogPost[]> => {
  if (!config.space || !config.token) return []

  const entries = await fetchEntries('blog', config)
  const postsBySlug = new Map<string, BlogPost>()
  entries.forEach((entry, index) => {
    const post = blogPostFrom(entry, index)
    if (isValidBlogSlug(post.slug) && !postsBySlug.has(post.slug)) {
      postsBySlug.set(post.slug, post)
    }
  })
  return sortBlogPosts([...postsBySlug.values()])
}

export const fetchBlogPostBySlug = async (
  config: ContentfulConfig,
  slug: string
): Promise<BlogPost | null> => {
  if (!config.space || !config.token || !isValidBlogSlug(slug)) return null

  const [entry] = await fetchEntries('blog', config, {
    'fields.slug': slug,
    limit: '1',
  })
  return entry ? blogPostFrom(entry) : null
}

export const filterCurrentEvents = (
  events: StageEvent[],
  now = new Date()
): StageEvent[] =>
  [...events]
    .filter((event) => {
      const finalTime = new Date(event.endTime || event.startTime).getTime()
      return Number.isFinite(finalTime) && finalTime >= now.getTime()
    })
    .sort(
      (first, second) =>
        new Date(first.startTime).getTime() -
        new Date(second.startTime).getTime()
    )

export const sortCoffees = (coffees: Coffee[]): Coffee[] =>
  [...coffees].sort((first, second) => {
    const firstIsDecaf = first.caffeine.toLowerCase() === 'decaf'
    const secondIsDecaf = second.caffeine.toLowerCase() === 'decaf'
    if (firstIsDecaf !== secondIsDecaf) return firstIsDecaf ? 1 : -1

    const timeDifference =
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    if (Number.isFinite(timeDifference) && timeDifference !== 0) {
      return timeDifference
    }
    return first.name.localeCompare(second.name)
  })

export const fetchSiteContent = async (
  config: ContentfulConfig
): Promise<SiteContent> => {
  if (!config.space || !config.token) return emptyContent

  const [
    homeResult,
    bannerResult,
    eventResult,
    jobResult,
    foodMenuResult,
    coffeeResult,
  ] = await Promise.allSettled([
    fetchEntries('websiteOrder', config),
    fetchEntries('banner', config),
    fetchEntries('events', config),
    fetchEntries('job', config),
    fetchEntries('foodMenu', config),
    fetchEntries('coffee', config),
  ])

  // The page-order entry owns the site's primary content and contact copy. If
  // that request fails, abort the build rather than deploying an apparently
  // successful but empty website. Secondary collections can still degrade to
  // their accessible empty states when an individual model is unavailable.
  if (homeResult.status === 'rejected') throw homeResult.reason

  const home = homeResult.value[0]
  const banner =
    bannerResult.status === 'fulfilled' ? bannerResult.value[0] : undefined
  const eventEntries =
    eventResult.status === 'fulfilled' ? eventResult.value : []
  const jobEntries = jobResult.status === 'fulfilled' ? jobResult.value : []
  const foodMenuEntry =
    foodMenuResult.status === 'fulfilled' ? foodMenuResult.value[0] : undefined
  const coffeeEntries =
    coffeeResult.status === 'fulfilled' ? coffeeResult.value : []

  const sections = asRecordArray(home?.fields?.contentOrder)
  const bannerAssets = Array.isArray(banner?.fields?.images)
    ? banner.fields.images
    : []

  const events = eventEntries.map((entry, index) => {
    const startTime = asString(entry.fields?.startTime)
    return {
      id: asString(entry.sys?.id, `event-${index}`),
      name: asString(entry.fields?.displayName, 'Untitled event'),
      description: asDocument(entry.fields?.description),
      image: imageFrom(entry.fields?.image),
      startTime,
      endTime: asString(entry.fields?.endTime, startTime),
    }
  })

  return {
    banners: bannerAssets.map(imageFrom).filter(Boolean) as ImageAsset[],
    homeSections: sections.map((entry, index) => ({
      id: asString(entry.sys?.id, `section-${index}`),
      title: asString(entry.fields?.title, 'Stage Espresso'),
      text: asDocument(entry.fields?.text),
      image: imageFrom(entry.fields?.image),
    })),
    contactFormText: asDocument(home?.fields?.contactFormText),
    events: filterCurrentEvents(events),
    jobs: jobEntries.map((entry, index) => ({
      id: asString(entry.sys?.id, `job-${index}`),
      position: asString(entry.fields?.jobPosition, 'Role at Stage'),
      description: asDocument(entry.fields?.description),
      link: asString(entry.fields?.link),
    })),
    foodMenu: foodMenuEntry
      ? {
          id: asString(foodMenuEntry.sys?.id, 'food-menu'),
          name: asString(foodMenuEntry.fields?.name, 'Main food menu'),
          intro: asString(foodMenuEntry.fields?.intro),
          bannerImage: imageFrom(foodMenuEntry.fields?.bannerImage),
          markdown: asString(foodMenuEntry.fields?.contentMarkdown),
        }
      : null,
    coffees: sortCoffees(
      coffeeEntries.map((entry, index) => ({
        id: asString(entry.sys?.id, `coffee-${index}`),
        createdAt: asString(entry.sys?.createdAt),
        name: asString(entry.fields?.coffeeName, 'Untitled coffee'),
        roaster: asString(entry.fields?.coffeeRoaster),
        notes: asString(entry.fields?.notes),
        origin: asString(entry.fields?.origin),
        region: asString(entry.fields?.region),
        altitude: asString(entry.fields?.altitude),
        producer: asString(entry.fields?.producer),
        farm: asString(entry.fields?.farm),
        varietal: asString(entry.fields?.varietal),
        process: asString(entry.fields?.process),
        caffeine: asString(entry.fields?.caffeine),
        prices: asStringArray(entry.fields?.prices),
        houseEspresso: asBoolean(entry.fields?.houseEspresso),
        houseBatch: asBoolean(entry.fields?.houseBatch),
        filter: asBoolean(entry.fields?.filter),
        retail: asBoolean(entry.fields?.retail),
      }))
    ),
  }
}

export const getProductionContent = () =>
  fetchSiteContent({
    space: import.meta.env.CONTENTFUL_SPACE_ID || '',
    token: import.meta.env.CONTENTFUL_DELIVERY_TOKEN || '',
    environment: import.meta.env.CONTENTFUL_ENVIRONMENT || 'master',
  })

let productionBlogPostsPromise: Promise<BlogPost[]> | undefined

export const getProductionBlogPosts = () => {
  productionBlogPostsPromise ??= fetchBlogPosts({
    space: import.meta.env.CONTENTFUL_SPACE_ID || '',
    token: import.meta.env.CONTENTFUL_DELIVERY_TOKEN || '',
    environment: import.meta.env.CONTENTFUL_ENVIRONMENT || 'master',
  })
  return productionBlogPostsPromise
}
