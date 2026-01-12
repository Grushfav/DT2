import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import Countdown from './countdown/Countdown'
import AirportAutocomplete from './AirportAutocomplete'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// Generate calendar days for current month
function generateCalendarDays() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()
  
  const days = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push({
      day,
      date: date.toISOString().split('T')[0],
      fullDate: date
    })
  }
  
  return { days, year, month }
}

export default function TravelPulse() {
  const { user } = useAuth()
  // Crazy deal ends in 2 hours from now
  const crazyDealEnds = new Date(Date.now() + 1000 * 60 * 60 * 2)
  
  // Memoize calendar days to prevent infinite re-renders
  const { days: calendarDays, year, month } = useMemo(() => generateCalendarDays(), [])
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Date range state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [calendarDeals, setCalendarDeals] = useState({})
  const [filteredDays, setFilteredDays] = useState(calendarDays)
  
  // Submission form state
  const [tripType, setTripType] = useState('return') // 'one-way' | 'return'
  const [departureAirport, setDepartureAirport] = useState('')
  const [arrivalAirport, setArrivalAirport] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [error, setError] = useState('')

  // Load saved draft on mount if user is logged in
  useEffect(() => {
    if (!user?.id) return

    const loadTravelPeriodDraft = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/form-drafts?userId=${user.id}&formType=travel_period&status=draft`)
        if (response.ok) {
          const drafts = await response.json()
          if (drafts.length > 0) {
            const draft = drafts[0] // Get most recent draft
            const data = draft.form_data
            setStartDate(data.startDate || '')
            setEndDate(data.endDate || '')
            setDepartureAirport(data.departureAirport || '')
            setArrivalAirport(data.arrivalAirport || '')
            setTripType(data.tripType || 'return')
            setCurrentDraftId(draft.id)
          }
        }
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }

    loadTravelPeriodDraft()
  }, [user?.id]) // Only depend on user.id, not the entire user object

  const saveDraft = async () => {
    if (!user) {
      alert('Please log in to save your form progress')
      return
    }

    setSaving(true)
    try {
      const formData = {
        startDate,
        endDate,
        tripType,
        departureAirport: departureAirport.trim() || null,
        arrivalAirport: arrivalAirport.trim() || null
      }

      const progress = calculateProgress()
      const payload = {
        userId: user.id,
        formType: 'travel_period',
        formData,
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
    const fields = [
      startDate, 
      tripType === 'return' ? endDate : 'one-way',
      departureAirport,
      arrivalAirport
    ]
    const filled = fields.filter(f => f && (typeof f === 'string' ? f.trim() !== '' : true))
    return Math.round((filled.length / fields.length) * 100)
  }

  // Fetch calendar deals from API
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/calendar-deals`)
        if (response.ok) {
          const deals = await response.json()
          const dealsMap = {}
          deals.forEach(deal => {
            dealsMap[deal.deal_date] = deal
          })
          setCalendarDeals(dealsMap)
        }
      } catch (error) {
        console.error('Failed to fetch calendar deals:', error)
      }
    }
    
    fetchDeals()
  }, [])

  // Calculate date range based on start and end dates
  useEffect(() => {
    if (!startDate && !endDate) {
      setFilteredDays(calendarDays)
      return
    }

    const start = startDate ? new Date(startDate) : null
    const end = (tripType === 'return' && endDate) ? new Date(endDate) : start

    // Filter days based on date range
    const daysInRange = calendarDays.filter((dayObj) => {
      if (!dayObj) return false
      if (start && dayObj.fullDate < start) return false
      if (end && dayObj.fullDate > end) return false
      return true
    })

    setFilteredDays(daysInRange.length > 0 ? daysInRange : calendarDays)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, tripType]) // calendarDays is memoized and doesn't need to be in dependencies

  const handleReset = () => {
    setStartDate('')
    setEndDate('')
    setTripType('return')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!startDate) {
      setError('Please select a start date')
      return
    }
    if (tripType === 'return' && !endDate) {
      setError('Please select an end date for return trips')
      return
    }
    
    if (!departureAirport.trim() || !arrivalAirport.trim()) {
      setError('Please select both departure and arrival airports')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
      const response = await fetch(`${API_BASE}/api/travel-periods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
          body: JSON.stringify({
          startDate,
          endDate: tripType === 'one-way' ? startDate : endDate,
          tripType,
          departureAirport: departureAirport.trim() || null,
          arrivalAirport: arrivalAirport.trim() || null,
          userId: user?.id || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
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
        // Reset form after 3 seconds
        setTimeout(() => {
          setSubmitted(false)
          setStartDate('')
          setEndDate('')
          setTripType('return')
          setDepartureAirport('')
          setArrivalAirport('')
          setCurrentDraftId(null)
        }, 3000)
      } else {
        setError(data.error || 'Failed to submit travel period')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="py-16 bg-gradient-to-b from-[#0a1b34] via-[#0b2746] to-[#071327]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <p className="text-sm text-teal/80 uppercase tracking-wide">TravelPulse</p>
            <h3 className="text-3xl md:text-4xl font-semibold text-white">Deals Calendar</h3>
            <p className="text-white/70 mt-1">Pick dates, choose one-way or return, and get tailored deals.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-lg">
            <div className="text-sm text-white/80">Crazy Deal</div>
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-navy px-3 py-1 rounded-full text-xs font-semibold shadow">
              Limited time
            </div>
            <Countdown end={crazyDealEnds} />
          </div>
        </div>

        {/* Date Range Filter */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md rounded-2xl p-5 mb-6 shadow-xl border border-white/10"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <label className="block text-sm font-medium text-white/90">
                  Select Travel Period
                </label>
                <div className="inline-flex rounded-full bg-white/10 p-1 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setTripType('one-way')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                      tripType === 'one-way' ? 'bg-white text-navy shadow' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    One-way
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('return')}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                      tripType === 'return' ? 'bg-white text-navy shadow' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Return
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-white/60 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-teal"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-white/60 mb-1">End Date {tripType === 'one-way' && '(optional)'}</label>
                  <input
                    type="date"
                    value={tripType === 'one-way' ? startDate : endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-teal disabled:opacity-60"
                    min={startDate || new Date().toISOString().split('T')[0]}
                    disabled={tripType === 'one-way'}
                  />
                </div>
                {(startDate || endDate) && (
                  <div className="flex items-end">
                    <button
                      onClick={handleReset}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors border border-white/10"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
              {(startDate || endDate) && (
                <div className="mt-2 text-xs text-white/60">
                  Showing {filteredDays.length} day{filteredDays.length !== 1 ? 's' : ''} 
                  {startDate && endDate && ` (${startDate} to ${endDate})`}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Travel Period Submission Form (now directly below date selector) */}
        {(startDate && (tripType === 'return' ? endDate : true)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10 mb-6"
          >
            <h4 className="text-lg font-semibold mb-4 text-white">Submit Your Travel Preferences</h4>
            
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-teal font-semibold">Travel period submitted successfully!</p>
                <p className="text-sm text-white/60 mt-2">We'll contact you with the best deals for your selected period.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AirportAutocomplete
                    value={departureAirport}
                    onChange={setDepartureAirport}
                    label="Departure Airport"
                    placeholder="Search departure airport (e.g., JFK, MIA, LAX)"
                    required
                  />

                  <AirportAutocomplete
                    value={arrivalAirport}
                    onChange={setArrivalAirport}
                    label="Arrival Airport"
                    placeholder="Search arrival airport (e.g., MBJ, NAS, SDQ)"
                    required
                  />
                </div>

                <div className="bg-white/5 rounded-lg p-4 text-sm text-white/80 border border-white/10">
                  <p className="flex items-center gap-2">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-white/10 text-teal-200">
                      {tripType === 'one-way' ? 'One-way' : 'Return'}
                    </span>
                    <span><strong>Selected:</strong> {startDate}{tripType === 'return' && endDate ? ` → ${endDate}` : ''}</span>
                  </p>
                  <p className="mt-1"><strong>Duration:</strong> {tripType === 'one-way' ? 'One day (flexible)' : `${Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days`}</p>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={
                      submitting || 
                      (tripType === 'return' && !endDate) ||
                      !startDate || 
                      !departureAirport.trim() || 
                      !arrivalAirport.trim()
                    }
                    className="w-full bg-teal hover:bg-teal-dark text-navy font-semibold px-6 py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Travel Period'}
                  </button>
                  
                  {user && (
                    <div className="flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10">
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
            )}
          </motion.div>
        )}

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/10">
          {/* Calendar Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h4 className="text-2xl font-semibold text-white">
                {monthNames[month]} {year}
              </h4>
              <p className="text-white/60 text-sm">Tap a date to highlight your range</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Legend color="#0FB7A4" label="Flights" />
              <Legend color="#38bdf8" label="Hotels" />
              <Legend color="#D4AF37" label="Packages" />
              <Legend color="#a78bfa" label="Visa Deals" />
            </div>
            <div className="text-sm text-white/70 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              {tripType === 'one-way' ? 'One-way' : 'Return'}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mt-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-white/60 py-2">
                  {day}
                </div>
              ))}
            </div>

          {filteredDays.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <p>No deals available for the selected period.</p>
              <button
                onClick={handleReset}
                className="mt-4 px-4 py-2 rounded-lg bg-teal hover:bg-teal-dark text-white text-sm"
              >
                View All Deals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3">
              {filteredDays.map((d, index) => {
                if (!d) {
                  return <div key={`empty-${index}`} className="p-2" />
                }
                
                const deal = calendarDeals[d.date]
                const dealType = deal?.deal_type || null
                const rangeStart = startDate ? new Date(startDate) : null
                const rangeEnd = tripType === 'return' && endDate ? new Date(endDate) : rangeStart
                const isSelected = rangeStart && rangeEnd && 
                  d.fullDate >= rangeStart && 
                  d.fullDate <= rangeEnd
                const isToday = d.date === new Date().toISOString().split('T')[0]
                
                return (
                  <motion.div
                    key={d.date}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`flex flex-col items-center gap-2 p-2 rounded-lg transition-all ${
                      isSelected ? 'bg-teal/20 ring-2 ring-teal' : 
                      isToday ? 'bg-white/10 ring-1 ring-white/30' : 
                      'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center border-2 ${
                      dealType === 'flight' ? 'border-teal bg-teal/10' : 
                      dealType === 'hotel' ? 'border-sky-400 bg-sky-400/10' : 
                      dealType === 'package' ? 'border-gold bg-gold/10' : 
                      dealType === 'visa' ? 'border-violet-400 bg-violet-400/10' :
                      'border-white/20 bg-white/5'
                    }`}>
                      <span className={`text-sm font-medium ${isToday ? 'text-teal font-bold' : 'text-white'}`}>
                        {d.day}
                      </span>
                    </div>
                    {dealType && (
                      <div className="text-xs text-white/70 capitalize">{dealType}</div>
                    )}
                    {isSelected && (
                      <div className="text-xs text-teal font-semibold">Selected</div>
                    )}
                    {isToday && !dealType && (
                      <div className="text-xs text-white/50">Today</div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </section>
  )
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }} />
      <div className="text-muted">{label}</div>
    </div>
  )
}
