import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function PassportForm({ open, onClose, draftId = null }) {
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState(draftId)
  const [formData, setFormData] = useState({
    fullName: '',
    otherNames: '',
    dateOfBirth: '',
    placeOfBirth: '',
    nationality: '',
    maritalStatus: '',
    residentialAddress: '',
    phone: '',
    email: '',
    passportNumber: '',
    dateOfIssue: '',
    dateOfExpiry: '',
    parentsFullNames: '',
    emergencyContact: '',
    declarationAccepted: false
  })

  // Load draft if draftId is provided
  useEffect(() => {
    if (draftId && open) {
      loadDraft(draftId)
    } else if (!open) {
      setSubmitted(false)
      resetForm()
      setCurrentDraftId(null)
    }
  }, [open, draftId])

  const resetForm = () => {
    setFormData({
      fullName: '',
      otherNames: '',
      dateOfBirth: '',
      placeOfBirth: '',
      nationality: '',
      maritalStatus: '',
      residentialAddress: '',
      phone: '',
      email: '',
      passportNumber: '',
      dateOfIssue: '',
      dateOfExpiry: '',
      parentsFullNames: '',
      emergencyContact: '',
      declarationAccepted: false
    })
  }

  const loadDraft = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/api/form-drafts/${id}`)
      if (response.ok) {
        const draft = await response.json()
        setFormData({ ...draft.form_data, declarationAccepted: draft.form_data.declarationAccepted || false })
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
        formType: 'passport',
        formData: formData,
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
    const requiredFields = ['fullName', 'dateOfBirth', 'placeOfBirth', 'nationality', 'maritalStatus', 'residentialAddress', 'phone', 'email']
    const optionalFields = ['otherNames', 'passportNumber', 'dateOfIssue', 'dateOfExpiry', 'parentsFullNames', 'emergencyContact']
    
    const requiredFilled = requiredFields.filter(field => {
      const value = formData[field]
      return value && value.trim() !== ''
    }).length

    const optionalFilled = optionalFields.filter(field => {
      const value = formData[field]
      return value && value.trim() !== ''
    }).length

    // Required fields are worth 70%, optional fields 30%
    const requiredProgress = (requiredFilled / requiredFields.length) * 70
    const optionalProgress = (optionalFilled / optionalFields.length) * 30
    
    return Math.round(requiredProgress + optionalProgress)
  }

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!open || !user || submitted) return

    const autoSave = setInterval(() => {
      if (formData.fullName || formData.phone || formData.email) {
        saveDraft()
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSave)
  }, [open, user, formData, submitted])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.declarationAccepted) {
      alert('Please accept the declaration to continue')
      return
    }

    setLoading(true)

    try {
      // Submit to leads endpoint (or create a dedicated passport endpoint)
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          service: 'Passport Application',
          userId: user?.id || null,
          notes: `PASSPORT APPLICATION FORM\n\n` +
            `Full Name: ${formData.fullName}\n` +
            `Other Names: ${formData.otherNames || 'N/A'}\n` +
            `Date of Birth: ${formData.dateOfBirth}\n` +
            `Place of Birth: ${formData.placeOfBirth}\n` +
            `Nationality: ${formData.nationality}\n` +
            `Marital Status: ${formData.maritalStatus}\n` +
            `Residential Address: ${formData.residentialAddress}\n` +
            `Phone: ${formData.phone}\n` +
            `Email: ${formData.email}\n` +
            `Passport Number: ${formData.passportNumber || 'N/A'}\n` +
            `Date of Issue: ${formData.dateOfIssue || 'N/A'}\n` +
            `Date of Expiry: ${formData.dateOfExpiry || 'N/A'}\n` +
            `Parents' Full Names: ${formData.parentsFullNames || 'N/A'}\n` +
            `Emergency Contact: ${formData.emergencyContact || 'N/A'}\n`
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Mark draft as submitted if exists
        if (currentDraftId) {
          try {
            await fetch(`${API_BASE}/api/form-drafts/${currentDraftId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'submitted' })
            })
          } catch (err) {
            console.error('Failed to update draft status:', err)
          }
        }
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
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          
          <motion.div 
            className="relative w-full max-w-3xl bg-white rounded-xl p-6 md:p-8 z-50 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, y: 20 }} 
            animate={{ scale: 1, y: 0 }} 
            exit={{ scale: 0.95, y: 20 }}
          >
            <button 
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-800 text-2xl" 
              onClick={onClose}
            >
              ×
            </button>

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2 form-header">BT² Passport Application Information Form</h2>
                  <p className="text-slate-400">Please fill out all required fields</p>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Full Name (as per passport/birth certificate) <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Other Names */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Other names used (maiden/previous)
                    </label>
                    <input
                      type="text"
                      value={formData.otherNames}
                      onChange={(e) => setFormData({...formData, otherNames: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="Enter other names if applicable"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                    />
                  </div>

                  {/* Place of Birth */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Place of Birth <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({...formData, placeOfBirth: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="City, Country"
                    />
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Nationality <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="Enter your nationality"
                    />
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Marital Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({...formData, maritalStatus: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      <option value="">Select marital status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Residential Address */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Residential Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.residentialAddress}
                      onChange={(e) => setFormData({...formData, residentialAddress: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      rows={3}
                      placeholder="Enter your full residential address"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Phone / WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="your@email.com"
                    />
                  </div>

                  {/* Passport Number */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Passport Number (if renewal)
                    </label>
                    <input
                      type="text"
                      value={formData.passportNumber}
                      onChange={(e) => setFormData({...formData, passportNumber: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="Enter passport number if renewing"
                    />
                  </div>

                  {/* Date of Issue & Expiry */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Date of Issue
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfIssue}
                        onChange={(e) => setFormData({...formData, dateOfIssue: e.target.value})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Date of Expiry
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfExpiry}
                        onChange={(e) => setFormData({...formData, dateOfExpiry: e.target.value})}
                        className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      />
                    </div>
                  </div>

                  {/* Parents' Full Names */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Parents' Full Names
                    </label>
                    <textarea
                      value={formData.parentsFullNames}
                      onChange={(e) => setFormData({...formData, parentsFullNames: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      rows={2}
                      placeholder="Father's name and Mother's name"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Emergency Contact
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="Name and phone number"
                    />
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-2">DISCLAIMER:</h3>
                  <p className="text-sm text-slate-700">
                    BT² provides visa and passport application assistance only and does not guarantee approval. 
                    All decisions are made solely by the relevant issuing authority.
                  </p>
                </div>

                {/* Declaration */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-2">DECLARATION & AUTHORISATION:</h3>
                  <p className="text-sm text-slate-700 mb-3">
                    I confirm that the information provided is true and complete. I authorise BT² – Bookings | Transport | Travel 
                    to prepare and submit applications on my behalf based on the information supplied.
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.declarationAccepted}
                      onChange={(e) => setFormData({...formData, declarationAccepted: e.target.checked})}
                      className="mt-1 w-4 h-4 text-teal focus:ring-teal"
                      required
                    />
                    <span className="text-sm text-slate-700">
                      I accept the declaration and authorisation <span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading || !formData.declarationAccepted}
                      className="flex-1 bg-teal hover:bg-teal-dark text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
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
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-semibold text-navy mb-2">Application Submitted!</h3>
                <p className="text-slate-600 mb-6">
                  Thank you for submitting your passport application form. A BT² specialist will review your information 
                  and contact you within 24-48 hours to proceed with your application.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-teal text-white rounded-lg hover:bg-teal-dark transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

