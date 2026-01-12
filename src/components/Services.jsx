import React from 'react'

const services = [
  { icon: '✈️', title: 'Flights', desc: 'Airline partnerships & flexible fares.', action: 'booking' },
  { icon: '🛂', title: 'Visa & Passport', desc: 'Fast, secure document help.', action: 'visa' },
  { icon: '🏨', title: 'Hotels', desc: 'Hilton, Hyatt, Marriott & more.', action: 'booking' },
  { icon: '👥', title: 'Group Travel', desc: 'Events, conferences & corporate packages.', action: 'booking' }
]

export default function Services({ 
  onPassportClick = () => {}, 
  onBookingClick = () => {},
  onVisaClick = () => {}
}) {
  const handleClick = (action) => {
    if (action === 'passport') {
      onPassportClick()
    } else if (action === 'visa') {
      onVisaClick()
    } else {
      onBookingClick()
    }
  }

  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto px-6">
        <h3 className="text-2xl font-semibold mb-6">Visa & Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {services.map(s => (
            <div key={s.title} className="p-4 bg-white rounded-lg shadow flex flex-col gap-3 items-start hover:shadow-lg transition-shadow">
              <div className="text-2xl">{s.icon}</div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-slate-600">{s.desc}</div>
              <button 
                onClick={() => handleClick(s.action)}
                className="mt-auto text-teal underline hover:text-teal-dark"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
