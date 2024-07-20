import useSWR from 'swr'
import { Spinner } from '@contentful/f36-spinner'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer'

import getHomePageFromCMS from '../utils/getHomePageFromCMS.js'
import getJobsFromCMS from '../utils/getJobsFromCMS.js'

import Banner from '../components/Banner'
import Footer from '../components/Footer'

const Jobs = () => {
  const { data, error } = useSWR('jobs', getJobsFromCMS)
  const { data: homePageData, error: homePageError } = useSWR(
    'eventsHomePage',
    getHomePageFromCMS
  )

  if (error) {
    console.log(error)
    return <div>failed to load </div>
  }
  if (!data) return <Spinner size="large" />

  const { jobs } = data

  return (
    <>
      <Banner />
      {jobs.length === 0 && (
        <div className="contain">
          <div>
            <p>Sorry, we don't currently have any positions available.</p>
          </div>
        </div>
      )}
      <div className="jobs-page">
        {jobs.map(({ jobPosition, link, description }, index) => {
          return (
            <section key={index} className="river">
              <article
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '350px',
                }}
              >
                <div>
                  <h3>{jobPosition}</h3>
                  {documentToReactComponents(description)}
                  <a
                    href={link}
                    className="button"
                    style={{ marginTop: '10px', display: 'inline-block' }}
                  >
                    Apply
                  </a>
                </div>
              </article>
            </section>
          )
        })}
      </div>
      {homePageData && (
        <Footer contactFormText={homePageData.contactFormText} />
      )}
    </>
  )
}

export default Jobs
