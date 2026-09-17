import { useEffect, useState } from 'react'
import {
  fetchBlogPostBySlug,
  fetchBlogPosts,
  fetchSiteContent,
  getRelatedBlogPosts,
  type BlogPost,
  type SiteContent,
} from '../lib/contentful'
import BlogPostView from './BlogPostView'
import BlogIndexView from './BlogIndexView'
import ContactForm from './ContactForm'
import CoffeeView from './CoffeeView'
import HeroView from './HeroView'
import HomeFeatureCards from './HomeFeatureCards'
import HomeBlogFeature from './HomeBlogFeature'
import HomeIntroduction from './HomeIntroduction'
import HomeLocation from './HomeLocation'
import HomeMenuTiles from './HomeMenuTiles'
import HomeOpeningHours from './HomeOpeningHours'
import HomeRetail from './HomeRetail'
import MenuView from './MenuView'
import RelatedBlogPosts from './RelatedBlogPosts'
import { EventsView, HomeSections, JobsBanner, JobsView } from './PageViews'

type Props = {
  page: 'home' | 'events' | 'jobs' | 'menu' | 'coffee' | 'blog'
  space: string
  token: string
  environment: string
  passwordHash: string
}

const SESSION_KEY = 'stage-preview-unlocked'

const sha256 = async (value: string) => {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('')
}

export default function PreviewApp(props: Props) {
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [content, setContent] = useState<SiteContent | null>(null)
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null)
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    setUnlocked(sessionStorage.getItem(SESSION_KEY) === 'true')
  }, [])

  useEffect(() => {
    if (!unlocked) return

    if (!props.space || !props.token) {
      setError(
        'Draft preview is not configured. Add a Contentful Preview API token and restart the site.'
      )
      return
    }

    const config = {
      space: props.space,
      token: props.token,
      environment: props.environment,
      preview: true,
    }
    const slug =
      props.page === 'blog'
        ? new URLSearchParams(window.location.search).get('slug') || ''
        : ''

    setError('')
    Promise.all([
      fetchSiteContent(config),
      props.page === 'home' || props.page === 'blog'
        ? fetchBlogPosts(config)
        : Promise.resolve([]),
      props.page === 'blog'
        ? slug
          ? fetchBlogPostBySlug(config, slug)
          : Promise.resolve(null)
        : Promise.resolve(null),
    ])
      .then(([siteContent, posts, post]) => {
        if (props.page === 'blog' && slug && !post) {
          setError('That draft blog post could not be found.')
          return
        }
        setContent(siteContent)
        setBlogPosts(posts)
        setBlogPost(post)
        if (post) {
          document.title = `${post.title} preview | Stage Espresso & Brewbar`
        }
      })
      .catch(() =>
        setError(
          'Draft content could not be loaded. Please refresh and try again.'
        )
      )
  }, [unlocked, props.space, props.token, props.environment])

  const unlock = async (event: { preventDefault: () => void }) => {
    event.preventDefault()
    if (
      !props.passwordHash ||
      (await sha256(password)) !== props.passwordHash.toLowerCase()
    ) {
      setError('That password was not recognised.')
      return
    }
    sessionStorage.setItem(SESSION_KEY, 'true')
    setError('')
    setUnlocked(true)
  }

  if (!unlocked) {
    return (
      <main className="preview-gate section-shell">
        <form className="preview-card" onSubmit={unlock}>
          <label htmlFor="preview-password">Password</label>
          <input
            id="preview-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button" type="submit">
            Submit
          </button>
        </form>
      </main>
    )
  }

  if (error)
    return (
      <main className="section-shell empty-state" role="alert">
        {error}
      </main>
    )
  if (!content)
    return (
      <main className="section-shell loading-state" aria-live="polite">
        Loading draft content…
      </main>
    )

  return (
    <>
      <main className={props.page === 'blog' ? 'blog-page' : undefined}>
        {props.page === 'home' ? (
          <>
            <HeroView
              images={content.banners}
              title="Seriously good coffee"
              quotedTitle
              introduction="Thoughtfully sourced and carefully made coffee, alongside house-baked goods and a fresh, satisfying food menu."
            />
            <HomeIntroduction />
            <HomeMenuTiles preview />
            <HomeBlogFeature post={blogPosts[0]} preview />
            <HomeOpeningHours />
            <HomeRetail />
            <HomeLocation />
            <HomeFeatureCards sections={content.homeSections} />
            <JobsBanner jobs={content.jobs} href="/preview/jobs" />
            <HomeSections
              sections={content.homeSections}
              events={content.events}
              eventsHref="/preview/events"
              menuHref="/preview/menu"
            />
          </>
        ) : null}
        {props.page === 'events' ? (
          <>
            <section className="page-intro section-shell">
              <h1>Events at Stage</h1>
            </section>
            <section className="section-shell">
              <EventsView events={content.events} />
            </section>
          </>
        ) : null}
        {props.page === 'jobs' ? (
          <>
            <section className="page-intro section-shell">
              <h1>Work with us</h1>
            </section>
            <section className="section-shell">
              <JobsView jobs={content.jobs} />
            </section>
          </>
        ) : null}
        {props.page === 'menu' ? <MenuView menu={content.foodMenu} /> : null}
        {props.page === 'coffee' ? (
          <CoffeeView coffees={content.coffees} />
        ) : null}
        {props.page === 'blog' ? (
          blogPost ? (
            <>
              <BlogPostView post={blogPost} />
              <RelatedBlogPosts
                posts={getRelatedBlogPosts(blogPosts, blogPost.id)}
                preview
              />
            </>
          ) : (
            <BlogIndexView posts={blogPosts} preview />
          )
        ) : null}
      </main>
      <ContactForm introduction={content.contactFormText} />
    </>
  )
}
