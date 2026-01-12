import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function LeadModal({ open, onClose, selectedPackage, draftId = null }) {
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState(draftId)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: 'Packages',
    notes: ''
  })

  // Load draft if draftId is provided
  useEffect(() => {
    if (draftId && open) {
      loadDraft(draftId)
    } else if (!open) {
      setSubmitted(false)
      setFormData({ name: '', phone: '', email: '', service: 'Packages', notes: '' })
      setCurrentDraftId(null)
    }
  }, [open, draftId])

  const loadDraft = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/form-drafts/${id}`)
      if (response.ok) {
        const draft = await response.json()
        setFormData(draft.form_data)
        setCurrentDraftId(draft.id)
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }

  const saveDraft = async () => {
    if (!user) {
      alert('Please log in to save your form progress')
      return
    }

    setSaving(true)
    try {
      const progress = calculateProgress()
      const payload = {
        userId: user.id,
        formType: 'booking',
        formData: {
          ...formData,
          packageCode: selectedPackage?.code || null
        },
        progressPercent: progress
      }

      const url = currentDraftId 
        ? `${API_BASE}/api/form-drafts/${currentDraftId}`
        : `${API_BASE}/api/form-drafts`
      
      const method = currentDraftId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentDraftId(data.id)
        alert('Form progress saved!')
      }
    } catch (error) {
      console.error('Save draft error:', error)
      alert('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const calculateProgress = () => {
    const fields = ['name', 'phone', 'email', 'service', 'notes']
    const filled = fields.filter(field => {
      const value = formData[field]
      return value && value.trim() !== ''
    })
    return Math.round((filled.length / fields.length) * 100)
  }

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!open || !user || submitted) return

    const autoSave = setInterval(() => {
      if (formData.name || formData.phone || formData.email) {
        saveDraft()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSave)
  }, [open, user, formData, submitted])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: formData.service,
          notes: formData.notes,
          packageCode: selectedPackage?.code || null,
          userId: user?.id || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('Error: ' + (data.error || 'Failed to submit'))
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <motion.div className="relative w-full md:w-2/3 lg:w-1/3 bg-white rounded-t-xl md:rounded-xl p-6 z-50" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 120 }}>
            <button className="absolute right-4 top-4 text-slate-600" onClick={onClose}>Close</button>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <h3 className="text-2xl font-semibold mb-4">Start Your Booking</h3>
                {selectedPackage && <div className="mb-3 text-sm bg-teal/10 text-teal p-2 rounded">Package code: <strong>{selectedPackage.code}</strong></div>}
                
                <label className="block text-sm text-slate-700 font-medium">Name *</label>
                <input 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border px-3 py-2 rounded mt-1 mb-3" 
                  placeholder="Your full name"
                />

                <label className="block text-sm text-slate-700 font-medium">Phone Number *</label>
                <input 
                  required 
                  type="tel"
                  inputMode="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border px-3 py-2 rounded mt-1 mb-3" 
                  placeholder="+1 234 567 8900"
                />

                <label className="block text-sm text-slate-700 font-medium">Email</label>
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border px-3 py-2 rounded mt-1 mb-3" 
                  placeholder="your@email.com"
                />

                <label className="block text-sm text-slate-700 font-medium">Service</label>
                <select 
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full border px-3 py-2 rounded mt-1 mb-3"
                >
                  <option>Flights</option>
                  <option>Visa Assistance</option>
                  <option>Hotels</option>
                  <option>Packages</option>
                </select>

                <label className="block text-sm text-slate-700 font-medium">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border px-3 py-2 rounded mt-1 mb-3" 
                  rows={3}
                  placeholder="Tell us about your travel plans..."
                ></textarea>

                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1 bg-teal text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Submit'}
                    </button>
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
                  </div>
                  
                  {user && (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t">
                      <span>Progress: {calculateProgress()}%</span>
                      <button
                        type="button"
                        onClick={saveDraft}
                        disabled={saving}
                        className="text-teal hover:underline disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : currentDraftId ? 'Update Saved' : 'Save Progress'}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl">🎉</div>
                <h4 className="mt-4 text-lg font-semibold">Got it!</h4>
                <p className="mt-2 text-slate-600">A BT2 Specialist will reach out to you within 2 hours.</p>
                <div className="mt-6">
                  <button onClick={onClose} className="px-4 py-2 bg-gold text-navy rounded">Close</button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
