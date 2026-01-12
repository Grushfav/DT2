import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function USAVisaForm({ open, onClose, draftId = null }) {
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState(draftId)
  const [formData, setFormData] = useState({
    fullName: '',
    allNamesUsed: '',
    dateOfBirth: '',
    placeOfBirth: '',
    otherCitizenships: '',
    nationalIdNumber: '',
    socialMediaHandles: '',
    previousUSTravel: '',
    usRefusalsOverstays: '',
    countriesVisited: '',
    currentEmployerName: '',
    currentEmployerAddress: '',
    jobTitle: '',
    jobDuties: '',
    monthlyIncome: '',
    previousEmployers: '',
    arrestsConvictions: '',
    immigrationViolations: '',
    militaryService: '',
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
      allNamesUsed: '',
      dateOfBirth: '',
      placeOfBirth: '',
      otherCitizenships: '',
      nationalIdNumber: '',
      socialMediaHandles: '',
      previousUSTravel: '',
      usRefusalsOverstays: '',
      countriesVisited: '',
      currentEmployerName: '',
      currentEmployerAddress: '',
      jobTitle: '',
      jobDuties: '',
      monthlyIncome: '',
      previousEmployers: '',
      arrestsConvictions: '',
      immigrationViolations: '',
      militaryService: '',
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
        formType: 'usa_visa',
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
    const requiredFields = ['fullName', 'dateOfBirth', 'placeOfBirth', 'currentEmployerName', 'jobTitle']
    const optionalFields = ['allNamesUsed', 'otherCitizenships', 'nationalIdNumber', 'socialMediaHandles', 'previousUSTravel', 'usRefusalsOverstays', 'countriesVisited', 'currentEmployerAddress', 'jobDuties', 'monthlyIncome', 'previousEmployers', 'arrestsConvictions', 'immigrationViolations', 'militaryService']
    
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
      if (formData.fullName || formData.currentEmployerName || formData.jobTitle) {
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
          service: 'USA Visa (DS-160)',
          userId: user?.id || null,
          notes: `USA VISA (DS-160) APPLICATION FORM\n\n` +
            `PERSONAL HISTORY:\n` +
            `Full Name (Passport): ${formData.fullName}\n` +
            `All Names Ever Used: ${formData.allNamesUsed || 'N/A'}\n` +
            `Date & Place of Birth: ${formData.dateOfBirth} - ${formData.placeOfBirth}\n` +
            `Other Citizenships: ${formData.otherCitizenships || 'N/A'}\n` +
            `National ID Number: ${formData.nationalIdNumber || 'N/A'}\n` +
            `Social Media Handles (Last 5 Years): ${formData.socialMediaHandles || 'N/A'}\n\n` +
            `TRAVEL HISTORY:\n` +
            `Previous Travel to USA: ${formData.previousUSTravel || 'N/A'}\n` +
            `US Refusals or Overstays: ${formData.usRefusalsOverstays || 'N/A'}\n` +
            `Countries Visited (Last 5 Years): ${formData.countriesVisited || 'N/A'}\n\n` +
            `EMPLOYMENT HISTORY (5 YEARS):\n` +
            `Current Employer Name: ${formData.currentEmployerName}\n` +
            `Current Employer Address: ${formData.currentEmployerAddress || 'N/A'}\n` +
            `Job Title: ${formData.jobTitle}\n` +
            `Job Duties: ${formData.jobDuties || 'N/A'}\n` +
            `Monthly Income: ${formData.monthlyIncome || 'N/A'}\n` +
            `Previous Employers: ${formData.previousEmployers || 'N/A'}\n\n` +
            `SECURITY & BACKGROUND:\n` +
            `Arrests or Convictions: ${formData.arrestsConvictions || 'N/A'}\n` +
            `Immigration Violations: ${formData.immigrationViolations || 'N/A'}\n` +
            `Military / Law Enforcement Service: ${formData.militaryService || 'N/A'}`
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
                  <h2 className="text-3xl font-bold text-white mb-2 form-header">BT² USA Visa (DS‑160) – Full Client Intake Form</h2>
                  <p className="text-slate-400">Please fill out all required fields</p>
                </div>

                <div className="space-y-6">
                  {/* Personal History Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Personal History</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Full name (passport) <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="Enter your full name as it appears on passport"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          All names ever used
                        </label>
                        <textarea
                          value={formData.allNamesUsed}
                          onChange={(e) => setFormData({...formData, allNamesUsed: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Maiden names, previous names, aliases, etc."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Date of birth <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                            className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Place of birth <span className="text-red-500">*</span>
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
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Other citizenships
                        </label>
                        <input
                          type="text"
                          value={formData.otherCitizenships}
                          onChange={(e) => setFormData({...formData, otherCitizenships: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="List all citizenships"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          National ID number
                        </label>
                        <input
                          type="text"
                          value={formData.nationalIdNumber}
                          onChange={(e) => setFormData({...formData, nationalIdNumber: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          placeholder="National identification number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Social media handles (last 5 years)
                        </label>
                        <textarea
                          value={formData.socialMediaHandles}
                          onChange={(e) => setFormData({...formData, socialMediaHandles: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Facebook, Twitter, Instagram, LinkedIn, etc."
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
                          Previous travel to USA (dates & visa type)
                        </label>
                        <textarea
                          value={formData.previousUSTravel}
                          onChange={(e) => setFormData({...formData, previousUSTravel: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Dates, visa type, and purpose of visit"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          US refusals or overstays (details)
                        </label>
                        <textarea
                          value={formData.usRefusalsOverstays}
                          onChange={(e) => setFormData({...formData, usRefusalsOverstays: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Details of any visa refusals or overstays"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Countries visited last 5 years
                        </label>
                        <textarea
                          value={formData.countriesVisited}
                          onChange={(e) => setFormData({...formData, countriesVisited: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="List countries and dates"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employment History Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Employment History (5 years)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Current employer name & address <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.currentEmployerName}
                          onChange={(e) => setFormData({...formData, currentEmployerName: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal mb-2"
                          placeholder="Employer name"
                        />
                        <textarea
                          value={formData.currentEmployerAddress}
                          onChange={(e) => setFormData({...formData, currentEmployerAddress: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Full employer address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Job title and duties <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal mb-2"
                          placeholder="Job title"
                        />
                        <textarea
                          value={formData.jobDuties}
                          onChange={(e) => setFormData({...formData, jobDuties: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Describe your job duties and responsibilities"
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
                          Previous employers (details)
                        </label>
                        <textarea
                          value={formData.previousEmployers}
                          onChange={(e) => setFormData({...formData, previousEmployers: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={3}
                          placeholder="Employer names, dates, and job titles for the last 5 years"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security & Background Section */}
                  <div className="border-b pb-4">
                    <h3 className="text-xl font-semibold text-navy mb-4">Security & Background</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Arrests or convictions
                        </label>
                        <textarea
                          value={formData.arrestsConvictions}
                          onChange={(e) => setFormData({...formData, arrestsConvictions: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Details of any arrests or convictions (if none, state 'None')"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Immigration violations
                        </label>
                        <textarea
                          value={formData.immigrationViolations}
                          onChange={(e) => setFormData({...formData, immigrationViolations: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Details of any immigration violations (if none, state 'None')"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Military / law enforcement service
                        </label>
                        <textarea
                          value={formData.militaryService}
                          onChange={(e) => setFormData({...formData, militaryService: e.target.value})}
                          className="w-full border border-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal"
                          rows={2}
                          placeholder="Details of military or law enforcement service (if none, state 'None')"
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
                  Thank you for submitting your USA Visa (DS-160) application. A BT² specialist will review your information 
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

