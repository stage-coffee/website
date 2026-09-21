import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EventsView, HomeUpcomingEvents } from './PageViews'

describe('EventsView', () => {
  it('shows the event time with its date', () => {
    const markup = renderToStaticMarkup(
      <EventsView
        events={[
          {
            id: 'event',
            name: 'An evening at Stage',
            description: null,
            image: null,
            startTime: '2099-09-04T18:00:00+01:00',
            endTime: '2099-09-04T20:00:00+01:00',
            readMoreLink: 'https://example.com/events/an-evening-at-stage',
          },
        ]}
      />
    )

    expect(markup).toContain('Friday, 4 September 2099<br/>18:00 – 20:00')
    expect(markup).not.toContain('event-time')
    expect(markup).toContain(
      'class="event-read-more" href="https://example.com/events/an-evening-at-stage">Read more <span aria-hidden="true">→</span>'
    )
  })

  it('shows the start and finish dates instead of times for multi-day events', () => {
    const markup = renderToStaticMarkup(
      <EventsView
        events={[
          {
            id: 'weekend-event',
            name: 'A weekend at Stage',
            description: null,
            image: null,
            startTime: '2099-09-04T18:00:00+01:00',
            endTime: '2099-09-06T16:00:00+01:00',
            readMoreLink: '',
          },
        ]}
      />
    )

    expect(markup).toContain(
      'Friday, 4 September 2099<br/>Sunday, 6 September 2099'
    )
    expect(markup).not.toContain('<br/>18:00')
  })

  it('shows only the next two events on the home page', () => {
    const events = ['First event', 'Second event', 'Third event'].map(
      (name, index) => ({
        id: String(index),
        name,
        description: null,
        image: null,
        startTime: `2099-09-0${index + 4}T18:00:00+01:00`,
        endTime: `2099-09-0${index + 4}T20:00:00+01:00`,
        readMoreLink: '',
      })
    )
    const markup = renderToStaticMarkup(<HomeUpcomingEvents events={events} />)

    expect(markup).toContain('First event')
    expect(markup).toContain('Second event')
    expect(markup).not.toContain('Third event')
    expect(markup).toContain('href="/events/"')
  })
})
