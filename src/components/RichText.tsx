import { Fragment, type ReactNode } from 'react'
import {
  documentToReactComponents,
  type Options,
} from '@contentful/rich-text-react-renderer'
import { BLOCKS, INLINES, type Document } from '@contentful/rich-text-types'

type Props = {
  document: Document | null
  eventsSlot?: ReactNode
}

export default function RichText({ document, eventsSlot }: Props) {
  if (!document) return null

  const options: Options = {
    renderText: (text) => {
      if (!eventsSlot || !text.includes('[[events]]')) return text
      return text.split('[[events]]').map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {part}
          {index === 0 ? eventsSlot : null}
        </Fragment>
      ))
    },
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: () => null,
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
    },
  }

  return <>{documentToReactComponents(document, options)}</>
}
