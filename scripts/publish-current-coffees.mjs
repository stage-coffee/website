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
const request = async (path, options = {}) => {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  if (!response.ok) {
    throw new Error(
      `Contentful request failed (${response.status} ${response.statusText}): ${await response.text()}`
    )
  }
  return response.status === 204 ? null : response.json()
}

const locales = await request('/locales?limit=100')
const locale = locales.items.find((item) => item.default)?.code
if (!locale) throw new Error('The Contentful environment has no default locale')

const coffees = [
  {
    coffeeName: 'Bette Buna',
    coffeeRoaster: 'Skylark',
    notes: 'Milk chocolate, almond and blueberry. Listed for 2026.',
    origin: 'Ethiopia',
    region: 'Sidama',
    farm: 'Taferi Kela',
    process: 'Natural',
    caffeine: 'Caffeinated',
    prices: ['Filter — £5.00'],
  },
  {
    aliases: ['Ethiopian Guji'],
    coffeeName: 'Ethiopia Guji',
    coffeeRoaster: 'Rish',
    notes: 'Orange marmalade, darjeeling and brown sugar. Listed for 2025.',
    origin: 'Ethiopia',
    region: 'Guji',
    farm: 'Dimtu farm',
    process: 'Natural',
    caffeine: 'Caffeinated',
    prices: ['Filter — £5.20'],
  },
  {
    coffeeName: 'Chelechele',
    coffeeRoaster: 'Maude',
    notes: 'Blueberry muffin and strawberry jam. Listed for 2025.',
    origin: 'Ethiopia',
    region: 'Gedeo Woreda',
    process: 'Natural',
    caffeine: 'Caffeinated',
    prices: ['Filter — £6.00'],
  },
  {
    coffeeName: 'Finca La Luisa',
    coffeeRoaster: 'Outpost',
    notes: 'Peach jam, chocolate and grapefruit. Listed for 2023.',
    origin: 'Colombia',
    region: 'Ciudad Bolivar, Antioquia',
    farm: 'Finca La Luisa',
    process: 'Peach Co-ferment',
    caffeine: 'Caffeinated',
    prices: ['Filter — £7.40'],
  },
  {
    aliases: ['Love Decaf Club'],
    coffeeName: 'Love Decaf Club Montanari',
    coffeeRoaster: 'North Star',
    notes: 'Praline cream, brown sugar and orange. Listed for 2026.',
    origin: 'Brazil',
    region: 'Minas Gerais',
    process: 'CO2 Decaf',
    caffeine: 'Decaf',
    prices: ['Filter — £5.00'],
  },
  {
    coffeeName: 'Mango Smoothie',
    coffeeRoaster: 'September',
    notes: 'Mango lassi, pineapple and tangerine. Listed for 2026.',
    origin: 'Colombia',
    region: 'Cauca',
    farm: 'Finca El Paraiso',
    process: 'Fermented Thermal Shock EA Decaf',
    caffeine: 'Decaf',
    prices: ['Filter — £7.80'],
  },
  {
    coffeeName: 'El Paraíso',
    coffeeRoaster: 'Hatch',
    notes: 'Lemon, raspberry and cinnamon. Listed for 2026.',
    origin: 'Colombia',
    region: 'Cauca',
    farm: 'Finca El Paraíso',
    process: 'Anaerobic Washed EA Decaf',
    caffeine: 'Decaf',
    prices: ['Filter — £7.40'],
  },
]

const collection = await request('/entries?content_type=coffee&limit=1000')
const existingEntries = collection.items
const localName = (entry) => entry.fields.coffeeName?.[locale]

for (const coffee of coffees) {
  const names = [coffee.coffeeName, ...(coffee.aliases || [])]
  let entry = existingEntries.find((candidate) =>
    names.includes(localName(candidate))
  )
  const { aliases: _aliases, ...values } = coffee
  const fields = Object.fromEntries(
    Object.entries(values).map(([field, value]) => [field, { [locale]: value }])
  )
  const sectionDefaults = {
    houseEspresso: false,
    houseBatch: false,
    filter: true,
    retail: false,
  }
  for (const [field, fallback] of Object.entries(sectionDefaults)) {
    fields[field] = {
      [locale]: entry?.fields[field]?.[locale] ?? fallback,
    }
  }

  if (entry) {
    entry = await request(`/entries/${entry.sys.id}`, {
      method: 'PUT',
      headers: { 'X-Contentful-Version': String(entry.sys.version) },
      body: JSON.stringify({ fields }),
    })
    console.log(`Updated ${coffee.coffeeName}`)
  } else {
    entry = await request('/entries', {
      method: 'POST',
      headers: { 'X-Contentful-Content-Type': 'coffee' },
      body: JSON.stringify({ fields }),
    })
    console.log(`Created ${coffee.coffeeName}`)
  }

  await request(`/entries/${entry.sys.id}/published`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(entry.sys.version) },
  })
  console.log(`Published ${coffee.coffeeName}`)
}
