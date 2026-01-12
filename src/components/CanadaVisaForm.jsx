import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function CanadaVisaForm({ open, onClose, draftId = null }) {
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState(draftId)
  const [formData, setFormData] = useState({
    fullName: '',
    citizenships: '',
    maritalStatus: '',
    spouseChildrenDetails: '',
    countriesVisited: '',
    previousCanadianVisa: '',
    currentEmployer: '',
    lengthOfEmployment: '',
    approvedLeaveDates: '',
    propertyOrBusiness: '',
    bankName: '',
    accountType: '',
    averageBalance: '',
    otherAssets: '',
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
      citizenships: '',
      maritalStatus: '',
      spouseChildrenDetails: '',
      countriesVisited: '',
      previousCanadianVisa: '',
      currentEmployer: '',
      lengthOfEmployment: '',
      approvedLeaveDates: '',
      propertyOrBusiness: '',
      bankName: '',
      accountType: '',
      averageBalance: '',
      otherAssets: '',
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
        formType: 'canada_visa',
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
    const requiredFields = ['fullName', 'citizenships', 'maritalStatus', 'currentEmployer', 'bankName', 'accountType']
    const optionalFields = ['spouseChildrenDetails', 'countriesVisited', 'previousCanadianVisa', 'lengthOfEmployment', 'approvedLeaveDates', 'propertyOrBusiness', 'averageBalance', 'otherAssets']
    
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
      if (formData.fullName || formData.currentEmployer || formData.bankName) {
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
          service: 'Canada Visitor Visa',
          userId: user?.id || null,
          notes: `CANADA VISITOR VISA APPLICATION FORM\n\n` +
            `PERSONAL & FAMILY:\n` +
            `Full Name: ${formData.fullName}\n` +
            `Citizenship(s): ${formData.citizenships}\n` +
            `Marital Status: ${formData.maritalStatus}\n` +
            `Spouse & Children Details: ${formData.spouseChildrenDetails || 'N/A'}\n\n` +
            `TRAVEL HISTORY:\n` +
            `Countries Visited (Last 10 Years): ${formData.countriesVisited || 'N/A'}\n` +
            `Previous Canadian Visa or Refusal: ${formData.previousCanadianVisa || 'N/A'}\n\n` +
            `EMPLOYMENT & TIES:\n` +
            `Current Employer: ${formData.currentEmployer}\n` +
            `Length of Employment: ${formData.lengthOfEmployment || 'N/A'}\n` +
            `Approved Leave Dates: ${formData.approvedLeaveDates || 'N/A'}\n` +
            `Property or Business Owned: ${formData.propertyOrBusiness || 'N/A'}\n\n` +
            `FINANCIAL INFORMATION:\n` +
            `Bank Name: ${formData.bankName}\n` +
            `Account Type: ${formData.accountType}\n` +
            `Average Balance (6 months): ${formData.averageBalance || 'N/A'}\n` +
            `Other Assets: ${formData.otherAssets || 'N/A'}`
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
                  <h2 className="text-3xl font-bold text-white mb-2 form-header">BT² Canada Visitor Visa – Full Client Intake Form</h2>
                  <p className="text-slate-600">Please fill out all required fields</p>
                </div>

                <div className="space-y-6">
                  {/* Personal & Family Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Personal & Family</h3>
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
                          Citizenship(s) <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.citizenships}
                          onChange={(e) => setFormData({...formData, citizenships: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="e.g., Jamaican, Canadian"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Marital status <span className="text-red-500">*</span>
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
                          <option value="Common-law">Common-law</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Spouse & children details
                        </label>
                        <textarea
                          value={formData.spouseChildrenDetails}
                          onChange={(e) => setFormData({...formData, spouseChildrenDetails: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={3}
                          placeholder="Names, ages, and relationship"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Travel History Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Travel History</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Countries visited last 10 years
                        </label>
                        <textarea
                          value={formData.countriesVisited}
                          onChange={(e) => setFormData({...formData, countriesVisited: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="List countries and dates"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Previous Canadian visa or refusal
                        </label>
                        <textarea
                          value={formData.previousCanadianVisa}
                          onChange={(e) => setFormData({...formData, previousCanadianVisa: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Details of previous applications"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment & Ties Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Employment & Ties</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Current employer <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.currentEmployer}
                          onChange={(e) => setFormData({...formData, currentEmployer: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="Company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Length of employment
                        </label>
                        <input
                          type="text"
                          value={formData.lengthOfEmployment}
                          onChange={(e) => setFormData({...formData, lengthOfEmployment: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="e.g., 5 years"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Approved leave dates
                        </label>
                        <input
                          type="text"
                          value={formData.approvedLeaveDates}
                          onChange={(e) => setFormData({...formData, approvedLeaveDates: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="e.g., Dec 15, 2024 - Jan 5, 2025"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Property or business owned
                        </label>
                        <textarea
                          value={formData.propertyOrBusiness}
                          onChange={(e) => setFormData({...formData, propertyOrBusiness: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Details of property or business ownership"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Information Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-white mb-4 form-header">Financial Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Bank name <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="Bank name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Account type <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={formData.accountType}
                          onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                        >
                          <option value="">Select account type</option>
                          <option value="Checking">Checking</option>
                          <option value="Savings">Savings</option>
                          <option value="Investment">Investment</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Average balance (6 months)
                        </label>
                        <input
                          type="text"
                          value={formData.averageBalance}
                          onChange={(e) => setFormData({...formData, averageBalance: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="Amount in CAD"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Other assets
                        </label>
                        <textarea
                          value={formData.otherAssets}
                          onChange={(e) => setFormData({...formData, otherAssets: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Investments, property, vehicles, etc."
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
                  Thank you for submitting your Canada Visitor Visa application. A BT² specialist will review your information 
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

