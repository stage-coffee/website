import { Fragment, type ReactNode } from 'react'
import type { FoodMenu } from '../lib/contentful'
import { menuBlocksFromMarkdown } from '../lib/menu-admin'

const contentfulImageUrl = (url: string, width: number) => {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}w=${width}&fm=webp&q=82`
}

const inlineMarkdown = (text: string): ReactNode[] =>
  text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      if (
        (part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))
      ) {
        return <em key={index}>{part.slice(1, -1)}</em>
      }
      return part.split('\n').map((line, lineIndex) => (
        <Fragment key={`${index}-${lineIndex}`}>
          {lineIndex ? <br /> : null}
          {line}
        </Fragment>
      ))
    })

export default function MenuView({
  menu,
  embedded = false,
}: {
  menu: FoodMenu | null
  embedded?: boolean
}) {
  const blocks = menu ? menuBlocksFromMarkdown(menu.markdown) : []

  return (
    <div className={embedded ? 'menu-tab-view' : 'menu-page'}>
      {menu?.bannerImage ? (
        <figure className="menu-banner">
          <img
            src={contentfulImageUrl(menu.bannerImage.url, 1440)}
            srcSet={[640, 960, 1440, 1920]
              .map(
                (width) =>
                  `${contentfulImageUrl(menu.bannerImage!.url, width)} ${width}w`
              )
              .join(', ')}
            sizes="(min-width: 80rem) 78rem, calc(100vw - 2rem)"
            width={menu.bannerImage.width}
            height={menu.bannerImage.height}
            alt={menu.bannerImage.title || 'Food at Stage'}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </figure>
      ) : null}
      <section className="menu-section section-shell" aria-label="Food menu">
        <header className="menu-page-header">
          {!embedded ? <h1>Our Menu</h1> : null}
          {menu?.intro ? <p>{menu.intro}</p> : null}
        </header>
        {blocks.length ? (
          <div className="menu-sheet">
            <h2 className="visually-hidden">Food options</h2>
            <div className="menu-content">
              {blocks.map((block) => {
                const content = inlineMarkdown(block.text)
                if (block.style === 'section') {
                  return <h2 key={block.id}>{content}</h2>
                }
                if (block.style === 'dish') {
                  return <h3 key={block.id}>{content}</h3>
                }
                if (block.style === 'allergen') {
                  return (
                    <p key={block.id}>
                      <em>{content}</em>
                    </p>
                  )
                }
                if (block.style === 'highlight') {
                  return (
                    <p key={block.id}>
                      <strong>{content}</strong>
                    </p>
                  )
                }
                return <p key={block.id}>{content}</p>
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h2>Our menu is being updated</h2>
            <p>Please ask the team about today’s food.</p>
          </div>
        )}
      </section>
    </div>
  )
}
