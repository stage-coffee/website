import moment from 'moment'

const EventsList = ({ events }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ width: '100%' }}>
      <table>
        {events.map(({ name, startTime }, index) => (
          <tr key={index}>
            <td>{moment(startTime).format('Do MMM')}</td>
            <td>{name}</td>
          </tr>
        ))}
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

export default EventsList
