import type { BlogPost } from '../lib/contentful'
import BlogCard from './BlogCard'

export default function BlogIndexView({
  posts,
  preview = false,
}: {
  posts: BlogPost[]
  preview?: boolean
}) {
  return (
    <section
      className="blog-index section-shell"
      aria-labelledby="blog-index-heading"
    >
      <header className="blog-index-header">
        <h1 id="blog-index-heading">From Stage</h1>
        <p>News, stories and updates from Stage.</p>
      </header>
      {posts.length ? (
        <div className="blog-grid">
          {posts.map((post) => (
            <BlogCard
              key={post.id}
              post={post}
              href={
                preview
                  ? `/preview/blog?slug=${encodeURIComponent(post.slug)}`
                  : `/blog/${post.slug}`
              }
            />
          ))}
        </div>
      ) : (
        <p className="empty-state">Blog posts coming soon.</p>
      )}
    </section>
  )
}
