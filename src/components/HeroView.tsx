import type { CSSProperties } from 'react'
import type { ImageAsset } from '../lib/contentful'

type Props = {
  images: ImageAsset[]
  title: string
  introduction: string
  quotedTitle?: boolean
}

export default function HeroView({
  images,
  title,
  introduction,
  quotedTitle = false,
}: Props) {
  const image = images[0]
  const background = image
    ? `${image.url}${image.url.includes('?') ? '&' : '?'}w=1800&fm=webp&q=84`
    : ''
  const style = background
    ? ({ '--hero-image': `url("${background}")` } as CSSProperties)
    : undefined

  return (
    <section className="hero" style={style}>
      <div className="hero-shade" />
      <div className="hero-content section-shell">
        <div className="hero-copy">
          <h1 className={quotedTitle ? 'hero-title-quoted' : undefined}>
            {title}
          </h1>
          <p>{introduction}</p>
        </div>
      </div>
    </section>
  )
}
