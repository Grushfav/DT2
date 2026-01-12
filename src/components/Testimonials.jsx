import React, { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// Fallback testimonials if API fails
const fallbackTestimonials = [
  { id: 1, name: 'Lisa', location: 'Kingston, Jamaica', text: 'BT2 made my UK trip effortless — handled everything perfectly!', rating: 5 },
  { id: 2, name: 'Marcus', location: 'Montego Bay', text: 'Fast, professional and truly personal service.', rating: 5 },
  { id: 3, name: 'Hannah', location: 'London, UK', text: 'Seamless booking and excellent support.', rating: 5 }
]

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/testimonials`)
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data.length > 0 ? data : fallbackTestimonials)
      } else {
        setTestimonials(fallbackTestimonials)
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error)
      setTestimonials(fallbackTestimonials)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating) => {
    return '⭐'.repeat(rating || 5)
  }

  return (
    <section className="py-12 bg-slate-50">
      <div className="max-w-6xl mx-auto px-6">
        <h3 className="text-2xl font-semibold mb-6">Testimonials</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="min-w-[280px] bg-white p-4 rounded-xl shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gold/80 flex items-center justify-center text-navy font-semibold">
                    {testimonial.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">
                      {testimonial.location ? `Verified Client • ${testimonial.location}` : 'Verified Client'}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-yellow-500 text-sm">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="mt-3 text-slate-700">{testimonial.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
