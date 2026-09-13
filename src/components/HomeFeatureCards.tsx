import type { HomeSection, ImageAsset } from '../lib/contentful'
import RichText from './RichText'

const imageUrl = (image: ImageAsset, width: number) =>
  `${image.url}${image.url.includes('?') ? '&' : '?'}w=${width}&fm=webp&q=82`

type FeatureDetails = {
  title: string
  imageSide: 'left' | 'right'
  imageAlt: string
  image?: ImageAsset
}

const featureDetails: FeatureDetails[] = [
  {
    title: 'Board Games',
    imageSide: 'right',
    imageAlt: 'Board games available to play at Stage',
    image: {
      url: 'https://images.ctfassets.net/cccc6mdhxqr5/3K0XmonKnvlmb8fEckqdet/15bc8bbd054cf56eea24ac649c10ca8a/games.jpg',
      title: 'Board games at Stage',
      width: 1352,
      height: 760,
    },
  },
  {
    title: 'Dog Friendly',
    imageSide: 'left',
    imageAlt: 'Dogs are welcome at Stage',
  },
]

export default function HomeFeatureCards({
  sections,
}: {
  sections: HomeSection[]
}) {
  const features = featureDetails.flatMap((details) => {
    const section = sections.find(
      ({ title }) => title.trim().toLowerCase() === details.title.toLowerCase()
    )
    return section
      ? [{ section, ...details, image: details.image ?? section.image }]
      : []
  })

  if (!features.length) return null

  return (
    <div className="home-features">
      {features.map(({ section, imageSide, imageAlt, image }) => (
        <section
          className={`home-feature home-feature-image-${imageSide}`}
          aria-labelledby={`home-feature-${section.id}`}
          key={section.id}
        >
          <div className="home-feature-panel section-shell">
            <div className="home-feature-copy">
              <h2 id={`home-feature-${section.id}`}>{section.title}</h2>
              <RichText document={section.text} />
            </div>
            {image ? (
              <div className="home-feature-media">
                <img
                  src={imageUrl(image, 960)}
                  srcSet={`${imageUrl(image, 480)} 480w, ${imageUrl(image, 960)} 960w, ${imageUrl(image, 1440)} 1440w`}
                  sizes="(min-width: 64rem) 52vw, calc(100vw - 2rem)"
                  width={image.width}
                  height={image.height}
                  alt={imageAlt}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  )
}
