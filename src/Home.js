import useSWR from 'swr'
import { Spinner } from '@contentful/f36-spinner'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'

import Banner from './Banner'
import Footer from './Footer'
import getHomePageFromCMS from './getHomePageFromCMS'

const Home = () => {
  const { data, error } = useSWR('homePage', getHomePageFromCMS)

  if (error) {
    console.log(error)
    return <div>failed to load </div>
  }
  if (!data)
    return (
      <>
        <Banner />
        <Spinner size="large" />
      </>
    )

  const { entries, contactFormText } = data

  return (
    <>
      <Banner />
      {entries.map(({ image, alt, title, text, css }, index) => {
        return (
          <section key={index} className="river center-vert" style={{ ...css }}>
            <img src={image} alt={alt} aria-hidden="true" />
            <article>
              <h3>{title}</h3>
              {documentToReactComponents(text)}
            </article>
          </section>
        )
      })}
      <Footer contactFormText={contactFormText} />
    </>
  )
}

export default Home
