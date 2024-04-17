import useSWR from 'swr'
import { Spinner } from '@contentful/f36-spinner'
import { createClient } from 'contentful'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import Banner from './Banner'
import Footer from './Footer'

const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID,
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
})

const fetcher = async () => {
  const websiteOrder = await client.getEntries({
    content_type: 'websiteOrder',
  })

  const websiteSections = websiteOrder.items[0].fields.contentOrder

  const entries = websiteSections.map((entry) => {
    const { fields } = entry

    console.log({ fields })
    return {
      title: fields.title,
      image: fields.image.fields.file.url,
      alt: fields.image.fields.title,
      text: fields.text,
      css: fields.css,
    }
  })

  return { entries }
}

function App() {
  const { data, error } = useSWR('contentful', fetcher)

  if (error) {
    console.log(error)
    return <div>failed to load </div>
  }
  if (!data) return <Spinner size="large" />

  const { entries } = data

  return (
    <main>
      <Banner />
      {entries.map(({ image, alt, title, text, css }) => {
        return (
          <section className="river center-vert" style={{ ...css }}>
            <img src={image} alt={alt} aria-hidden="true" />
            <article>
              <h3>{title}</h3>
              {documentToReactComponents(text)}
            </article>
          </section>
        )
      })}
      <Footer />
    </main>
  )
}

export default App
