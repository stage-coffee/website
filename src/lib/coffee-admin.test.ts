import { describe, expect, it, vi } from 'vitest'
import {
  archiveCoffee,
  coffeeEntryStatus,
  coffeeFormFromEntry,
  coffeeFormToFields,
  emptyCoffeeForm,
  isVersionConflict,
  restoreCoffee,
  saveAndPublishCoffee,
  validateCoffeeForm,
  type CoffeeAdminGateway,
  type CoffeeEntryLike,
} from './coffee-admin'

const entry = {
  sys: { id: 'coffee', version: 4, publishedVersion: 3 },
  fields: {
    coffeeName: { en: ' Test coffee ' },
    coffeeRoaster: { en: 'Test roaster' },
    notes: { en: 'Peach and cocoa.' },
    caffeine: { en: 'Decaf' },
    origin: { en: 'Colombia' },
    prices: { en: ['Filter — £5', 42] },
    filter: { en: true },
  },
}

describe('coffee admin mapping', () => {
  it('maps localized Contentful fields into the editor form', () => {
    expect(coffeeFormFromEntry(entry, 'en')).toMatchObject({
      coffeeName: ' Test coffee ',
      caffeine: 'Decaf',
      origin: 'Colombia',
      prices: ['Filter — £5'],
      filter: true,
      retail: false,
    })
  })

  it('normalizes fields before sending them to Contentful', () => {
    const form = {
      ...emptyCoffeeForm(),
      coffeeName: ' Test coffee ',
      coffeeRoaster: ' Test roaster ',
      notes: ' Peach ',
      origin: ' Colombia ',
      prices: [' Filter — £5 ', ''],
      filter: true,
    }

    expect(coffeeFormToFields(form, 'en')).toMatchObject({
      coffeeName: { en: 'Test coffee' },
      coffeeRoaster: { en: 'Test roaster' },
      prices: { en: ['Filter — £5'] },
      filter: { en: true },
    })
  })
})

describe('coffee admin validation and status', () => {
  it('requires core fields and at least one website section', () => {
    expect(validateCoffeeForm(emptyCoffeeForm())).toEqual({
      coffeeName: 'Enter a coffee name.',
      coffeeRoaster: 'Enter the coffee roastery.',
      notes: 'Enter tasting notes.',
      origin: 'Enter the coffee origin.',
      sections: 'Choose at least one section for this coffee.',
    })
  })

  it('recognizes Contentful lifecycle states', () => {
    expect(coffeeEntryStatus(entry)).toBe('Published')
    expect(
      coffeeEntryStatus({ ...entry, sys: { ...entry.sys, version: 5 } })
    ).toBe('Changed')
    expect(
      coffeeEntryStatus({ ...entry, sys: { id: 'draft', version: 1 } })
    ).toBe('Draft')
    expect(
      coffeeEntryStatus({
        ...entry,
        sys: { ...entry.sys, archivedAt: '2026-09-07T08:00:00Z' },
      })
    ).toBe('Archived')
  })

  it('detects direct and wrapped Contentful conflicts', () => {
    expect(isVersionConflict({ status: 409 })).toBe(true)
    expect(isVersionConflict({ response: { status: 409 } })).toBe(true)
    expect(isVersionConflict({ name: 'VersionMismatch' })).toBe(true)
    expect(isVersionConflict({ status: 500 })).toBe(false)
  })
})

const workflowEntry = (
  overrides: Partial<CoffeeEntryLike['sys']> = {}
): CoffeeEntryLike => ({
  sys: { id: 'coffee', version: 2, ...overrides },
  fields: {},
})

const workflowGateway = (
  current = workflowEntry()
): CoffeeAdminGateway<CoffeeEntryLike> => ({
  get: vi.fn(async () => current),
  create: vi.fn(async (fields) => ({
    ...workflowEntry({ id: 'created' }),
    fields,
  })),
  update: vi.fn(async (existing, fields) => ({
    ...existing,
    sys: { ...existing.sys, version: (existing.sys.version ?? 0) + 1 },
    fields: { ...existing.fields, ...fields },
  })),
  publish: vi.fn(async (existing) => ({
    ...existing,
    sys: { ...existing.sys, publishedVersion: existing.sys.version },
  })),
  unpublish: vi.fn(async (existing) => ({
    ...existing,
    sys: { ...existing.sys, publishedVersion: undefined },
  })),
  archive: vi.fn(async (existing) => ({
    ...existing,
    sys: { ...existing.sys, archivedAt: '2026-09-07T08:00:00Z' },
  })),
  unarchive: vi.fn(async (existing) => ({
    ...existing,
    sys: { ...existing.sys, archivedAt: undefined },
  })),
  requireAccess: vi.fn(async () => undefined),
})

describe('coffee admin workflows', () => {
  it('creates and immediately publishes a new coffee', async () => {
    const gateway = workflowGateway()
    const published = await saveAndPublishCoffee(gateway, null, {
      coffeeName: { en: 'New coffee' },
    })

    expect(gateway.create).toHaveBeenCalledOnce()
    expect(gateway.publish).toHaveBeenCalledOnce()
    expect(gateway.requireAccess).toHaveBeenCalledWith(
      'create',
      expect.any(Object)
    )
    expect(gateway.requireAccess).toHaveBeenCalledWith(
      'publish',
      expect.any(Object)
    )
    expect(published.sys.id).toBe('created')
  })

  it('refuses to overwrite a newer Contentful version', async () => {
    const opened = workflowEntry({ version: 2 })
    const gateway = workflowGateway(workflowEntry({ version: 3 }))

    await expect(
      saveAndPublishCoffee(gateway, opened, {
        coffeeName: { en: 'Changed coffee' },
      })
    ).rejects.toMatchObject({ status: 409 })
    expect(gateway.update).not.toHaveBeenCalled()
  })

  it('unpublishes before archiving a published coffee', async () => {
    const published = workflowEntry({ publishedVersion: 1 })
    const gateway = workflowGateway(published)

    const archived = await archiveCoffee(gateway, published)

    expect(gateway.unpublish).toHaveBeenCalledOnce()
    expect(gateway.archive).toHaveBeenCalledOnce()
    expect(archived.sys.archivedAt).toBeTruthy()
  })

  it('restores an archived coffee as an unpublished entry', async () => {
    const archived = workflowEntry({ archivedAt: '2026-09-07T08:00:00Z' })
    const gateway = workflowGateway(archived)

    const restored = await restoreCoffee(gateway, archived)

    expect(gateway.requireAccess).toHaveBeenCalledWith('unarchive', archived)
    expect(restored.sys.archivedAt).toBeUndefined()
  })
})
