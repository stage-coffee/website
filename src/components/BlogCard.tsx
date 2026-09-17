import { getBlogDisplayDate, type BlogPost } from '../lib/contentful'
import AddToCalendar from './AddToCalendar'

export const formatBlogDate = (value: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export const blogImageUrl = (url: string, width: number) => {
  try {
    const value = new URL(url)
    value.searchParams.set('w', String(width))
    value.searchParams.set('fm', 'webp')
    value.searchParams.set('q', '82')
    return value.toString()
  } catch {
    return url
  }
}

export default function BlogCard({
  post,
  href,
  headingLevel = 2,
  wide = false,
  showCalendar = true,
}: {
  post: BlogPost
  href: string
  headingLevel?: 2 | 3
  wide?: boolean
  showCalendar?: boolean
}) {
  const dateValue = getBlogDisplayDate(post)
  const date = formatBlogDate(dateValue)
  const imageAlt =
    post.coverImage?.description ||
    post.coverImage?.title ||
    `Cover image for ${post.title}`
  const Heading = `h${headingLevel}` as 'h2' | 'h3'

  return (
    <article
      className={`blog-card${post.coverImage ? '' : ' blog-card-text-only'}`}
    >
      {post.coverImage ? (
        <a className="blog-card-media-link" href={href}>
          <div className="blog-card-media">
            <img
              src={blogImageUrl(post.coverImage.url, wide ? 1440 : 960)}
              srcSet={(wide ? [640, 960, 1440] : [480, 720, 960])
                .map(
                  (width) =>
                    `${blogImageUrl(post.coverImage!.url, width)} ${width}w`
                )
                .join(', ')}
              sizes={
                wide
                  ? '(min-width: 80rem) 78rem, calc(100vw - 2rem)'
                  : '(min-width: 64rem) 25vw, (min-width: 40rem) 45vw, calc(100vw - 2rem)'
              }
              width={post.coverImage.width}
              height={post.coverImage.height}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>
      ) : null}
      <div className="blog-card-copy">
        {date ? <time dateTime={dateValue}>{date}</time> : null}
        <Heading>
          <a className="blog-card-title-link" href={href}>
            {post.title}
          </a>
        </Heading>
        {post.shortIntro ? <p>{post.shortIntro}</p> : null}
        <div className="blog-card-actions">
          {showCalendar && post.associatedEvent ? (
            <AddToCalendar event={post.associatedEvent} />
          ) : null}
          <a className="blog-card-action" href={href}>
            Read more
          </a>
        </div>
      </div>
    </article>
  )
}
