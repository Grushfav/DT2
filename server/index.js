require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const multer = require('multer')
const db = require('./db')
const auth = require('./auth')
const storage = require('./storage')
const emailModule = require('./email')
const http = require('http')
const { Server } = require('socket.io')
const path = require('path')
const fs = require('fs')

// Debug: Check if email module loaded correctly
if (!emailModule || !emailModule.sendLeadNotification) {
  console.error('Email module not loaded correctly:', emailModule)
}

const app = express()
const PORT = process.env.PORT || 4000
const ADMIN_KEY = process.env.ADMIN_KEY || 'secret-admin-key'

app.use(cors())
app.use(bodyParser.json())

// Legacy admin key check (for backward compatibility)
function requireAdmin(req, res, next) {
  const key = req.header('x-admin-key')
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  // Check JWT token first (preferred)
  if (token) {
    const decoded = auth.verifyToken(token)
    if (decoded && decoded.role === 'admin') {
      req.user = decoded
      return next()
    }
  }
  
  // Fallback to admin key
  if (key && key === ADMIN_KEY) {
    // Set a minimal user object for admin key authentication
    req.user = { id: null, role: 'admin', isAdmin: true }
    return next()
  }
  
  return res.status(401).json({ error: 'Unauthorized' })
}

// Posts endpoints
// posts endpoints (JSON DB)
app.get('/api/posts', async (req, res) => {
  const rows = await db.all('posts')
  res.json(rows.sort((a,b)=> (b.id||0)-(a.id||0)))
})

app.post('/api/posts', requireAdmin, async (req, res) => {
  const { title, slug, content } = req.body
  const row = await db.insert('posts', { title, slug, content })
  res.json({ id: row.id })
})

app.put('/api/posts/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  const { title, slug, content } = req.body
  await db.update('posts', id, { title, slug, content })
  res.json({ ok: true })
})

app.delete('/api/posts/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  await db.remove('posts', id)
  res.json({ ok: true })
})

// Packages endpoints
app.get('/api/packages', async (req, res) => {
  try {
    const rows = await db.all('packages')
    // Parse images JSON and ensure backward compatibility
    const packages = rows.map(pkg => {
      let images = []
      if (pkg.images) {
        try {
          images = typeof pkg.images === 'string' ? JSON.parse(pkg.images) : pkg.images
        } catch (e) {
          images = []
        }
      }
      // If no images array but has legacy img field, use that
      if (images.length === 0 && pkg.img) {
        images = [pkg.img]
      }
      return {
        ...pkg,
        images: images,
        img: images[0] || pkg.img || null // Ensure img field is set
      }
    })
    res.json(packages.sort((a,b)=> (a.id||0)-(b.id||0)))
  } catch (error) {
    console.error('Get packages error:', error)
    res.status(500).json({ error: 'Failed to fetch packages' })
  }
})

app.post('/api/packages', requireAdmin, async (req, res) => {
  try {
    const { code, title, nights, price, img, images, trip_details } = req.body
    
    // Validate images array (minimum 1 image, recommended 7+)
    let imageArray = []
    if (Array.isArray(images) && images.length > 0) {
      if (images.length < 1) {
        return res.status(400).json({ error: 'At least 1 image is required' })
      }
      imageArray = images
    } else if (img) {
      // Legacy single image support
      imageArray = [img]
    } else {
      return res.status(400).json({ error: 'At least 1 image is required' })
    }
    
    const row = await db.insert('packages', { 
      code, 
      title, 
      nights, 
      price, 
      trip_details: trip_details || null,
      img: imageArray[0] || null, // Legacy field
      images: imageArray // Send as array - Supabase will handle JSONB conversion
    })
    res.json({ id: row.id })
  } catch (error) {
    console.error('Create package error:', error)
    res.status(500).json({ error: 'Failed to create package' })
  }
})

app.put('/api/packages/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { code, title, nights, price, img, images, trip_details } = req.body
    
    // Handle images - always update if provided
    let imageArray = []
    if (Array.isArray(images)) {
      // If images array is provided, use it (even if empty, we'll validate)
      imageArray = images.filter(img => img && img.trim() !== '') // Remove empty strings
    } else if (img && img.trim() !== '') {
      // Fallback to single img field
      imageArray = [img]
    }
    
    // Validate: require at least 1 image
    if (imageArray.length < 1) {
      return res.status(400).json({ error: 'At least 1 image is required' })
    }
    
    const updateData = { 
      code, 
      title, 
      nights, 
      price,
      trip_details: trip_details !== undefined ? trip_details : null,
      img: imageArray[0], // Legacy field - always set first image
      images: imageArray // Send as array - Supabase will handle JSONB conversion
    }
    
    await db.update('packages', id, updateData)
    res.json({ ok: true })
  } catch (error) {
    console.error('Update package error:', error)
    res.status(500).json({ error: 'Failed to update package' })
  }
})

app.delete('/api/packages/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  await db.remove('packages', id)
  res.json({ ok: true })
})

// Crazy Deals endpoints
app.get('/api/crazy-deals', async (req, res) => {
  try {
    const rows = await db.all('crazy_deals')
    // Filter active deals that haven't expired
    const now = new Date()
    const active = rows
      .filter(d => d.active && new Date(d.end_date) > now)
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
    res.json(active)
  } catch (error) {
    console.error('Get deals error:', error)
    res.status(500).json({ error: 'Failed to fetch deals' })
  }
})

app.get('/api/crazy-deals/all', requireAdmin, async (req, res) => {
  try {
    const rows = await db.all('crazy_deals')
    res.json(rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
  } catch (error) {
    console.error('Get all deals error:', error)
    res.status(500).json({ error: 'Failed to fetch deals' })
  }
})

app.post('/api/crazy-deals', requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, discount_percent, end_date, active } = req.body
    const row = await db.insert('crazy_deals', {
      title,
      subtitle: subtitle || null,
      discount_percent: discount_percent || null,
      end_date,
      active: active !== undefined ? active : true
    })
    res.json({ id: row.id, ...row })
  } catch (error) {
    console.error('Create deal error:', error)
    res.status(500).json({ error: 'Failed to create deal' })
  }
})

app.put('/api/crazy-deals/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { title, subtitle, discount_percent, end_date, active } = req.body
    await db.update('crazy_deals', id, {
      title,
      subtitle,
      discount_percent,
      end_date,
      active
    })
    res.json({ ok: true })
  } catch (error) {
    console.error('Update deal error:', error)
    res.status(500).json({ error: 'Failed to update deal' })
  }
})

app.delete('/api/crazy-deals/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    await db.remove('crazy_deals', id)
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete deal error:', error)
    res.status(500).json({ error: 'Failed to delete deal' })
  }
})

// Affordable Destinations endpoints
app.get('/api/affordable-destinations', async (req, res) => {
  try {
    const rows = await db.all('affordable_destinations')
    const active = rows
      .filter(d => d.active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
    res.json(active)
  } catch (error) {
    console.error('Get destinations error:', error)
    res.status(500).json({ error: 'Failed to fetch destinations' })
  }
})

app.get('/api/affordable-destinations/all', requireAdmin, async (req, res) => {
  try {
    const rows = await db.all('affordable_destinations')
    res.json(rows.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)))
  } catch (error) {
    console.error('Get all destinations error:', error)
    res.status(500).json({ error: 'Failed to fetch destinations' })
  }
})

app.post('/api/affordable-destinations', requireAdmin, async (req, res) => {
  try {
    const { country, city, price, display_order, active } = req.body
    const row = await db.insert('affordable_destinations', {
      country,
      city,
      price,
      display_order: display_order || 0,
      active: active !== undefined ? active : true
    })
    res.json({ id: row.id, ...row })
  } catch (error) {
    console.error('Create destination error:', error)
    res.status(500).json({ error: 'Failed to create destination' })
  }
})

app.put('/api/affordable-destinations/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { country, city, price, display_order, active } = req.body
    await db.update('affordable_destinations', id, {
      country,
      city,
      price,
      display_order,
      active
    })
    res.json({ ok: true })
  } catch (error) {
    console.error('Update destination error:', error)
    res.status(500).json({ error: 'Failed to update destination' })
  }
})

app.delete('/api/affordable-destinations/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    await db.remove('affordable_destinations', id)
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete destination error:', error)
    res.status(500).json({ error: 'Failed to delete destination' })
  }
})

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, name, phone, gender, age_range } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    // Require either firstName/lastName OR name (for backward compatibility)
    if (!firstName && !lastName && !name) {
      return res.status(400).json({ error: 'First name and last name are required' })
    }
    
    // Validate age_range if provided
    const validAgeRanges = ['12-18', '19-29', '30-39', '40-49', '50-59', '60-69', '70-79']
    if (age_range && !validAgeRanges.includes(age_range)) {
      return res.status(400).json({ error: 'Invalid age range' })
    }
    
    // Validate gender if provided
    const validGenders = ['male', 'female', 'other', 'prefer_not_to_say']
    if (gender && !validGenders.includes(gender)) {
      return res.status(400).json({ error: 'Invalid gender' })
    }
    
    // Check if user already exists
    const users = await db.all('users')
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' })
    }
    
    // Build name fields - prefer firstName/lastName, fallback to name
    const finalFirstName = firstName || (name ? name.split(' ')[0] : '')
    const finalLastName = lastName || (name ? name.split(' ').slice(1).join(' ') : '')
    const fullName = name || `${finalFirstName} ${finalLastName}`.trim()
    
    // Hash password and create user
    const password_hash = await auth.hashPassword(password)
    const user = await db.insert('users', {
      email,
      password_hash,
      name: fullName,
      first_name: finalFirstName || null,
      last_name: finalLastName || null,
      phone: phone || null,
      gender: gender || null,
      age_range: age_range || null,
      role: 'user'
    })
    
    // Generate token
    const token = auth.generateToken(user)
    
    // Remove password hash from response
    const { password_hash: _, ...userWithoutPassword } = user
    
    res.json({
      user: userWithoutPassword,
      token
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    
    const user = await auth.authenticateUser(email, password)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    const token = auth.generateToken(user)
    
    res.json({
      user,
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', auth.requireAuth, async (req, res) => {
  try {
    const user = await db.get('users', req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const { password_hash, ...userWithoutPassword } = user
    res.json({ user: userWithoutPassword })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Users endpoint (admin only)
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    let users = []
    try {
      users = await db.all('users')
    } catch (dbError) {
      // If table doesn't exist yet, return empty array
      if (dbError.code === 'PGRST205' || (dbError.message && dbError.message.includes('does not exist'))) {
        console.warn('Users table does not exist yet.')
        return res.json([])
      }
      throw dbError
    }
    
    // Remove password hashes from response
    const usersWithoutPasswords = users.map(({ password_hash, ...user }) => user)
    
    res.json(usersWithoutPasswords)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// Configure multer for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// Image upload endpoint
app.post('/api/upload', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { bucket = 'images', folder = 'packages' } = req.body
    const fileExtension = req.file.originalname.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
    const filePath = `${folder}/${fileName}`

    const result = await storage.uploadFile(
      bucket,
      filePath,
      req.file.buffer,
      {
        contentType: req.file.mimetype,
        upsert: false
      }
    )

    res.json({
      url: result.url,
      path: result.path,
      fileName: fileName
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Upload failed: ' + error.message })
  }
})

// List images endpoint
app.get('/api/images', requireAdmin, async (req, res) => {
  try {
    const { bucket = 'images', folder = 'packages' } = req.query
    const files = await storage.listFiles(bucket, folder)
    
    const filesWithUrls = files.map(file => ({
      name: file.name,
      url: storage.getPublicUrl(bucket, `${folder}/${file.name}`),
      size: file.metadata?.size || 0,
      updated: file.updated_at
    }))

    res.json(filesWithUrls)
  } catch (error) {
    console.error('List images error:', error)
    res.status(500).json({ error: 'Failed to list images' })
  }
})

// Delete image endpoint
app.delete('/api/images', requireAdmin, async (req, res) => {
  try {
    const { bucket = 'images', path } = req.body
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' })
    }

    await storage.deleteFile(bucket, path)
    res.json({ ok: true })
  } catch (error) {
    console.error('Delete image error:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// Create HTTP server and Socket.IO (must be before endpoints that use io)
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Lead submission endpoint (sends email notification and creates request)
app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, email: userEmail, service, notes, packageCode, userId } = req.body
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone number are required' })
    }

    // Send email notification (fail gracefully if email not configured)
    let emailResult = { success: false, error: 'Email not configured' }
    try {
      emailResult = await emailModule.sendLeadNotification({
        name,
        phone,
        email: userEmail,
        service,
        notes,
        packageCode
      })
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Continue even if email fails
    }

    if (!emailResult.success) {
      console.warn('Email notification failed:', emailResult.error || 'Email not configured')
      // Still return success to user, but log the error
    }

    // Create request for ALL submissions (logged-in and guest users) - fail silently if table doesn't exist
    let requestId = null
    try {
      // Determine request type based on service
      let requestType = 'booking'
      if (packageCode) {
        requestType = 'package'
      } else if (service && typeof service === 'string') {
        const serviceLower = service.toLowerCase()
        if (serviceLower.includes('passport')) {
          requestType = 'passport'
        } else if (serviceLower.includes('visa')) {
          requestType = 'visa'
        }
      }
      
      const request = await db.insert('requests', {
        user_id: userId ? parseInt(userId) : null,
        request_type: requestType,
        title: packageCode ? `Package Request: ${packageCode}` : `${service || 'Booking Inquiry'}`,
        description: notes || null,
        status: 'pending',
        request_data: {
          name,
          phone,
          email: userEmail,
          service,
          packageCode
        }
      })
      requestId = request.id
      console.log(`✅ Request created successfully: ID ${requestId}${userId ? ` for user ${userId}` : ' (guest user)'} - Type: ${requestType}`)
      console.log(`   Title: ${packageCode ? `Package Request: ${packageCode}` : `${service || 'Booking Inquiry'}`}`)
      console.log(`   Name: ${name}, Email: ${userEmail || 'N/A'}, Phone: ${phone}`)
    } catch (err) {
      // Log error details for debugging
      console.error('❌ Failed to create request:', err)
      console.error('   Error code:', err.code)
      console.error('   Error message:', err.message)
      console.error('   Request type attempted:', requestType)
      console.error('   User ID:', userId)
      
      // Silently fail if requests table doesn't exist - form submission should still succeed
      if (err.code === 'PGRST205' || (err.message && err.message.includes('does not exist'))) {
        console.warn('⚠️  REQUESTS TABLE DOES NOT EXIST!')
        console.warn('   Form submitted successfully, but request was NOT saved to database.')
        console.warn('   To enable request tracking, run the SQL migration from: server/MIGRATION_REQUESTS.md')
        console.warn('   After running the migration, restart the server and submit forms again.')
      } else if (err.message && err.message.includes('check constraint')) {
        console.error('⚠️  REQUEST TYPE CONSTRAINT ERROR!')
        console.error('   The request_type "' + requestType + '" is not allowed.')
        console.error('   Update the requests table CHECK constraint to include: passport, visa')
        console.error('   Run the SQL from: server/MIGRATION_REQUESTS_UPDATE_TYPES.md')
      } else {
        console.error('❌ Failed to create request:', err)
      }
    }

    res.json({ 
      success: true, 
      message: 'Thank you! We will contact you soon.',
      emailSent: emailResult.success,
      requestId
    })
  } catch (error) {
    console.error('Lead submission error:', error)
    res.status(500).json({ error: 'Failed to submit lead' })
  }
})

// Requests endpoints
app.get('/api/requests', async (req, res) => {
  try {
    const { userId, requestType, status } = req.query
    
    // Check for admin key (for admin panel)
    const adminKey = req.header('x-admin-key')
    const isAdmin = adminKey && adminKey === ADMIN_KEY
    
    // Check for token
    const token = req.header('Authorization')?.replace('Bearer ', '')
    let user = null
    if (token) {
      user = auth.verifyToken(token)
    }
    
    let requests = []
    try {
      requests = await db.all('requests')
    } catch (dbError) {
      // If table doesn't exist yet, return empty array
      if (dbError.code === 'PGRST205' || (dbError.message && dbError.message.includes('does not exist'))) {
        console.warn('Requests table does not exist yet. Run the migration from MIGRATION_REQUESTS.md')
        return res.json([])
      }
      throw dbError
    }
    
    // Filter by user if provided (users can only see their own)
    if (userId) {
      requests = requests.filter(r => r.user_id === parseInt(userId))
    } else if (!isAdmin && user && user.role !== 'admin') {
      // Non-admin users can only see their own requests (unless admin key is used)
      requests = requests.filter(r => r.user_id === user.id)
    }
    // If admin key is used or user is admin, show all requests (no filtering)
    
    // Filter by type if provided
    if (requestType) {
      requests = requests.filter(r => r.request_type === requestType)
    }
    
    // Filter by status if provided
    if (status) {
      requests = requests.filter(r => r.status === status)
    }
    
    // Sort by created date (most recent first)
    requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    res.json(requests)
  } catch (error) {
    console.error('Get requests error:', error)
    res.status(500).json({ error: 'Failed to get requests' })
  }
})

app.get('/api/requests/:id', async (req, res) => {
  try {
    let request
    try {
      request = await db.get('requests', req.params.id)
    } catch (dbError) {
      // If table doesn't exist yet, return 404
      if (dbError.code === 'PGRST205' || (dbError.message && dbError.message.includes('does not exist'))) {
        return res.status(404).json({ error: 'Request not found' })
      }
      throw dbError
    }
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Check for token
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (token) {
      const user = auth.verifyToken(token)
      // Non-admin users can only view their own requests
      if (user && user.role !== 'admin' && request.user_id !== user.id) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }
    
    res.json(request)
  } catch (error) {
    console.error('Get request error:', error)
    res.status(500).json({ error: 'Failed to get request' })
  }
})

app.post('/api/requests', async (req, res) => {
  try {
    const { requestType, title, description, requestData, userId } = req.body
    
    if (!requestType || !title) {
      return res.status(400).json({ error: 'Request type and title are required' })
    }
    
    // Check for token or use userId from body
    const token = req.header('Authorization')?.replace('Bearer ', '')
    let user = null
    if (token) {
      user = auth.verifyToken(token)
    }
    
    const finalUserId = userId || (user ? user.id : null)
    if (!finalUserId) {
      return res.status(401).json({ error: 'User ID required' })
    }
    
    const request = await db.insert('requests', {
      user_id: finalUserId,
      request_type: requestType,
      title: title,
      description: description || null,
      status: 'pending',
      request_data: requestData || {},
      admin_notes: null
    })
    
    res.json(request)
  } catch (error) {
    console.error('Create request error:', error)
    res.status(500).json({ error: 'Failed to create request' })
  }
})

app.put('/api/requests/:id', requireAdmin, async (req, res) => {
  try {
    const request = await db.get('requests', req.params.id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Only admins can update requests (already verified by requireAdmin middleware, but double-check)
    if (!req.user || (req.user.role !== 'admin' && !req.user.isAdmin)) {
      return res.status(403).json({ error: 'Only admins can update requests' })
    }
    
    const { status, adminNotes, paymentStatus, paymentInfo } = req.body
    
    const updateData = {
      status: status || request.status,
      admin_notes: adminNotes !== undefined ? adminNotes : request.admin_notes
    }
    
    // Update payment fields if provided
    if (paymentStatus !== undefined) {
      updateData.payment_status = paymentStatus
      if (paymentStatus === 'payment_confirmed') {
        updateData.payment_confirmed_at = new Date().toISOString()
        updateData.payment_confirmed_by = req.user.id
      }
    }
    
    if (paymentInfo !== undefined) {
      updateData.payment_info = paymentInfo
    }
    
    const updated = await db.update('requests', req.params.id, updateData)
    
    res.json(updated)
  } catch (error) {
    console.error('Update request error:', error)
    res.status(500).json({ error: 'Failed to update request' })
  }
})

// User marks payment as received (notifies admin)
app.post('/api/requests/:id/payment-received', auth.requireAuth, async (req, res) => {
  try {
    const request = await db.get('requests', req.params.id)
    if (!request) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    // Users can only update their own requests
    if (request.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    const updated = await db.update('requests', req.params.id, {
      payment_status: 'payment_received'
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Payment received error:', error)
    res.status(500).json({ error: 'Failed to update payment status' })
  }
})

// Calendar Deals endpoints
app.get('/api/calendar-deals', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    let deals = []
    try {
      deals = await db.all('calendar_deals')
    } catch (dbError) {
      // If table doesn't exist yet, return empty array
      if (dbError.code === 'PGRST205' || (dbError.message && dbError.message.includes('does not exist'))) {
        console.warn('Calendar deals table does not exist yet. Run the migration from MIGRATION_CALENDAR_DEALS.md')
        return res.json([])
      }
      throw dbError
    }
    
    // Filter by date range if provided
    if (startDate) {
      deals = deals.filter(d => d.deal_date >= startDate)
    }
    if (endDate) {
      deals = deals.filter(d => d.deal_date <= endDate)
    }
    
    // Only return active deals for public endpoint
    deals = deals.filter(d => d.active)
    
    res.json(deals)
  } catch (error) {
    console.error('Get calendar deals error:', error)
    res.status(500).json({ error: 'Failed to get calendar deals' })
  }
})

app.get('/api/calendar-deals/all', requireAdmin, async (req, res) => {
  try {
    let deals = []
    try {
      deals = await db.all('calendar_deals')
    } catch (dbError) {
      // If table doesn't exist yet, return empty array
      if (dbError.code === 'PGRST205' || (dbError.message && dbError.message.includes('does not exist'))) {
        console.warn('Calendar deals table does not exist yet. Run the migration from MIGRATION_CALENDAR_DEALS.md')
        return res.json([])
      }
      throw dbError
    }
    res.json(deals)
  } catch (error) {
    console.error('Get all calendar deals error:', error)
    res.status(500).json({ error: 'Failed to get calendar deals' })
  }
})

app.post('/api/calendar-deals', requireAdmin, async (req, res) => {
  try {
    const { deal_date, deal_type, title, description, discount_percent, active } = req.body
    
    if (!deal_date || !deal_type) {
      return res.status(400).json({ error: 'Deal date and type are required' })
    }
    
    const validTypes = ['flight', 'hotel', 'package', 'visa']
    if (!validTypes.includes(deal_type)) {
      return res.status(400).json({ error: 'Invalid deal type' })
    }
    
    // Check if deal already exists for this date
    const existingDeals = await db.all('calendar_deals')
    const existing = existingDeals.find(d => d.deal_date === deal_date)
    
    if (existing) {
      // Update existing deal
      const updated = await db.update('calendar_deals', existing.id, {
        deal_type,
        title: title || null,
        description: description || null,
        discount_percent: discount_percent || null,
        active: active !== undefined ? active : true
      })
      res.json(updated)
    } else {
      // Create new deal
      const deal = await db.insert('calendar_deals', {
        deal_date,
        deal_type,
        title: title || null,
        description: description || null,
        discount_percent: discount_percent || null,
        active: active !== undefined ? active : true
      })
      res.json(deal)
    }
  } catch (error) {
    console.error('Create/update calendar deal error:', error)
    res.status(500).json({ error: 'Failed to save calendar deal' })
  }
})

app.delete('/api/calendar-deals/:id', requireAdmin, async (req, res) => {
  try {
    await db.remove('calendar_deals', req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete calendar deal error:', error)
    res.status(500).json({ error: 'Failed to delete calendar deal' })
  }
})

// Form Drafts endpoints (save/resume forms)
app.get('/api/form-drafts', async (req, res) => {
  try {
    const { userId, formType, status } = req.query
    
    let drafts = await db.all('form_drafts')
    
    // Filter by user if provided
    if (userId) {
      drafts = drafts.filter(d => d.user_id === parseInt(userId))
    }
    
    // Filter by form type if provided
    if (formType) {
      drafts = drafts.filter(d => d.form_type === formType)
    }
    
    // Filter by status if provided
    if (status) {
      drafts = drafts.filter(d => d.status === status)
    }
    
    // Sort by last saved (most recent first)
    drafts.sort((a, b) => new Date(b.last_saved_at) - new Date(a.last_saved_at))
    
    res.json(drafts)
  } catch (error) {
    console.error('Get form drafts error:', error)
    res.status(500).json({ error: 'Failed to get form drafts' })
  }
})

app.get('/api/form-drafts/:id', async (req, res) => {
  try {
    const draft = await db.get('form_drafts', req.params.id)
    if (!draft) {
      return res.status(404).json({ error: 'Form draft not found' })
    }
    res.json(draft)
  } catch (error) {
    console.error('Get form draft error:', error)
    res.status(500).json({ error: 'Failed to get form draft' })
  }
})

app.post('/api/form-drafts', async (req, res) => {
  try {
    const { userId, formType, formData, progressPercent } = req.body
    
    if (!formType || !formData) {
      return res.status(400).json({ error: 'Form type and data are required' })
    }
    
    // Calculate progress if not provided
    const progress = progressPercent !== undefined ? progressPercent : calculateFormProgress(formData)
    
    const draft = await db.insert('form_drafts', {
      user_id: userId || null,
      form_type: formType,
      form_data: formData,
      progress_percent: progress,
      status: 'draft',
      last_saved_at: new Date().toISOString()
    })
    
    res.json(draft)
  } catch (error) {
    console.error('Create form draft error:', error)
    res.status(500).json({ error: 'Failed to save form draft' })
  }
})

app.put('/api/form-drafts/:id', async (req, res) => {
  try {
    const { formData, progressPercent, status } = req.body
    const draft = await db.get('form_drafts', req.params.id)
    
    if (!draft) {
      return res.status(404).json({ error: 'Form draft not found' })
    }
    
    const progress = progressPercent !== undefined ? progressPercent : calculateFormProgress(formData || draft.form_data)
    
    const updated = await db.update('form_drafts', req.params.id, {
      form_data: formData || draft.form_data,
      progress_percent: progress,
      status: status || draft.status,
      last_saved_at: new Date().toISOString()
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update form draft error:', error)
    res.status(500).json({ error: 'Failed to update form draft' })
  }
})

app.delete('/api/form-drafts/:id', async (req, res) => {
  try {
    await db.remove('form_drafts', req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete form draft error:', error)
    res.status(500).json({ error: 'Failed to delete form draft' })
  }
})

// Helper function to calculate form progress
function calculateFormProgress(formData) {
  if (!formData || typeof formData !== 'object') return 0
  
  const fields = Object.keys(formData)
  if (fields.length === 0) return 0
  
  const filledFields = fields.filter(key => {
    const value = formData[key]
    return value !== null && value !== undefined && value !== ''
  })
  
  return Math.round((filledFields.length / fields.length) * 100)
}

// Travel period submission endpoint (from TravelPulse)
app.post('/api/travel-periods', async (req, res) => {
  try {
    const { startDate, endDate, departureAirport, arrivalAirport, userId, tripType } = req.body
    
    if (!startDate) {
      return res.status(400).json({ error: 'Start date is required' })
    }
    if ((tripType || 'return') === 'return' && !endDate) {
      return res.status(400).json({ error: 'End date is required for return trips' })
    }
    if (!departureAirport || !arrivalAirport) {
      return res.status(400).json({ error: 'Departure and arrival airports are required' })
    }

    // Send email notification (countries removed)
    const emailResult = await emailModule.sendTravelPeriodNotification({
      startDate,
      endDate: (tripType || 'return') === 'one-way' ? startDate : endDate,
      countries: [], // no countries now
      departureAirport,
      arrivalAirport
    })

    if (!emailResult.success) {
      console.error('Email failed:', emailResult.error)
      // Still return success to user, but log the error
    }

    // Create request for ALL submissions (logged-in and guest users) - fail silently if table doesn't exist
    let requestId = null
    try {
      const request = await db.insert('requests', {
        user_id: userId ? parseInt(userId) : null,
        request_type: 'travel_plan',
        title: `Travel Plan: ${departureAirport || 'TBD'} → ${arrivalAirport || 'TBD'}`,
        description: `Travel period: ${startDate} to ${(tripType || 'return') === 'one-way' ? startDate : endDate}`,
        status: 'pending',
        request_data: {
          startDate,
          endDate: (tripType || 'return') === 'one-way' ? startDate : endDate,
          tripType: tripType || 'return',
          departureAirport,
          arrivalAirport
        }
      })
      requestId = request.id
      console.log(`✅ Travel plan request created: ID ${requestId}${userId ? ` for user ${userId}` : ' (guest user)'}`)
    } catch (err) {
      // Silently fail if requests table doesn't exist - form submission should still succeed
      if (err.code === 'PGRST205' || (err.message && err.message.includes('does not exist'))) {
        console.warn('Requests table does not exist. Form submitted but request not tracked. Run MIGRATION_REQUESTS.md')
      } else {
        console.error('Failed to create request:', err)
      }
    }

    res.json({ 
      success: true, 
      message: 'Travel period submitted successfully! We will contact you with the best deals.',
      emailSent: emailResult.success,
      requestId
    })
  } catch (error) {
    console.error('Travel period submission error:', error)
    res.status(500).json({ error: 'Failed to submit travel period' })
  }
})

// Chat endpoints
app.post('/api/chat/messages', async (req, res) => {
  try {
    const { sessionId, senderName, senderEmail, message, userId } = req.body
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' })
    }

    // Try to insert with user_id, fallback if column doesn't exist
    let chatMessage
    try {
      chatMessage = await db.insert('chat_messages', {
        session_id: sessionId,
        sender_name: senderName || 'Anonymous',
        sender_email: senderEmail || null,
        user_id: userId ? parseInt(userId) : null,
        message: message,
        is_admin: false
      })
    } catch (insertError) {
      // If user_id column doesn't exist, insert without it
      if (insertError.code === 'PGRST204' && insertError.message && insertError.message.includes('user_id')) {
        console.warn('⚠️  user_id column not found in chat_messages. Run migration: server/MIGRATION_CHAT_USER_ID.md')
        chatMessage = await db.insert('chat_messages', {
          session_id: sessionId,
          sender_name: senderName || 'Anonymous',
          sender_email: senderEmail || null,
          message: message,
          is_admin: false
        })
      } else {
        throw insertError
      }
    }

    // Emit to all connected clients
    io.emit('new_message', chatMessage)

    res.json({ success: true, message: chatMessage })
  } catch (error) {
    console.error('Error inserting into chat_messages:', error)
    console.error('Chat message error:', error)
    res.status(500).json({ error: 'Failed to send message' })
  }
})

app.get('/api/chat/messages', async (req, res) => {
  try {
    const { sessionId, userId } = req.query
    const token = req.header('Authorization')?.replace('Bearer ', '')
    let user = null
    if (token) {
      user = auth.verifyToken(token)
    }
    
    const isAdmin = user && user.role === 'admin'
    const currentUserId = user?.id || (userId ? parseInt(userId) : null)
    
    let messages
    if (sessionId) {
      // Get messages for specific session
      const allMessages = await db.all('chat_messages')
      messages = allMessages
        .filter(m => {
          // Must match the requested session
          if (m.session_id !== sessionId) {
            return false
          }
          
          // Admins can see all messages for any session
          if (isAdmin) {
            return true
          }
          
          // For logged-in regular users
          if (currentUserId) {
            // Include user's own messages (by user_id)
            if (m.user_id === currentUserId) {
              return true
            }
            // Include admin messages ONLY if this session belongs to this user
            // (session starts with user_{userId} or user_{userId}_)
            if (m.is_admin) {
              const sessionPattern = `user_${currentUserId}`
              if (sessionId.startsWith(sessionPattern)) {
                return true
              }
              // Don't show admin messages for other users' sessions
              return false
            }
            // Include non-admin messages from other users in the same session (for group chats if needed)
            return true
          }
          
          // For guest users (not logged in), only show their own non-admin messages
          // Do NOT show admin messages to guests
          return !m.is_admin
        })
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    } else {
      // Get all messages (only for admin)
      if (isAdmin) {
        messages = await db.all('chat_messages')
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      } else {
        // Regular users shouldn't access this endpoint without sessionId
        messages = []
      }
    }

    res.json(messages)
  } catch (error) {
    console.error('Get chat messages error:', error)
    res.status(500).json({ error: 'Failed to get messages' })
  }
})

app.post('/api/chat/admin-reply', requireAdmin, async (req, res) => {
  try {
    const { sessionId, message } = req.body
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' })
    }

    const adminMessage = await db.insert('chat_messages', {
      session_id: sessionId,
      sender_name: 'BT2 Support',
      message: message,
      is_admin: true,
      read_at: null // Admin messages start as unread
    })

    // Emit to all connected clients (especially the user in this session)
    io.emit('new_message', adminMessage)

    res.json({ success: true, message: adminMessage })
  } catch (error) {
    console.error('Admin reply error:', error)
    res.status(500).json({ error: 'Failed to send reply' })
  }
})

// Mark messages as read
app.post('/api/chat/mark-read', async (req, res) => {
  try {
    const { sessionId } = req.body
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' })
    }

    // Get all messages for this session
    const allMessages = await db.all('chat_messages')
    const sessionMessages = allMessages.filter(m => m.session_id === sessionId && m.is_admin && !m.read_at)
    
    // Mark admin messages as read
    for (const msg of sessionMessages) {
      await db.update('chat_messages', msg.id, {
        read_at: new Date().toISOString()
      })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ error: 'Failed to mark as read' })
  }
})

// Travel Buddy - Travel Trips endpoints
app.get('/api/travel-trips', async (req, res) => {
  try {
    const { status, destination, country } = req.query
    let trips = await db.all('travel_trips')
    
    // If no trips found, return empty array (not an error)
    if (!trips) {
      return res.json([])
    }
    
    // Filter by status if provided
    if (status) {
      trips = trips.filter(t => t.status === status)
    }
    
    // Filter by destination if provided
    if (destination) {
      trips = trips.filter(t => 
        t.destination && t.destination.toLowerCase().includes(destination.toLowerCase())
      )
    }
    
    // Filter by country if provided
    if (country) {
      trips = trips.filter(t => 
        t.country && t.country.toLowerCase().includes(country.toLowerCase())
      )
    }
    
    // Sort by start_date (upcoming first)
    trips.sort((a, b) => {
      if (!a.start_date || !b.start_date) return 0
      return new Date(a.start_date) - new Date(b.start_date)
    })
    
    res.json(trips)
  } catch (error) {
    console.error('Get travel trips error:', error)
    // If table doesn't exist, return empty array instead of error
    if (error.message && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.warn('travel_trips table does not exist. Please run the schema.sql migration.')
      return res.json([])
    }
    res.status(500).json({ error: 'Failed to get travel trips: ' + error.message })
  }
})

app.get('/api/travel-trips/:id', async (req, res) => {
  try {
    const trip = await db.get('travel_trips', req.params.id)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    
    // Get participants for this trip
    const allParticipants = await db.all('trip_participants')
    const participants = allParticipants.filter(p => p.trip_id === parseInt(req.params.id))
    
    res.json({ ...trip, participants })
  } catch (error) {
    console.error('Get travel trip error:', error)
    res.status(500).json({ error: 'Failed to get travel trip' })
  }
})

app.post('/api/travel-trips', requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      destination,
      country,
      start_date,
      end_date,
      max_participants,
      price_per_person,
      image_url,
      images,
      itinerary,
      included,
      requirements
    } = req.body
    
    if (!title || !destination || !country || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    // Handle images array (similar to packages)
    let imageArray = []
    if (Array.isArray(images) && images.length > 0) {
      imageArray = images
    } else if (image_url) {
      // Legacy single image support
      imageArray = [image_url]
    }
    
    // Validate: require at least 1 image
    if (imageArray.length < 1) {
      return res.status(400).json({ error: 'At least 1 image is required' })
    }
    
    const trip = await db.insert('travel_trips', {
      title,
      description,
      destination,
      country,
      start_date,
      end_date,
      max_participants: max_participants || 10,
      price_per_person,
      images: imageArray, // Store as JSONB array
      image_url: imageArray[0] || null, // Legacy field - set to first image
      itinerary: itinerary || [],
      included: included || [],
      requirements,
      status: 'open',
      current_participants: 0
    })
    
    res.json(trip)
  } catch (error) {
    console.error('Create travel trip error:', error)
    res.status(500).json({ error: 'Failed to create travel trip' })
  }
})

app.put('/api/travel-trips/:id', requireAdmin, async (req, res) => {
  try {
    const trip = await db.get('travel_trips', req.params.id)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    
    // Handle images array (similar to packages)
    const updateData = { ...req.body }
    if (updateData.images !== undefined) {
      // If images array is provided, use it
      if (Array.isArray(updateData.images) && updateData.images.length > 0) {
        updateData.image_url = updateData.images[0] // Set legacy field to first image
      } else {
        // If empty array, keep existing images or set to empty
        updateData.images = []
        updateData.image_url = null
      }
    } else if (updateData.image_url && !updateData.images) {
      // If only image_url is provided (legacy), convert to images array
      updateData.images = [updateData.image_url]
    }
    
    const updatedTrip = await db.update('travel_trips', req.params.id, updateData)
    res.json(updatedTrip)
  } catch (error) {
    console.error('Update travel trip error:', error)
    res.status(500).json({ error: 'Failed to update travel trip' })
  }
})

app.delete('/api/travel-trips/:id', requireAdmin, async (req, res) => {
  try {
    await db.remove('travel_trips', req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete travel trip error:', error)
    res.status(500).json({ error: 'Failed to delete travel trip' })
  }
})

// Join a travel trip
app.post('/api/travel-trips/:id/join', async (req, res) => {
  try {
    const trip = await db.get('travel_trips', req.params.id)
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    
    if (trip.status !== 'open') {
      return res.status(400).json({ error: 'Trip is not open for registration' })
    }
    
    if (trip.current_participants >= trip.max_participants) {
      return res.status(400).json({ error: 'Trip is full' })
    }
    
    const { userId, guestName, guestEmail, guestPhone, notes } = req.body
    
    // Check if user already joined
    const allParticipants = await db.all('trip_participants')
    const existingParticipant = allParticipants.find(p => {
      const tripMatch = p.trip_id === parseInt(req.params.id)
      if (!tripMatch) return false
      
      // For logged-in users, check by user_id (convert to number for comparison)
      if (userId) {
        const userIdNum = parseInt(userId)
        if (p.user_id && p.user_id === userIdNum) {
          return true
        }
      }
      
      // For guest users, check by email (case-insensitive)
      if (guestEmail && p.guest_email) {
        return p.guest_email.toLowerCase() === guestEmail.toLowerCase()
      }
      
      return false
    })
    
    if (existingParticipant) {
      return res.status(400).json({ error: 'You have already joined this trip' })
    }
    
    // Create participant record
    const participant = await db.insert('trip_participants', {
      trip_id: parseInt(req.params.id),
      user_id: userId || null,
      guest_name: guestName || null,
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      status: 'pending',
      notes: notes || null
    })
    
    // Update trip participant count
    await db.update('travel_trips', req.params.id, {
      current_participants: trip.current_participants + 1,
      status: (trip.current_participants + 1 >= trip.max_participants) ? 'full' : 'open'
    })
    
    // Send email notification for travel buddy join
    let emailResult = { success: false, error: 'Email not configured' }
    try {
      emailResult = await emailModule.sendTravelBuddyNotification({
        tripTitle: trip.title,
        destination: trip.destination,
        country: trip.country,
        startDate: trip.start_date,
        endDate: trip.end_date,
        guestName: guestName || 'Guest',
        guestEmail: guestEmail || 'N/A',
        guestPhone: guestPhone || 'N/A',
        notes: notes || null
      })
    } catch (emailError) {
      console.error('Email notification error:', emailError)
    }

    // Create request for ALL travel buddy joins (logged-in and guest users) - fail silently if table doesn't exist
    let requestId = null
    try {
      const request = await db.insert('requests', {
        user_id: userId ? parseInt(userId) : null,
        request_type: 'travel_buddy',
        title: `Travel Buddy Request: ${trip.title}`,
        description: `Request to join trip to ${trip.destination}, ${trip.country}`,
        status: 'pending',
        request_data: {
          tripId: parseInt(req.params.id),
          tripTitle: trip.title,
          destination: trip.destination,
          country: trip.country,
          startDate: trip.start_date,
          endDate: trip.end_date,
          guestName,
          guestEmail,
          guestPhone,
          notes
        }
      })
      requestId = request.id
      console.log(`✅ Travel buddy request created: ID ${requestId}${userId ? ` for user ${userId}` : ' (guest user)'}`)
    } catch (err) {
      // Silently fail if requests table doesn't exist - trip join should still succeed
      if (err.code === 'PGRST205' || (err.message && err.message.includes('does not exist'))) {
        console.warn('Requests table does not exist. Trip joined but request not tracked. Run MIGRATION_REQUESTS.md')
      } else {
        console.error('Failed to create request:', err)
      }
    }
    
    res.json({ success: true, participant, requestId })
  } catch (error) {
    console.error('Join trip error:', error)
    res.status(500).json({ error: 'Failed to join trip' })
  }
})

// Leave a travel trip
app.post('/api/travel-trips/:id/leave', async (req, res) => {
  try {
    const { userId, guestEmail } = req.body
    const trip = await db.get('travel_trips', req.params.id)
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' })
    }
    
    // Find and remove participant
    const allParticipants = await db.all('trip_participants')
    const participant = allParticipants.find(
      p => p.trip_id === parseInt(req.params.id) && 
      (p.user_id === userId || p.guest_email === guestEmail)
    )
    
    if (!participant) {
      return res.status(404).json({ error: 'You are not registered for this trip' })
    }
    
    await db.remove('trip_participants', participant.id)
    
    // Update trip participant count
    const newCount = Math.max(0, trip.current_participants - 1)
    await db.update('travel_trips', req.params.id, {
      current_participants: newCount,
      status: newCount < trip.max_participants ? 'open' : trip.status
    })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Leave trip error:', error)
    res.status(500).json({ error: 'Failed to leave trip' })
  }
})

// Get user's trips
app.get('/api/travel-trips/user/:userId', async (req, res) => {
  try {
    const allParticipants = await db.all('trip_participants')
    const userParticipants = allParticipants.filter(
      p => p.user_id === parseInt(req.params.userId)
    )
    
    const allTrips = await db.all('travel_trips')
    const userTrips = allTrips.filter(trip =>
      userParticipants.some(p => p.trip_id === trip.id)
    )
    
    res.json(userTrips)
  } catch (error) {
    console.error('Get user trips error:', error)
    res.status(500).json({ error: 'Failed to get user trips' })
  }
})

// Testimonials endpoints
app.get('/api/testimonials', async (req, res) => {
  try {
    let testimonials = []
    try {
      testimonials = await db.all('testimonials')
    } catch (dbError) {
      // If table doesn't exist yet, return empty array
      if (dbError.code === 'PGRST205' || (dbError.message && dbError.message.includes('does not exist'))) {
        console.warn('Testimonials table does not exist yet. Run the migration from MIGRATION_TESTIMONIALS.md')
        return res.json([])
      }
      throw dbError
    }
    
    // Only return approved testimonials for public view
    testimonials = testimonials.filter(t => t.status === 'approved')
    
    // Sort by created date (most recent first)
    testimonials.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    res.json(testimonials)
  } catch (error) {
    console.error('Get testimonials error:', error)
    res.status(500).json({ error: 'Failed to get testimonials' })
  }
})

app.post('/api/testimonials', async (req, res) => {
  try {
    const { name, email, location, text, rating, userId } = req.body
    
    if (!name || !text) {
      return res.status(400).json({ error: 'Name and testimonial text are required' })
    }
    
    if (text.length < 20) {
      return res.status(400).json({ error: 'Testimonial text must be at least 20 characters' })
    }
    
    const testimonial = await db.insert('testimonials', {
      user_id: userId || null,
      name: name.trim(),
      email: email?.trim() || null,
      location: location?.trim() || null,
      text: text.trim(),
      rating: rating || 5,
      status: 'pending' // Requires admin approval
    })
    
    res.json({ success: true, testimonial })
  } catch (error) {
    console.error('Create testimonial error:', error)
    // Gracefully handle missing table
    if (error.code === 'PGRST205' || (error.message && error.message.includes('does not exist'))) {
      console.warn('Testimonials table does not exist. Run the migration from MIGRATION_TESTIMONIALS.md')
      return res.status(500).json({ error: 'Testimonials feature not available. Please contact support.' })
    }
    res.status(500).json({ error: 'Failed to create testimonial' })
  }
})

// Admin endpoints for testimonials
app.get('/api/testimonials/all', requireAdmin, async (req, res) => {
  try {
    const { status } = req.query
    let testimonials = []
    try {
      testimonials = await db.all('testimonials')
    } catch (dbError) {
      if (dbError.code === 'PGRST205' || (dbError.message && dbError.message.includes('does not exist'))) {
        return res.json([])
      }
      throw dbError
    }
    
    // Filter by status if provided
    if (status) {
      testimonials = testimonials.filter(t => t.status === status)
    }
    
    // Sort by created date (most recent first)
    testimonials.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    
    res.json(testimonials)
  } catch (error) {
    console.error('Get all testimonials error:', error)
    res.status(500).json({ error: 'Failed to get testimonials' })
  }
})

app.put('/api/testimonials/:id', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body
    
    const testimonial = await db.get('testimonials', req.params.id)
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' })
    }
    
    const updated = await db.update('testimonials', req.params.id, {
      status: status || testimonial.status,
      admin_notes: adminNotes !== undefined ? adminNotes : testimonial.admin_notes
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update testimonial error:', error)
    res.status(500).json({ error: 'Failed to update testimonial' })
  }
})

app.delete('/api/testimonials/:id', requireAdmin, async (req, res) => {
  try {
    await db.remove('testimonials', req.params.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete testimonial error:', error)
    res.status(500).json({ error: 'Failed to delete testimonial' })
  }
})

// Bank Details endpoints (for BT2 company bank account information)
app.get('/api/bank-details', async (req, res) => {
  try {
    // Bank details are public - no authentication required
    let bankDetails = []
    try {
      bankDetails = await db.all('bank_details')
    } catch (dbError) {
      // If table doesn't exist yet, return empty array
      if (dbError.code === 'PGRST205' || (dbError.message && dbError.message.includes('does not exist'))) {
        console.warn('Bank details table does not exist yet. Run the migration from MIGRATION_BANK_DETAILS.md')
        return res.json([])
      }
      throw dbError
    }
    
    // Only return active bank details
    const activeDetails = bankDetails.filter(b => b.active)
    
    res.json(activeDetails)
  } catch (error) {
    console.error('Get bank details error:', error)
    res.status(500).json({ error: 'Failed to get bank details' })
  }
})

// Admin endpoint to update bank details
app.put('/api/bank-details/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const {
      bank_name,
      account_name,
      account_number,
      routing_number,
      swift_code,
      branch_name,
      branch_address,
      currency,
      instructions,
      active
    } = req.body
    
    const bankDetail = await db.get('bank_details', id)
    if (!bankDetail) {
      return res.status(404).json({ error: 'Bank detail not found' })
    }
    
    const updated = await db.update('bank_details', id, {
      bank_name: bank_name || bankDetail.bank_name,
      account_name: account_name || bankDetail.account_name,
      account_number: account_number || bankDetail.account_number,
      routing_number: routing_number !== undefined ? routing_number : bankDetail.routing_number,
      swift_code: swift_code !== undefined ? swift_code : bankDetail.swift_code,
      branch_name: branch_name !== undefined ? branch_name : bankDetail.branch_name,
      branch_address: branch_address !== undefined ? branch_address : bankDetail.branch_address,
      currency: currency || bankDetail.currency,
      instructions: instructions !== undefined ? instructions : bankDetail.instructions,
      active: active !== undefined ? active : bankDetail.active
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Update bank detail error:', error)
    res.status(500).json({ error: 'Failed to update bank detail' })
  }
})

// Admin endpoint to create bank details
app.post('/api/bank-details', requireAdmin, async (req, res) => {
  try {
    const {
      bank_name,
      account_name,
      account_number,
      routing_number,
      swift_code,
      branch_name,
      branch_address,
      currency,
      instructions,
      active
    } = req.body
    
    if (!bank_name || !account_name || !account_number) {
      return res.status(400).json({ error: 'Bank name, account name, and account number are required' })
    }
    
    const bankDetail = await db.insert('bank_details', {
      bank_name,
      account_name,
      account_number,
      routing_number: routing_number || null,
      swift_code: swift_code || null,
      branch_name: branch_name || null,
      branch_address: branch_address || null,
      currency: currency || 'USD',
      instructions: instructions || null,
      active: active !== undefined ? active : true
    })
    
    res.json(bankDetail)
  } catch (error) {
    console.error('Create bank detail error:', error)
    res.status(500).json({ error: 'Failed to create bank detail' })
  }
})

// Serve admin.html
app.get('/admin.html', (req, res) => {
  const adminHtmlPath = path.join(__dirname, 'admin.html')
  if (fs.existsSync(adminHtmlPath)) {
    res.sendFile(adminHtmlPath)
  } else {
    res.status(404).json({ error: 'Admin page not found' })
  }
})

// Root route - redirect to frontend for browser requests
app.get('/', (req, res) => {
  // Check if this is an API request (has Accept: application/json header)
  const acceptHeader = req.headers.accept || ''
  const isApiRequest = acceptHeader.includes('application/json') && !acceptHeader.includes('text/html')
  
  if (isApiRequest) {
    return res.status(404).json({ error: 'Route not found', path: req.path })
  }
  
  // Always redirect browser requests to frontend
  // The frontend Vite dev server runs on port 5173
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  res.redirect(302, frontendUrl)
})

// 404 handler - must be after all routes
app.use((req, res) => {
  // Only return JSON for API routes or JSON requests
  const isApiRoute = req.path.startsWith('/api')
  const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json')
  const isJsonRequest = req.headers['content-type'] && req.headers['content-type'].includes('application/json')
  
  if (isApiRoute || acceptsJson || isJsonRequest) {
    return res.status(404).json({ error: 'Route not found', path: req.path })
  }
  
  // For other browser requests, redirect to frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  res.redirect(302, frontendUrl)
})

server.listen(PORT, () => {
  console.log(`BT2 backend listening on http://localhost:${PORT}`)
  console.log(`Socket.IO server ready for live chat`)
  console.log(`✅ Testimonials endpoints available at /api/testimonials`)
})
