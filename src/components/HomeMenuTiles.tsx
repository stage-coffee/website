const images = {
  coffee: {
    url: 'https://images.ctfassets.net/cccc6mdhxqr5/2BKfgBRTqF8YDZqp8Uy5Sy/10d3d8ccafc8c6d76f2ef2c14e05f634/barista.jpg',
    alt: 'Latte art in a blue cup at Stage',
  },
  food: {
    url: 'https://images.ctfassets.net/cccc6mdhxqr5/1lsr8NvliaaLn321Gk58BS/79804881aad4411d2dd32ad91b20fc76/WhatsApp_Image_2026-05-14_at_09.39.20__1_.jpeg',
    alt: 'The upstairs café room at Stage',
  },
}

const imageUrl = (url: string, width: number) =>
  `${url}?w=${width}&fm=webp&q=82`

export default function HomeMenuTiles({
  preview = false,
}: {
  preview?: boolean
}) {
  const tiles = [
    {
      label: 'Coffee',
      href: preview ? '/preview/coffee' : '/coffee',
      image: images.coffee,
    },
    {
      label: 'Food',
      href: preview ? '/preview/menu' : '/menu',
      image: images.food,
    },
  ]

  return (
    <section className="home-menu-section" aria-labelledby="home-menu-heading">
      <div className="home-menu-inner section-shell">
        <h2 id="home-menu-heading">Our Menu</h2>
        <nav className="home-menu-tiles" aria-label="View our menu">
          {tiles.map((tile) => (
            <a className="home-menu-tile" href={tile.href} key={tile.label}>
              <img
                src={imageUrl(tile.image.url, 960)}
                srcSet={[480, 960, 1440]
                  .map(
                    (width) => `${imageUrl(tile.image.url, width)} ${width}w`
                  )
                  .join(', ')}
                sizes="50vw"
                alt={tile.image.alt}
                loading="lazy"
                decoding="async"
              />
              <span>{tile.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
