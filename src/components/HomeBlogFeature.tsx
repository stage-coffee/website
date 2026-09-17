import type { BlogPost } from '../lib/contentful'
import BlogCard from './BlogCard'

export default function HomeBlogFeature({
  post,
  preview = false,
}: {
  post?: BlogPost
  preview?: boolean
}) {
  if (!post) return null

  return (
    <section className="home-blog" aria-label="Latest blog post">
      <div className="section-shell">
        <BlogCard
          post={post}
          wide
          href={
            preview
              ? `/preview/blog?slug=${encodeURIComponent(post.slug)}`
              : `/blog/${post.slug}`
          }
        />
      </div>
    </section>
  )
}
