import { useState } from 'react'

const KEY = 'origano-notice-v1'

/** Honest storage notice. ORIGANO sets no cookies and uses no trackers. */
export default function StorageNotice() {
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(KEY) === '1' } catch { return false } })
  if (hidden) return null
  const dismiss = () => { try { localStorage.setItem(KEY, '1') } catch { /* ignore */ } setHidden(true) }
  return (
    <div className="storage-notice" role="region" aria-label="Storage notice">
      <span>No cookies and no tracking. Your work is saved in this browser’s local storage and never leaves it unless you export it.</span>
      <button className="button button-secondary compact" type="button" onClick={dismiss}>Got it</button>
    </div>
  )
}
