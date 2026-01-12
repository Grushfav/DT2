import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function FormDrafts({ onResumeDraft, onClose }) {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, draft, submitted

  useEffect(() => {
    if (user) {
      fetchDrafts()
    }
  }, [user, filter])

  const fetchDrafts = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      if (user?.id) params.append('userId', user.id)
      if (filter !== 'all') params.append('status', filter)

      const response = await fetch(`${API_BASE}/api/form-drafts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDrafts(data)
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (draftId) => {
    if (!confirm('Delete this saved form?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/form-drafts/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        fetchDrafts()
      } else {
        alert('Failed to delete draft')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Network error')
    }
  }

  const getFormTypeLabel = (type) => {
    const labels = {
      booking: 'Booking Inquiry',
      visa: 'Visa Application',
      passport: 'Passport Application',
      usa_visa: 'USA Visa (DS-160)',
      canada_visa: 'Canada Visitor Visa',
      uk_visa: 'UK Visitor Visa',
      travel_inquiry: 'Travel Inquiry',
      travel_period: 'Travel Period',
      custom: 'Custom Form'
    }
    return labels[type] || type
  }

  if (!user) {
    return null
  }

  return (
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
        className="bg-navy text-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-semibold text-white">📋 My Saved Forms</h2>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white/10 text-white border-white/20 focus:ring-teal focus:border-teal"
            >
              <option value="all" className="bg-navy">All Forms</option>
              <option value="draft" className="bg-navy">Drafts</option>
              <option value="submitted" className="bg-navy">Submitted</option>
            </select>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
            <p className="mt-4 text-slate-300">Loading forms...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-slate-300">No saved forms yet.</p>
            <p className="text-sm text-slate-400 mt-2">Start filling out a form and save your progress!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-lg shadow-lg p-6 border border-white/10 hover:border-teal transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{getFormTypeLabel(draft.form_type)}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        draft.status === 'draft' 
                          ? 'bg-yellow-600/20 text-yellow-300' 
                          : 'bg-green-600/20 text-green-300'
                      }`}>
                        {draft.status === 'draft' ? 'Draft' : 'Submitted'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <span>Progress: {draft.progress_percent}%</span>
                      <span>Last saved: {new Date(draft.updated_at || draft.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                      <div
                        className="bg-teal h-2 rounded-full transition-all"
                        style={{ width: `${draft.progress_percent}%` }}
                      />
                    </div>

                    {/* Preview of form data */}
                    <div className="text-sm text-slate-300 space-y-1">
                      {draft.form_data?.name && (
                        <p><strong>Name:</strong> {draft.form_data.name}</p>
                      )}
                      {draft.form_data?.email && (
                        <p><strong>Email:</strong> {draft.form_data.email}</p>
                      )}
                      {draft.form_data?.phone && (
                        <p><strong>Phone:</strong> {draft.form_data.phone}</p>
                      )}
                      {draft.form_data?.service && (
                        <p><strong>Service:</strong> {draft.form_data.service}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {draft.status === 'draft' && (
                      <button
                        onClick={() => onResumeDraft(draft)}
                        className="px-4 py-2 bg-teal text-navy rounded-lg hover:bg-teal-dark transition-colors font-semibold"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(draft.id)}
                      className="px-4 py-2 border border-red-600/50 text-red-300 rounded-lg hover:bg-red-600/10 transition-colors font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </motion.div>
    </motion.div>
  )
}

