import { createClient } from 'contentful'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
})

const getBannersFromCMS = async () => {
  const bannerPage = await client.getEntries({
    content_type: 'banner',
  })

  const bannerImages = bannerPage.items[0].fields.images.map(
    (image) => image.fields.file.url
  )

  return bannerImages
}

export default getBannersFromCMS
