import { readFile } from 'node:fs/promises'

const parseEnv = async () => {
  const source = await readFile(new URL('../.env', import.meta.url), 'utf8')
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=')
        const rawValue = line.slice(separator + 1).trim()
        return [
          line.slice(0, separator).trim(),
          rawValue.replace(/^(['"])(.*)\1$/, '$2'),
        ]
      })
  )
}

const env = await parseEnv()
const space = env.CONTENTFUL_SPACE_ID
const environment = env.CONTENTFUL_ENVIRONMENT || 'master'
const token = env.CONTENTFUL_MANAGEMENT_TOKEN
const menuIntro =
  'We also offer freshly baked pastries every day, alongside a variety of vegan cakes, cookies and brownies, all made in-house, with gluten-free options available.'

if (!space || !token) {
  throw new Error(
    'CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN are required in .env'
  )
}

const base = `https://api.contentful.com/spaces/${space}/environments/${environment}`
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/vnd.contentful.management.v1+json',
}

const request = async (path, options = {}, allowed = []) => {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  if (!response.ok && !allowed.includes(response.status)) {
    const detail = await response.text()
    throw new Error(
      `Contentful request failed (${response.status} ${response.statusText}): ${detail}`
    )
  }
  if (response.status === 204) return null
  return { status: response.status, body: await response.json() }
}

const locales = await request('/locales?limit=100')
const locale = locales.body.items.find((item) => item.default)?.code
if (!locale) throw new Error('The Contentful environment has no default locale')

const contentTypeDefinition = {
  name: 'Food Menu',
  description: 'The food menu displayed on stagecoffee.com/menu.',
  displayField: 'name',
  fields: [
    {
      id: 'name',
      name: 'Internal name',
      type: 'Symbol',
      localized: false,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: 'intro',
      name: 'Introduction',
      type: 'Text',
      localized: false,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    },
    {
      id: 'bannerImage',
      name: 'Banner image',
      type: 'Link',
      linkType: 'Asset',
      localized: false,
      required: false,
      validations: [{ linkMimetypeGroup: ['image'] }],
      disabled: false,
      omitted: false,
    },
    {
      id: 'contentMarkdown',
      name: 'Menu content',
      type: 'Text',
      localized: false,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    },
  ],
}

let contentType = await request('/content_types/foodMenu', {}, [404])
let contentTypeNeedsPublishing = false
if (contentType.status === 404) {
  contentType = await request('/content_types/foodMenu', {
    method: 'PUT',
    body: JSON.stringify(contentTypeDefinition),
  })
  contentTypeNeedsPublishing = true
  console.log('Created Food Menu content type')
} else {
  const removedFieldIds = new Set(['title', 'availability'])
  const removedFields = contentType.body.fields.filter((field) =>
    removedFieldIds.has(field.id)
  )

  if (removedFields.length) {
    if (removedFields.some((field) => !field.disabled || !field.omitted)) {
      contentType = await request('/content_types/foodMenu', {
        method: 'PUT',
        headers: {
          'X-Contentful-Version': String(contentType.body.sys.version),
        },
        body: JSON.stringify({
          name: contentType.body.name,
          description: contentType.body.description,
          displayField: 'name',
          fields: contentType.body.fields.map((field) =>
            removedFieldIds.has(field.id)
              ? { ...field, disabled: true, omitted: true, required: false }
              : field
          ),
        }),
      })
      contentType = await request('/content_types/foodMenu/published', {
        method: 'PUT',
        headers: {
          'X-Contentful-Version': String(contentType.body.sys.version),
        },
      })
    }

    contentType = await request('/content_types/foodMenu', {
      method: 'PUT',
      headers: {
        'X-Contentful-Version': String(contentType.body.sys.version),
      },
      body: JSON.stringify({
        name: contentType.body.name,
        description: contentType.body.description,
        displayField: 'name',
        fields: contentType.body.fields.filter(
          (field) => !removedFieldIds.has(field.id)
        ),
      }),
    })
    contentTypeNeedsPublishing = true
    console.log('Removed Page title and Availability from Food Menu')
  }
}

const markdownFieldDefinition = contentTypeDefinition.fields.find(
  (field) => field.id === 'contentMarkdown'
)
const introFieldDefinition = contentTypeDefinition.fields.find(
  (field) => field.id === 'intro'
)
const bannerImageFieldDefinition = contentTypeDefinition.fields.find(
  (field) => field.id === 'bannerImage'
)
const existingMarkdownField = contentType.body.fields.find(
  (field) => field.id === 'contentMarkdown'
)
const existingIntroField = contentType.body.fields.find(
  (field) => field.id === 'intro'
)
const existingBannerImageField = contentType.body.fields.find(
  (field) => field.id === 'bannerImage'
)
const normalizedFields = [
  contentType.body.fields.find((field) => field.id === 'name'),
  existingIntroField
    ? {
        ...existingIntroField,
        name: 'Introduction',
        type: 'Text',
        required: true,
        disabled: false,
        omitted: false,
      }
    : introFieldDefinition,
  existingBannerImageField
    ? {
        ...existingBannerImageField,
        name: 'Banner image',
        type: 'Link',
        linkType: 'Asset',
        required: false,
        validations: [{ linkMimetypeGroup: ['image'] }],
        disabled: false,
        omitted: false,
      }
    : bannerImageFieldDefinition,
  existingMarkdownField
    ? {
        ...existingMarkdownField,
        name: 'Menu content',
        type: 'Text',
        required: true,
        disabled: false,
        omitted: false,
      }
    : markdownFieldDefinition,
  ...contentType.body.fields.filter(
    (field) =>
      !['name', 'intro', 'bannerImage', 'contentMarkdown'].includes(field.id)
  ),
].filter(Boolean)

if (
  JSON.stringify(normalizedFields) !== JSON.stringify(contentType.body.fields)
) {
  contentType = await request('/content_types/foodMenu', {
    method: 'PUT',
    headers: {
      'X-Contentful-Version': String(contentType.body.sys.version),
    },
    body: JSON.stringify({
      name: contentType.body.name,
      description: contentType.body.description,
      displayField: 'name',
      fields: normalizedFields,
    }),
  })
  contentTypeNeedsPublishing = true
  console.log('Updated the Food Menu fields')
}

const requiredFields = ['name', 'intro', 'bannerImage', 'contentMarkdown']
const existingFields = new Set(contentType.body.fields.map((field) => field.id))
if (requiredFields.some((field) => !existingFields.has(field))) {
  throw new Error(
    'The existing foodMenu content type does not have the expected fields'
  )
}

if (
  contentTypeNeedsPublishing ||
  contentType.body.sys.publishedVersion == null
) {
  contentType = await request('/content_types/foodMenu/published', {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(contentType.body.sys.version) },
  })
  console.log('Published Food Menu content type')
}

const editorInterface = await request(
  '/content_types/foodMenu/editor_interface'
)
const markdownControl = editorInterface.body.controls?.find(
  (control) => control.fieldId === 'contentMarkdown'
)
const introControl = editorInterface.body.controls?.find(
  (control) => control.fieldId === 'intro'
)
if (
  markdownControl?.widgetId !== 'markdown' ||
  markdownControl?.widgetNamespace !== 'builtin' ||
  introControl?.widgetId !== 'multipleLine' ||
  introControl?.widgetNamespace !== 'builtin'
) {
  const { sys: editorSys, ...editorDefinition } = editorInterface.body
  editorDefinition.controls = [
    ...(editorDefinition.controls || []).filter(
      (control) =>
        control.fieldId !== 'contentMarkdown' && control.fieldId !== 'intro'
    ),
    {
      fieldId: 'intro',
      widgetId: 'multipleLine',
      widgetNamespace: 'builtin',
      settings: {},
    },
    {
      fieldId: 'contentMarkdown',
      widgetId: 'markdown',
      widgetNamespace: 'builtin',
      settings: {},
    },
  ]
  await request('/content_types/foodMenu/editor_interface', {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(editorSys.version) },
    body: JSON.stringify(editorDefinition),
  })
  console.log('Configured the Contentful Markdown editor')
}

const text = (value, marks = []) => ({
  nodeType: 'text',
  value,
  marks: marks.map((type) => ({ type })),
  data: {},
})
const block = (nodeType, value, marks = []) => ({
  nodeType,
  data: {},
  content: [text(value, marks)],
})

const menuDocument = {
  nodeType: 'document',
  data: {},
  content: [
    block('heading-3', 'Homemade Granola Bowl (V/VGN) — £5.95'),
    block('paragraph', 'Allergens: Gluten, milk.', ['italic']),
    block(
      'paragraph',
      'Greek yoghurt (VGN option: coconut yoghurt), topped with homemade berry compote, homemade granola, diced apple and cinnamon, with a drizzle of agave syrup.'
    ),
    block('heading-3', 'Berry & Banana Porridge (V/VGN) — £5.95'),
    block('paragraph', 'Allergens: Gluten, milk.', ['italic']),
    block(
      'paragraph',
      'Porridge with oat milk for the VGN option, topped with sliced bananas, homemade berry compote and cinnamon.'
    ),
    block('heading-3', 'Stage-shuka (V) — £9.95'),
    block('paragraph', 'Allergens: Gluten, eggs.', ['italic']),
    block(
      'paragraph',
      'Two eggs baked into a spiced tomato base with green peppers, onion, garlic and chilli, served with toasted homemade focaccia.'
    ),
    block('heading-3', 'Soup of the day (V) — £5.95'),
    block(
      'paragraph',
      'Soup topped with homemade croutons. Ask staff for today’s soup and allergen information.'
    ),
    block('heading-2', 'Sandwiches'),
    block('paragraph', 'Available from 10:30.', ['bold']),
    block(
      'paragraph',
      'All sandwiches are served on rosemary and sea-salt focaccia, made fresh in-house daily, and are available toasted.'
    ),
    block('heading-3', 'Brie, caramelised onion and apple (V) — £6.95'),
    block('paragraph', 'Allergens: Gluten, milk.', ['italic']),
    block(
      'paragraph',
      'Sliced brie, homemade caramelised onions and sliced apples.'
    ),
    block('heading-3', 'Sweet & smoky tofu (VGN) — £6.95'),
    block('paragraph', 'Allergens: Gluten, soya.', ['italic']),
    block(
      'paragraph',
      'Tofu marinated in a house-made sticky glaze with pickled carrots and cucumber, spiced mayo and spring onions.'
    ),
    block('heading-3', 'Roasted veg and jalapeño houmous (VGN) — £6.95'),
    block('paragraph', 'Allergens: Gluten, mustard, sesame, sulphites.', [
      'italic',
    ]),
    block(
      'paragraph',
      'Roasted carrots, bell peppers, onions and courgettes, jalapeño houmous and rocket.'
    ),
  ],
}

const nodeText = (node) =>
  typeof node?.value === 'string'
    ? node.value
    : Array.isArray(node?.content)
      ? node.content.map(nodeText).join('')
      : ''

const nodeMarks = (node) => [
  ...(Array.isArray(node?.marks)
    ? node.marks.map((mark) => mark.type).filter(Boolean)
    : []),
  ...(Array.isArray(node?.content) ? node.content.flatMap(nodeMarks) : []),
]

const documentToMarkdown = (document) =>
  document?.nodeType === 'document' && Array.isArray(document.content)
    ? document.content
        .map((node) => {
          const value = nodeText(node).trim()
          if (!value) return ''
          if (node.nodeType === 'heading-2') return `## ${value}`
          if (node.nodeType === 'heading-3') return `### ${value}`
          const marks = nodeMarks(node)
          if (marks.includes('italic')) return `*${value}*`
          if (marks.includes('bold')) return `**${value}**`
          return value
        })
        .filter(Boolean)
        .join('\n\n')
    : ''

const initialMenuMarkdown = documentToMarkdown(menuDocument)

const query = new URLSearchParams({
  content_type: 'foodMenu',
  [`fields.name`]: 'Main food menu',
  limit: '1',
})
const existingEntries = await request(`/entries?${query}`)

if (existingEntries.body.items.length) {
  const entry = existingEntries.body.items[0]
  const fields = Object.fromEntries(
    Object.entries(entry.fields).filter(
      ([field]) => field !== 'title' && field !== 'availability'
    )
  )
  const content = fields.content?.[locale]
  let removedIntroContent = false
  let migratedMarkdown = false
  let addedIntro = false

  if (content?.nodeType === 'document' && Array.isArray(content.content)) {
    const plainText = (node) =>
      Array.isArray(node?.content)
        ? node.content
            .map((child) => child.value || '')
            .join('')
            .trim()
        : ''
    const unwantedIntro = (node) => {
      const value = plainText(node)
      return (
        (node.nodeType === 'heading-2' && value.toLowerCase() === 'food') ||
        (node.nodeType === 'paragraph' &&
          /^available from open until 14:00 daily\.?$/i.test(value))
      )
    }
    const cleanedContent = content.content.filter((node, index) =>
      index < 2 ? !unwantedIntro(node) : true
    )
    removedIntroContent = cleanedContent.length !== content.content.length
    fields.content = {
      ...fields.content,
      [locale]: { ...content, content: cleanedContent },
    }
  }

  if (typeof fields.contentMarkdown?.[locale] !== 'string') {
    fields.contentMarkdown = {
      [locale]: documentToMarkdown(fields.content?.[locale]),
    }
    migratedMarkdown = true
  }
  if (typeof fields.intro?.[locale] !== 'string') {
    fields.intro = { [locale]: menuIntro }
    addedIntro = true
  }

  if (
    removedIntroContent ||
    migratedMarkdown ||
    addedIntro ||
    Object.keys(fields).length !== Object.keys(entry.fields).length
  ) {
    const updatedEntry = await request(`/entries/${entry.sys.id}`, {
      method: 'PUT',
      headers: { 'X-Contentful-Version': String(entry.sys.version) },
      body: JSON.stringify({ fields }),
    })
    if (entry.sys.publishedVersion != null) {
      await request(`/entries/${entry.sys.id}/published`, {
        method: 'PUT',
        headers: {
          'X-Contentful-Version': String(updatedEntry.body.sys.version),
        },
      })
      console.log('Migrated and republished the Food Menu entry')
    } else {
      console.log('Migrated the Food Menu draft to Markdown')
    }
  } else {
    console.log('Food Menu entry already uses Markdown; no changes made')
  }
} else {
  await request('/entries', {
    method: 'POST',
    headers: { 'X-Contentful-Content-Type': 'foodMenu' },
    body: JSON.stringify({
      fields: {
        name: { [locale]: 'Main food menu' },
        intro: { [locale]: menuIntro },
        contentMarkdown: { [locale]: initialMenuMarkdown },
      },
    }),
  })
  console.log('Created unpublished Food Menu draft entry')
}

let latestContentType = await request('/content_types/foodMenu')
const legacyContentField = latestContentType.body.fields.find(
  (field) => field.id === 'content'
)
if (legacyContentField) {
  if (!legacyContentField.disabled || !legacyContentField.omitted) {
    latestContentType = await request('/content_types/foodMenu', {
      method: 'PUT',
      headers: {
        'X-Contentful-Version': String(latestContentType.body.sys.version),
      },
      body: JSON.stringify({
        name: latestContentType.body.name,
        description: latestContentType.body.description,
        displayField: 'name',
        fields: latestContentType.body.fields.map((field) =>
          field.id === 'content'
            ? {
                ...field,
                required: false,
                disabled: true,
                omitted: true,
              }
            : field
        ),
      }),
    })
    latestContentType = await request('/content_types/foodMenu/published', {
      method: 'PUT',
      headers: {
        'X-Contentful-Version': String(latestContentType.body.sys.version),
      },
    })
  }

  latestContentType = await request('/content_types/foodMenu', {
    method: 'PUT',
    headers: {
      'X-Contentful-Version': String(latestContentType.body.sys.version),
    },
    body: JSON.stringify({
      name: latestContentType.body.name,
      description: latestContentType.body.description,
      displayField: 'name',
      fields: latestContentType.body.fields.filter(
        (field) => field.id !== 'content'
      ),
    }),
  })
  await request('/content_types/foodMenu/published', {
    method: 'PUT',
    headers: {
      'X-Contentful-Version': String(latestContentType.body.sys.version),
    },
  })
  console.log('Removed the legacy Rich Text menu field')
}
