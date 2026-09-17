import type { BlogPost } from '../lib/contentful'
import BlogCard from './BlogCard'

export default function RelatedBlogPosts({
  posts,
  preview = false,
}: {
  posts: BlogPost[]
  preview?: boolean
}) {
  return (
    <aside className="blog-related section-shell" aria-label="More blog posts">
      {posts.length ? (
        <>
          <h2>More from Stage</h2>
          <div className="blog-grid blog-related-grid">
            {posts.map((post) => (
              <BlogCard
                key={post.id}
                post={post}
                headingLevel={3}
                showCalendar={false}
                href={
                  preview
                    ? `/preview/blog?slug=${encodeURIComponent(post.slug)}`
                    : `/blog/${post.slug}`
                }
              />
            ))}
          </div>
        </>
      ) : null}
      <a
        className="button blog-index-link"
        href={preview ? '/preview/blog' : '/blog'}
      >
        View all posts
      </a>
    </aside>
  )
}
