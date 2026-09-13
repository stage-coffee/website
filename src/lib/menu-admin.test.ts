import { describe, expect, it, vi } from 'vitest'
import {
  menuBlocksFromMarkdown,
  menuFieldsFromForm,
  menuFormFromEntry,
  menuMarkdownFromBlocks,
  saveAndPublishMenu,
  validateMenuForm,
  type MenuAdminGateway,
} from './menu-admin'
import type { CoffeeEntryLike } from './coffee-admin'

const entry: CoffeeEntryLike = {
  sys: { id: 'menu', version: 2, publishedVersion: 1 },
  fields: {
    name: { en: 'Main food menu' },
    intro: { en: 'Freshly baked every day.' },
    contentMarkdown: { en: '## Sandwiches\n\n*Allergens: Gluten.*' },
  },
}

describe('menu admin mapping', () => {
  it('maps Contentful Markdown to editable menu blocks', () => {
    expect(menuFormFromEntry(entry, 'en')).toMatchObject({
      name: 'Main food menu',
      intro: 'Freshly baked every day.',
      blocks: [
        { style: 'section', text: 'Sandwiches' },
        { style: 'allergen', text: 'Allergens: Gluten.' },
      ],
    })
  })

  it('round-trips the supported menu Markdown formatting', () => {
    const markdown = [
      '## Sandwiches',
      '### Soup of the day — £5.95',
      '*Allergens: Gluten.*',
      '**Available from 10:30**',
      'Ask staff for today’s soup.',
    ].join('\n\n')

    expect(menuMarkdownFromBlocks(menuBlocksFromMarkdown(markdown))).toBe(
      markdown
    )
  })

  it('creates localized Contentful fields and validates empty menus', () => {
    const form = { name: '', intro: 'Freshly baked every day.', blocks: [] }
    expect(validateMenuForm(form)).toMatch(/at least one/i)
    expect(menuFieldsFromForm(form, 'en')).toMatchObject({
      name: { en: 'Main food menu' },
      intro: { en: 'Freshly baked every day.' },
      contentMarkdown: { en: '' },
    })
  })

  it('requires the menu introduction', () => {
    expect(
      validateMenuForm({
        name: 'Main food menu',
        intro: '',
        blocks: [{ id: '1', style: 'text', text: 'A dish' }],
      })
    ).toMatch(/introduction/i)
  })
})

describe('menu admin publishing', () => {
  const gateway = (current = entry): MenuAdminGateway<CoffeeEntryLike> => ({
    get: vi.fn(async () => current),
    create: vi.fn(async (fields) => ({
      sys: { id: 'new-menu', version: 1 },
      fields,
    })),
    update: vi.fn(async (existing, fields) => ({
      ...existing,
      sys: { ...existing.sys, version: (existing.sys.version || 0) + 1 },
      fields: { ...existing.fields, ...fields },
    })),
    publish: vi.fn(async (existing) => existing),
    requireAccess: vi.fn(async () => undefined),
  })

  it('updates and publishes the current menu', async () => {
    const client = gateway()
    await saveAndPublishMenu(client, entry, {
      contentMarkdown: { en: '## Food' },
    })
    expect(client.update).toHaveBeenCalledOnce()
    expect(client.publish).toHaveBeenCalledOnce()
  })

  it('refuses to overwrite a newer menu version', async () => {
    const client = gateway({ ...entry, sys: { ...entry.sys, version: 3 } })
    await expect(
      saveAndPublishMenu(client, entry, {
        contentMarkdown: { en: '## Food' },
      })
    ).rejects.toMatchObject({ status: 409 })
  })
})
