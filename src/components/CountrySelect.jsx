import React, { useState, useEffect } from 'react'
import { fetchCountries } from '../utils/airportsApi'

export default function CountrySelect({ 
  value, 
  onChange, 
  placeholder = 'Select country...',
  label,
  required = false,
  multiple = false
}) {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const loadCountries = async () => {
      try {
        const data = await fetchCountries()
        const countriesList = Array.isArray(data) ? data : []
        
        // Normalize country objects to ensure they have name and code
        const normalizedCountries = countriesList
          .filter(country => {
            // Filter out invalid entries
            if (!country) return false
            if (typeof country === 'string') return country.trim().length > 0
            if (typeof country === 'object') {
              // Must have at least one identifying property
              return !!(country.code || country.country_code || country.iso_code || 
                       country.name || country.country_name || country.country)
            }
            return false
          })
          .map((country) => {
            if (typeof country === 'string') {
              return { code: country.toUpperCase(), name: country }
            }
            if (typeof country === 'object' && country !== null) {
              const code = country.code || country.country_code || country.iso_code || country.cca2 || ''
              const name = country.name || country.country_name || country.country || ''
              
              // Only return if we have at least a name
              if (name) {
                return {
                  code: code || '',
                  name: name,
                  ...country // Preserve other properties
                }
              }
            }
            return null
          })
          .filter(Boolean) // Remove any null entries
        
        if (normalizedCountries.length > 0) {
          setCountries(normalizedCountries)
        } else {
          // If normalization failed, use fallback
          const fallback = getFallbackCountries()
          setCountries(fallback)
        }
      } catch (error) {
        // Use fallback on error
        const fallback = getFallbackCountries()
        setCountries(fallback)
      } finally {
        setLoading(false)
      }
    }

    loadCountries()
  }, [])

  // Helper function for fallback countries
  const getFallbackCountries = () => [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'BS', name: 'Bahamas' },
    { code: 'DO', name: 'Dominican Republic' },
    { code: 'MX', name: 'Mexico' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'FR', name: 'France' },
    { code: 'DE', name: 'Germany' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'PT', name: 'Portugal' },
    { code: 'GR', name: 'Greece' },
    { code: 'TR', name: 'Turkey' },
    { code: 'EG', name: 'Egypt' },
    { code: 'AE', name: 'United Arab Emirates' },
    { code: 'TH', name: 'Thailand' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'AU', name: 'Australia' },
    { code: 'NZ', name: 'New Zealand' },
    { code: 'BR', name: 'Brazil' },
    { code: 'AR', name: 'Argentina' },
    { code: 'ZA', name: 'South Africa' },
    { code: 'KE', name: 'Kenya' }
  ]

  const filteredCountries = countries.filter(country => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const name = country.name || country.country_name || country.country || ''
    const code = country.code || country.country_code || country.iso_code || ''
    return (
      name.toLowerCase().includes(query) ||
      code.toLowerCase().includes(query)
    )
  })

  const handleSelect = (country) => {
    if (multiple) {
      // For multiple selection, add/remove from array
      const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
      const countryCode = country.code || country.country_code || country.iso_code
      const isSelected = currentValues.some(c => {
        if (typeof c === 'string') return false
        const cCode = c.code || c.country_code || c.iso_code
        return cCode === countryCode
      })
      
      if (isSelected) {
        onChange(currentValues.filter(c => {
          if (typeof c === 'string') return true
          const cCode = c.code || c.country_code || c.iso_code
          return cCode !== countryCode
        }))
      } else {
        onChange([...currentValues, country])
      }
    } else {
      onChange(country)
      setShowDropdown(false)
    }
  }

  const getDisplayValue = () => {
    if (!value) return ''
    if (multiple) {
      const selected = Array.isArray(value) ? value : []
      return selected.map(c => {
        if (typeof c === 'string') return c
        if (typeof c === 'object' && c !== null) {
          return c.name || c.country_name || c.country || c.code || String(c)
        }
        return String(c)
      }).filter(Boolean).join(', ')
    }
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null) {
      return value.name || value.country_name || value.country || value.code || ''
    }
    return String(value)
  }

  const isSelected = (country) => {
    const countryCode = country.code || country.country_code || country.iso_code
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
      return currentValues.some(c => {
        if (typeof c === 'string') return false
        const cCode = c.code || c.country_code || c.iso_code
        return cCode === countryCode
      })
    }
    if (typeof value === 'string') return false
    const valueCode = value?.code || value?.country_code || value?.iso_code
    return valueCode === countryCode
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium mb-2 text-white/80">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <div className="relative">
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white cursor-pointer flex items-center justify-between"
        >
          <span className={getDisplayValue() ? '' : 'text-white/40'}>
            {getDisplayValue() || placeholder}
          </span>
          <span className="text-white/60">▼</span>
        </div>

        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className="w-full px-3 py-2 border rounded-lg text-slate-800"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {loading ? (
              <div className="p-4 text-center text-slate-600">Loading countries...</div>
            ) : filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-slate-600">No countries found</div>
            ) : (
              filteredCountries.map((country, index) => {
                const countryCode = country.code || country.country_code || country.iso_code || `country-${index}`
                const countryName = country.name || country.country_name || country.country || countryCode
                
                return (
                  <button
                    key={countryCode}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full text-left px-4 py-2 hover:bg-teal/10 text-slate-800 border-b border-slate-100 last:border-b-0 ${
                      isSelected(country) ? 'bg-teal/20 font-semibold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {multiple && (
                        <input
                          type="checkbox"
                          checked={isSelected(country)}
                          readOnly
                          className="w-4 h-4"
                        />
                      )}
                      <span>{countryName}</span>
                      {countryCode && countryCode !== countryName && (
                        <span className="text-xs text-slate-500">({countryCode})</span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
      {multiple && (
        <p className="text-xs text-white/50 mt-1">Select multiple countries</p>
      )}
    </div>
  )
}

