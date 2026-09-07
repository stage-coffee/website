import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../.env', import.meta.url), 'utf8')
const env = Object.fromEntries(
  source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const separator = line.indexOf('=')
      return [
        line.slice(0, separator).trim(),
        line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, '$2'),
      ]
    })
)

const space = env.CONTENTFUL_SPACE_ID
const environment = env.CONTENTFUL_ENVIRONMENT || 'master'
const token = env.CONTENTFUL_MANAGEMENT_TOKEN

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
    throw new Error(
      `Contentful request failed (${response.status} ${response.statusText}): ${await response.text()}`
    )
  }
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
  }
}

const locales = await request('/locales?limit=100')
const locale = locales.body.items.find((item) => item.default)?.code
if (!locale) throw new Error('The Contentful environment has no default locale')

const symbol = (id, name, required = false) => ({
  id,
  name,
  type: 'Symbol',
  localized: false,
  required,
  validations: [],
  disabled: false,
  omitted: false,
})

const symbolList = (id, name, required = false) => ({
  id,
  name,
  type: 'Array',
  localized: false,
  required,
  validations: [],
  items: { type: 'Symbol', validations: [] },
  disabled: false,
  omitted: false,
})

const boolean = (id, name) => ({
  id,
  name,
  type: 'Boolean',
  localized: false,
  required: true,
  validations: [],
  disabled: false,
  omitted: false,
})

const contentTypeDefinition = {
  name: 'Coffee',
  description: 'A coffee served at Stage, with tasting and provenance details.',
  displayField: 'coffeeName',
  fields: [
    symbol('coffeeName', 'Coffee name', true),
    symbol('coffeeRoaster', 'Coffee roaster', true),
    boolean('houseEspresso', 'House Espresso'),
    boolean('houseBatch', 'House Batch'),
    boolean('retail', 'Retail'),
    boolean('filter', 'Filter'),
    {
      ...symbol('caffeine', 'Caffeinated / decaf', true),
      validations: [{ in: ['Caffeinated', 'Decaf'] }],
    },
    symbol('origin', 'Origin', true),
    symbol('process', 'Process'),
    {
      id: 'notes',
      name: 'Notes',
      type: 'Text',
      localized: false,
      required: true,
      validations: [],
      disabled: false,
      omitted: false,
    },
    symbolList('prices', 'Price options'),
    symbol('region', 'Region'),
    symbol('altitude', 'Altitude'),
    symbol('producer', 'Producer'),
    symbol('farm', 'Farm'),
    symbol('varietal', 'Varietal'),
  ],
}

let contentType = await request('/content_types/coffee', {}, [404])
const existingCoffeeEntries =
  contentType.status === 404
    ? []
    : (await request('/entries?content_type=coffee&limit=1000')).body.items

if (contentType.status === 404) {
  contentType = await request('/content_types/coffee', {
    method: 'PUT',
    body: JSON.stringify(contentTypeDefinition),
  })
  console.log('Created Coffee content type')
  contentType = await request('/content_types/coffee/published', {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(contentType.body.sys.version) },
  })
  console.log('Published Coffee content type')
} else {
  const publishType = async () => {
    contentType = await request('/content_types/coffee/published', {
      method: 'PUT',
      headers: { 'X-Contentful-Version': String(contentType.body.sys.version) },
    })
  }
  const updateType = async (fields) => {
    contentType = await request('/content_types/coffee', {
      method: 'PUT',
      headers: { 'X-Contentful-Version': String(contentType.body.sys.version) },
      body: JSON.stringify({ ...contentTypeDefinition, fields }),
    })
  }
  const legacyPrice = contentType.body.fields.find(
    (field) => field.id === 'price'
  )

  if (legacyPrice && (!legacyPrice.disabled || !legacyPrice.omitted)) {
    const stagedFields = contentType.body.fields.map((field) => {
      if (field.id === 'price') {
        return { ...field, required: false, disabled: true, omitted: true }
      }
      if (field.id === 'process') return { ...field, required: false }
      return field
    })
    for (const field of contentTypeDefinition.fields) {
      if (!stagedFields.some((existing) => existing.id === field.id)) {
        stagedFields.push(field)
      }
    }
    await updateType(stagedFields)
    await publishType()
  }

  const currentFields = new Map(
    contentType.body.fields.map((field) => [field.id, field])
  )
  const schemaChanged =
    currentFields.size !== contentTypeDefinition.fields.length ||
    contentTypeDefinition.fields.some((field) => {
      const current = currentFields.get(field.id)
      return (
        !current ||
        current.type !== field.type ||
        current.required !== field.required ||
        current.name !== field.name ||
        JSON.stringify(current.validations) !==
          JSON.stringify(field.validations) ||
        JSON.stringify(current.items || null) !==
          JSON.stringify(field.items || null)
      )
    })

  if (schemaChanged) {
    await updateType(contentTypeDefinition.fields)
    await publishType()
    console.log(
      'Updated Coffee model with optional Process, caffeine and repeatable prices'
    )
  }
}

for (const entry of existingCoffeeEntries) {
  const oldPrice = entry.fields.price?.[locale]
  const fields = Object.fromEntries(
    Object.entries(entry.fields).filter(([field]) => field !== 'price')
  )
  let changed = Object.keys(fields).length !== Object.keys(entry.fields).length

  if (!fields.prices?.[locale] && oldPrice) {
    fields.prices = { [locale]: [oldPrice] }
    changed = true
  }
  if (!fields.caffeine?.[locale]) {
    const name = entry.fields.coffeeName?.[locale] || ''
    fields.caffeine = {
      [locale]: /decaf/i.test(name) ? 'Decaf' : 'Caffeinated',
    }
    changed = true
  }
  const prices = fields.prices?.[locale] || []
  const sectionDefaults = {
    houseEspresso: false,
    houseBatch: false,
    filter: false,
    retail: prices.some((price) => /250g|retail|beans/i.test(price)),
  }
  for (const [field, value] of Object.entries(sectionDefaults)) {
    if (typeof fields[field]?.[locale] !== 'boolean') {
      fields[field] = { [locale]: value }
      changed = true
    }
  }

  if (changed) {
    await request(`/entries/${entry.sys.id}`, {
      method: 'PUT',
      headers: { 'X-Contentful-Version': String(entry.sys.version) },
      body: JSON.stringify({ fields }),
    })
  }
}

const placeholders = [
  {
    coffeeName: 'Blue Beans',
    coffeeRoaster: 'Roast Co',
    notes:
      'Our seasonally rotating house coffee, crafted for both espresso and filter. A perfectly balanced daily drinker.\n\nChocolate bonbon and malted milk bring rich, creamy sweetness, lifted by orange zest and bergamot. Sweet, smooth and aromatic.',
    origin: 'Colombia',
    region: 'Huila',
    altitude: '1850 masl',
    producer: 'Edinson Argote',
    farm: 'Quebraditas',
    varietal: 'Castillo',
    process: 'Yeast Inoculated Washed',
    caffeine: 'Caffeinated',
    prices: ['250g beans — £14.00'],
    houseEspresso: true,
    houseBatch: false,
    filter: true,
    retail: true,
  },
  {
    coffeeName: 'Golden Hour',
    coffeeRoaster: 'Example Roastery',
    notes:
      'A bright and juicy example coffee created for testing the website.\n\nRipe peach and strawberry sweetness lead into a floral finish with a soft honey character.',
    origin: 'Ethiopia',
    region: 'Sidama',
    altitude: '2100 masl',
    producer: 'Example Smallholders',
    farm: 'Sample Lot 12',
    varietal: 'Heirloom',
    process: 'Natural',
    caffeine: 'Caffeinated',
    prices: ['250g beans — £15.50'],
    houseEspresso: false,
    houseBatch: false,
    filter: true,
    retail: true,
  },
]

for (const values of placeholders) {
  const query = new URLSearchParams({
    content_type: 'coffee',
    'fields.coffeeName': values.coffeeName,
    limit: '1',
  })
  const existingEntries = await request(`/entries?${query}`)

  if (existingEntries.body.items.length) {
    console.log(`${values.coffeeName} already exists; no entry changes made`)
    continue
  }

  const fields = Object.fromEntries(
    Object.entries(values).map(([field, value]) => [field, { [locale]: value }])
  )

  await request('/entries', {
    method: 'POST',
    headers: { 'X-Contentful-Content-Type': 'coffee' },
    body: JSON.stringify({ fields }),
  })
  console.log(`Created unpublished ${values.coffeeName} entry`)
}
