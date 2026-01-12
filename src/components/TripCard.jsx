import React from 'react'
import { motion } from 'framer-motion'

export default function TripCard({ trip, onClick, index }) {
  const startDate = new Date(trip.start_date)
  const endDate = new Date(trip.end_date)
  const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
  
  const spotsLeft = trip.max_participants - trip.current_participants
  const isFull = trip.status === 'full' || spotsLeft === 0

  // Get images array (support both new images array and legacy image_url field)
  const images = Array.isArray(trip.images) && trip.images.length > 0 
    ? trip.images 
    : (trip.image_url ? [trip.image_url] : [])
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const currentImage = images[currentImageIndex] || images[0] || null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
    >
      {/* Image Section */}
      <div className="relative">
        <div className="relative h-48 bg-gradient-to-br from-teal to-navy">
          {currentImage ? (
            <img
              src={currentImage}
              alt={trip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-4xl">
              ✈️
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {isFull ? (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Full
              </span>
            ) : (
              <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                {spotsLeft} Spots Left
              </span>
            )}
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
        <h3 className="text-xl font-bold text-navy mb-2">{trip.title}</h3>
        <div className="flex items-center gap-2 text-slate-600 mb-3">
          <span>📍</span>
          <span className="font-medium">{trip.destination}, {trip.country}</span>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-1">
            <span>📅</span>
            <span>{startDate.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🌙</span>
            <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
          </div>
        </div>

        {trip.price_per_person && (
          <div className="text-2xl font-bold text-teal mb-3">
            {trip.price_per_person}
          </div>
        )}

        {trip.description && (
          <p className="text-slate-600 text-sm line-clamp-2 mb-4">
            {trip.description}
          </p>
        )}

        {/* Participants */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(trip.current_participants, 5) }).map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-teal border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <span className="text-sm text-slate-600">
              {trip.current_participants} / {trip.max_participants} travelers
            </span>
          </div>
          
          <button className="text-teal font-semibold hover:text-teal-dark">
            View Details →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

