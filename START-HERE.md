# 🚀 Quick Start - Test Your Backend!

## What We Built So Far

You now have a working flight rescheduler backend with:

- ✅ **Convex Database** - Students, Instructors, Bookings, Weather data
- ✅ **CRUD Operations** - 26 operations across all tables
- ✅ **Weather API** - Real-time weather from OpenWeatherMap
- ✅ **Scheduled Jobs** - Automatic weather monitoring every 30 minutes
- ✅ **Real-Time UI** - Test dashboard to verify everything works

## Let's Test It! (5 Minutes)

### Step 1: Start Convex (1 min)

Open a terminal and run:

```bash
npx convex dev
```

**First time?** You'll be asked to:
1. Log in to Convex (or create free account)
2. Create a project (pick any name)
3. Wait for deployment (~30 seconds)

You'll get a URL like: `https://happy-animal-123.convex.cloud`

### Step 2: Add API Key (1 min)

1. Get a **free** OpenWeatherMap API key:
   - Visit: https://openweathermap.org/api
   - Sign up → API keys → Copy your key

2. Add it to Convex:
   - Go to: https://dashboard.convex.dev
   - Click your project
   - Settings → Environment Variables
   - Add: `OPENWEATHER_API_KEY` = `your_key_here`
   - Save

### Step 3: Configure Frontend (30 sec)

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your Convex URL:

```env
VITE_CONVEX_URL=https://happy-animal-123.convex.cloud
```

### Step 4: Start Frontend (30 sec)

Open a **new terminal** (keep Convex running) and run:

```bash
npm run dev:frontend
```

### Step 5: Test! (2 min)

Open: **http://localhost:5173**

**You'll see a beautiful testing dashboard!**

Try this flow:

1. **Create a Student**
   - Name: John Doe
   - Email: john@test.com
   - Training Level: Student Pilot
   - Click "Create Student" ✅

2. **Create an Instructor**
   - Name: Jane Smith
   - Email: jane@test.com
   - Click "Create Instructor" ✅

3. **Create a Booking**
   - Select John and Jane
   - Click "Create Booking" ✅
   - This creates a flight for tomorrow at 10 AM

4. **Fetch Weather**
   - Click "Fetch Weather" (default: JFK Airport)
   - See real weather data! ✅
   - Temperature, visibility, wind, conditions

5. **Real-Time Test** 🤯
   - Open the app in another browser tab
   - Create a student in one tab
   - **Watch it appear instantly in the other!**

## 🎉 Success!

If everything works, you have:

- ✅ Working Convex database
- ✅ Real-time data sync
- ✅ Weather API integration
- ✅ Scheduled background jobs

**Ready for next steps?** Run these commands:

```bash
# See all tasks
task-master list

# Check next task
task-master next

# Continue building
# (We'll add weather conflict detection next!)
```

## 🐛 Issues?

See the detailed [SETUP.md](SETUP.md) guide for troubleshooting.

**Common fixes:**
- Convex won't connect? Check `.env.local` has correct URL
- Weather API fails? Verify key in Convex dashboard
- TypeScript errors? Run `npx convex dev` to regenerate types

---

**Questions?** Everything is documented in `SETUP.md`!

**Ready to continue?** Say "next task" and we'll add weather conflict detection! 🌦️

