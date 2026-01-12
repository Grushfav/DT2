import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

export default function LoginModal({ open, onClose }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = isLogin
      ? await login(email, password)
      : await register(email, password, firstName, lastName, phone, gender, ageRange)

    if (result.success) {
      resetForm()
      
      // Check if user is admin before closing modal
      const userIsAdmin = result.user && result.user.role === 'admin'
      
      console.log('Login result:', { 
        success: result.success, 
        user: result.user, 
        userRole: result.user?.role,
        userIsAdmin, 
        isLogin 
      })
      
      // If admin user logged in, redirect to admin dashboard immediately
      if (isLogin && userIsAdmin) {
        console.log('Admin detected - redirecting to dashboard...')
        onClose()
        // Use setTimeout to allow modal to close first
        setTimeout(() => {
          window.location.href = '/admin.html'
        }, 300)
        setLoading(false)
        return
      }
      
      onClose()
    } else {
      setError(result.error || 'Something went wrong')
    }

    setLoading(false)
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setPhone('')
    setGender('')
    setAgeRange('')
    setError('')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => { resetForm(); onClose(); }} />
          
          <motion.div
            className="relative w-full max-w-md bg-white rounded-xl p-6 z-50 mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <button
              className="absolute right-4 top-4 text-slate-600 hover:text-slate-800"
              onClick={() => { resetForm(); onClose(); }}
            >
              ✕
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                {isLogin ? 'Login' : 'Create Account'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {isLogin
                  ? 'Welcome back to BT2 Horizon'
                  : 'Join BT2 Horizon to manage your travel'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Gender (Optional)
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Age Range (Optional)
                    </label>
                    <select
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      <option value="">Select age range</option>
                      <option value="12-18">12-18</option>
                      <option value="19-29">19-29</option>
                      <option value="30-39">30-39</option>
                      <option value="40-49">40-49</option>
                      <option value="50-59">50-59</option>
                      <option value="60-69">60-69</option>
                      <option value="70-79">70-79</option>
                    </select>
                  </div>
                </>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="your@email.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
                  placeholder="••••••••"
                  minLength={6}
                />
                {!isLogin && (
                  <p className="text-xs text-slate-500 mt-1">
                    Minimum 6 characters
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal hover:bg-teal-dark text-white font-semibold px-4 py-3 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  resetForm()
                }}
                className="text-sm text-teal hover:underline"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Login'}
              </button>
            </div>

            {isLogin && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <strong>Default Admin:</strong> admin@bt2.com / admin123
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

