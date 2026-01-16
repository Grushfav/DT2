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
          className="bank-details-modal bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
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
                    className="rounded-xl p-6 shadow-lg"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      backgroundImage: 'linear-gradient(to bottom right, #f8fafc, #ffffff)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold" style={{ color: '#0f172a', fontWeight: '700' }}>{bank.bank_name}</h3>
                      {bank.currency && (
                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold"
                          style={{ backgroundColor: '#ecfeff', color: '#0f172a', border: '1px solid #bae6fd' }}
                        >
                          {bank.currency}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Account Name */}
                      <div
                        className="rounded-lg p-4"
                        style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                      >
                        <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: '#000000', fontWeight: '800', letterSpacing: '0.05em' }}>
                          Account Name
                        </label>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold" style={{ color: '#0f172a', fontWeight: '700' }}>{bank.account_name}</p>
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
                      <div
                        className="rounded-lg p-4"
                        style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                      >
                        <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: '#000000', fontWeight: '800', letterSpacing: '0.05em' }}>
                          Account Number
                        </label>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-mono font-semibold" style={{ color: '#0f172a', fontWeight: '700' }}>{bank.account_number}</p>
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
                        <div
                          className="rounded-lg p-4"
                          style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                        >
                          <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: '#000000', fontWeight: '800', letterSpacing: '0.05em' }}>
                            Routing Number
                          </label>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-mono font-semibold" style={{ color: '#0f172a', fontWeight: '700' }}>{bank.routing_number}</p>
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
                        <div
                          className="rounded-lg p-4"
                          style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                        >
                          <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: '#000000', fontWeight: '800', letterSpacing: '0.05em' }}>
                            SWIFT Code
                          </label>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-mono font-semibold" style={{ color: '#0f172a', fontWeight: '700' }}>{bank.swift_code}</p>
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
                        <div
                          className="rounded-lg p-4"
                          style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                        >
                          <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: '#000000', fontWeight: '800', letterSpacing: '0.05em' }}>
                            Branch Name
                          </label>
                          <p className="text-lg font-semibold" style={{ color: '#0f172a', fontWeight: '700' }}>{bank.branch_name}</p>
                        </div>
                      )}

                      {/* Branch Address */}
                      {bank.branch_address && (
                        <div
                          className="rounded-lg p-4 md:col-span-2"
                          style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                        >
                          <label className="text-xs font-bold uppercase tracking-wide mb-2 block" style={{ color: '#000000', fontWeight: '800', letterSpacing: '0.05em' }}>
                            Branch Address
                          </label>
                          <p className="text-gray-700" style={{ color: '#0f172a', fontWeight: '500' }}>{bank.branch_address}</p>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    {bank.instructions && (
                      <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: '#ecfdf5', border: '1px solid #10b981' }}>
                        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: '#059669' }}>
                          ⚠️ Important Instructions
                        </label>
                        <p className="whitespace-pre-wrap" style={{ color: '#065f46', fontWeight: '600' }}>{bank.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Other Payment Methods */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-5">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">💳 Other Payment Methods</h3>
                  <p className="text-sm text-purple-800 mb-2">
                    We also accept payments via:
                  </p>
                  <ul className="list-disc list-inside text-sm text-purple-800 space-y-1 mb-3">
                    <li>PayPal</li>
                    <li>Cash App</li>
                    <li>Zelle</li>
                  </ul>
                  <p className="text-sm text-purple-700 italic">
                    Please contact us for more details on these payment methods.
                  </p>
                </div>

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

