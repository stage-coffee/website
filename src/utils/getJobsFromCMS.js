import { createClient } from 'contentful'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
})

const getJobsFromCMS = async () => {
  const entries = await client.getEntries({
    content_type: 'job',
  })

  const jobs = entries.items.map((entry) => {
    const { fields } = entry

    return {
      jobPosition: fields.jobPosition,
      description: fields.description,
      link: fields.link,
    }
  })

  return { jobs }
}

export default getJobsFromCMS
