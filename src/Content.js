const jazz = new URL('./assets/jazz.jpg', import.meta.url)
const dogs = new URL('./assets/dogs.jpg', import.meta.url)
const room = new URL('./assets/stageupstairs.jpg', import.meta.url)
const logo = new URL('./assets/logo-banner.webp', import.meta.url)
const games = new URL('./assets/games.jpg', import.meta.url)
const coffee = new URL('./assets/coffee.jpg', import.meta.url)
const events = new URL('./assets/events.jpg', import.meta.url)
const retail = new URL('./assets/retail.jpg', import.meta.url)

const backgroundImageStyle = {
  backgroundImage: `url('${room}')`,
}

const Content = () => {
  return (
    <>
      <div className="banner-img" style={{ ...backgroundImageStyle }}>
        <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', width: '100%' }}>
          <img
            src={logo}
            alt="Stage Logo"
            style={{
              display: 'inline-block',
              paddingTop: '20px',
              paddingBottom: '20px',
              width: '200px',
            }}
          />
        </div>
      </div>
      <section className="river center-vert">
        <img src={retail} alt="React + Contentful" aria-hidden="true" />
        <article>
          <h3>Stage Espresso</h3>
          <p>
            At Stage, our coffee selection is diverse and carefully chosen,
            offering blends and single-origin beans from around the world. Take
            home our freshly roasted beans, ground to your preference upon
            request. Plus, we regularly rotate our espresso options, ensuring
            there's always something new to enjoy during your visit.
          </p>
        </article>
      </section>
      <section className="river center-vert center-hori">
        <img src={coffee} alt="React + Contentful" aria-hidden="true" />

        <article>
          <h3>Opening Times</h3>
          <table className="openingTimesTable">
            <tr>
              <td>Mon</td>
              <td>08:30-15:30</td>
            </tr>
            <tr>
              <td>Tue</td>
              <td>08:30-15:30</td>
            </tr>
            <tr>
              <td>Wed</td>
              <td>08:30-21:00</td>
            </tr>
            <tr>
              <td>Thur</td>
              <td>08:30-15:30</td>
            </tr>
            <tr>
              <td>Fri</td>
              <td>08:30-15:30</td>
            </tr>
            <tr>
              <td>Sat</td>
              <td>CLOSED</td>
            </tr>
            <tr>
              <td>Sun</td>
              <td>CLOSED</td>
            </tr>
          </table>
        </article>
      </section>
      <section className="river center-vert center-hori">
        <img src={events} alt="React + Contentful" aria-hidden="true" />

        <article>
          <h3>
            Events<small>every Wednesday</small>
          </h3>
          <table className="eventTimesTable">
            <tr>
              <td>17th April</td>
              <td>Jazz Jam</td>
            </tr>
            <tr>
              <td>24th April</td>
              <td>Open Mic Night</td>
            </tr>
            <tr>
              <td>1st May</td>
              <td>Open Mic Night</td>
            </tr>
            <tr>
              <td>8th May</td>
              <td>Open Mic Night</td>
            </tr>
            <tr>
              <td>15th May</td>
              <td>Jazz Jam</td>
            </tr>
          </table>
        </article>
      </section>
      <section className="river center-vert">
        <img src={jazz} alt="React + Contentful" aria-hidden="true" />
        <article>
          <h3>Jazz Jam</h3>
          <p>
            Experience the authentic vibe of our jazz nights. Every week,
            talented musicians perform live, creating a laid-back atmosphere for
            you to enjoy. Savor our quality coffee blends while listening to
            soulful melodies. Whether you're a jazz lover or simply looking for
            a chill hangout spot, our jazz nights offer a genuine and relaxed
            experience.
          </p>
        </article>
      </section>
      <section className="river center-vert">
        <img src={games} alt="React + Contentful" aria-hidden="true" />
        <article>
          <h3>Board Games</h3>
          <p>
            At Stage, we offer a laid-back vibe with our collection of board
            games. Take a break from your day, grab a game, and enjoy some
            relaxed fun with friends or by yourself. Our selection covers
            classics and newer options, so there's always something for
            everyone. It's just another way we make your time here enjoyable and
            chill.
          </p>
        </article>
      </section>
      <section className="river center-vert">
        <img src={dogs} alt="React + Contentful" aria-hidden="true" />
        <article>
          <h3>Dog Friendly</h3>
          <p>
            At Stage, we're all about inclusivity—including our furry friends!
            Feel free to bring your beloved pups inside for a cozy coffee
            experience. With our dog-friendly policy, you can enjoy your
            favorite brew while spending quality time with your best friend.
            Come on in and make yourself at home!
          </p>
        </article>
      </section>
    </>
  )
}

export default Content
