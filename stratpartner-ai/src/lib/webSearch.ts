export interface SearchResult {
  title: string
  url: string
  description: string
}

/**
 * Searches the web using Brave Search API.
 * Returns up to `count` results (default 5).
 */
export async function webSearch(query: string, count = 5): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) {
    console.warn('BRAVE_SEARCH_API_KEY not set — skipping web search')
    return []
  }

  const url = new URL('https://api.search.brave.com/res/v1/web/search')
  url.searchParams.set('q', query)
  url.searchParams.set('count', String(count))

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  })

  if (!res.ok) {
    console.error(`Brave Search API error: ${res.status}`)
    return []
  }

  const data = await res.json()
  const results: SearchResult[] = (data.web?.results ?? []).map((r: {
    title: string
    url: string
    description: string
  }) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }))

  return results
}

/**
 * Formats search results as a markdown context block for injection into prompts.
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) return ''
  return results
    .map((r, i) => `[${i + 1}] **${r.title}**\n${r.url}\n${r.description}`)
    .join('\n\n')
}
