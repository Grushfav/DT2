import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// Generate stable session ID
function getSessionId(user) {
  if (user?.id) {
    // For logged-in users: use user ID for stable session
    return `user_${user.id}`
  }
  // For guests: use localStorage to persist session
  let sessionId = localStorage.getItem('chat_session_id')
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`
    localStorage.setItem('chat_session_id', sessionId)
  }
  return sessionId
}

export default function LiveChat() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const sessionIdRef = useRef(null)

  // Initialize session ID
  useEffect(() => {
    sessionIdRef.current = getSessionId(user)
  }, [user?.id])

  // Fetch messages
  const fetchMessages = async () => {
    if (!sessionIdRef.current) return
    
    try {
      const token = localStorage.getItem('auth_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_BASE}/api/chat/messages?sessionId=${sessionIdRef.current}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setMessages(data || [])
        scrollToBottom()
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  // Setup Socket.IO connection
  useEffect(() => {
    if (!sessionIdRef.current) return

    socketRef.current = io(API_BASE, { transports: ['websocket', 'polling'] })
    
    socketRef.current.on('new_message', (message) => {
      // Only add if it's for this session
      if (message.session_id === sessionIdRef.current) {
        setMessages(prev => {
          // Check for duplicates
          const exists = prev.some(m => m.id === message.id)
          if (exists) return prev
          return [...prev, message]
        })
        scrollToBottom()
      }
    })

    // Fetch initial messages
    fetchMessages()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [sessionIdRef.current])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || loading || !sessionIdRef.current) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    try {
      const token = localStorage.getItem('auth_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          senderName: user?.name || user?.email || 'Guest',
          senderEmail: user?.email || null,
          userId: user?.id || null,
          message: messageText
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Send message error:', error)
      alert('Failed to send message. Please try again.')
      setInputMessage(messageText) // Restore message on error
    } finally {
      setLoading(false)
    }
  }


  // Floating button (closed state)
  if (!isOpen) {
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-6 md:right-6 z-[110] bg-teal text-white w-16 h-16 md:w-14 md:h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-teal-dark active:bg-teal-dark transition-colors touch-manipulation ring-4 ring-teal/40 md:ring-2 md:ring-teal/20 border-2 border-white/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: [
            "0 20px 25px -5px rgba(15, 183, 164, 0.4), 0 10px 10px -5px rgba(15, 183, 164, 0.3), 0 0 0 4px rgba(15, 183, 164, 0.2)",
            "0 25px 30px -5px rgba(15, 183, 164, 0.5), 0 15px 15px -5px rgba(15, 183, 164, 0.4), 0 0 0 6px rgba(15, 183, 164, 0.3)",
            "0 20px 25px -5px rgba(15, 183, 164, 0.4), 0 10px 10px -5px rgba(15, 183, 164, 0.3), 0 0 0 4px rgba(15, 183, 164, 0.2)"
          ]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        aria-label="Open live chat"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          position: 'fixed'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="md:w-6 md:h-6 relative z-10">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {/* Pulse indicator */}
        <span className="absolute inset-0 rounded-full bg-teal animate-ping opacity-30"></span>
        {/* Glow effect */}
        <span className="absolute inset-0 rounded-full bg-teal blur-xl opacity-50"></span>
      </motion.button>
    )
  }

  // Chat modal (open state)
  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[110] w-[calc(100vw-2rem)] md:w-96 h-[calc(100vh-8rem)] md:h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-xl shadow-2xl flex flex-col"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
      >
        {/* Header */}
        <div className="bg-teal text-white p-4 rounded-t-xl flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Live Chat Support</h3>
            <p className="text-xs text-white/80">We're here to help!</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-white/80 text-xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUserMessage = !msg.is_admin
              
              return (
                <div
                  key={msg.id || `${msg.session_id}-${msg.created_at}-${msg.message}`}
                  className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      isUserMessage
                        ? 'bg-teal text-white'
                        : 'bg-white text-slate-800 border border-slate-200'
                    }`}
                  >
                    {!isUserMessage && (
                      <div className="text-xs font-semibold mb-1 text-teal">
                        {msg.sender_name || 'Support'}
                      </div>
                    )}
                    <div className="text-sm">{msg.message}</div>
                    <div className={`text-xs mt-1 ${isUserMessage ? 'text-white/70' : 'text-slate-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-slate-200 bg-white rounded-b-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-slate-300 rounded-lg px-3 md:px-4 py-2.5 md:py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-teal min-h-[44px]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="bg-teal text-white px-4 md:px-6 py-2.5 md:py-2 rounded-lg font-semibold hover:bg-teal-dark active:bg-teal-dark disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[60px] touch-manipulation"
            >
              Send
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  )
}
