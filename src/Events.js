import useSWR from 'swr'
import { Spinner } from '@contentful/f36-spinner'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'
import moment from 'moment'

import getHomePageFromCMS from './getHomePageFromCMS'
import getEventsFromCMS from './getEventsFromCMS'

import Banner from './Banner'
import Footer from './Footer'

const Events = () => {
  const { data, error } = useSWR('events', getEventsFromCMS)
  const { data: homePageData, error: homePageError } = useSWR(
    'eventsHomePage',
    getHomePageFromCMS
  )

  if (error) {
    console.log(error)
    return <div>failed to load </div>
  }
  if (!data) return <Spinner size="large" />

  const { events } = data

  return (
    <>
      <Banner />
      <div className="contain">
        <h1>Events at Stage</h1>
      </div>

      {events.map(
        ({ name, description, startTime, endTime, image, alt }, index) => {
          return (
            <section key={index} className="event">
              <div className="event-image-container">
                <img src={image} alt={alt} aria-hidden="true" />
                <div className="event-time-date">
                  <div className="month">
                    {moment(startTime).format('MMM').toUpperCase()}
                  </div>
                  <div className="day">{moment(startTime).format('D')}</div>
                  <div className="time">
                    {moment(startTime).format('h:mm A')}
                  </div>
                </div>
              </div>
              <article className="event-info">
                <h3>{name}</h3>
                <p className="event-description-date">
                  {moment(startTime).format('dddd, Do MMMM YYYY')}
                </p>
                <p className="event-description-time">
                  {moment(startTime).format('h:mm A')} -{' '}
                  {moment(endTime).format('h:mm A')}
                </p>
                {documentToReactComponents(description)}
              </article>
            </section>
          )
        }
      )}
      {homePageData && (
        <Footer contactFormText={homePageData.contactFormText} />
      )}
    </>
  )
}

export default Events
