export type CoffeeForm = {
  coffeeName: string
  coffeeRoaster: string
  notes: string
  caffeine: 'Caffeinated' | 'Decaf'
  origin: string
  region: string
  altitude: string
  producer: string
  farm: string
  varietal: string
  process: string
  prices: string[]
  houseEspresso: boolean
  houseBatch: boolean
  filter: boolean
  retail: boolean
}

export type CoffeeEntryLike = {
  sys: {
    id: string
    version?: number
    createdAt?: string
    updatedAt?: string
    publishedVersion?: number
    archivedAt?: string
  }
  fields: Record<string, unknown>
}

export type CoffeeStatus = 'Archived' | 'Changed' | 'Draft' | 'Published'
export type CoffeeAdminAction =
  'create' | 'update' | 'publish' | 'unpublish' | 'archive' | 'unarchive'

export type CoffeeAdminGateway<T extends CoffeeEntryLike = CoffeeEntryLike> = {
  get: (entryId: string) => Promise<T>
  create: (fields: Record<string, unknown>) => Promise<T>
  update: (entry: T, fields: Record<string, unknown>) => Promise<T>
  publish: (entry: T) => Promise<T>
  unpublish: (entry: T) => Promise<T>
  archive: (entry: T) => Promise<T>
  unarchive: (entry: T) => Promise<T>
  requireAccess: (action: CoffeeAdminAction, entry: object) => Promise<void>
}

export class PublishFailedError extends Error {
  cause: unknown

  constructor(cause: unknown) {
    super('The entry was saved as a draft but could not be published.')
    this.name = 'PublishFailedError'
    this.cause = cause
  }
}

export const emptyCoffeeForm = (): CoffeeForm => ({
  coffeeName: '',
  coffeeRoaster: '',
  notes: '',
  caffeine: 'Caffeinated',
  origin: '',
  region: '',
  altitude: '',
  producer: '',
  farm: '',
  varietal: '',
  process: '',
  prices: [''],
  houseEspresso: false,
  houseBatch: false,
  filter: false,
  retail: false,
})

const localValue = (value: unknown, locale: string): unknown =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)[locale]
    : undefined

const localString = (value: unknown, locale: string): string => {
  const result = localValue(value, locale)
  return typeof result === 'string' ? result : ''
}

const localBoolean = (value: unknown, locale: string): boolean =>
  localValue(value, locale) === true

export const coffeeFormFromEntry = (
  entry: CoffeeEntryLike,
  locale: string
): CoffeeForm => {
  const prices = localValue(entry.fields.prices, locale)

  return {
    coffeeName: localString(entry.fields.coffeeName, locale),
    coffeeRoaster: localString(entry.fields.coffeeRoaster, locale),
    notes: localString(entry.fields.notes, locale),
    caffeine:
      localString(entry.fields.caffeine, locale).toLowerCase() === 'decaf'
        ? 'Decaf'
        : 'Caffeinated',
    origin: localString(entry.fields.origin, locale),
    region: localString(entry.fields.region, locale),
    altitude: localString(entry.fields.altitude, locale),
    producer: localString(entry.fields.producer, locale),
    farm: localString(entry.fields.farm, locale),
    varietal: localString(entry.fields.varietal, locale),
    process: localString(entry.fields.process, locale),
    prices: Array.isArray(prices)
      ? prices.filter((price): price is string => typeof price === 'string')
      : [''],
    houseEspresso: localBoolean(entry.fields.houseEspresso, locale),
    houseBatch: localBoolean(entry.fields.houseBatch, locale),
    filter: localBoolean(entry.fields.filter, locale),
    retail: localBoolean(entry.fields.retail, locale),
  }
}

export const coffeeFormToFields = (
  form: CoffeeForm,
  locale: string
): Record<string, Record<string, string | string[] | boolean>> => ({
  coffeeName: { [locale]: form.coffeeName.trim() },
  coffeeRoaster: { [locale]: form.coffeeRoaster.trim() },
  notes: { [locale]: form.notes.trim() },
  caffeine: { [locale]: form.caffeine },
  origin: { [locale]: form.origin.trim() },
  region: { [locale]: form.region.trim() },
  altitude: { [locale]: form.altitude.trim() },
  producer: { [locale]: form.producer.trim() },
  farm: { [locale]: form.farm.trim() },
  varietal: { [locale]: form.varietal.trim() },
  process: { [locale]: form.process.trim() },
  prices: {
    [locale]: form.prices.map((price) => price.trim()).filter(Boolean),
  },
  houseEspresso: { [locale]: form.houseEspresso },
  houseBatch: { [locale]: form.houseBatch },
  filter: { [locale]: form.filter },
  retail: { [locale]: form.retail },
})

export const validateCoffeeForm = (
  form: CoffeeForm
): Partial<Record<keyof CoffeeForm | 'sections', string>> => {
  const errors: Partial<Record<keyof CoffeeForm | 'sections', string>> = {}
  if (!form.coffeeName.trim()) errors.coffeeName = 'Enter a coffee name.'
  if (!form.coffeeRoaster.trim())
    errors.coffeeRoaster = 'Enter the coffee roastery.'
  if (!form.notes.trim()) errors.notes = 'Enter tasting notes.'
  if (!form.origin.trim()) errors.origin = 'Enter the coffee origin.'
  if (!form.houseEspresso && !form.houseBatch && !form.filter && !form.retail) {
    errors.sections = 'Choose at least one section for this coffee.'
  }
  return errors
}

export const coffeeEntryStatus = (entry: CoffeeEntryLike): CoffeeStatus => {
  if (entry.sys.archivedAt) return 'Archived'
  if (typeof entry.sys.publishedVersion !== 'number') return 'Draft'
  return (entry.sys.version ?? 0) > entry.sys.publishedVersion + 1
    ? 'Changed'
    : 'Published'
}

export const isVersionConflict = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const candidate = error as {
    status?: number
    response?: { status?: number }
    name?: string
  }
  return (
    candidate.status === 409 ||
    candidate.response?.status === 409 ||
    candidate.name === 'VersionMismatch'
  )
}

export const saveAndPublishCoffee = async <T extends CoffeeEntryLike>(
  gateway: CoffeeAdminGateway<T>,
  existing: T | null,
  fields: Record<string, unknown>
): Promise<T> => {
  let saved: T
  if (existing) {
    const latest = await gateway.get(existing.sys.id)
    if (latest.sys.version !== existing.sys.version) {
      throw Object.assign(new Error('Version mismatch'), { status: 409 })
    }
    await gateway.requireAccess('update', latest)
    await gateway.requireAccess('publish', latest)
    saved = await gateway.update(latest, fields)
  } else {
    const candidate = {
      sys: {
        id: 'new-coffee',
        type: 'Entry',
        contentType: {
          sys: { type: 'Link', linkType: 'ContentType', id: 'coffee' },
        },
      },
      fields,
    }
    await gateway.requireAccess('create', candidate)
    await gateway.requireAccess('publish', candidate)
    saved = await gateway.create(fields)
  }

  try {
    return await gateway.publish(saved)
  } catch (error) {
    throw new PublishFailedError(error)
  }
}

export const archiveCoffee = async <T extends CoffeeEntryLike>(
  gateway: CoffeeAdminGateway<T>,
  entry: T
): Promise<T> => {
  let latest = await gateway.get(entry.sys.id)
  await gateway.requireAccess('archive', latest)
  if (typeof latest.sys.publishedVersion === 'number') {
    await gateway.requireAccess('unpublish', latest)
    latest = await gateway.unpublish(latest)
  }
  return gateway.archive(latest)
}

export const restoreCoffee = async <T extends CoffeeEntryLike>(
  gateway: CoffeeAdminGateway<T>,
  entry: T
): Promise<T> => {
  await gateway.requireAccess('unarchive', entry)
  return gateway.unarchive(entry)
}
