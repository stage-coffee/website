import type { StageEvent } from './contentful'

const stageAddress =
  'Stage Espresso & Brewbar, 41 Great George Street, Leeds, LS1 3BB'

const calendarTimestamp = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')

const escapeCalendarText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')

export const isUpcomingEvent = (event: StageEvent, now = new Date()) => {
  const finalTime = new Date(event.endTime || event.startTime).getTime()
  return Number.isFinite(finalTime) && finalTime >= now.getTime()
}

export const calendarLinksFor = (event: StageEvent) => {
  const start = calendarTimestamp(event.startTime)
  const end = calendarTimestamp(event.endTime || event.startTime)
  const eventUrl = event.readMoreLink || 'https://stagecoffee.com/events/'
  const googleParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${start}/${end}`,
    details: `More information: ${eventUrl}`,
    location: stageAddress,
  })
  const calendarFile = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stage Espresso & Brewbar//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@stagecoffee.com`,
    `DTSTAMP:${calendarTimestamp(new Date().toISOString())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeCalendarText(event.name)}`,
    `DESCRIPTION:${escapeCalendarText(`More information: ${eventUrl}`)}`,
    `LOCATION:${escapeCalendarText(stageAddress)}`,
    `URL:${eventUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  return {
    google: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
    file: `data:text/calendar;charset=utf-8,${encodeURIComponent(calendarFile)}`,
    filename: `${event.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}.ics`,
  }
}
