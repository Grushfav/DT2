import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function UKVisaForm({ open, onClose, draftId = null }) {
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState(draftId)
  const [formData, setFormData] = useState({
    fullName: '',
    nationality: '',
    passportNumber: '',
    passportExpiry: '',
    purposeOfVisit: '',
    travelDates: '',
    ukAddress: '',
    employerName: '',
    employerAddress: '',
    jobTitle: '',
    monthlyIncome: '',
    additionalIncome: '',
    ukVisaRefusals: '',
    overstaysRemovals: '',
    declarationAccepted: false
  })

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
      nationality: '',
      passportNumber: '',
      passportExpiry: '',
      purposeOfVisit: '',
      travelDates: '',
      ukAddress: '',
      employerName: '',
      employerAddress: '',
      jobTitle: '',
      monthlyIncome: '',
      additionalIncome: '',
      ukVisaRefusals: '',
      overstaysRemovals: '',
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
        formType: 'uk_visa',
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
    const requiredFields = ['fullName', 'nationality', 'passportNumber', 'passportExpiry', 'purposeOfVisit', 'travelDates', 'employerName', 'jobTitle']
    const optionalFields = ['ukAddress', 'employerAddress', 'monthlyIncome', 'additionalIncome', 'ukVisaRefusals', 'overstaysRemovals']
    
    const requiredFilled = requiredFields.filter(field => {
      const value = formData[field]
      return value && value.trim() !== ''
    }).length

    const optionalFilled = optionalFields.filter(field => {
      const value = formData[field]
      return value && value.trim() !== ''
    }).length

    const requiredProgress = (requiredFilled / requiredFields.length) * 70
    const optionalProgress = (optionalFilled / optionalFields.length) * 30
    
    return Math.round(requiredProgress + optionalProgress)
  }

  useEffect(() => {
    if (!open || !user || submitted) return

    const autoSave = setInterval(() => {
      if (formData.fullName || formData.passportNumber || formData.employerName) {
        saveDraft()
      }
    }, 30000)

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
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          phone: user?.phone || '',
          email: user?.email || '',
          service: 'UK Standard Visitor Visa',
          userId: user?.id || null,
          notes: `UK STANDARD VISITOR VISA APPLICATION FORM\n\n` +
            `PERSONAL INFORMATION:\n` +
            `Full Name: ${formData.fullName}\n` +
            `Nationality: ${formData.nationality}\n` +
            `Passport Number: ${formData.passportNumber}\n` +
            `Passport Expiry: ${formData.passportExpiry}\n\n` +
            `TRAVEL DETAILS:\n` +
            `Purpose of Visit: ${formData.purposeOfVisit}\n` +
            `Travel Dates: ${formData.travelDates}\n` +
            `UK Address / Accommodation: ${formData.ukAddress || 'N/A'}\n\n` +
            `EMPLOYMENT & INCOME:\n` +
            `Employer Name: ${formData.employerName}\n` +
            `Employer Address: ${formData.employerAddress || 'N/A'}\n` +
            `Job Title: ${formData.jobTitle}\n` +
            `Monthly Income: ${formData.monthlyIncome || 'N/A'}\n` +
            `Additional Income Sources: ${formData.additionalIncome || 'N/A'}\n\n` +
            `IMMIGRATION HISTORY:\n` +
            `UK or Other Visa Refusals: ${formData.ukVisaRefusals || 'N/A'}\n` +
            `Overstays or Removals: ${formData.overstaysRemovals || 'N/A'}`
        })
      })

      const data = await response.json()

      if (response.ok) {
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
                  <h2 className="text-3xl font-bold text-white mb-2 form-header">BT² UK Standard Visitor Visa – Full Client Intake Form</h2>
                  <p className="text-slate-400">Please fill out all required fields</p>
                </div>

                <div className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-white mb-4 form-header">Personal Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Full name <span className="text-red-500">*</span>
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
                          placeholder="e.g., Jamaican"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Passport number <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            value={formData.passportNumber}
                            onChange={(e) => setFormData({...formData, passportNumber: e.target.value})}
                            className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                            placeholder="Passport number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Passport expiry <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            type="date"
                            value={formData.passportExpiry}
                            onChange={(e) => setFormData({...formData, passportExpiry: e.target.value})}
                            className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Travel Details Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Travel Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Purpose of visit <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.purposeOfVisit}
                          onChange={(e) => setFormData({...formData, purposeOfVisit: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                        >
                          <option value="">Select purpose</option>
                          <option value="Tourism">Tourism</option>
                          <option value="Business">Business</option>
                          <option value="Family Visit">Family Visit</option>
                          <option value="Medical Treatment">Medical Treatment</option>
                          <option value="Study">Study</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Travel dates <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.travelDates}
                          onChange={(e) => setFormData({...formData, travelDates: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="e.g., Dec 15, 2024 - Jan 5, 2025"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          UK address / accommodation
                        </label>
                        <textarea
                          value={formData.ukAddress}
                          onChange={(e) => setFormData({...formData, ukAddress: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={3}
                          placeholder="Full address where you will be staying"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment & Income Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Employment & Income</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Employer name & address <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.employerName}
                          onChange={(e) => setFormData({...formData, employerName: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal mb-2"
                          placeholder="Employer name"
                        />
                        <textarea
                          value={formData.employerAddress}
                          onChange={(e) => setFormData({...formData, employerAddress: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Employer address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Job title <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="Your job title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Monthly income
                        </label>
                        <input
                          type="text"
                          value={formData.monthlyIncome}
                          onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="Amount in local currency"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Additional income sources
                        </label>
                        <textarea
                          value={formData.additionalIncome}
                          onChange={(e) => setFormData({...formData, additionalIncome: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Other sources of income"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Immigration History Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Immigration History</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          UK or other visa refusals
                        </label>
                        <textarea
                          value={formData.ukVisaRefusals}
                          onChange={(e) => setFormData({...formData, ukVisaRefusals: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Details of any visa refusals"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Overstays or removals
                        </label>
                        <textarea
                          value={formData.overstaysRemovals}
                          onChange={(e) => setFormData({...formData, overstaysRemovals: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Details of any overstays or removals"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Declaration */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h3 className="font-semibold text-slate-800 mb-2">IMPORTANT DECLARATION & AUTHORISATION:</h3>
                  <p className="text-sm text-slate-700 mb-3">
                    I confirm that all information provided is true, complete, and accurate. I understand that false, misleading, 
                    or incomplete information may result in refusal, delays, or bans. I acknowledge that BT² provides application 
                    assistance only and does not guarantee approval. I authorise BT² – Bookings | Transport | Travel to prepare and 
                    submit applications on my behalf.
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
                  Thank you for submitting your UK Standard Visitor Visa application. A BT² specialist will review your information 
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

