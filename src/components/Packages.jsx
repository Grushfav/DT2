import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const FALLBACK = [
  { id: 1, code: 'BT2-GRE-01', title: 'Greek Islands Escape', nights: 7, price: '$1,099', img: '/assets/santorini.jpg' },
  { id: 2, code: 'BT2-LON-02', title: 'London City Break', nights: 4, price: '$899', img: '/assets/london.jpg' },
  { id: 3, code: 'BT2-CRB-03', title: 'Caribbean Getaway', nights: 5, price: '$1,299', img: '/assets/caribbean.jpg' },
  { id: 4, code: 'BT2-NYC-04', title: 'NYC Weekend', nights: 3, price: '$699', img: '/assets/nyc.jpg' }
]

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// Format inclusions for display
function formatInclusions(inclusions) {
  if (!inclusions || typeof inclusions !== 'object') {
    return 'Flights + Hotel' // Default fallback
  }
  
  const parts = []
  if (inclusions.flights) parts.push('Flights')
  if (inclusions.hotel) parts.push('Hotel')
  if (inclusions.meal) parts.push('Meal')
  if (inclusions.vehicle) parts.push('Vehicle')
  
  if (parts.length === 0) {
    return 'Custom Package'
  }
  
  // Format: "Flights + Hotel" or "Flights + Hotel + Meal + Vehicle"
  return parts.join(' + ')
}

export default function Packages({ onViewDetails = () => {}, onRequest = () => {} }) {
  const { user, token } = useAuth()
  const [items, setItems] = useState(FALLBACK)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  const handleRequest = async (pkg) => {
    // If user is logged in, auto-submit request
    if (user && token) {
      try {
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email
        const response = await fetch(`${API_BASE}/api/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: userName,
            phone: user.phone || '',
            email: user.email,
            service: 'Packages',
            packageCode: pkg.code,
            userId: user.id
          })
        })

        if (response.ok) {
          setToast({ type: 'success', message: `✅ Request submitted for ${pkg.code}! Admin will review it soon.` })
          setTimeout(() => setToast(null), 4000)
        } else {
          const errorData = await response.json()
          setToast({ type: 'error', message: errorData.error || 'Failed to submit request' })
          setTimeout(() => setToast(null), 4000)
        }
      } catch (error) {
        console.error('Request submission error:', error)
        setToast({ type: 'error', message: 'Network error. Please try again.' })
        setTimeout(() => setToast(null), 4000)
      }
    } else {
      // If not logged in, open the form modal
      onRequest(pkg)
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`${API_BASE}/api/packages`)
      .then(r => {
        if (!r.ok) throw new Error('Network error')
        return r.json()
      })
      .then(data => {
        if (!mounted) return
        if (Array.isArray(data) && data.length) setItems(data)
        setError(null)
      })
      .catch(err => {
        console.warn('Packages fetch failed, using fallback', err)
        setError('Could not load packages')
        setToast({ type: 'error', message: 'Unable to load packages. Showing local fallback.' })
        setTimeout(() => setToast(null), 4000)
      })
      .finally(() => mounted && setLoading(false))

    return () => { mounted = false }
  }, [])

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed right-6 top-20 z-50 px-4 py-2 rounded shadow ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-teal text-navy'}`}>
            {toast.message}
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold">Featured Packages</h3>
          {loading && <div className="text-sm text-muted">Loading…</div>}
          {error && <div className="text-sm text-gold">{error}</div>}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <p>No packages available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {items.map((item, index) => (
              <Card 
                key={item.id || index} 
                item={item} 
                onView={() => onViewDetails(item)} 
                onRequest={(pkg) => handleRequest(pkg)}
                setToast={setToast}
                user={user}
                token={token}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Card({ item, onView = () => {}, onRequest = () => {}, setToast = () => {}, user = null, token = null }) {
  if (!item) return <div className="rounded-xl bg-white shadow p-6">No package</div>

  // Get images array (support both new images array and legacy img field)
  const images = Array.isArray(item.images) && item.images.length > 0 
    ? item.images 
    : (item.img ? [item.img] : [])
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const currentImage = images[currentImageIndex] || images[0] || '/assets/placeholder.jpg'

  return (
    <div className="group relative rounded-xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="relative">
        {/* Main image */}
        <div className="aspect-[16/9] bg-gray-200 relative overflow-hidden">
          <img 
            src={currentImage} 
            alt={item.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
          {/* Package code badge overlay */}
          <div className="absolute top-3 right-3">
            <div className="bg-teal text-navy text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              {item.code}
            </div>
          </div>
        </div>
        
        {/* Thumbnail navigation at bottom */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
            <div className="flex gap-2 justify-center overflow-x-auto pb-1 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { 
                    e.stopPropagation()
                    setCurrentImageIndex(idx)
                  }}
                  className={`flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex 
                      ? 'border-teal scale-110 shadow-lg ring-2 ring-teal/50' 
                      : 'border-white/40 opacity-70 hover:opacity-100 hover:scale-105 hover:border-white/60'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${item.title} - Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <h4 className="font-semibold text-lg text-slate-800 mb-2 line-clamp-1">{item.title}</h4>
        <p className="text-xs md:text-sm text-slate-600 mb-4 leading-relaxed">{item.nights} Nights | {formatInclusions(item.inclusions)} — from <span className="font-semibold text-teal">{item.price}</span></p>
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button 
            onClick={onView} 
            className="text-teal font-medium hover:text-teal-dark transition-colors flex items-center gap-1 group/link"
          >
            View Details
            <span className="group-hover/link:translate-x-1 transition-transform">→</span>
          </button>
          <RequestButton onRequest={() => onRequest(item)} user={user} />
        </div>
      </div>
    </div>
  )
}

function RequestButton({ onRequest, user }) {
  return (
    <button 
      onClick={onRequest} 
      className="bg-teal hover:bg-teal-dark active:bg-teal-dark text-white text-xs md:text-sm font-semibold px-4 py-2 md:px-6 md:py-2.5 rounded-md transition-colors min-h-[44px] touch-manipulation"
    >
      {user ? 'Request' : 'Request'}
    </button>
  )
}
