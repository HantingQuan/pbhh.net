import { Elysia, t } from 'elysia'

/**
 * 校验诗句是否为真实古诗文。
 * 返回 true=有效，false=无效，null=API 不可用（网络错误或超时）。
 */
export async function validatePoem(content: string): Promise<boolean | null> {
  try {
    const res = await fetch(
      `https://www.guwendao.net/search.aspx?value=${encodeURIComponent(content)}`,
      { signal: AbortSignal.timeout(5_000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' } },
    )
    if (!res.ok)
      return null
    const html = await res.text()
    const textareaTexts = [...html.matchAll(/<textarea[^>]*>([\s\S]*?)<\/textarea>/gi)].map(m => m[1] ?? '')
    return textareaTexts.some(text => text.includes(content))
  }
  catch {
    return null
  }
}

export default new Elysia({ prefix: '/poems' })
  .get('/validate', async ({ query, status }) => {
    const { content } = query
    if (!content.trim())
      return status(400, { message: 'error.badRequest' })
    const result = await validatePoem(content)
    return { valid: result }
  }, {
    query: t.Object({ content: t.String() }),
  })
