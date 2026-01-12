import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      setNotifications([])
      return
    }

    // Fetch unread messages count
    const fetchUnreadCount = async () => {
      try {
        const sessionId = localStorage.getItem('chat_session_id')
        if (!sessionId) return

        const response = await fetch(`${API_BASE}/api/chat/messages?sessionId=${sessionId}`)
        if (response.ok) {
          const messages = await response.json()
          // Count unread admin messages (messages that are from admin and not read)
          const unread = messages.filter(
            msg => msg.is_admin && !msg.read_at && msg.created_at > (localStorage.getItem('last_read_timestamp') || '0')
          ).length
          setUnreadCount(unread)
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [user])

  const markAsRead = async () => {
    const sessionId = localStorage.getItem('chat_session_id')
    if (sessionId) {
      try {
        await fetch(`${API_BASE}/api/chat/mark-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
    localStorage.setItem('last_read_timestamp', new Date().toISOString())
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, markAsRead, notifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

