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
const configuredAppId = env.PUBLIC_CONTENTFUL_ADMIN_APP_ID
const appName = 'Stage Coffee Admin'
const appSource =
  env.CONTENTFUL_ADMIN_APP_SRC || 'https://stagecoffee.com/admin'

if (!space || !token) {
  throw new Error(
    'CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN are required in .env'
  )
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/vnd.contentful.management.v1+json',
}

const request = async (url, options = {}, allowed = []) => {
  const response = await fetch(`https://api.contentful.com${url}`, {
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

const spaceResponse = await request(`/spaces/${space}`)
const organization =
  env.CONTENTFUL_ORGANIZATION_ID || spaceResponse.body.sys.organization?.sys?.id
if (!organization) {
  throw new Error(
    'Could not discover the Contentful organization. Add CONTENTFUL_ORGANIZATION_ID to .env.'
  )
}

const definition = {
  name: appName,
  src: appSource,
  locations: [{ location: 'page' }],
}

let app
if (configuredAppId) {
  const existing = await request(
    `/organizations/${organization}/app_definitions/${configuredAppId}`,
    {},
    [404]
  )
  if (existing.status !== 404) app = existing.body
}

if (!app) {
  const collection = await request(
    `/organizations/${organization}/app_definitions?limit=1000`
  )
  app = collection.body.items.find((candidate) => candidate.name === appName)
}

if (app) {
  app = (
    await request(
      `/organizations/${organization}/app_definitions/${app.sys.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(definition),
      }
    )
  ).body
  console.log('Updated the Stage Coffee Admin app definition')
} else {
  app = (
    await request(`/organizations/${organization}/app_definitions`, {
      method: 'POST',
      body: JSON.stringify(definition),
    })
  ).body
  console.log('Created the Stage Coffee Admin app definition')
}

await request(
  `/spaces/${space}/environments/${environment}/app_installations/${app.sys.id}`,
  {
    method: 'PUT',
    body: JSON.stringify({ parameters: {} }),
  }
)

console.log(`Installed the app in ${space}/${environment}`)
console.log(`PUBLIC_CONTENTFUL_ADMIN_APP_ID=${app.sys.id}`)
console.log(
  `Admin URL: https://app.contentful.com/spaces/${space}/environments/${environment}/app_installations/${app.sys.id}/`
)
