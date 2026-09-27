const LIMITATIONS = [
  { title: 'Classification is heuristic', body: 'Prompt complexity is scored by length and keyword regex, not a trained model. The pricing table is hand-maintained.' },
  { title: 'Quality guard is pattern matching', body: 'A retry triggers on empty, very short, or refusal-shaped responses — not a semantic quality score.' },
  { title: 'PII and injection detection are regex-based', body: 'Fast and predictable, but not a classifier. It catches known patterns, not every phrasing.' },
  { title: 'Idempotency needs Redis', body: 'Non-streaming requests only, with a 24-hour replay window.' },
  { title: 'Response cache is exact-match', body: 'Model, messages, and params must match byte-for-byte. No semantic cache.' },
  { title: 'Risk scoring is post-hoc', body: 'Computed asynchronously after the response is already sent — it never blocks a request.' },
]

export function Limitations() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="type-h1 text-text">What Zyra doesn&rsquo;t do yet</h2>
      <p className="mt-3 max-w-2xl text-[14px] text-text-secondary">
        A solo-built beta, stated plainly. None of this is hidden in the fine print.
      </p>
      <dl className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
        {LIMITATIONS.map((l) => (
          <div key={l.title}>
            <dt className="type-h3 text-text">{l.title}</dt>
            <dd className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">{l.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
