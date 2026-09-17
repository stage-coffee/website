const images = {
  coffee: {
    url: 'https://images.ctfassets.net/cccc6mdhxqr5/2xu6eArn5w0niWhHMBDfRr/dec69f94e7c0cfa38d492001015e585c/stage-beans.jpeg',
    alt: 'Latte art in a blue cup at Stage',
  },
  food: {
    url: 'https://images.ctfassets.net/cccc6mdhxqr5/4Yc1HbaY3IrIA9e3O8j9Af/6ee5cb216e915578694c0d336642dc9c/stage-sandwich.jpeg',
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
      href: preview ? '/preview/menu?tab=coffee' : '/menu?tab=coffee',
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
