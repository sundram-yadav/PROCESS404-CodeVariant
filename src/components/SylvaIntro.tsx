import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Full-screen interactive Three.js welcome (living moss, pollen, butterfly).
 * It lives in /public/landing-pages/origano-hero.html and talks to the app with
 * postMessage: every button inside it asks the app to open a page.
 */
export default function SylvaIntro({ onEnter }: { onEnter: (page?: string) => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onEnter() }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; page?: string } | null
      if (data?.type === 'origano:go') onEnter(data.page)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('message', onMessage)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('message', onMessage)
    }
  }, [onEnter])

  return (
    <div className="sylva-intro" role="dialog" aria-modal="true" aria-label="Welcome to ORIGANO">
      <iframe className="sylva-frame" src="/landing-pages/origano-hero.html" title="ORIGANO — after the event, the work begins" />
      <button className="sylva-skip" type="button" onClick={() => onEnter()}>Skip intro <X size={15} /></button>
      <p className="sylva-credit">
        <strong>ORIGANO</strong><span>Made by Sundram Yadav &amp; Yugnsh Sethi</span><span>Private · local-first · no account</span>
      </p>
    </div>
  )
}