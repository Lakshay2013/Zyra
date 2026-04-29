import React from 'react'

/**
 * WordReveal animates text word by word with staggered delays.
 * @param {string} text - The text to animate.
 * @param {string} className - Optional CSS classes.
 * @param {number} delay - Base delay before animation starts (ms).
 */
export function WordReveal({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={`word-reveal ${className}`}>
      {text.split(' ').map((word, i) => (
        <span key={i} style={{ '--word-delay': `${delay + i * 80}ms` } as React.CSSProperties}>
          {word}&nbsp;
        </span>
      ))}
    </span>
  )
}
