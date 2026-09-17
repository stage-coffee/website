import type {
  ImageAsset,
  HomeSection,
  StageEvent,
  StageJob,
} from '../lib/contentful'
import AddToCalendar from './AddToCalendar'
import RichText from './RichText'

const imageUrl = (image: ImageAsset, width: number) =>
  `${image.url}${image.url.includes('?') ? '&' : '?'}w=${width}&fm=webp&q=82`

export function EditorialImage({
  image,
  eager = false,
}: {
  image: ImageAsset
  eager?: boolean
}) {
  return (
    <img
      src={imageUrl(image, 960)}
      srcSet={`${imageUrl(image, 480)} 480w, ${imageUrl(image, 960)} 960w, ${imageUrl(image, 1440)} 1440w`}
      sizes="(min-width: 800px) 50vw, 100vw"
      width={image.width}
      height={image.height}
      alt={image.title}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
    />
  )
}

export function UpcomingEvents({
  events,
  href = '/events/',
}: {
  events: StageEvent[]
  href?: string
}) {
  if (!events.length) return <p>No upcoming events just now—check back soon.</p>
  return (
    <div className="event-teasers">
      {events.slice(0, 3).map((event) => (
        <a href={href} className="event-teaser" key={event.id}>
          <time dateTime={event.startTime}>
            {formatDate(event.startTime, true)}
          </time>
          <span>{event.name}</span>
        </a>
      ))}
      <a href={href} className="text-link">
        See all event details
      </a>
    </div>
  )
}

export function HomeSections({
  sections,
  events,
  eventsHref = '/events/',
  menuHref = '/menu',
}: {
  sections: HomeSection[]
  events: StageEvent[]
  eventsHref?: string
  menuHref?: string
}) {
  const hiddenSectionTitles = new Set([
    'opening times',
    'opening hours',
    'stage espresso',
    'board games',
    'dog friendly',
  ])
  const visibleSections = sections.filter(
    (section) => !hiddenSectionTitles.has(section.title.trim().toLowerCase())
  )

  if (!sections.length) {
    return (
      <p className="empty-state section-shell">
        We’re updating this page. Please check back soon.
      </p>
    )
  }
  if (!visibleSections.length) return null
  return (
    <div className="editorial-stack">
      {visibleSections.map((section, index) => (
        <section
          className={`editorial-row ${section.image ? '' : 'editorial-row-text-only'} ${index % 2 ? 'editorial-row-reverse' : ''}`}
          key={section.id}
        >
          {section.image ? (
            <div className="editorial-media">
              <EditorialImage image={section.image} />
            </div>
          ) : null}
          <div className="editorial-copy">
            <h2>{section.title}</h2>
            <RichText
              document={section.text}
              eventsSlot={<UpcomingEvents events={events} href={eventsHref} />}
              menuSlot={
                <a className="button home-menu-link" href={menuHref}>
                  View our menu
                </a>
              }
            />
          </div>
        </section>
      ))}
    </div>
  )
}

function EventCards({
  events,
  showCalendar = false,
}: {
  events: StageEvent[]
  showCalendar?: boolean
}) {
  return (
    <div className="card-grid">
      {events.map((event) => (
        <article className="event-card" key={event.id}>
          {event.image ? (
            <div className="card-media">
              <EditorialImage image={event.image} />
            </div>
          ) : null}
          <div className="card-copy">
            <h2>{event.name}</h2>
            <time className="event-date" dateTime={event.startTime}>
              {formatDate(event.startTime, true)}
              <br />
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </time>
            <RichText document={event.description} />
            <div className="event-card-actions">
              {showCalendar ? <AddToCalendar event={event} /> : null}
              {event.readMoreLink ? (
                <a className="event-read-more" href={event.readMoreLink}>
                  Read more <span aria-hidden="true">→</span>
                </a>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function EventsView({
  events,
  pastEvents = [],
}: {
  events: StageEvent[]
  pastEvents?: StageEvent[]
}) {
  return (
    <div className="events-collections">
      <section className="events-group" aria-labelledby="upcoming-events">
        <h2 id="upcoming-events">Upcoming Events</h2>
        {events.length ? (
          <EventCards events={events} showCalendar />
        ) : (
          <div className="empty-state">
            <h3>No upcoming events</h3>
            <p>Follow us on Instagram for the latest announcements.</p>
          </div>
        )}
      </section>
      <section className="events-group" aria-labelledby="past-events">
        <h2 id="past-events">Past Events</h2>
        {pastEvents.length ? (
          <EventCards events={pastEvents} />
        ) : (
          <div className="empty-state">
            <p>There are no past events to show yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}

export function JobsView({ jobs }: { jobs: StageJob[] }) {
  if (!jobs.length) {
    return (
      <div className="empty-state">
        <h2>Nothing open right now</h2>
        <p>New roles are always shared here and on our Instagram.</p>
      </div>
    )
  }
  return (
    <div className="jobs-list">
      {jobs.map((job) => (
        <article className="job-card" key={job.id}>
          <div>
            <h2>{job.position}</h2>
          </div>
          <div>
            <RichText document={job.description} />
            {job.link ? (
              <a className="button" href={job.link}>
                Apply for this role
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

export function JobsBanner({ jobs, href }: { jobs: StageJob[]; href: string }) {
  if (!jobs.length) return null
  return (
    <a className="jobs-banner" href={href}>
      Join our team!
    </a>
  )
}

export const formatDate = (date: string, includeWeekday = false) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: includeWeekday ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))

export const formatTime = (date: string) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
