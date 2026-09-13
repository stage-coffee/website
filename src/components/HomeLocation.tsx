import historicWindow from '../assets/stage-historic-window.jpg'

export default function HomeLocation() {
  return (
    <section className="home-location" aria-labelledby="home-location-heading">
      <div className="home-location-panel section-shell">
        <div className="home-location-copy">
          <h2 id="home-location-heading">Our Corner</h2>
          <p>
            Our historic building from the 1860s is nestled on the corner of
            Great George Street and Oxford Row, with a view of the striking
            Grade I listed hospital buildings of Leeds General Infirmary.
          </p>
          <p>
            Inside, the building retains plenty of its original charm, with tall
            arched windows, decorative details and a sense of history that gives
            Stage a unique atmosphere.
          </p>
        </div>
        <div className="home-location-media">
          <img
            src={historicWindow.src}
            width={historicWindow.width}
            height={historicWindow.height}
            alt="Decorative etched glass in the historic Stage building"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  )
}
