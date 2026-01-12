import React, { useEffect, useState } from 'react'
import Countdown from './countdown/Countdown'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function CrazyDealBadge() {
  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    
    fetch(`${API_BASE}/api/crazy-deals`)
      .then(r => {
        if (!r.ok) throw new Error('Network error')
        return r.json()
      })
      .then(data => {
        if (!mounted) return
        // Get the first active deal (most recent)
        if (Array.isArray(data) && data.length > 0) {
          setDeal(data[0])
        }
      })
      .catch(err => {
        console.warn('Failed to fetch deals:', err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  if (loading || !deal) return null

  const endDate = new Date(deal.end_date)

  return (
    <>
      {/* Desktop version */}
      <div className="crazy-badge fixed z-60 right-6 top-6 hidden md:flex items-center gap-4 p-4 rounded-2xl shadow-lg">
        <div className="badge-left bg-gradient-to-br from-teal to-[#08a58f] rounded-lg p-3 text-center">
          <div className="text-xs text-white/90">Crazy Deal</div>
          <div className="text-3xl font-mono font-semibold tracking-tight text-white mt-1">
            <Countdown end={endDate} />
          </div>
        </div>

        <div className="badge-right pl-2">
          <div className="font-semibold text-white">
            {deal.title}
            {deal.discount_percent && ` — ${deal.discount_percent}% OFF`}
          </div>
          <div className="text-sm text-white/80">
            {deal.subtitle || 'Limited seats • Book now'}
          </div>
        </div>
      </div>

      {/* Mobile version */}
      <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-60">
        <div className="bg-gradient-to-br from-teal to-[#08a58f] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3">
          <div className="text-sm font-semibold">
            {deal.title}
            {deal.discount_percent && ` — ${deal.discount_percent}% OFF`}
          </div>
          <div className="text-lg font-mono">
            <Countdown end={endDate} />
          </div>
        </div>
      </div>
    </>
  )
}
