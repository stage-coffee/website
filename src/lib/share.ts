export type ShareDetails = {
  title: string
  text: string
  url: string
}

type ShareNavigator = {
  share?: (details: ShareDetails) => Promise<void>
  clipboard?: { writeText: (value: string) => Promise<void> }
}

export const shareBlogPost = async (
  details: ShareDetails,
  shareNavigator: ShareNavigator = navigator
): Promise<'shared' | 'copied' | 'cancelled'> => {
  if (shareNavigator.share) {
    try {
      await shareNavigator.share(details)
      return 'shared'
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'AbortError'
      ) {
        return 'cancelled'
      }
    }
  }

  if (!shareNavigator.clipboard?.writeText) {
    throw new Error('Copy unavailable')
  }
  await shareNavigator.clipboard.writeText(details.url)
  return 'copied'
}
