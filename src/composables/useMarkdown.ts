import type { MaybeRefOrGetter } from 'vue'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { ref, toValue, watchEffect } from 'vue'

let hljsReady: Promise<typeof import('highlight.js').default> | null = null

function getHljs() {
  if (!hljsReady) {
    hljsReady = Promise.all([
      import('highlight.js'),
      import('highlight.js/styles/github-dark.min.css?inline'),
    ]).then(([{ default: hljs }, { default: githubDarkCss }]) => {
      const style = document.createElement('style')
      style.textContent = githubDarkCss.replace(/\.hljs/g, '.dark .hljs')
      document.head.appendChild(style)
      return hljs
    })
  }
  return hljsReady
}

marked.use({
  breaks: true,
  renderer: {
    code({ text, lang }) {
      const body = text.replace(/</g, '&lt;')
      return `<pre><code \
class="hljs language-${lang ?? 'plaintext'}" \
data-code="${encodeURIComponent(text)}" \
data-lang="${lang ?? ''}">${body}</code></pre>`
    },
  },
})

async function highlight(html: string): Promise<string> {
  const hljs = await getHljs()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('code[data-code]').forEach((el) => {
    const text = decodeURIComponent(el.getAttribute('data-code')!)
    const lang = el.getAttribute('data-lang') || 'plaintext'
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    el.innerHTML = hljs.highlight(text, { language }).value
    el.removeAttribute('data-code')
    el.removeAttribute('data-lang')
    el.className = `hljs language-${language}`
  })
  return doc.body.innerHTML
}

export function useMarkdown(content: MaybeRefOrGetter<string>) {
  const result = ref('')

  watchEffect((onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })

    const raw = marked.parse(toValue(content).normalize()) as string
    const sanitized = DOMPurify.sanitize(raw)
    result.value = sanitized

    highlight(sanitized).then((highlighted) => {
      if (!cancelled)
        result.value = DOMPurify.sanitize(highlighted)
    })
  })

  return result
}
