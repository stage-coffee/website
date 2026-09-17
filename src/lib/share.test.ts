import { describe, expect, it, vi } from 'vitest'
import { shareBlogPost } from './share'

const details = {
  title: 'The Stage Blog',
  text: 'An update from Stage.',
  url: 'https://stagecoffee.com/blog/the-stage-blog',
}

describe('shareBlogPost', () => {
  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    await expect(shareBlogPost(details, { share })).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith(details)
  })

  it('copies the canonical URL when native sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(
      shareBlogPost(details, { clipboard: { writeText } })
    ).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(details.url)
  })

  it('does nothing when the share sheet is cancelled', async () => {
    const share = vi.fn().mockRejectedValue({ name: 'AbortError' })
    const writeText = vi.fn()
    await expect(
      shareBlogPost(details, { share, clipboard: { writeText } })
    ).resolves.toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to copying after another share failure', async () => {
    const share = vi.fn().mockRejectedValue(new Error('Share failed'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    await expect(
      shareBlogPost(details, { share, clipboard: { writeText } })
    ).resolves.toBe('copied')
  })

  it('reports when neither sharing nor copying is available', async () => {
    await expect(shareBlogPost(details, {})).rejects.toThrow('Copy unavailable')
  })
})
