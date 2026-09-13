import type { Coffee } from '../lib/contentful'

const detailsFor = (coffee: Coffee) =>
  [
    ['Origin', coffee.origin],
    ['Region', coffee.region],
    ['Altitude', coffee.altitude],
    ['Producer', coffee.producer],
    ['Farm', coffee.farm],
    ['Varietal', coffee.varietal],
    ['Process', coffee.process],
  ].filter((detail): detail is [string, string] => Boolean(detail[1]))

const sections: Array<{
  id: keyof Pick<Coffee, 'houseEspresso' | 'houseBatch' | 'filter' | 'retail'>
  title: string
}> = [
  { id: 'houseEspresso', title: 'Espresso' },
  { id: 'houseBatch', title: 'Batch' },
  { id: 'filter', title: 'Pour Over' },
  { id: 'retail', title: 'Retail' },
]

function CoffeeCard({ coffee, section }: { coffee: Coffee; section: string }) {
  const headingId = `coffee-${section}-${coffee.id}`
  const details = detailsFor(coffee)

  return (
    <details className="coffee-card">
      <summary aria-labelledby={headingId}>
        <span className="coffee-card-title">{coffee.name}</span>
        {coffee.roaster ? (
          <span className="coffee-roaster">Roasted by {coffee.roaster}</span>
        ) : null}
        {coffee.notes ? (
          <span className="coffee-notes">{coffee.notes}</span>
        ) : null}
        <span className="coffee-card-summary">
          {[coffee.origin, coffee.process].filter(Boolean).join(' · ')}
        </span>
        {coffee.caffeine.toLowerCase() === 'decaf' ? (
          <span className="coffee-decaf">Decaf</span>
        ) : null}
      </summary>
      <div className="coffee-card-content">
        <h3 className="visually-hidden" id={headingId}>
          {coffee.name}
        </h3>
        {details.length ? (
          <dl className="coffee-facts">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {coffee.prices.length ? (
          <div className="coffee-prices">
            <h4>Prices</h4>
            <ul>
              {coffee.prices.map((price) => (
                <li key={price}>{price}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  )
}

export default function CoffeeView({ coffees }: { coffees: Coffee[] }) {
  return (
    <div className="coffee-page">
      <header className="coffee-intro section-shell">
        <h1>Our Coffee</h1>
        <p>
          Explore what we have on offer. We source our coffee from a variety of
          roasters, and we rotate our selection regularly. Some are available as
          a filtered pour-over, some as espresso, and some on retail.
        </p>
      </header>

      <div className="coffee-sections section-shell">
        {coffees.length ? (
          sections.map((section) => {
            const sectionCoffees = coffees.filter(
              (coffee) => coffee[section.id]
            )
            return (
              <section
                className="coffee-group"
                aria-labelledby={`coffee-section-${section.id}`}
                key={section.id}
              >
                <h2 id={`coffee-section-${section.id}`}>{section.title}</h2>
                <div className="coffee-list">
                  {sectionCoffees.length ? (
                    sectionCoffees.map((coffee) => (
                      <CoffeeCard
                        coffee={coffee}
                        section={section.id}
                        key={coffee.id}
                      />
                    ))
                  ) : (
                    <p className="coffee-group-empty">
                      No coffees listed in this section just now.
                    </p>
                  )}
                </div>
              </section>
            )
          })
        ) : (
          <div className="empty-state">
            <h2>Our coffee list is being updated</h2>
            <p>Please ask the team what we’re brewing today.</p>
          </div>
        )}
      </div>
    </div>
  )
}
