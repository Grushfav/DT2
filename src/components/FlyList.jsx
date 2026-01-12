import React, { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

const FALLBACK = [
  { country: 'Jamaica', city: 'Montego Bay', price: '$399' },
  { country: 'Mexico', city: 'Cancun', price: '$349' },
  { country: 'Dominican Republic', city: 'Punta Cana', price: '$329' }
]

export default function FlyList() {
  const [list, setList] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    
    fetch(`${API_BASE}/api/affordable-destinations`)
      .then(r => {
        if (!r.ok) throw new Error('Network error')
        return r.json()
      })
      .then(data => {
        if (!mounted) return
        if (Array.isArray(data) && data.length > 0) {
          setList(data)
        }
      })
      .catch(err => {
        console.warn('Failed to fetch destinations, using fallback:', err)
        setList(FALLBACK)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  if (loading || list.length === 0) return null

  return (
    <div>
      {/* Desktop vertical list */}
      <div className="hidden md:flex fixed right-0 top-1/3 flex-col gap-3 p-3 z-50">
        {list.map((item) => (
          <div key={item.id} className="bg-white/5 backdrop-blur px-4 py-3 rounded-l-full flex items-center gap-4 shadow">
            <div className="text-sm font-semibold">{item.country}</div>
            <div className="text-xs text-muted">{item.city}</div>
            <div className="ml-4 text-sm bg-gold/10 text-gold px-2 py-1 rounded">{item.price}</div>
          </div>
        ))}
      </div>

      {/* Mobile horizontal scroller */}
      <div className="md:hidden fixed bottom-4 left-0 right-0 z-50 px-4">
        <div className="flex gap-3 overflow-x-auto">
          {list.map((item) => (
            <div key={item.id} className="min-w-[180px] bg-white/5 p-3 rounded-xl">
              <div className="font-semibold text-sm">{item.country}</div>
              <div className="text-xs text-muted">{item.city}</div>
              <div className="mt-2 text-sm bg-gold/10 text-gold px-2 py-1 rounded inline-block">{item.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
