'use client'
import { useEffect, useRef, useCallback } from 'react'

// ============================================================
// MOTION ENGINE — All 40 features in one useEffect-based system
// ============================================================

export function useMotionEngine() {
  const isMuted = useRef(true)
  const audioCtx = useRef<AudioContext | null>(null)

  const playSound = useCallback((freq: number, dur: number) => {
    if (isMuted.current || !audioCtx.current) return
    try {
      const osc = audioCtx.current.createOscillator()
      const gain = audioCtx.current.createGain()
      osc.connect(gain); gain.connect(audioCtx.current.destination)
      osc.frequency.value = freq; osc.type = 'sine'
      gain.gain.setValueAtTime(0.04, audioCtx.current.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + dur)
      osc.start(); osc.stop(audioCtx.current.currentTime + dur)
    } catch {}
  }, [])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    // Audio context (#39)
    audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()

    // === PAGE CURTAIN (#28) ===
    const curtain = document.getElementById('page-curtain')
    setTimeout(() => curtain?.classList.add('hidden'), 1200)

    // === SCROLL PROGRESS (#1) ===
    let pb = document.getElementById('scroll-progress')
    if (!pb) { pb = document.createElement('div'); pb.id = 'scroll-progress'; document.body.appendChild(pb) }

    // === NOISE OVERLAY (#26) ===
    let noise = document.getElementById('noise-overlay')
    if (!noise) { noise = document.createElement('div'); noise.id = 'noise-overlay'; document.body.appendChild(noise) }

    // === CURSOR SYSTEM (#8, #9, #10) ===
    let dot = document.getElementById('cursor-dot')
    let ring = document.getElementById('cursor-ring')
    if (!dot) { dot = document.createElement('div'); dot.id = 'cursor-dot'; document.body.appendChild(dot) }
    if (!ring) { ring = document.createElement('div'); ring.id = 'cursor-ring'; document.body.appendChild(ring) }
    document.body.classList.add('custom-cursor')

    const trails: HTMLDivElement[] = []
    for (let i = 0; i < 6; i++) {
      const t = document.createElement('div'); t.className = 'cursor-trail'
      t.style.opacity = `${0.3 - i * 0.04}`
      document.body.appendChild(t); trails.push(t)
    }
    const trailPos = trails.map(() => ({ x: 0, y: 0 }))

    let mx = window.innerWidth / 2, my = window.innerHeight / 2
    let dx = mx, dy = my, rx = mx, ry = my
    const onMouse = (e: MouseEvent) => { mx = e.clientX; my = e.clientY }
    window.addEventListener('mousemove', onMouse)

    // === BACK TO TOP (#38) ===
    let btt = document.getElementById('back-to-top')
    if (!btt) {
      btt = document.createElement('button'); btt.id = 'back-to-top'; btt.innerHTML = '↑'
      document.body.appendChild(btt)
    }
    btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' })

    // === CURSOR ANIMATION LOOP ===
    let rafId: number
    const animate = () => {
      dx += (mx - dx) * 0.25; dy += (my - dy) * 0.25
      rx += (mx - rx) * 0.08; ry += (my - ry) * 0.08
      if (dot) dot.style.transform = `translate3d(${dx - 4}px, ${dy - 4}px, 0)`
      if (ring) ring.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0)`
      for (let i = trails.length - 1; i > 0; i--) {
        trailPos[i].x += (trailPos[i - 1].x - trailPos[i].x) * 0.3
        trailPos[i].y += (trailPos[i - 1].y - trailPos[i].y) * 0.3
      }
      trailPos[0].x = dx; trailPos[0].y = dy
      trails.forEach((t, i) => { t.style.transform = `translate3d(${trailPos[i].x - 2}px, ${trailPos[i].y - 2}px, 0)` })
      rafId = requestAnimationFrame(animate)
    }
    animate()

    // === SCROLL HANDLERS (#1, #3, #4, #7, #38) ===
    let lastScroll = 0
    const onScroll = () => {
      const st = document.documentElement.scrollTop
      const sh = document.documentElement.scrollHeight - document.documentElement.clientHeight
      if (pb) pb.style.width = `${(st / sh) * 100}%`

      // Navbar shrink
      const nav = document.querySelector('.nav-bar') as HTMLElement
      if (nav) { st > 60 ? nav.classList.add('scrolled') : nav.classList.remove('scrolled') }

      // Back to top
      if (btt) { st > 500 ? btt.classList.add('visible') : btt.classList.remove('visible') }

      // Skew effect (#3)
      const delta = st - lastScroll
      document.querySelectorAll('.skew-on-scroll').forEach(el => {
        (el as HTMLElement).style.transform = `skewY(${Math.max(-2, Math.min(2, delta * 0.05))}deg)`
      })
      lastScroll = st

      // Parallax (#4)
      document.querySelectorAll('.parallax-slow').forEach(el => {
        const speed = parseFloat((el as HTMLElement).dataset.speed || '0.3')
        ;(el as HTMLElement).style.transform = `translateY(${st * speed}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // === INTERSECTION OBSERVER — REVEAL (#2, #30) ===
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.08 })
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el))

    // === NUMBER COUNTER (#21) ===
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const t = e.target as HTMLElement
        if (e.isIntersecting && !t.dataset.counted) {
          t.dataset.counted = 'true'
          const raw = t.innerText
          const m = raw.match(/([\$₹]?)([\d,.]+)(%?)/)
          if (!m) return
          const prefix = m[1], num = parseFloat(m[2].replace(/,/g, '')), suffix = m[3]
          const hasDecimal = m[2].includes('.')
          const start = 0, dur = 1800, t0 = performance.now()
          const tick = (now: number) => {
            const p = Math.min((now - t0) / dur, 1)
            const ease = 1 - Math.pow(1 - p, 4)
            const v = start + (num - start) * ease
            t.innerText = prefix + (hasDecimal ? v.toFixed(1) : Math.floor(v).toLocaleString()) + suffix
            if (p < 1) requestAnimationFrame(tick)
            else t.innerText = raw
          }
          requestAnimationFrame(tick)
        }
      })
    }, { threshold: 0.5 })
    document.querySelectorAll('[data-counter]').forEach(el => countObs.observe(el))

    // === 3D CARD TILT (#13) ===
    document.querySelectorAll('.tilt-card').forEach(card => {
      const el = card as HTMLElement
      el.addEventListener('mousemove', (e: Event) => {
        const ev = e as MouseEvent
        const r = el.getBoundingClientRect()
        const x = (ev.clientX - r.left) / r.width - 0.5
        const y = (ev.clientY - r.top) / r.height - 0.5
        el.style.transform = `perspective(1000px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) scale(1.02)`
        el.style.setProperty('--glare-x', `${(x + 0.5) * 100}%`)
        el.style.setProperty('--glare-y', `${(y + 0.5) * 100}%`)
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)'
      })
    })

    // === SPOTLIGHT CARDS (#14) ===
    document.querySelectorAll('.spotlight-card').forEach(card => {
      card.addEventListener('mousemove', (e: Event) => {
        const ev = e as MouseEvent
        const r = (card as HTMLElement).getBoundingClientRect()
        ;(card as HTMLElement).style.setProperty('--mx', `${ev.clientX - r.left}px`)
        ;(card as HTMLElement).style.setProperty('--my', `${ev.clientY - r.top}px`)
      })
    })

    // === MAGNETIC BUTTONS (#11, #17) ===
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
      const el = btn as HTMLElement
      el.addEventListener('mousemove', (e: Event) => {
        const ev = e as MouseEvent
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2
        const dx = (ev.clientX - cx) * 0.25, dy = (ev.clientY - cy) * 0.25
        el.style.transform = `translate(${dx}px, ${dy}px)`
      })
      el.addEventListener('mouseleave', () => { el.style.transform = '' })
      // Cursor ring hover
      el.addEventListener('mouseenter', () => ring?.classList.add('hovering'))
      el.addEventListener('mouseleave', () => ring?.classList.remove('hovering'))
    })

    // === HOVER SOUNDS (#39) ===
    document.querySelectorAll('a, button, [data-magnetic]').forEach(el => {
      el.addEventListener('mouseenter', () => playSound(880, 0.08))
      el.addEventListener('click', () => playSound(1200, 0.1))
    })

    // === CANVAS PARTICLE NETWORK (#25) ===
    const canvas = document.getElementById('canvas-network') as HTMLCanvasElement
    let cAnim: number
    if (canvas) {
      const ctx = canvas.getContext('2d')!
      const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
      resize(); window.addEventListener('resize', resize)
      interface Particle { x: number; y: number; vx: number; vy: number }
      const particles: Particle[] = []
      const count = Math.min(60, Math.floor(window.innerWidth / 25))
      for (let i = 0; i < count; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 })
      }
      const drawParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        particles.forEach(p => {
          p.x += p.vx; p.y += p.vy
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,166,158,0.3)'; ctx.fill()
        })
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const d = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y)
            if (d < 120) {
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = `rgba(255,166,158,${0.06 * (1 - d / 120)})`
              ctx.lineWidth = 0.5; ctx.stroke()
            }
          }
        }
        cAnim = requestAnimationFrame(drawParticles)
      }
      drawParticles()
    }

    // === INTERACTIVE RIPPLE (#27) ===
    const onRippleClick = (e: MouseEvent) => {
      const ripple = document.createElement('div')
      ripple.className = 'ripple-effect'
      ripple.style.left = `${e.clientX - 50}px`
      ripple.style.top = `${e.clientY - 50}px`
      ripple.style.width = '100px'; ripple.style.height = '100px'
      ripple.style.position = 'fixed'
      document.body.appendChild(ripple)
      setTimeout(() => ripple.remove(), 800)
    }
    window.addEventListener('click', onRippleClick)

    // === LETTER SCRAMBLE (#18) ===
    document.querySelectorAll('[data-scramble]').forEach(el => {
      const t = el as HTMLElement
      const original = t.innerText
      const chars = '!<>-_\\/[]{}—=+*^?#_ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let frame = 0
      const totalFrames = 25
      const scramble = () => {
        let output = ''
        for (let i = 0; i < original.length; i++) {
          if (original[i] === ' ') { output += ' '; continue }
          const progress = frame / totalFrames
          if (i / original.length < progress) output += original[i]
          else output += chars[Math.floor(Math.random() * chars.length)]
        }
        t.innerText = output
        frame++
        if (frame <= totalFrames) requestAnimationFrame(scramble)
      }
      scramble()
    })

    // === MUTE TOGGLE (#40) ===
    const muteBtn = document.getElementById('mute-toggle')
    if (muteBtn) {
      muteBtn.onclick = () => {
        isMuted.current = !isMuted.current
        muteBtn.innerHTML = isMuted.current ? '🔇' : '🔊'
        if (!isMuted.current && audioCtx.current?.state === 'suspended') audioCtx.current.resume()
      }
    }

    // === CLEANUP ===
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('click', onRippleClick)
      cancelAnimationFrame(rafId)
      cancelAnimationFrame(cAnim)
      revealObs.disconnect()
      countObs.disconnect()
      trails.forEach(t => t.remove())
      document.body.classList.remove('custom-cursor')
    }
  }, [playSound])
}

// ============================================================
// WORD-BY-WORD REVEAL COMPONENT (#19)
// ============================================================
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

// ============================================================
// COPY BUTTON (#33)
// ============================================================
export function CopyButton({ text }: { text: string }) {
  const handleCopy = async (e: React.MouseEvent) => {
    const btn = e.currentTarget as HTMLElement
    await navigator.clipboard.writeText(text)
    btn.classList.add('copied')
    setTimeout(() => btn.classList.remove('copied'), 2000)
  }
  return (
    <button onClick={handleCopy} className="copy-btn absolute top-4 right-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-gray-400 hover:text-white transition-all z-10 font-sans">
      <span className="copy-icon">Copy</span>
      <span className="check-icon text-green-400">✓ Copied</span>
    </button>
  )
}

// ============================================================
// FAQ ACCORDION (#34)
// ============================================================
export function FAQItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div className={`border border-white/[0.06] rounded-xl overflow-hidden transition-colors ${open ? 'bg-brand-surface faq-open' : 'bg-transparent hover:bg-white/[0.02]'}`}>
      <button onClick={onClick} className="w-full flex items-center justify-between px-6 py-5 text-left">
        <span className="text-[15px] font-semibold text-white">{q}</span>
        <span className="faq-chevron text-gray-500 text-lg ml-4">▾</span>
      </button>
      <div className="faq-content" style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}>
        <p className="px-6 pb-5 text-[14px] text-gray-400 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}
