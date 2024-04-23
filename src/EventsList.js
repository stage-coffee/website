import moment from 'moment'

const EventsList = ({ events }) => {
  console.log('events')
  console.log(events)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '100%' }}>
        <table>
          {events.map(
            ({ name, description, startTime, endTime, image, alt }, index) => (
              <tr>
                <td>{moment(startTime).format('Do MMM')}</td>
                <td>{name}</td>
              </tr>
            )
          )}
        </table>
      </div>
      <a
        href="./#/events"
        className="button"
        style={{ marginTop: '10px', display: 'inline-block' }}
      >
        See Event Details
      </a>
    </div>
  )
}

export default EventsList
