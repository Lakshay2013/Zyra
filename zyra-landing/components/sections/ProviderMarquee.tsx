const PROVIDERS = ['OpenAI', 'Anthropic', 'Groq', 'Gemini']

function ProviderWordmark({ name }: { name: string }) {
  return (
    <span className="type-mono px-8 text-[20px] font-medium tracking-tight text-text-tertiary transition-colors hover:text-text">
      {name}
    </span>
  )
}

export function ProviderMarquee() {
  return (
    <section className="border-y border-border py-10">
      <p className="mb-6 text-center text-[13px] font-medium text-text-secondary">Routes across</p>
      <div className="marquee-paused overflow-hidden">
        <div className="marquee-track flex w-max items-center">
          {[...PROVIDERS, ...PROVIDERS].map((name, i) => (
            <ProviderWordmark key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </div>
      <p className="mt-6 text-center text-[13px] text-text-tertiary">
        Bring your own keys. Zyra never resells inference.
      </p>
    </section>
  )
}
