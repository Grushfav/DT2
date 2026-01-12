import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import TripCard from './TripCard'
import TripDetails from './TripDetails'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function TravelBuddy() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [filters, setFilters] = useState({
    status: 'open',
    destination: ''
  })

  useEffect(() => {
    fetchTrips()
  }, [filters])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.destination) params.append('destination', filters.destination)

      const response = await fetch(`${API_BASE}/api/travel-trips?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
      }
    } catch (error) {
      console.error('Failed to fetch trips:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="travel-buddy" className="py-16 px-4 md:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,29,58,0.3)] via-[rgba(7,19,39,0.2)] to-[rgba(11,29,58,0.3)] -z-10"></div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Travel Buddy
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Join group trips and meet fellow travelers! Share amazing experiences with like-minded adventurers.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 flex flex-wrap gap-4 justify-center"
        >
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-white/20 rounded-lg bg-white/10 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="open" className="bg-[#071327]">Open Trips</option>
            <option value="full" className="bg-[#071327]">Full Trips</option>
            <option value="" className="bg-[#071327]">All Status</option>
          </select>
          
          <input
            type="text"
            placeholder="Search destination..."
            value={filters.destination}
            onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
            className="px-4 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal flex-1 max-w-xs"
          />
        </motion.div>

        {/* Trips Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
            <p className="mt-4 text-slate-300">Loading trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-300 text-lg">No trips found. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClick={() => setSelectedTrip(trip)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trip Details Modal */}
      {selectedTrip && (
        <TripDetails
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
          onJoin={() => {
            fetchTrips()
            setSelectedTrip(null)
          }}
        />
      )}
    </section>
  )
}

