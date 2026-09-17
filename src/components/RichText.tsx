import { Fragment, type ReactNode } from 'react'
import {
  documentToReactComponents,
  type Options,
} from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES, type Document } from '@contentful/rich-text-types'

type Props = {
  document: Document | null
  eventsSlot?: ReactNode
  menuSlot?: ReactNode
  demoteHeadings?: boolean
}

type EmbeddedAsset = {
  fields?: {
    title?: string
    description?: string
    file?: {
      url?: string
      details?: { image?: { width?: number; height?: number } }
    }
  }
}

const assetUrl = (asset: EmbeddedAsset) => {
  const url = asset.fields?.file?.url || ''
  return url.startsWith('//') ? `https:${url}` : url
}

const responsiveImageUrl = (url: string, width: number) => {
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

export default function RichText({
  document,
  eventsSlot,
  menuSlot,
  demoteHeadings = false,
}: Props) {
  if (!document) return null

  const headingRenderers: Options['renderNode'] = demoteHeadings
    ? {
        [BLOCKS.HEADING_1]: (_node, children) => <h2>{children}</h2>,
        [BLOCKS.HEADING_2]: (_node, children) => <h3>{children}</h3>,
        [BLOCKS.HEADING_3]: (_node, children) => <h4>{children}</h4>,
        [BLOCKS.HEADING_4]: (_node, children) => <h5>{children}</h5>,
        [BLOCKS.HEADING_5]: (_node, children) => <h6>{children}</h6>,
        [BLOCKS.HEADING_6]: (_node, children) => <h6>{children}</h6>,
      }
    : {}

  const options: Options = {
    renderText: (text) => {
      if (!text.includes('[[events]]') && !text.includes('[[menu]]')) {
        return text
      }

      return text
        .split(/(\[\[events\]\]|\[\[menu\]\])/g)
        .filter(Boolean)
        .map((part, index) => (
          <Fragment key={`${part}-${index}`}>
            {part === '[[events]]'
              ? (eventsSlot ?? part)
              : part === '[[menu]]'
                ? (menuSlot ?? part)
                : part}
          </Fragment>
        ))
    },
    renderNode: {
      ...headingRenderers,
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const asset = node.data.target as EmbeddedAsset | undefined
        const url = asset ? assetUrl(asset) : ''
        if (!url) return null

        const image = asset?.fields?.file?.details?.image
        const alt =
          asset?.fields?.description || asset?.fields?.title || 'Blog image'
        const widths = [480, 768, 1200]
        return (
          <figure className="rich-asset">
            <img
              src={responsiveImageUrl(url, 1200)}
              srcSet={widths
                .map((width) => `${responsiveImageUrl(url, width)} ${width}w`)
                .join(', ')}
              sizes="(max-width: 52rem) calc(100vw - 2rem), 50rem"
              width={image?.width}
              height={image?.height}
              alt={alt}
              loading="lazy"
            />
          </figure>
        )
      },
      [BLOCKS.EMBEDDED_ENTRY]: () => null,
      [INLINES.EMBEDDED_ENTRY]: () => null,
      [INLINES.HYPERLINK]: (node, children) => {
        const href = String(node.data.uri || '')
        const external = href.startsWith('http')
        return (
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
          >
            {children}
          </a>
        )
      },
      [INLINES.ASSET_HYPERLINK]: (node, children) => {
        const asset = node.data.target as EmbeddedAsset | undefined
        const href = asset ? assetUrl(asset) : ''
        return href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ) : (
          <>{children}</>
        )
      },
      [INLINES.ENTRY_HYPERLINK]: (_node, children) => <>{children}</>,
    },
  }

  return <>{documentToReactComponents(document, options)}</>
}
