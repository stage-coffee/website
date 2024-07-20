import { createClient } from 'contentful'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
})

const getHomePageFromCMS = async () => {
  const websiteOrder = await client.getEntries({
    content_type: 'websiteOrder',
  })

  const websiteSections = websiteOrder.items[0].fields.contentOrder
  const contactFormText = websiteOrder.items[0].fields.contactFormText

  const entries = websiteSections.map((entry) => {
    const { fields } = entry

    return {
      title: fields.title,
      image: fields.image.fields.file.url,
      alt: fields.image.fields.title,
      text: fields.text,
      css: fields.css,
    }
  })

  return { entries, contactFormText }
}

export default getHomePageFromCMS
