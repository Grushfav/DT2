import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function MyRequests({ onClose, onViewPayment }) {
  const { user, token } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, in_progress, on_hold, completed

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user, filter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)

      const response = await fetch(`${API_BASE}/api/requests?${params}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRequestTypeLabel = (type) => {
    const labels = {
      booking: 'Booking Inquiry',
      package: 'Package Request',
      travel_plan: 'Travel Plan',
      travel_buddy: 'Travel Buddy Trip'
    }
    return labels[type] || type
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      on_hold: 'On Hold',
      completed: 'Completed'
    }
    return labels[status] || status
  }

  if (!user) {
    return null
  }

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
          className="bg-navy text-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-semibold text-white">📝 My Requests</h2>
          <div className="flex items-center gap-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white/10 text-white border-white/20 focus:ring-teal focus:border-teal"
            >
              <option value="all" className="bg-navy">All Requests</option>
              <option value="pending" className="bg-navy">Pending</option>
              <option value="in_progress" className="bg-navy">In Progress</option>
              <option value="on_hold" className="bg-navy">On Hold</option>
              <option value="completed" className="bg-navy">Completed</option>
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
            <p className="mt-4 text-slate-300">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-slate-300">No requests found.</p>
            <p className="text-sm text-slate-400 mt-2">Submit a booking, package request, or join a travel buddy trip to see your requests here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-lg shadow-lg p-6 border border-white/10 hover:border-teal transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{request.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-600/20 text-yellow-300' :
                        request.status === 'in_progress' ? 'bg-blue-600/20 text-blue-300' :
                        request.status === 'on_hold' ? 'bg-orange-600/20 text-orange-300' :
                        'bg-green-600/20 text-green-300'
                      }`}>
                        {getStatusLabel(request.status)}
                      </span>
                      {(request.payment_status === 'awaiting_payment' || request.payment_status === 'payment_received') && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-teal/20 text-teal">
                          💳 Payment Required
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                      <span>{getRequestTypeLabel(request.request_type)}</span>
                      <span>•</span>
                      <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                      {request.updated_at !== request.created_at && (
                        <>
                          <span>•</span>
                          <span>Updated: {new Date(request.updated_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    {request.description && (
                      <p className="text-slate-300 text-sm mb-3">{request.description}</p>
                    )}
                    
                    {/* Request Details */}
                    {request.request_data && Object.keys(request.request_data).length > 0 && (
                      <div className="mt-3 p-3 bg-white/10 rounded-lg">
                        <div className="text-xs font-semibold text-slate-300 mb-2">Request Details:</div>
                        <div className="text-sm text-slate-300 space-y-1">
                          {request.request_data.packageCode && (
                            <p><strong>Package:</strong> {request.request_data.packageCode}</p>
                          )}
                          {request.request_data.service && (
                            <p><strong>Service:</strong> {request.request_data.service}</p>
                          )}
                          {request.request_data.countries && (
                            <p><strong>Countries:</strong> {Array.isArray(request.request_data.countries) ? request.request_data.countries.join(', ') : request.request_data.countries}</p>
                          )}
                          {request.request_data.startDate && (
                            <p><strong>Travel Period:</strong> {request.request_data.startDate} to {request.request_data.endDate}</p>
                          )}
                          {request.request_data.destination && (
                            <p><strong>Destination:</strong> {request.request_data.destination}, {request.request_data.country}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {request.admin_notes && (
                      <div className="mt-3 p-3 bg-teal/10 border border-teal/20 rounded-lg">
                        <div className="text-xs font-semibold text-teal mb-1">Admin Note:</div>
                        <p className="text-sm text-slate-300">{request.admin_notes}</p>
                      </div>
                    )}

                    {/* Payment Button */}
                    {(request.payment_status === 'awaiting_payment' || request.payment_status === 'payment_received' || request.payment_status === 'payment_confirmed') && (
                      <div className="mt-3">
                        <button
                          onClick={() => onViewPayment && onViewPayment(request.id)}
                          className="px-4 py-2 bg-teal hover:bg-teal-dark text-navy font-semibold rounded-lg transition-colors"
                        >
                          💳 View Payment Info
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

