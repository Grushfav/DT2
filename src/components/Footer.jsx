import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-navy text-white py-10 mt-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="font-semibold text-lg">BT2 Horizon</div>
          <div className="mt-2 text-sm">Proudly Jamaican. Globally Connected.</div>
        </div>
        <div>
          <div className="font-semibold">Quick Links</div>
          <div className="mt-2 text-sm flex flex-col gap-1">
            <a href="#" className="text-white/80 hover:text-teal transition-colors">Packages</a>
            <a href="#" className="text-white/80 hover:text-teal transition-colors">Services</a>
            <a href="#" className="text-white/80 hover:text-teal transition-colors">Contact</a>
            <button
              onClick={() => {
                const event = new CustomEvent('openTestimonialModal')
                window.dispatchEvent(event)
              }}
              className="text-left text-white/80 hover:text-teal transition-colors"
            >
              Share Your Experience
            </button>
          </div>
        </div>
        <div>
          <div className="font-semibold">Contact</div>
          <div className="mt-2 text-sm">Phone: <a className="underline" href="tel:+1234567890">Contact Us</a></div>
          <div className="mt-4 text-xs text-white/70">© {new Date().getFullYear()} BT2. Privacy Policy</div>
        </div>
      </div>
    </footer>
  )
}
