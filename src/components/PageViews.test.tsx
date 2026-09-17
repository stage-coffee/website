import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EventsView } from './PageViews'

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
            startTime: '2099-09-04T18:00:00',
            endTime: '2099-09-04T20:00:00',
            readMoreLink: 'https://example.com/events/an-evening-at-stage',
          },
        ]}
      />
    )

    expect(markup).toContain('4 September 2099<br/>18:00 - 20:00')
    expect(markup).not.toContain('event-time')
    expect(markup).toContain(
      'class="event-read-more" href="https://example.com/events/an-evening-at-stage">Read more <span aria-hidden="true">→</span>'
    )
  })
})
