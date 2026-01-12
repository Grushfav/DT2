import React, { useState, useEffect, useRef } from 'react'
import { searchAirports, formatAirport } from '../utils/airportsApi'

export default function AirportAutocomplete({ 
  value, 
  onChange, 
  placeholder = 'Search airport...',
  label,
  required = false
}) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    try {
      const results = await searchAirports(searchQuery)
      setSuggestions(results.slice(0, 10)) // Limit to 10 results
      setShowSuggestions(true)
    } catch (error) {
      console.error('Airport search error:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange(newValue)
    
    if (newValue.length >= 2) {
      handleSearch(newValue)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSelect = (airport) => {
    const displayValue = formatAirport(airport)
    setQuery(displayValue)
    onChange(displayValue)
    setShowSuggestions(false)
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium mb-2 text-white/80">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          required={required}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal"></div>
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((airport, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(airport)}
                className="w-full text-left px-4 py-2 hover:bg-teal/10 text-slate-800 border-b border-slate-100 last:border-b-0"
              >
                <div className="font-semibold">{formatAirport(airport)}</div>
                {airport.city && (
                  <div className="text-xs text-slate-500">{airport.city}, {airport.country}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

