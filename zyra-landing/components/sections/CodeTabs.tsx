'use client'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CopyButton } from '@/components/ui/copy-button'

const SNIPPETS = {
  node: {
    label: 'Node SDK',
    keywords: /\b(import|from|const|await|new)\b/g,
    code: `import Zyra from "zyra-sdk";

const client = new Zyra({
  apiKey: process.env.ZYRA_API_KEY,
  baseURL: "http://localhost:5000/v1",
  debug: true,
});

const res = await client.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: "Hello" }],
});`,
  },
  python: {
    label: 'Python SDK',
    keywords: /\b(import|from|def)\b/g,
    code: `from zyra import Zyra

client = Zyra(api_key="sk-live-...", base_url="http://localhost:5000")
res = client.chat.completions.create(
    model="auto",
    messages=[{"role": "user", "content": "Hi"}],
)`,
  },
  curl: {
    label: 'cURL',
    keywords: /\b(curl)\b/g,
    code: `curl localhost:5000/v1/chat/completions \\
  -H "x-zyra-api-key: $ZYRA_API_KEY" \\
  -H "x-zyra-debug: true" \\
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'`,
  },
} as const

type TabId = keyof typeof SNIPPETS
const TAB_IDS = Object.keys(SNIPPETS) as TabId[]

// Minimal hand-rolled highlighter — strings, comments, keywords. No runtime highlighter bundle.
function highlight(code: string, keywordRe: RegExp) {
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;')
  return escaped
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, '<span class="text-success">$1</span>')
    .replace(keywordRe, '<span class="text-accent">$1</span>')
}

export function CodeTabs() {
  const [active, setActive] = useState<TabId>('node')
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = TAB_IDS.indexOf(active)
    if (e.key === 'ArrowRight') {
      const next = TAB_IDS[(idx + 1) % TAB_IDS.length]
      setActive(next)
      tabRefs.current[next]?.focus()
    } else if (e.key === 'ArrowLeft') {
      const prev = TAB_IDS[(idx - 1 + TAB_IDS.length) % TAB_IDS.length]
      setActive(prev)
      tabRefs.current[prev]?.focus()
    }
  }

  const snippet = SNIPPETS[active]

  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="type-h1 text-center text-text">Drop it into what you have</h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-[14px] text-text-secondary">
        Zyra extends the OpenAI client, so streaming and every OpenAI-compatible parameter work unchanged.
      </p>

      <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated">
        <div role="tablist" aria-label="Integration examples" onKeyDown={onKeyDown} className="relative flex border-b border-border px-2">
          {TAB_IDS.map((id) => (
            <button
              key={id}
              ref={(el) => { tabRefs.current[id] = el }}
              role="tab"
              aria-selected={active === id}
              tabIndex={active === id ? 0 : -1}
              onClick={() => setActive(id)}
              className={`relative px-4 py-3 text-[13px] font-medium transition-colors ${active === id ? 'text-text' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              {SNIPPETS[id].label}
              {active === id && (
                <motion.span layoutId="code-tab-underline" className="absolute inset-x-3 -bottom-px h-[2px] bg-accent" transition={{ type: 'spring', bounce: 0, duration: 0.3 }} />
              )}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="relative">
          <CopyButton text={snippet.code} />
          <pre className="type-mono overflow-x-auto p-6 text-[13px] leading-relaxed text-text-secondary">
            <code dangerouslySetInnerHTML={{ __html: highlight(snippet.code, snippet.keywords) }} />
          </pre>
        </div>
      </div>
    </section>
  )
}
