const nodemailer = require('nodemailer')
require('dotenv').config()

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.trim().replace(/\s+/g, '') : null // Remove all spaces
  }
})

// Verify transporter configuration on startup
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  const cleanPassword = process.env.GMAIL_APP_PASSWORD.trim().replace(/\s+/g, '')
  console.log('📧 Email configuration:')
  console.log('   User:', process.env.GMAIL_USER)
  console.log('   Password length:', cleanPassword.length, 'characters')
  console.log('   Notification email:', process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER)
  
  // Verify connection (optional - can be commented out if causing issues)
  transporter.verify(function (error, success) {
    if (error) {
      console.error('❌ Email configuration error:', error.message)
      console.error('   Make sure:')
      console.error('   1. 2-Step Verification is enabled on your Google account')
      console.error('   2. You generated an App Password (not your regular password)')
      console.error('   3. The App Password has no spaces in .env file')
      console.error('   4. The App Password is correct and not expired')
    } else {
      console.log('✅ Email server is ready to send messages')
    }
  })
} else {
  console.warn('⚠️  Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env')
}

/**
 * Send email notification
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env')
      return { success: false, error: 'Email not configured' }
    }

    const mailOptions = {
      from: `"BT2 Horizon" <${process.env.GMAIL_USER}>`,
      to: to || process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send lead notification email
 */
async function sendLeadNotification(leadData) {
  const { name, phone, email, service, notes, packageCode } = leadData

  const subject = `New Booking Inquiry${packageCode ? ` - ${packageCode}` : ''}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0FB7A4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #0FB7A4; }
        .value { margin-top: 5px; }
        .package-badge { background: #D4AF37; color: #051025; padding: 5px 10px; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎯 New Booking Inquiry</h2>
        </div>
        <div class="content">
          ${packageCode ? `<div class="field"><span class="package-badge">Package: ${packageCode}</span></div>` : ''}
          <div class="field">
            <div class="label">Name:</div>
            <div class="value">${name}</div>
          </div>
          ${email ? `<div class="field"><div class="label">Email:</div><div class="value">${email}</div></div>` : ''}
          <div class="field">
            <div class="label">Phone:</div>
            <div class="value">${phone}</div>
          </div>
          <div class="field">
            <div class="label">Service:</div>
            <div class="value">${service || 'Not specified'}</div>
          </div>
          ${notes ? `<div class="field"><div class="label">Notes:</div><div class="value">${notes}</div></div>` : ''}
          <div class="field" style="margin-top: 20px;">
            <a href="tel:${phone.replace(/[^0-9+]/g, '')}" style="background: #0FB7A4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Contact via Phone</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
    subject: subject,
    html: html
  })
}

/**
 * Send travel period notification email
 */
async function sendTravelPeriodNotification(data) {
  const { startDate, endDate, countries, departureAirport, arrivalAirport } = data

  const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
  
  const subject = `New Travel Period Request - ${countries.join(', ')}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0FB7A4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #0FB7A4; }
        .value { margin-top: 5px; }
        .highlight { background: #D4AF37; color: #051025; padding: 5px 10px; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✈️ New Travel Period Request</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Travel Period:</div>
            <div class="value">
              <span class="highlight">${startDate}</span> to <span class="highlight">${endDate}</span>
              <br><small>Duration: ${duration} ${duration === 1 ? 'day' : 'days'}</small>
            </div>
          </div>
          
          <div class="field">
            <div class="label">Destinations:</div>
            <div class="value">${countries.map(c => `<span class="highlight">${c}</span>`).join(', ')}</div>
          </div>
          
          ${departureAirport ? `
          <div class="field">
            <div class="label">Departure Airport:</div>
            <div class="value">${departureAirport}</div>
          </div>
          ` : ''}
          
          ${arrivalAirport ? `
          <div class="field">
            <div class="label">Arrival Airport:</div>
            <div class="value">${arrivalAirport}</div>
          </div>
          ` : ''}
          
          <div class="field" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #0FB7A4;">
            <p style="color: #666; font-size: 14px;">
              This request was submitted from the TravelPulse Deals Calendar. 
              Please contact the customer with available deals for the selected period.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
    subject: subject,
    html: html
  })
}

/**
 * Send travel buddy join notification email
 */
async function sendTravelBuddyNotification(data) {
  const { tripTitle, destination, country, startDate, endDate, guestName, guestEmail, guestPhone, notes } = data

  const subject = `New Travel Buddy Join Request - ${destination}, ${country}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0FB7A4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #0FB7A4; }
        .value { margin-top: 5px; }
        .highlight { background: #D4AF37; color: #051025; padding: 5px 10px; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>👥 New Travel Buddy Join Request</h2>
        </div>
        <div class="content">
          <div class="field">
            <div class="label">Trip:</div>
            <div class="value">
              <span class="highlight">${tripTitle}</span>
            </div>
          </div>
          
          <div class="field">
            <div class="label">Destination:</div>
            <div class="value">${destination}, ${country}</div>
          </div>
          
          <div class="field">
            <div class="label">Travel Dates:</div>
            <div class="value">
              <span class="highlight">${startDate}</span> to <span class="highlight">${endDate}</span>
            </div>
          </div>
          
          <div class="field">
            <div class="label">Participant Name:</div>
            <div class="value">${guestName}</div>
          </div>
          
          <div class="field">
            <div class="label">Email:</div>
            <div class="value">${guestEmail}</div>
          </div>
          
          ${guestPhone ? `
          <div class="field">
            <div class="label">Phone:</div>
            <div class="value">${guestPhone}</div>
          </div>
          ` : ''}
          
          ${notes ? `
          <div class="field">
            <div class="label">Notes:</div>
            <div class="value">${notes}</div>
          </div>
          ` : ''}
          
          <div class="field" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #0FB7A4;">
            <p style="color: #666; font-size: 14px;">
              A new participant wants to join this Travel Buddy trip. 
              Please review and confirm their participation.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail({
    to: process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER,
    subject: subject,
    html: html
  })
}

module.exports = {
  sendEmail,
  sendLeadNotification,
  sendTravelPeriodNotification,
  sendTravelBuddyNotification
}

