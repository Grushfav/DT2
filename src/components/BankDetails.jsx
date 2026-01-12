import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function BankDetails({ open, onClose }) {
  const { user, token } = useAuth()
  const [bankDetails, setBankDetails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      fetchBankDetails()
    }
  }, [open])

  const fetchBankDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const headers = {}
      // Include auth token if available, but don't require it
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`${API_BASE}/api/bank-details`, {
        headers
      })

      if (response.ok) {
        const data = await response.json()
        setBankDetails(data)
      } else {
        setError('Failed to load bank details. Please try again later.')
      }
    } catch (error) {
      console.error('Failed to fetch bank details:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy')
    })
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal to-teal-dark text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">🏦 BT2 Bank Details</h2>
                <p className="text-sm text-white/80 mt-1">Payment information for making transfers</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
                <p className="text-slate-600 mt-4">Loading bank details...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : bankDetails.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-600">No bank details available. Please contact support.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {bankDetails.map((bank, index) => (
                  <div
                    key={bank.id || index}
                    className="bg-gradient-to-br from-slate-50 to-white border-2 border-teal/20 rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{bank.bank_name}</h3>
                      {bank.currency && (
                        <span className="px-3 py-1 bg-teal/10 text-teal rounded-full text-sm font-semibold">
                          {bank.currency}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Account Name */}
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                          Account Name
                        </label>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold text-white">{bank.account_name}</p>
                          <button
                            onClick={() => copyToClipboard(bank.account_name)}
                            className="ml-2 text-teal hover:text-teal-dark text-sm"
                            title="Copy"
                          >
                            📋
                          </button>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="bg-white rounded-lg p-4 border border-slate-200">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                          Account Number
                        </label>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-mono font-semibold text-white">{bank.account_number}</p>
                          <button
                            onClick={() => copyToClipboard(bank.account_number)}
                            className="ml-2 text-teal hover:text-teal-dark text-sm"
                            title="Copy"
                          >
                            📋
                          </button>
                        </div>
                      </div>

                      {/* Routing Number */}
                      {bank.routing_number && (
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                            Routing Number
                          </label>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-mono font-semibold text-white">{bank.routing_number}</p>
                            <button
                              onClick={() => copyToClipboard(bank.routing_number)}
                              className="ml-2 text-teal hover:text-teal-dark text-sm"
                              title="Copy"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SWIFT Code */}
                      {bank.swift_code && (
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                            SWIFT Code
                          </label>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-mono font-semibold text-white">{bank.swift_code}</p>
                            <button
                              onClick={() => copyToClipboard(bank.swift_code)}
                              className="ml-2 text-teal hover:text-teal-dark text-sm"
                              title="Copy"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Branch Name */}
                      {bank.branch_name && (
                        <div className="bg-white rounded-lg p-4 border border-slate-200">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                            Branch Name
                          </label>
                          <p className="text-lg font-semibold text-white">{bank.branch_name}</p>
                        </div>
                      )}

                      {/* Branch Address */}
                      {bank.branch_address && (
                        <div className="bg-white rounded-lg p-4 border border-slate-200 md:col-span-2">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">
                            Branch Address
                          </label>
                          <p className="text-slate-300">{bank.branch_address}</p>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    {bank.instructions && (
                      <div className="mt-4 bg-teal/5 border border-teal/20 rounded-lg p-4">
                        <label className="text-xs font-semibold text-teal uppercase tracking-wide mb-2 block">
                          ⚠️ Important Instructions
                        </label>
                        <p className="text-slate-300 whitespace-pre-wrap">{bank.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Footer Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> When making a payment, please include your Request ID in the payment reference 
                    so we can match your payment to your request. You can find your Request ID in the "My Requests" section.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-4 rounded-b-xl border-t border-slate-200">
            <button
              onClick={onClose}
              className="w-full bg-teal hover:bg-teal-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

