import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CountrySelect from '../CountrySelect'
import * as airportsApi from '../../utils/airportsApi'

// Mock the airports API
vi.mock('../../utils/airportsApi', () => ({
  fetchCountries: vi.fn()
}))

describe('CountrySelect', () => {
  const mockCountries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'BS', name: 'Bahamas' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    airportsApi.fetchCountries.mockResolvedValue(mockCountries)
  })

  it('should render with label', async () => {
    render(<CountrySelect label="Select Country" />)
    
    await waitFor(() => {
      expect(screen.getByText('Select Country')).toBeInTheDocument()
    })
  })

  it('should load and display countries', async () => {
    render(<CountrySelect />)
    
    // Click to open dropdown
    const dropdown = screen.getByText('Select country...')
    fireEvent.click(dropdown)
    
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument()
      expect(screen.getByText('Canada')).toBeInTheDocument()
      expect(screen.getByText('Jamaica')).toBeInTheDocument()
    })
  })

  it('should filter countries by search query', async () => {
    render(<CountrySelect />)
    
    // Open dropdown
    const dropdown = screen.getByText('Select country...')
    fireEvent.click(dropdown)
    
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument()
    })
    
    // Type in search
    const searchInput = screen.getByPlaceholderText('Search countries...')
    fireEvent.change(searchInput, { target: { value: 'jam' } })
    
    await waitFor(() => {
      expect(screen.getByText('Jamaica')).toBeInTheDocument()
      expect(screen.queryByText('United States')).not.toBeInTheDocument()
    })
  })

  it('should handle single selection', async () => {
    const onChange = vi.fn()
    render(<CountrySelect onChange={onChange} />)
    
    // Open dropdown
    const dropdown = screen.getByText('Select country...')
    fireEvent.click(dropdown)
    
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument()
    })
    
    // Select a country
    const usaButton = screen.getByText('United States').closest('button')
    fireEvent.click(usaButton)
    
    expect(onChange).toHaveBeenCalledWith(mockCountries[0])
  })

  it('should handle multiple selection', async () => {
    const onChange = vi.fn()
    render(<CountrySelect onChange={onChange} multiple={true} />)
    
    // Open dropdown
    const dropdown = screen.getByText('Select country...')
    fireEvent.click(dropdown)
    
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument()
    })
    
    // Select first country
    const usaButton = screen.getByText('United States').closest('button')
    fireEvent.click(usaButton)
    
    expect(onChange).toHaveBeenCalledWith([mockCountries[0]])
    
    // Select second country
    const canadaButton = screen.getByText('Canada').closest('button')
    fireEvent.click(canadaButton)
    
    expect(onChange).toHaveBeenCalledWith([mockCountries[0], mockCountries[1]])
  })

  it('should display selected countries correctly', async () => {
    render(<CountrySelect value={mockCountries[0]} />)
    
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument()
    })
  })

  it('should display multiple selected countries', async () => {
    render(<CountrySelect value={[mockCountries[0], mockCountries[1]]} multiple={true} />)
    
    await waitFor(() => {
      const display = screen.getByText('United States, Canada')
      expect(display).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    airportsApi.fetchCountries.mockRejectedValue(new Error('API Error'))
    
    render(<CountrySelect />)
    
    // Open dropdown
    const dropdown = screen.getByText('Select country...')
    fireEvent.click(dropdown)
    
    await waitFor(() => {
      expect(screen.getByText('No countries found')).toBeInTheDocument()
    })
  })

  it('should handle different country object formats', async () => {
    const alternativeFormat = [
      { country_code: 'US', country_name: 'United States' },
      { iso_code: 'CA', country: 'Canada' }
    ]
    
    airportsApi.fetchCountries.mockResolvedValue(alternativeFormat)
    
    render(<CountrySelect />)
    
    // Open dropdown
    const dropdown = screen.getByText('Select country...')
    fireEvent.click(dropdown)
    
    await waitFor(() => {
      expect(screen.getByText('United States')).toBeInTheDocument()
      expect(screen.getByText('Canada')).toBeInTheDocument()
    })
  })
})

