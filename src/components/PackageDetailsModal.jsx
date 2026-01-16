import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

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

export default function PackageDetailsModal({ open, onClose, package: pkg, onRequest }) {
  const { user, token } = useAuth()
  const [toast, setToast] = React.useState(null)
  if (!open || !pkg) return null

  // Get images array (support both new images array and legacy img field)
  const images = Array.isArray(pkg.images) && pkg.images.length > 0 
    ? pkg.images 
    : (pkg.img ? [pkg.img] : [])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl md:rounded-xl rounded-t-3xl md:max-w-4xl w-full h-full md:h-auto max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative h-64 bg-gradient-to-br from-teal to-navy">
            {images[0] && (
              <img
                src={images[0]}
                alt={pkg.title}
                className="w-full h-full object-cover"
              />
            )}
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              ✕
            </button>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-teal text-navy text-xs font-semibold px-3 py-1 rounded-full shadow-md inline-block mb-2">
                {pkg.code}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{pkg.title}</h2>
              <div className="flex items-center gap-4 text-white/90">
                <span>{pkg.nights} Nights</span>
                <span className="font-semibold text-teal">{pkg.price}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Package Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div>
                <div className="text-sm text-slate-600 mb-1">Package Code</div>
                <div className="font-semibold font-mono">{pkg.code}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Duration</div>
                <div className="font-semibold">{pkg.nights} Nights</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Price</div>
                <div className="font-semibold text-teal">{pkg.price}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Includes</div>
                <div className="font-semibold">{formatInclusions(pkg.inclusions)}</div>
              </div>
            </div>

            {/* Trip Details */}
            {pkg.trip_details && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Trip Details</h3>
                <div className="prose max-w-none">
                  <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {pkg.trip_details}
                  </div>
                </div>
              </div>
            )}

            {/* Image Gallery */}
            {images.length > 1 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="aspect-video rounded-lg overflow-hidden">
                      <img
                        src={img}
                        alt={`${pkg.title} - Image ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <button
                onClick={async () => {
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
                        setToast({ type: 'success', message: `✅ Request submitted for ${pkg.code}!` })
                        setTimeout(() => {
                          setToast(null)
                          onClose()
                        }, 2000)
                      } else {
                        const errorData = await response.json()
                        setToast({ type: 'error', message: errorData.error || 'Failed to submit request' })
                        setTimeout(() => setToast(null), 3000)
                      }
                    } catch (error) {
                      console.error('Request submission error:', error)
                      setToast({ type: 'error', message: 'Network error. Please try again.' })
                      setTimeout(() => setToast(null), 3000)
                    }
                  } else {
                    // If not logged in, open the form modal
                    onRequest()
                    onClose()
                  }
                }}
                className="flex-1 bg-teal hover:bg-teal-dark active:bg-teal-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                Request This Package
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                Close
              </button>
            </div>
            
            {/* Toast Notification */}
            {toast && (
              <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg ${
                toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {toast.message}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

