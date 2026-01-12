BT2 Backend

Express.js backend with Supabase database for BT2 prototype.

## Setup

1. **Create a Supabase project** at https://supabase.com
2. **Run the SQL schema** in your Supabase SQL Editor:
   - Open `schema.sql` and copy the contents
   - Paste and run it in the Supabase SQL Editor
3. **Get your Supabase credentials**:
   - Go to Project Settings > API
   - Copy your Project URL and Service Role Key
4. **Configure environment variables**:
   ```powershell
   cd 'C:/Users/grush/Downloads/Master/Devop/Adrian/DT2/server'
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   ```

5. **Install dependencies and run**:
   ```powershell
   pnpm install
   pnpm run seed  # Optional: seed initial data
   pnpm start
   ```

## Environment Variables

Create a `.env` file in the `server` directory with:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=4000
ADMIN_KEY=secret-admin-key
JWT_SECRET=your-jwt-secret-key-change-in-production
```

## Default Admin Account

After running the seed script, a default admin account is created:

- **Email:** `admin@bt2.com`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change the admin password after first login!

## Email Setup

Email notifications are sent when users submit lead forms. See `EMAIL_SETUP.md` for Gmail configuration instructions.

## Chat Setup

Live chat support is available. Messages are stored in the `chat_messages` table. Run the SQL schema to create the table.

## API Endpoints

### Posts
- GET /api/posts
- POST /api/posts (x-admin-key header or JWT token required)
- PUT /api/posts/:id (x-admin-key header or JWT token required)
- DELETE /api/posts/:id (x-admin-key header or JWT token required)

### Packages
- GET /api/packages
- POST /api/packages (x-admin-key header or JWT token required)
- PUT /api/packages/:id (x-admin-key header or JWT token required)
- DELETE /api/packages/:id (x-admin-key header or JWT token required)

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login with email and password
- GET /api/auth/me - Get current user (requires Authorization: Bearer token)

### Crazy Deals
- GET /api/crazy-deals - Get active deals (public)
- GET /api/crazy-deals/all - Get all deals (admin only)
- POST /api/crazy-deals - Create a new deal (admin only)
- PUT /api/crazy-deals/:id - Update a deal (admin only)
- DELETE /api/crazy-deals/:id - Delete a deal (admin only)

### Affordable Destinations
- GET /api/affordable-destinations - Get active destinations (public)
- GET /api/affordable-destinations/all - Get all destinations (admin only)
- POST /api/affordable-destinations - Create a new destination (admin only)
- PUT /api/affordable-destinations/:id - Update a destination (admin only)
- DELETE /api/affordable-destinations/:id - Delete a destination (admin only)

### Lead Submission (with Email Notification)
- POST /api/leads - Submit a lead form (sends email notification)
  - Body: `{ name, phone, email?, service?, notes?, packageCode? }`

### Live Chat
- POST /api/chat/messages - Send a chat message
  - Body: `{ sessionId, senderName, senderEmail?, message }`
- GET /api/chat/messages?sessionId=xxx - Get messages for a session
- POST /api/chat/admin-reply - Admin reply (requires admin auth)
  - Headers: `x-admin-key: secret-admin-key` or `Authorization: Bearer <token>`
  - Body: `{ sessionId, message }`

### Travel Buddy (Travel Trips)
- GET /api/travel-trips - Get all trips (with optional filters: status, destination, country)
- GET /api/travel-trips/:id - Get trip details with participants
- POST /api/travel-trips - Create a new trip (admin only)
  - Body: `{ title, description, destination, country, start_date, end_date, max_participants, price_per_person, image_url, itinerary[], included[], requirements }`
- PUT /api/travel-trips/:id - Update a trip (admin only)
- DELETE /api/travel-trips/:id - Delete a trip (admin only)
- POST /api/travel-trips/:id/join - Join a trip
  - Body: `{ userId?, guestName?, guestEmail?, guestPhone?, notes? }`
- POST /api/travel-trips/:id/leave - Leave a trip
  - Body: `{ userId?, guestEmail }`
- GET /api/travel-trips/user/:userId - Get trips for a specific user

## Email Setup

Email notifications are sent when users submit lead forms. See `EMAIL_SETUP.md` for Gmail configuration instructions.

## Chat Setup

Live chat support is available. Messages are stored in the `chat_messages` table. Run the SQL schema to create the table.

## Admin UI

- Open `server/admin.html` in a browser (or serve it via the backend). Enter API base and admin key to manage packages and posts.
