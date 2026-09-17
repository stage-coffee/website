import { getBlogDisplayDate, type BlogPost } from '../lib/contentful'
import AddToCalendar from './AddToCalendar'
import { formatBlogDate } from './BlogCard'
import RichText from './RichText'

const contentfulImageUrl = (url: string, width: number) => {
  try {
    const imageUrl = new URL(url)
    imageUrl.searchParams.set('w', String(width))
    imageUrl.searchParams.set('fm', 'webp')
    imageUrl.searchParams.set('q', '82')
    return imageUrl.toString()
  } catch {
    return url
  }
}

export default function BlogPostView({ post }: { post: BlogPost }) {
  const dateValue = getBlogDisplayDate(post)
  const publishedDate = formatBlogDate(dateValue)
  const coverAlt =
    post.coverImage?.description ||
    post.coverImage?.title ||
    `Cover image for ${post.title}`

  return (
    <article className="blog-post">
      <header className="blog-post-header section-shell">
        {publishedDate ? (
          <time dateTime={dateValue}>{publishedDate}</time>
        ) : null}
        <h1>{post.title}</h1>
        {post.shortIntro ? (
          <p className="blog-post-intro">{post.shortIntro}</p>
        ) : null}
        {post.associatedEvent ? (
          <div className="blog-post-calendar">
            <AddToCalendar event={post.associatedEvent} />
          </div>
        ) : null}
      </header>

      {post.coverImage ? (
        <figure className="blog-cover section-shell">
          <img
            src={contentfulImageUrl(post.coverImage.url, 1440)}
            srcSet={[640, 960, 1440]
              .map(
                (width) =>
                  `${contentfulImageUrl(post.coverImage!.url, width)} ${width}w`
              )
              .join(', ')}
            sizes="(max-width: 80rem) calc(100vw - 2rem), 78rem"
            width={post.coverImage.width}
            height={post.coverImage.height}
            alt={coverAlt}
          />
        </figure>
      ) : null}

      <div className="blog-content section-shell">
        {post.content ? (
          <RichText document={post.content} demoteHeadings />
        ) : (
          <p>This post is being prepared. Please check back soon.</p>
        )}
      </div>
    </article>
  )
}
