# 🚀 Flight Rescheduler - Setup & Testing Guide

This guide will help you set up and test the Convex backend and weather API integration.

## Prerequisites

- Node.js 18+ installed
- OpenWeatherMap API key (free tier: https://openweathermap.org/api)
- Convex account (free: https://www.convex.dev/)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Convex

### 2.1 Start Convex Dev Server

```bash
npx convex dev
```

This will:
1. Prompt you to log in to Convex (or create an account)
2. Create a new Convex project
3. Deploy your schema and functions
4. Give you a deployment URL like: `https://xxxxx.convex.cloud`

### 2.2 Configure Environment Variables in Convex Dashboard

1. Go to https://dashboard.convex.dev
2. Select your project
3. Click "Settings" → "Environment Variables"
4. Add the following variables:

**Required:**
- `OPENWEATHER_API_KEY` = `your_openweathermap_api_key`
  - Get from: https://openweathermap.org/api (free tier is fine)

**Optional (for AI features later):**
- `OPENAI_API_KEY` = `your_openai_api_key`
  - OR `ANTHROPIC_API_KEY` = `your_anthropic_api_key`

5. Click "Save"

### 2.3 Configure Frontend Environment

Create `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Convex deployment URL:

```
VITE_CONVEX_URL=https://xxxxx.convex.cloud
```

(You got this URL when you ran `npx convex dev`)

## Step 3: Start the Application

In a **new terminal** (keep `npx convex dev` running):

```bash
npm run dev:frontend
```

Or run both together:

```bash
npm run dev
```

This starts:
- Convex backend (port: managed by Convex)
- React frontend (port: 5173)

## Step 4: Open Testing Dashboard

Open your browser to: **http://localhost:5173**

You should see the Flight Rescheduler Testing Dashboard!

## 🧪 Testing Guide

### Test 1: Create a Student

1. Fill in the "Create Student" form:
   - Name: John Doe
   - Email: john@example.com
   - Phone: +1-555-0100
   - Training Level: Student Pilot
2. Click "Create Student"
3. ✅ You should see: "Student created! ID: xxx"

### Test 2: Create an Instructor

1. Fill in the "Create Instructor" form:
   - Name: Jane Smith
   - Email: jane@example.com
   - Phone: +1-555-0200
2. Click "Create Instructor"
3. ✅ You should see: "Instructor created! ID: xxx"

### Test 3: Create a Booking

1. Select the student you created
2. Select the instructor you created
3. Click "Create Booking"
   - This creates a flight lesson for tomorrow at 10 AM
   - Route: KJFK → KLGA
4. ✅ You should see: "Booking created! ID: xxx"

### Test 4: Fetch Weather Data

1. Choose a location preset (or enter custom coordinates):
   - KJFK - JFK Airport (40.6413, -73.7781)
   - KLGA - LaGuardia (40.7769, -73.8740)
   - KEWR - Newark (40.6895, -74.1745)
2. Click "Fetch Weather"
3. ✅ You should see real weather data:
   - Temperature
   - Visibility (in miles)
   - Wind Speed (in knots)
   - Ceiling (if cloudy)
   - Conditions
   - Thunderstorm flag
   - Icing flag

**Note:** This makes a real API call to OpenWeatherMap!

### Test 5: Real-Time Updates

1. Open the app in **two browser windows** side-by-side
2. Create a student in one window
3. ✅ Watch it appear **instantly** in the other window!
   - This is Convex's real-time subscriptions in action

### Test 6: Verify Scheduled Jobs

The weather monitoring job runs every 30 minutes automatically. To verify:

1. Go to Convex Dashboard → Your Project → Logs
2. Look for: "fetch weather for active bookings"
3. You should see it run every 30 minutes
4. It will check weather for all bookings scheduled in the next 48 hours

## 🎯 What's Working

✅ **Database (Convex):**
- Students, Instructors, Bookings tables
- Real-time queries and mutations
- Audit logging
- Status transitions

✅ **Weather API:**
- OpenWeatherMap integration
- Smart caching (30-minute TTL)
- Unit conversions (meters→miles, m/s→knots, K→C)
- Hazard detection (thunderstorms, icing)

✅ **Scheduled Jobs:**
- Weather monitoring every 30 minutes
- Cache cleanup every hour

✅ **Real-Time UI:**
- Live data updates (no page refresh needed)
- Instant sync across browser tabs

## 🐛 Troubleshooting

### "Cannot connect to Convex"
- Make sure `npx convex dev` is running
- Check `.env.local` has the correct `VITE_CONVEX_URL`
- Restart the frontend: `Ctrl+C` and `npm run dev:frontend` again

### "OpenWeatherMap API error"
- Verify `OPENWEATHER_API_KEY` is set in Convex dashboard
- Check the key is valid: https://home.openweathermap.org/api_keys
- Wait 10 minutes after creating a new API key (activation time)

### "Student with this email already exists"
- Emails must be unique
- Use a different email or delete the existing student from Convex dashboard

### TypeScript errors
- Run: `npx convex dev` to regenerate types
- Restart your IDE

## 📝 Next Steps

Once everything is working:

1. ✅ **Task 4**: Implement weather conflict detection
2. ✅ **Task 5**: Add AI-powered rescheduling
3. ✅ **Task 6**: Build notification system
4. ✅ **Task 7**: Create production dashboard

## 🎉 Success!

If you can:
- Create students and instructors
- Create bookings
- Fetch real weather data
- See real-time updates

**You're ready to continue building!** 🚀

---

## Quick Commands Reference

```bash
# Start Convex backend
npx convex dev

# Start frontend only
npm run dev:frontend

# Start both together
npm run dev

# View Convex logs
# Go to: https://dashboard.convex.dev → Logs

# Reset database (if needed)
# Go to: https://dashboard.convex.dev → Data → Clear All
```

