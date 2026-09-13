const retailImage =
  'https://images.ctfassets.net/cccc6mdhxqr5/6SPuFuMGoJO1UVmxOP6tBR/dc18dcedae523123edc63f07b37bbb20/retail.jpg'

const imageUrl = (width: number) => `${retailImage}?w=${width}&fm=webp&q=82`

export default function HomeRetail() {
  return (
    <section className="home-retail" aria-labelledby="home-retail-heading">
      <div className="home-retail-panel section-shell">
        <div className="home-retail-copy">
          <h2 id="home-retail-heading">Coffee at Home</h2>
          <p>
            Take home a bag of coffee from our retail shelf, available whole
            bean or ground to suit your brew method.
          </p>
          <p>
            We also stock a range of home brewing equipment, including Hoop,
            AeroPress, Chemex and Toddy brewers, along with V60 and other
            filters, kettles, grinders, reusable coffee cups and other
            essentials for your home coffee setup.
          </p>
        </div>
        <div className="home-retail-media">
          <img
            src={imageUrl(960)}
            srcSet={`${imageUrl(480)} 480w, ${imageUrl(960)} 960w, ${imageUrl(1440)} 1440w`}
            sizes="(min-width: 64rem) 52vw, calc(100vw - 2rem)"
            width="593"
            height="588"
            alt="Coffee and brewing equipment on the retail shelves at Stage"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  )
}
