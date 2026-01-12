const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('./db')

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

async function hashPassword(password) {
  return await bcrypt.hash(password, 10)
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

async function authenticateUser(email, password) {
  const users = await db.all('users')
  const user = users.find(u => u.email === email)
  
  if (!user) {
    return null
  }
  
  const isValid = await comparePassword(password, user.password_hash)
  if (!isValid) {
    return null
  }
  
  // Remove password hash from response
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

async function requireAuth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' })
  }
  
  req.user = decoded
  next()
}

async function requireAdminAuth(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  
  req.user = decoded
  next()
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticateUser,
  requireAuth,
  requireAdminAuth
}

