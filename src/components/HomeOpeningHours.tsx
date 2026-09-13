const openingHoursImage =
  'https://images.ctfassets.net/cccc6mdhxqr5/1TBN6pq3TyylELpFTNGvRt/f8249982f3e1701da1f897edd60246f7/cups.jpg'

const imageUrl = (width: number) =>
  `${openingHoursImage}?w=${width}&fm=webp&q=82`

export default function HomeOpeningHours() {
  return (
    <section className="home-hours" aria-labelledby="home-hours-heading">
      <div className="home-hours-panel section-shell">
        <div className="home-hours-copy">
          <h2 id="home-hours-heading">Opening Hours</h2>
          <dl className="home-hours-list">
            <div>
              <dt>Monday to Friday</dt>
              <dd>
                <time>07:30 – 15:30</time>
              </dd>
            </div>
            <div>
              <dt>Saturday</dt>
              <dd>
                <time>10:00 – 15:30</time>
              </dd>
            </div>
            <div>
              <dt>Sunday</dt>
              <dd>Closed</dd>
            </div>
          </dl>
        </div>
        <div className="home-hours-media">
          <img
            src={imageUrl(960)}
            srcSet={`${imageUrl(480)} 480w, ${imageUrl(960)} 960w, ${imageUrl(1440)} 1440w`}
            sizes="(min-width: 64rem) 45vw, calc(100vw - 2rem)"
            width="1327"
            height="870"
            alt="Coffee being served at Stage"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  )
}
