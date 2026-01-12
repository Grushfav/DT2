import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function PaymentInfo({ requestId, onClose }) {
  const { user } = useAuth()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (requestId && user) {
      fetchRequest()
    }
  }, [requestId, user])

  const fetchRequest = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequest(data)
      }
    } catch (error) {
      console.error('Failed to fetch request:', error)
    } finally {
      setLoading(false)
    }
  }

  const markPaymentReceived = async () => {
    if (!confirm('Have you made the payment? This will notify the admin.')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/api/requests/${requestId}/payment-received`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        await fetchRequest()
        alert('✅ Payment notification sent to admin. They will confirm once verified.')
      } else {
        alert('Failed to update payment status')
      }
    } catch (error) {
      console.error('Payment update error:', error)
      alert('Network error')
    }
  }

  if (!request) {
    return null
  }

  const paymentInfo = request.payment_info || {}
  const paymentStatus = request.payment_status || 'pending'

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
                <h2 className="text-2xl font-bold">💳 Payment Information</h2>
                <p className="text-sm text-slate-300 mt-1">Request: {request.title}</p>
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
          <div className="p-6 space-y-6">
            {/* Payment Status */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-300">Payment Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  paymentStatus === 'payment_confirmed' ? 'bg-green-600/20 text-green-300' :
                  paymentStatus === 'awaiting_payment' ? 'bg-yellow-600/20 text-yellow-300' :
                  paymentStatus === 'payment_received' ? 'bg-blue-600/20 text-blue-300' :
                  'bg-gray-600/20 text-gray-300'
                }`}>
                  {paymentStatus === 'payment_confirmed' ? '✅ Payment Confirmed' :
                   paymentStatus === 'awaiting_payment' ? '⏳ Awaiting Payment' :
                   paymentStatus === 'payment_received' ? '📧 Payment Received (Pending Confirmation)' :
                   paymentStatus === 'no_payment_required' ? 'ℹ️ No Payment Required' :
                   '⏸️ Pending'}
                </span>
              </div>
            </div>

            {/* Payment Instructions */}
            {paymentStatus === 'awaiting_payment' || paymentStatus === 'payment_received' || paymentStatus === 'payment_confirmed' ? (
              <div className="bg-white/5 rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold text-teal">Payment Instructions</h3>
                
                {paymentInfo.amount && (
                  <div className="flex items-center justify-between p-3 bg-teal/10 rounded-lg">
                    <span className="text-slate-300">Amount Due:</span>
                    <span className="text-xl font-bold text-teal">
                      {paymentInfo.currency || 'USD'} {paymentInfo.amount}
                    </span>
                  </div>
                )}

                {paymentInfo.payment_method && (
                  <div>
                    <span className="text-sm text-slate-300">Payment Method:</span>
                    <p className="text-white font-medium capitalize">{paymentInfo.payment_method.replace('_', ' ')}</p>
                  </div>
                )}

                {paymentInfo.bank_name && (
                  <div>
                    <span className="text-sm text-slate-300">Bank Name:</span>
                    <p className="text-white font-medium">{paymentInfo.bank_name}</p>
                  </div>
                )}

                {paymentInfo.account_name && (
                  <div>
                    <span className="text-sm text-slate-300">Account Name:</span>
                    <p className="text-white font-medium">{paymentInfo.account_name}</p>
                  </div>
                )}

                {paymentInfo.account_number && (
                  <div>
                    <span className="text-sm text-slate-300">Account Number:</span>
                    <p className="text-white font-mono font-medium">{paymentInfo.account_number}</p>
                  </div>
                )}

                {paymentInfo.instructions && (
                  <div>
                    <span className="text-sm text-slate-300">Special Instructions:</span>
                    <p className="text-white mt-1 whitespace-pre-wrap">{paymentInfo.instructions}</p>
                  </div>
                )}

                {paymentInfo.due_date && (
                  <div className="p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                    <span className="text-sm text-yellow-300">⚠️ Payment Due Date:</span>
                    <p className="text-white font-semibold">{new Date(paymentInfo.due_date).toLocaleDateString()}</p>
                  </div>
                )}

                <div className="p-3 bg-teal/10 border border-teal/20 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <strong>Important:</strong> Please include Request ID <code className="bg-white/10 px-2 py-1 rounded">#{request.id}</code> in your payment reference.
                  </p>
                </div>
              </div>
            ) : paymentStatus === 'no_payment_required' ? (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-slate-300">This request does not require payment.</p>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-slate-300">Payment information will be provided once your request is processed.</p>
              </div>
            )}

            {/* Action Buttons */}
            {paymentStatus === 'awaiting_payment' && (
              <div className="flex gap-3">
                <button
                  onClick={markPaymentReceived}
                  className="flex-1 bg-teal hover:bg-teal-dark text-navy font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  ✓ I've Made the Payment
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {paymentStatus === 'payment_received' && (
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  ✅ Your payment has been received. The admin will confirm once verified.
                </p>
              </div>
            )}

            {paymentStatus === 'payment_confirmed' && (
              <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
                <p className="text-sm text-green-300">
                  ✅ Payment confirmed by admin on {request.payment_confirmed_at ? new Date(request.payment_confirmed_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

