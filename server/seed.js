const db = require('./db')
const auth = require('./auth')

async function seed() {
  try {
    console.log('Starting seed...')

    // Clear existing data (optional - comment out if you want to keep existing data)
    const existingPosts = await db.all('posts')
    const existingPackages = await db.all('packages')
    
    console.log(`Found ${existingPosts.length} existing posts and ${existingPackages.length} existing packages`)
    
    // Delete existing data (uncomment if you want to reset)
    // for (const post of existingPosts) {
    //   await db.remove('posts', post.id)
    // }
    // for (const pkg of existingPackages) {
    //   await db.remove('packages', pkg.id)
    // }

    // Insert sample post
    const post = await db.insert('posts', { 
      title: 'Welcome to BT2', 
      slug: 'welcome', 
      content: 'This is sample post content.' 
    })
    console.log('Created post:', post.id)

    // Insert sample packages
    const packages = [
      { code: 'BT2-GRE-01', title: 'Greek Islands Escape', nights: 7, price: '$1,099', img: '/assets/santorini.jpg' },
      { code: 'BT2-LON-02', title: 'London City Break', nights: 4, price: '$899', img: '/assets/london.jpg' },
      { code: 'BT2-CRB-03', title: 'Caribbean Getaway', nights: 5, price: '$1,299', img: '/assets/caribbean.jpg' }
    ]

    for (const p of packages) {
      const inserted = await db.insert('packages', p)
      console.log('Created package:', inserted.id, '-', inserted.title)
    }

    // Create default admin user
    const existingUsers = await db.all('users')
    const adminEmail = 'admin@bt2.com'
    const adminExists = existingUsers.find(u => u.email === adminEmail)
    
    if (!adminExists) {
      const adminPassword = 'admin123' // Default password - change after first login!
      const password_hash = await auth.hashPassword(adminPassword)
      const admin = await db.insert('users', {
        email: adminEmail,
        password_hash,
        name: 'Admin User',
        role: 'admin'
      })
      console.log('Created default admin user:', admin.email)
      console.log('Default credentials:')
      console.log('  Email: admin@bt2.com')
      console.log('  Password: admin123')
      console.log('  ⚠️  IMPORTANT: Change the password after first login!')
    } else {
      console.log('Admin user already exists:', adminEmail)
    }

    // Create sample crazy deal
    const existingDeals = await db.all('crazy_deals')
    if (existingDeals.length === 0) {
      const dealEndDate = new Date(Date.now() + 1000 * 60 * 60 * 48) // 48 hours from now
      const deal = await db.insert('crazy_deals', {
        title: 'Santorini',
        subtitle: 'Limited seats • Book now',
        discount_percent: 40,
        end_date: dealEndDate.toISOString(),
        active: true
      })
      console.log('Created sample crazy deal:', deal.id, '-', deal.title)
    } else {
      console.log('Crazy deals already exist:', existingDeals.length)
    }

    // Create sample affordable destinations
    const existingDestinations = await db.all('affordable_destinations')
    if (existingDestinations.length === 0) {
      const destinations = [
        { country: 'Jamaica', city: 'Montego Bay', price: '$399', display_order: 1 },
        { country: 'Mexico', city: 'Cancun', price: '$349', display_order: 2 },
        { country: 'Dominican Republic', city: 'Punta Cana', price: '$329', display_order: 3 },
        { country: 'Costa Rica', city: 'San José', price: '$419', display_order: 4 },
        { country: 'Colombia', city: 'Cartagena', price: '$299', display_order: 5 }
      ]

      for (const dest of destinations) {
        const inserted = await db.insert('affordable_destinations', {
          ...dest,
          active: true
        })
        console.log('Created destination:', inserted.id, '-', dest.country, dest.city)
      }
    } else {
      console.log('Destinations already exist:', existingDestinations.length)
    }

    console.log('Seed complete!')
    process.exit(0)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seed()
