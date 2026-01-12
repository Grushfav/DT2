import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function TripDetails({ trip, onClose, onJoin }) {
  const { user } = useAuth()
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

  useEffect(() => {
    checkIfJoined()
  }, [trip, user])

  const checkIfJoined = async () => {
    if (!user && !guestForm.email) return
    
    try {
      const response = await fetch(`${API_BASE}/api/travel-trips/${trip.id}`)
      if (response.ok) {
        const data = await response.json()
        const isUserJoined = data.participants?.some(
          p => (user && p.user_id === user.id) || p.guest_email === guestForm.email
        )
        setJoined(isUserJoined)
      }
    } catch (error) {
      console.error('Failed to check join status:', error)
    }
  }

  const handleJoin = async () => {
    if (!user && (!guestForm.name || !guestForm.email)) {
      alert('Please fill in your name and email')
      return
    }

    setJoining(true)
    try {
      const response = await fetch(`${API_BASE}/api/travel-trips/${trip.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id || null,
          guestName: guestForm.name || null,
          guestEmail: guestForm.email || null,
          guestPhone: guestForm.phone || null,
          notes: guestForm.notes || null
        })
      })

      if (response.ok) {
        setJoined(true)
        onJoin()
        alert('Successfully joined the trip! We will contact you soon.')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to join trip')
      }
    } catch (error) {
      console.error('Join trip error:', error)
      alert('Network error. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  const spotsLeft = trip.max_participants - trip.current_participants
  const isFull = trip.status === 'full' || spotsLeft === 0

  // Get images array (support both new images array and legacy image_url field)
  const images = Array.isArray(trip.images) && trip.images.length > 0 
    ? trip.images 
    : (trip.image_url ? [trip.image_url] : [])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const currentImage = images[currentImageIndex] || images[0] || null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative">
            <div className="relative h-64 bg-gradient-to-br from-teal to-navy">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={trip.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                  ✈️
                </div>
              )}
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm z-10"
              >
                ✕
              </button>

              <div className="absolute bottom-4 left-4 right-4 z-10">
                <h2 className="text-3xl font-bold text-white mb-2">{trip.title}</h2>
                <div className="flex items-center gap-4 text-white/90">
                  <span>📍 {trip.destination}, {trip.country}</span>
                  {isFull ? (
                    <span className="bg-red-500 px-3 py-1 rounded-full text-sm font-semibold">
                      Full
                    </span>
                  ) : (
                    <span className="bg-green-500 px-3 py-1 rounded-full text-sm font-semibold">
                      {spotsLeft} Spots Left
                    </span>
                  )}
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
                        alt={`${trip.title} - Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Trip Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-sm text-slate-600 mb-1">Start Date</div>
                <div className="font-semibold">{startDate.toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">End Date</div>
                <div className="font-semibold">{endDate.toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Duration</div>
                <div className="font-semibold">{nights} {nights === 1 ? 'night' : 'nights'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600 mb-1">Price</div>
                <div className="font-semibold text-teal">{trip.price_per_person || 'Contact us'}</div>
              </div>
            </div>

            {/* Description */}
            {trip.description && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">About This Trip</h3>
                <p className="text-slate-600">{trip.description}</p>
              </div>
            )}

            {/* Itinerary */}
            {trip.itinerary && trip.itinerary.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Itinerary</h3>
                <div className="space-y-3">
                  {trip.itinerary.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{item.title || `Day ${index + 1}`}</div>
                        {item.description && (
                          <div className="text-slate-600 text-sm">{item.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Included */}
            {trip.included && trip.included.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">What's Included</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {trip.included.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-slate-600">
                      <span className="text-teal">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {trip.requirements && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Requirements</h3>
                <p className="text-slate-600">{trip.requirements}</p>
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
                        alt={`${trip.title} - Image ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => setCurrentImageIndex(idx)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">
                Participants ({trip.current_participants} / {trip.max_participants})
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: trip.current_participants }).map((_, i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-teal border-2 border-white flex items-center justify-center text-white font-semibold"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Join Form */}
            {!joined && !isFull && (
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Join This Trip</h3>
                
                {!user && (
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        value={guestForm.name}
                        onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                        className="w-full border px-3 py-2 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        value={guestForm.email}
                        onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                        className="w-full border px-3 py-2 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        value={guestForm.phone}
                        onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Special Requests or Notes</label>
                  <textarea
                    value={guestForm.notes}
                    onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    rows={3}
                    placeholder="Any special requests or dietary requirements..."
                  />
                </div>

                <button
                  onClick={handleJoin}
                  disabled={joining || (!user && (!guestForm.name || !guestForm.email))}
                  className="w-full bg-teal text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? 'Joining...' : 'Join This Trip'}
                </button>
              </div>
            )}

            {joined && (
              <div className="border-t pt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">✓</div>
                  <div className="font-semibold text-green-800">You've joined this trip!</div>
                  <div className="text-sm text-green-600 mt-1">We'll contact you soon with more details.</div>
                </div>
              </div>
            )}

            {isFull && !joined && (
              <div className="border-t pt-6">
                <div className="bg-slate-100 rounded-lg p-4 text-center">
                  <div className="font-semibold text-slate-700">This trip is full</div>
                  <div className="text-sm text-slate-600 mt-1">Check out other available trips!</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

