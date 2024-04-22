import moment from 'moment'
import { createClient } from 'contentful'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
})

const getEventsFromCMS = async () => {
  const entries = await client.getEntries({
    content_type: 'events',
  })

  const events = entries.items.map((entry) => {
    const { fields } = entry

    return {
      name: fields.displayName,
      description: fields.description,
      image: fields.image.fields.file.url,
      alt: fields.image.fields.title,
      startTime: fields.startTime,
      endTime: fields.endTime,
    }
  })

  const orderedEvents = events.sort(
    (a, b) => moment(a.startTime).unix() - moment(b.startTime).unix()
  )

  const futureEvents = orderedEvents.filter(
    (event) => moment().unix() - moment(event.startTime).unix() < 0
  )

  return { events: futureEvents }
}

export default getEventsFromCMS
