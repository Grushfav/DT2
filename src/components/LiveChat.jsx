import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import { useNotifications } from '../contexts/NotificationContext'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

// Quick reply templates
const QUICK_REPLIES = [
  "Hello! How can I help you today?",
  "Thanks for reaching out!",
  "I'll get back to you shortly.",
  "Is there anything else I can help with?",
  "Have a great day!",
  "Let me check that for you.",
  "I understand your concern.",
  "Thank you for your patience."
]

// Generate or get session ID from localStorage
function getSessionId() {
  let sessionId = localStorage.getItem('chat_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    localStorage.setItem('chat_session_id', sessionId)
  }
  return sessionId
}

export default function LiveChat() {
  const { user, isAdmin } = useAuth()
  // Check if we're on the admin dashboard page
  const isAdminDashboard = window.location.pathname.includes('admin.html') || isAdmin
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [senderName, setSenderName] = useState('')
  const [senderEmail, setSenderEmail] = useState('')
  const [isNameSet, setIsNameSet] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeConversations, setActiveConversations] = useState([])
  const messagesEndRef = useRef(null)
  const [sessionId, setSessionId] = useState(getSessionId())
  const seenMessagesRef = useRef(new Set())
  const { markAsRead, unreadCount } = useNotifications()

  // Auto-set name and email if user is logged in
  useEffect(() => {
    if (user) {
      setSenderName(user.name || user.email || '')
      setSenderEmail(user.email || '')
      setIsNameSet(true)
      let currentSessionId = localStorage.getItem('chat_session_id')
      if (!currentSessionId || !currentSessionId.startsWith(`user_${user.id}`)) {
        currentSessionId = `user_${user.id}`
        localStorage.setItem('chat_session_id', currentSessionId)
      }
      setSessionId(currentSessionId)
      setTimeout(() => fetchMessages(), 100)
    } else {
      setSenderName('')
      setSenderEmail('')
      setIsNameSet(false)
      const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`
      localStorage.setItem('chat_session_id', newSessionId)
      setSessionId(newSessionId)
      setTimeout(() => fetchMessages(), 100)
    }
  }, [user?.id])

  useEffect(() => {
    if (sessionId) {
      fetchMessages()
      fetchActiveConversations()
    }

    const socket = io(API_BASE)
    
    socket.on('new_message', (message) => {
      const messageKey = message.id || `${message.session_id || 'unknown'}-${message.created_at || Date.now()}-${message.message}`
      if (seenMessagesRef.current.has(messageKey)) return
      seenMessagesRef.current.add(messageKey)
      setMessages(prev => [...prev, message])
      scrollToBottom()
      if (message.is_admin && isOpen) {
        markAsRead()
      }
      // Refresh conversations when new message arrives
      fetchActiveConversations()
    })

    return () => {
      socket.disconnect()
    }
  }, [sessionId, user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && sessionId && isNameSet) {
      const timer = setTimeout(() => {
        fetchMessages()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const currentSessionId = sessionId || getSessionId()
      const token = localStorage.getItem('auth_token')
      const headers = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const url = user?.id 
        ? `${API_BASE}/api/chat/messages?sessionId=${currentSessionId}&userId=${user.id}`
        : `${API_BASE}/api/chat/messages?sessionId=${currentSessionId}`
      
      const response = await fetch(url, { headers })
      if (response.ok) {
        const data = await response.json()
        const uniqueMessages = []
        const newSeen = new Set()
        data.forEach(msg => {
          const key = msg.id || `${msg.session_id || 'unknown'}-${msg.created_at || ''}-${msg.message}`
          if (!newSeen.has(key)) {
            newSeen.add(key)
            uniqueMessages.push(msg)
          }
        })
        uniqueMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        seenMessagesRef.current = newSeen
        setMessages(uniqueMessages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const fetchActiveConversations = async () => {
    try {
      // Fetch recent chat sessions (simplified - in production, you'd have an endpoint for this)
      // For now, we'll just show the current session
      const token = localStorage.getItem('auth_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${API_BASE}/api/chat/messages?sessionId=${sessionId}`, { headers })
      if (response.ok) {
        const data = await response.json()
        // Group by session or show current session
        setActiveConversations([{
          sessionId,
          lastMessage: data[data.length - 1],
          unread: unreadCount,
          name: user?.name || senderName || 'Guest'
        }])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || loading) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          senderName: user?.name || senderName || 'Guest',
          senderEmail: user?.email || senderEmail || null,
          userId: user?.id || null,
          message: messageText
        })
      })

      if (response.ok) {
        const data = await response.json()
        const message = data.message
        const messageKey = message.id || `${message.session_id || 'unknown'}-${message.created_at || Date.now()}-${message.message}`
        if (!seenMessagesRef.current.has(messageKey)) {
          seenMessagesRef.current.add(messageKey)
          setMessages(prev => [...prev, message])
        }
      } else {
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Send message error:', error)
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickReply = (reply) => {
    setInputMessage(reply)
  }

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (senderName.trim()) {
      setIsNameSet(true)
    }
  }

  const handleOpenChat = () => {
    setIsOpen(true)
    setIsCollapsed(false)
    markAsRead()
    fetchMessages()
  }

  // For regular users, show the old floating button/modal interface
  if (!isAdminDashboard) {
    // Regular user interface - floating button
    if (!isOpen) {
      return (
        <motion.button
          onClick={handleOpenChat}
          className="fixed bottom-6 right-6 z-[100] bg-teal text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-teal-dark transition-colors"
          style={{ position: 'fixed' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Open live chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>
      )
    }

    // Regular user interface - modal
    return (
      <AnimatePresence>
        <motion.div
          className="fixed bottom-6 right-6 z-[100] w-96 h-[600px] max-h-[calc(100vh-3rem)] bg-white rounded-xl shadow-2xl flex flex-col"
          style={{ position: 'fixed' }}
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
              className="text-white hover:text-white/80"
            >
              ✕
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {!isNameSet ? (
              <div className="bg-white p-4 rounded-lg shadow">
                <h4 className="font-semibold mb-2">Welcome! 👋</h4>
                {user ? (
                  <p className="text-sm text-slate-600 mb-4">You're logged in as <strong>{user.name || user.email}</strong>. Start chatting below!</p>
                ) : (
                  <p className="text-sm text-slate-600 mb-4">Please introduce yourself to start chatting.</p>
                )}
                <form onSubmit={handleNameSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your name"
                    required
                    disabled={!!user}
                    className="w-full border px-3 py-2 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="Email (optional)"
                    disabled={!!user}
                    className="w-full border px-3 py-2 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {!user && (
                    <button
                      type="submit"
                      className="w-full bg-teal text-white px-4 py-2 rounded text-sm font-semibold"
                    >
                      Start Chatting
                    </button>
                  )}
                </form>
                {user && (
                  <button
                    onClick={() => setIsNameSet(true)}
                    className="w-full bg-teal text-white px-4 py-2 rounded text-sm font-semibold mt-3"
                  >
                    Start Chatting
                  </button>
                )}
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 text-sm py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                {messages.map((msg) => {
                  // User messages (sent by user) go on RIGHT, admin messages (from support) go on LEFT
                  const isUserMessage = !msg.is_admin
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.is_admin
                            ? 'bg-white text-slate-800 shadow'
                            : 'bg-teal text-white'
                        }`}
                      >
                        {msg.is_admin && (
                          <div className="text-xs font-semibold mb-1 text-teal">
                            {msg.sender_name}
                          </div>
                        )}
                        {!msg.is_admin && (
                          <div className="text-xs font-semibold mb-1 text-white/80">
                            {msg.sender_name || 'You'}
                          </div>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <div className={`text-xs mt-1 ${msg.is_admin ? 'text-slate-500' : 'text-white/70'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input area */}
          {isNameSet && (
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white rounded-b-xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border px-3 py-2 rounded text-sm"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || loading}
                  className="bg-teal text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Admin dashboard - sidebar interface
  // Collapsed state - just a narrow sidebar
  if (isCollapsed) {
    return (
      <motion.div
        className="fixed right-0 top-0 h-full w-16 bg-white/10 backdrop-blur-md border-l border-white/10 z-[100] flex flex-col items-center py-6"
        initial={{ x: 0 }}
        animate={{ x: 0 }}
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="mb-6 p-2 bg-teal/20 hover:bg-teal/30 rounded-lg transition-colors"
          title="Expand Live Chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        {unreadCount > 0 && (
          <div className="relative mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
        <div className="text-xs text-white/60 writing-vertical-rl mt-auto mb-4">
          Live Chat
        </div>
      </motion.div>
    )
  }

  // Expanded sidebar
  return (
    <motion.div
      className="fixed right-0 top-0 h-full w-96 bg-white/10 backdrop-blur-md border-l border-white/10 z-[100] flex flex-col shadow-2xl"
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Header */}
      <div className="bg-teal/20 border-b border-white/10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal/30 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Live Chat</h3>
            <p className="text-xs text-white/70">Support & Assistance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <div className="relative">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-white/70 hover:text-white transition-colors p-1"
            title="Collapse"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs: Conversations | Chat */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setIsOpen(false)}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            !isOpen ? 'bg-teal/20 text-teal border-b-2 border-teal' : 'text-white/70 hover:text-white'
          }`}
        >
          Conversations ({activeConversations.length})
        </button>
        <button
          onClick={handleOpenChat}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative ${
            isOpen ? 'bg-teal/20 text-teal border-b-2 border-teal' : 'text-white/70 hover:text-white'
          }`}
        >
          Chat
          {unreadCount > 0 && (
            <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!isOpen ? (
          // Conversations List
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-xs text-white/60 mb-3 uppercase tracking-wider">Active Conversations</div>
            {activeConversations.length === 0 ? (
              <div className="text-center text-white/50 text-sm py-8">
                <p>No active conversations</p>
                <button
                  onClick={handleOpenChat}
                  className="mt-4 text-teal hover:text-teal-dark text-sm"
                >
                  Start a new chat
                </button>
              </div>
            ) : (
              activeConversations.map((conv) => (
                <div
                  key={conv.sessionId}
                  onClick={handleOpenChat}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors border border-white/5"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{conv.name}</span>
                    {conv.unread > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-xs text-white/60 truncate">{conv.lastMessage.message}</p>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          // Chat View
          <>
            {!isNameSet ? (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h4 className="font-semibold text-white mb-2">Welcome! 👋</h4>
                  {user ? (
                    <p className="text-sm text-white/70 mb-4">You're logged in as <strong>{user.name || user.email}</strong>. Start chatting below!</p>
                  ) : (
                    <p className="text-sm text-white/70 mb-4">Please introduce yourself to start chatting.</p>
                  )}
                  <form onSubmit={handleNameSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your name"
                      required
                      disabled={!!user}
                      className="w-full border border-white/20 bg-white/5 text-white px-3 py-2 rounded text-sm placeholder-white/40 disabled:bg-white/10 disabled:cursor-not-allowed"
                    />
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="Email (optional)"
                      disabled={!!user}
                      className="w-full border border-white/20 bg-white/5 text-white px-3 py-2 rounded text-sm placeholder-white/40 disabled:bg-white/10 disabled:cursor-not-allowed"
                    />
                    {!user && (
                      <button
                        type="submit"
                        className="w-full bg-teal text-white px-4 py-2 rounded text-sm font-semibold hover:bg-teal-dark transition-colors"
                      >
                        Start Chatting
                      </button>
                    )}
                  </form>
                  {user && (
                    <button
                      onClick={() => setIsNameSet(true)}
                      className="w-full bg-teal text-white px-4 py-2 rounded text-sm font-semibold mt-3 hover:bg-teal-dark transition-colors"
                    >
                      Start Chatting
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white/5">
                  {messages.length === 0 && (
                    <div className="text-center text-white/50 text-sm py-8">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    // User messages (sent by user) go on RIGHT, admin messages (from support) go on LEFT
                    const isUserMessage = !msg.is_admin
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.is_admin
                              ? 'bg-white/10 text-white border border-white/20'
                              : 'bg-teal text-white'
                          }`}
                        >
                          {msg.is_admin && (
                            <div className="text-xs font-semibold mb-1 text-teal">
                              {msg.sender_name}
                            </div>
                          )}
                          {!msg.is_admin && (
                            <div className="text-xs font-semibold mb-1 text-white/80">
                              {msg.sender_name || 'You'}
                            </div>
                          )}
                          <p className="text-sm">{msg.message}</p>
                          <div className={`text-xs mt-1 ${msg.is_admin ? 'text-white/60' : 'text-white/70'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                  <div className="text-xs text-white/60 mb-2">Quick Replies:</div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_REPLIES.slice(0, 4).map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(reply)}
                        className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                      >
                        {reply.substring(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 border border-white/20 bg-white/5 text-white px-3 py-2 rounded text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || loading}
                      className="bg-teal text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-dark transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
