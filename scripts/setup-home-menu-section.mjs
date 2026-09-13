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
        return [
          line.slice(0, separator).trim(),
          line
            .slice(separator + 1)
            .trim()
            .replace(/^(['"])(.*)\1$/, '$2'),
        ]
      })
  )
}

const env = await parseEnv()
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
  if (response.status === 204) return null
  return response.json()
}

const locales = await request('/locales?limit=100')
const locale = locales.items.find((item) => item.default)?.code
if (!locale) throw new Error('The Contentful environment has no default locale')

const paragraph = (value) => ({
  nodeType: 'paragraph',
  data: {},
  content: [{ nodeType: 'text', value, marks: [], data: {} }],
})

const menuCopy = {
  nodeType: 'document',
  data: {},
  content: [
    paragraph(
      'Our fresh menu features breakfast and lunch options, all made to order.'
    ),
    paragraph(
      'We also offer freshly baked pastries every day, alongside a variety of vegan cakes, cookies and brownies, all made in-house, with gluten-free options available.'
    ),
    paragraph('[[menu]]'),
  ],
}

const sectionQuery = new URLSearchParams({
  content_type: 'websiteSection',
  [`fields.title`]: 'Menu',
  limit: '1',
})
const orderQuery = new URLSearchParams({
  content_type: 'websiteOrder',
  limit: '10',
})

const [sectionCollection, orderCollection] = await Promise.all([
  request(`/entries?${sectionQuery}`),
  request(`/entries?${orderQuery}`),
])

if (orderCollection.items.length !== 1) {
  throw new Error(
    `Expected exactly one Website Order entry, found ${orderCollection.items.length}`
  )
}

let order = orderCollection.items[0]
const orderHasUnpublishedChanges =
  order.sys.publishedVersion != null &&
  order.sys.version > order.sys.publishedVersion + 1

let section = sectionCollection.items[0]
if (section) {
  section = await request(`/entries/${section.sys.id}`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(section.sys.version) },
    body: JSON.stringify({
      fields: {
        ...section.fields,
        title: { ...section.fields.title, [locale]: 'Menu' },
        text: { ...section.fields.text, [locale]: menuCopy },
      },
    }),
  })
  console.log('Updated the Menu Website Section')
} else {
  section = await request('/entries', {
    method: 'POST',
    headers: { 'X-Contentful-Content-Type': 'websiteSection' },
    body: JSON.stringify({
      fields: {
        title: { [locale]: 'Menu' },
        text: { [locale]: menuCopy },
      },
    }),
  })
  console.log('Created the Menu Website Section')
}

section = await request(`/entries/${section.sys.id}/published`, {
  method: 'PUT',
  headers: { 'X-Contentful-Version': String(section.sys.version) },
})
console.log('Published the Menu Website Section')

const currentOrder = order.fields.contentOrder?.[locale]
if (!Array.isArray(currentOrder)) {
  throw new Error(`Website Order has no contentOrder value for ${locale}`)
}

if (!currentOrder.some((link) => link?.sys?.id === section.sys.id)) {
  order = await request(`/entries/${order.sys.id}`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(order.sys.version) },
    body: JSON.stringify({
      fields: {
        ...order.fields,
        contentOrder: {
          ...order.fields.contentOrder,
          [locale]: [
            ...currentOrder,
            {
              sys: {
                type: 'Link',
                linkType: 'Entry',
                id: section.sys.id,
              },
            },
          ],
        },
      },
    }),
  })

  if (orderHasUnpublishedChanges) {
    console.log(
      'Added Menu to the Website Order draft; preserved its existing unpublished changes'
    )
  } else {
    await request(`/entries/${order.sys.id}/published`, {
      method: 'PUT',
      headers: { 'X-Contentful-Version': String(order.sys.version) },
    })
    console.log('Added Menu to Website Order and published the update')
  }
} else {
  console.log('Menu is already present in Website Order')
}
