import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function TestimonialModal({ open, onClose }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: '',
    text: '',
    rating: 5
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.text.trim()) {
      alert('Please fill in your name and testimonial text')
      return
    }

    if (formData.text.length < 20) {
      alert('Please write at least 20 characters for your testimonial')
      return
    }

    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/testimonials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id || null
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          location: '',
          text: '',
          rating: 5
        })
        setTimeout(() => {
          setSubmitted(false)
          onClose()
        }, 2000)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit testimonial')
      }
    } catch (error) {
      console.error('Submit testimonial error:', error)
      alert('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-navy text-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-teal/20 p-6 border-b border-teal/30 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Share Your Experience</h2>
                <p className="text-sm text-slate-300 mt-1">Help others discover BT2 Horizon</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {submitted ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-semibold mb-2">Thank You!</h3>
                <p className="text-slate-300">
                  Your testimonial has been submitted and will be reviewed by our team.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-teal focus:border-teal"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-teal focus:border-teal"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-teal focus:border-teal"
                    placeholder="e.g. Kingston, Jamaica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Rating *
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, rating }))}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          formData.rating >= rating
                            ? 'bg-gold border-gold text-navy'
                            : 'bg-white/10 border-white/20 text-white/50 hover:border-gold/50'
                        }`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Click stars to rate (1-5)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Your Testimonial *
                  </label>
                  <textarea
                    name="text"
                    value={formData.text}
                    onChange={handleChange}
                    required
                    rows={6}
                    minLength={20}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-teal focus:border-teal resize-none"
                    placeholder="Share your experience with BT2 Horizon... (minimum 20 characters)"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {formData.text.length} / 20 characters minimum
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting || formData.text.length < 20}
                    className="flex-1 bg-teal hover:bg-teal-dark text-navy font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Testimonial'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-slate-400 text-center mt-4">
                  Your testimonial will be reviewed before being published.
                </p>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

