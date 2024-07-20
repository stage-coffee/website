import useSWR from 'swr'
import { Spinner } from '@contentful/f36-spinner'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import { BLOCKS } from '@contentful/rich-text-types'

import Banner from '../components/Banner'
import Footer from '../components/Footer'
import EventsList from '../components/EventsList'

import getHomePageFromCMS from '../utils/getHomePageFromCMS'
import getEventsFromCMS from '../utils/getEventsFromCMS'

const Home = () => {
  const { data, error } = useSWR('homePage', getHomePageFromCMS)

  const { data: eventsData, error: eventsError } = useSWR(
    'homeEvents',
    getEventsFromCMS
  )

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

  const renderOptions = {
    renderText: (text) => {
      const isEvents = text.includes('[[events]]')

      if (isEvents) {
        if (eventsError || !eventsData) {
          return ''
        } else {
          return <EventsList events={eventsData.events} />
        }
      }

      return text
    },
    renderNode: { [BLOCKS.PARAGRAPH]: (node, children) => children },
  }

  return (
    <>
      <Banner />
      <div className="home-page">
        {entries.map(({ image, alt, title, text, css }, index) => {
          return (
            <section
              key={index}
              className="river center-vert"
              style={{ ...css }}
            >
              <img src={image} alt={alt} aria-hidden="true" />
              <article>
                <h3>{title}</h3>
                {documentToReactComponents(text, renderOptions)}
              </article>
            </section>
          )
        })}
      </div>
      <Footer contactFormText={contactFormText} />
    </>
  )
}

export default Home
