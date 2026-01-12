import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function Nav({ onPrimaryClick = () => {}, onLoginClick = () => {}, onSavedFormsClick = () => {}, onMyRequestsClick = () => {}, onBankDetailsClick = () => {} }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const { unreadCount } = useNotifications()

  return (
    <>
      {/* Desktop left sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-72 bg-white/5 backdrop-blur-md border-r border-white/5 z-50 p-6 text-white">
        <div className="flex items-center gap-3 mb-6">
        
          <div>
            <div className="font-serif text-xl leading-none"><img src="/images/bt2_logo.png" alt="BT2 Horizon" className="w-12 h-12" /></div>
            <div className="text-sm text-white/80">BT<sup>2</sup></div>
          </div>
        </div>

        <nav className="flex-1">
          <ul className="flex flex-col gap-3 text-sm">
            <li><a href="#" className="block px-3 py-2 rounded hover:bg-white/5">Home</a></li>
            <li><a href="#" className="block px-3 py-2 rounded hover:bg-white/5">Packages</a></li>
            <li><a href="#" className="block px-3 py-2 rounded hover:bg-white/5">Deals</a></li>
            <li><a href="#" className="block px-3 py-2 rounded hover:bg-white/5">Services</a></li>
            <li><a href="#" className="block px-3 py-2 rounded hover:bg-white/5">Testimonials</a></li>
            {user && (
              <>
                <li className="mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={onSavedFormsClick}
                    className="w-full text-left block px-3 py-2 rounded hover:bg-white/5 transition-colors"
                  >
                    📋 My Saved Forms
                  </button>
                </li>
                <li>
                  <button
                    onClick={onMyRequestsClick}
                    className="w-full text-left block px-3 py-2 rounded hover:bg-white/5 transition-colors"
                  >
                    📝 My Requests
                  </button>
                </li>
                <li>
                  <button
                    onClick={onBankDetailsClick}
                    className="w-full text-left block px-3 py-2 rounded hover:bg-white/5 transition-colors"
                  >
                    🏦 Bank Details
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>

        <div className="mt-4">
          {user ? (
            <>
              <div className="mb-3 p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-sm font-semibold">{user.name || user.email}</div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          // Store frontend URL so logout can redirect back
                          localStorage.setItem('frontend_url', window.location.origin)
                          window.location.href = `${API_BASE}/admin.html`
                        }}
                        className="text-xs px-2 py-1 rounded bg-gold/20 hover:bg-gold/30 text-gold font-semibold transition-colors"
                        title="Go to Admin Dashboard"
                      >
                        Dashboard
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="text-lg">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                {isAdmin && <div className="text-xs text-gold mt-1">Admin</div>}
              </div>
              <button
                onClick={logout}
                className="w-full text-sm px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-3 rounded-lg transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </aside>

      {/* Mobile top bar with hamburger */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-transparent p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <div className="w-10 h-10 rounded-full bg-gold/90 flex items-center justify-center text-navy font-bold">BT</div>
          <div className="font-semibold">BT2 Horizon</div>
        </div>
        <div>
          <button onClick={() => setMobileOpen(true)} className="p-2 bg-white/10 rounded">☰</button>
        </div>
      </header>

      {/* Mobile overlay nav */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-60 bg-navy text-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-full bg-gold/90 flex items-center justify-center text-navy font-bold">BT</div><div className="font-semibold">BT2</div></div>
            <button onClick={() => setMobileOpen(false)} className="text-white/80">Close</button>
          </div>

          <nav>
            <ul className="flex flex-col gap-4 text-lg">
              <li><a onClick={() => setMobileOpen(false)} href="#">Home</a></li>
              <li><a onClick={() => setMobileOpen(false)} href="#">Packages</a></li>
              <li><a onClick={() => setMobileOpen(false)} href="#">Deals</a></li>
              <li><a onClick={() => setMobileOpen(false)} href="#">Services</a></li>
              <li><a onClick={() => setMobileOpen(false)} href="#">Testimonials</a></li>
              {user && (
                <>
                  <li className="mt-4 pt-4 border-t border-white/20">
                    <button
                      onClick={() => { setMobileOpen(false); onSavedFormsClick() }}
                      className="w-full text-left"
                    >
                      📋 My Saved Forms
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { setMobileOpen(false); onMyRequestsClick() }}
                      className="w-full text-left"
                    >
                      📝 My Requests
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => { setMobileOpen(false); onBankDetailsClick() }}
                      className="w-full text-left"
                    >
                      🏦 Bank Details
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <div className="mt-8">
            {user ? (
              <>
                <div className="mb-3 p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="text-sm font-semibold">{user.name || user.email}</div>
                      {isAdmin && (
                        <button
                          onClick={() => { 
                            setMobileOpen(false)
                            // Store frontend URL so logout can redirect back
                            localStorage.setItem('frontend_url', window.location.origin)
                            window.location.href = `${API_BASE}/admin.html`
                          }}
                          className="text-xs px-2 py-1 rounded bg-gold/20 hover:bg-gold/30 text-gold font-semibold transition-colors"
                          title="Go to Admin Dashboard"
                        >
                          Dashboard
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="text-lg">🔔</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdmin && <div className="text-xs text-gold mt-1">Admin</div>}
                </div>
                <button
                  onClick={() => { setMobileOpen(false); logout() }}
                  className="w-full text-sm px-3 py-2 rounded bg-white/10 text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); onLoginClick() }}
                className="w-full bg-white/10 text-white px-4 py-3 rounded"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
