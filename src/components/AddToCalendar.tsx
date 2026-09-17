import { useId } from 'react'
import { calendarLinksFor, isUpcomingEvent } from '../lib/calendar'
import type { StageEvent } from '../lib/contentful'

export default function AddToCalendar({ event }: { event: StageEvent }) {
  const componentId = useId().replace(/:/g, '')
  if (!isUpcomingEvent(event)) return null

  const calendar = calendarLinksFor(event)
  const dialogId = `event-calendar-${componentId}`
  const titleId = `${dialogId}-title`

  return (
    <>
      <button
        className="event-calendar-button"
        type="button"
        popoverTarget={dialogId}
      >
        Add to Calendar
      </button>
      <div
        className="event-calendar-options"
        id={dialogId}
        popover="auto"
        role="dialog"
        aria-labelledby={titleId}
      >
        <div className="event-calendar-dialog-header">
          <h3 id={titleId}>Add to Calendar</h3>
          <button
            className="event-calendar-close"
            type="button"
            popoverTarget={dialogId}
            popoverTargetAction="hide"
            aria-label="Close calendar options"
          >
            ×
          </button>
        </div>
        <p>{event.name}</p>
        <div className="event-calendar-links">
          <a href={calendar.google} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
          <a href={calendar.file} download={calendar.filename}>
            Apple, Outlook or another app (.ics)
          </a>
        </div>
      </div>
    </>
  )
}
