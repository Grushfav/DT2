import React, { useEffect, useState } from 'react'

function formatTime(ms) {
  if (ms <= 0) return '00:00:00'
  const total = Math.floor(ms / 1000)
  const hrs = String(Math.floor(total / 3600)).padStart(2, '0')
  const mins = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const secs = String(total % 60).padStart(2, '0')
  return `${hrs}:${mins}:${secs}`
}

export default function Countdown({ end }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const remaining = end - now

  return (
    <div className="px-3 py-1 bg-white/6 rounded text-sm font-mono text-white">
      {remaining > 0 ? formatTime(remaining) : 'Expired'}
    </div>
  )
}
