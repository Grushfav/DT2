import React from 'react'

export default function StickyCTA({ onClick = () => {} }) {
  return (
    <div className="fixed left-6 bottom-6 z-40 md:left-auto md:right-6">
      <button onClick={onClick} className="bg-teal text-white px-5 py-3 rounded-full shadow-lg hover:bg-teal-dark transition-colors">Start Your Booking</button>
    </div>
  )
}
