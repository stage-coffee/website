import type { CoffeeAdminAction, CoffeeEntryLike } from './coffee-admin'

export type MenuBlockStyle =
  'section' | 'dish' | 'allergen' | 'highlight' | 'text'

export type MenuBlock = {
  id: string
  style: MenuBlockStyle
  text: string
}

export type MenuForm = {
  name: string
  intro: string
  blocks: MenuBlock[]
}

export const menuMarkdownFromBlocks = (blocks: MenuBlock[]): string =>
  blocks
    .map((block) => {
      switch (block.style) {
        case 'section':
          return `## ${block.text}`
        case 'dish':
          return `### ${block.text}`
        case 'allergen':
          return `*${block.text}*`
        case 'highlight':
          return `**${block.text}**`
        default:
          return block.text
      }
    })
    .join('\n\n')

export const menuBlocksFromMarkdown = (markdown: string): MenuBlock[] =>
  markdown
    .split(/\n\s*\n/)
    .map((value, index): MenuBlock | null => {
      const text = value.trim()
      if (!text) return null
      if (text.startsWith('### ')) {
        return {
          id: `markdown-${index}`,
          style: 'dish',
          text: text.slice(4).trim(),
        }
      }
      if (text.startsWith('## ')) {
        return {
          id: `markdown-${index}`,
          style: 'section',
          text: text.slice(3).trim(),
        }
      }
      if (text.startsWith('**') && text.endsWith('**') && text.length > 4) {
        return {
          id: `markdown-${index}`,
          style: 'highlight',
          text: text.slice(2, -2).trim(),
        }
      }
      if (
        ((text.startsWith('*') && text.endsWith('*')) ||
          (text.startsWith('_') && text.endsWith('_'))) &&
        text.length > 2
      ) {
        return {
          id: `markdown-${index}`,
          style: 'allergen',
          text: text.slice(1, -1).trim(),
        }
      }
      return { id: `markdown-${index}`, style: 'text', text }
    })
    .filter((block): block is MenuBlock => Boolean(block))

export type MenuAdminGateway<T extends CoffeeEntryLike = CoffeeEntryLike> = {
  get: (entryId: string) => Promise<T>
  create: (fields: Record<string, unknown>) => Promise<T>
  update: (entry: T, fields: Record<string, unknown>) => Promise<T>
  publish: (entry: T) => Promise<T>
  requireAccess: (action: CoffeeAdminAction, entry: object) => Promise<void>
}

const localizedValue = (value: unknown, locale: string): unknown =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)[locale]
    : undefined

export const menuFormFromEntry = (
  entry: CoffeeEntryLike | null,
  locale: string
): MenuForm => {
  const markdown = entry
    ? localizedValue(entry.fields.contentMarkdown, locale)
    : undefined
  const intro = entry ? localizedValue(entry.fields.intro, locale) : undefined

  return {
    name:
      (entry &&
        typeof localizedValue(entry.fields.name, locale) === 'string' &&
        (localizedValue(entry.fields.name, locale) as string)) ||
      'Main food menu',
    intro: typeof intro === 'string' ? intro : '',
    blocks:
      typeof markdown === 'string' ? menuBlocksFromMarkdown(markdown) : [],
  }
}

export const menuFieldsFromForm = (
  form: MenuForm,
  locale: string
): Record<string, Record<string, unknown>> => ({
  name: { [locale]: form.name.trim() || 'Main food menu' },
  intro: { [locale]: form.intro.trim() },
  contentMarkdown: { [locale]: menuMarkdownFromBlocks(form.blocks) },
})

export const menuFieldsFromMarkdown = (
  name: string,
  intro: string,
  markdown: string,
  locale: string
): Record<string, Record<string, unknown>> => ({
  name: { [locale]: name.trim() || 'Main food menu' },
  intro: { [locale]: intro.trim() },
  contentMarkdown: { [locale]: markdown.trim() },
})

export const validateMenuForm = (form: MenuForm): string => {
  if (!form.intro.trim()) return 'Add the menu introduction before publishing.'
  return form.blocks.some((block) => block.text.trim())
    ? ''
    : 'Add at least one menu line before publishing.'
}

export const saveAndPublishMenu = async <T extends CoffeeEntryLike>(
  gateway: MenuAdminGateway<T>,
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
        id: 'new-food-menu',
        type: 'Entry',
        contentType: {
          sys: { type: 'Link', linkType: 'ContentType', id: 'foodMenu' },
        },
      },
      fields,
    }
    await gateway.requireAccess('create', candidate)
    await gateway.requireAccess('publish', candidate)
    saved = await gateway.create(fields)
  }

  return gateway.publish(saved)
}
