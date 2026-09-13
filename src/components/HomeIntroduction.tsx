const introductionImage =
  'https://images.ctfassets.net/cccc6mdhxqr5/69mk7hShZOzCm01JJA2r3H/3b5e3ca0d21962e937201006b2a8a02d/WhatsApp_Image_2025-09-18_at_07.37.25.jpeg'

const imageUrl = (width: number) =>
  `${introductionImage}?w=${width}&fm=webp&q=82`

export default function HomeIntroduction() {
  return (
    <section className="home-introduction" aria-labelledby="stage-introduction">
      <div className="home-introduction-panel section-shell">
        <div className="home-introduction-copy">
          <h2 id="stage-introduction">Stage Espresso</h2>
          <p>
            Since 2017 Stage has been serving the best coffees we can find. We
            have a regularly changing menu of single origin coffees from a range
            of fantastic producers and coffee roasters, available as espresso or
            filter.
          </p>
          <p>
            Our breakfast and lunch menu is fresh, seasonal and cooked to order.
            We also offer pastries made every morning, alongside a variety of
            cakes, cookies and brownies, all made in-house, with a number of
            vegan and gluten-free options available.
          </p>
        </div>
        <div className="home-introduction-media">
          <img
            src={imageUrl(960)}
            srcSet={`${imageUrl(480)} 480w, ${imageUrl(960)} 960w, ${imageUrl(1440)} 1440w`}
            sizes="(min-width: 48rem) 52vw, calc(100vw - 2rem)"
            width="1066"
            height="1066"
            alt="Blue coffee cups stacked on the espresso machine at Stage"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  )
}
