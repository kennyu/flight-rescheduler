# Flight Rescheduler v2 - Demo Script

## Demo Overview
**Duration:** 5-10 minutes  
**Objective:** Showcase all core features and workflows  
**Audience:** Technical stakeholders, potential users

---

## Setup (Pre-Demo)

1. ✅ Start Convex backend: `npx convex dev`
2. ✅ Start React frontend: `npm run dev:frontend`
3. ✅ Open browser to http://localhost:5173
4. ✅ Verify Convex connection (green status indicator)
5. ✅ Clear any test data from previous demos
6. ✅ Ensure API keys are configured (OpenWeatherMap, OpenAI/Anthropic)

---

## Demo Flow

### Part 1: System Introduction (30 seconds)

**Script:**
> "Welcome to the Flight Rescheduler v2! This is an AI-powered system that automatically monitors weather conditions for scheduled flight lessons, detects conflicts based on pilot training levels, and generates optimized reschedule suggestions. The system runs entirely on Convex for the backend with a real-time React frontend."

**Actions:**
- Scroll through dashboard overview
- Point out key sections: Students, Instructors, Bookings, Weather, Conflicts, Reschedules, Notifications, Audit Log

---

### Part 2: Creating Students & Instructors (1 minute)

**Script:**
> "First, let's set up our users. We'll create students with different training levels, which is critical because weather minimums vary by certification."

**Actions:**

1. **Create Student Pilot:**
   - Name: "Alice Johnson"
   - Email: "alice@example.com"
   - Phone: "555-0101"
   - Training Level: **Student Pilot**
   - Click "Create Student"
   - **Point out:** Blue badge showing "Student Pilot"

2. **Create Private Pilot:**
   - Name: "Bob Martinez"
   - Email: "bob@example.com"
   - Phone: "555-0102"
   - Training Level: **Private Pilot**
   - Click "Create Student"

3. **Create Instrument Rated Pilot:**
   - Name: "Carol Davis"
   - Email: "carol@example.com"
   - Phone: "555-0103"
   - Training Level: **Instrument Rated**
   - Click "Create Student"

4. **Create Instructor:**
   - Name: "Dan Thompson"
   - Email: "dan@instructor.com"
   - Phone: "555-0200"
   - Click "Create Instructor"

**Highlight:**
> "Notice how each student has a different training level. Student pilots need perfect weather, while instrument-rated pilots can fly in much worse conditions."

---

### Part 3: Creating Flight Bookings (1 minute)

**Script:**
> "Now let's schedule some flight lessons. We'll create bookings at different locations to demonstrate the weather monitoring."

**Actions:**

1. **Create Booking #1 (Good Weather Expected):**
   - Student: Alice Johnson (Student Pilot)
   - Instructor: Dan Thompson
   - Date: Tomorrow at 10:00 AM
   - Location: "Phoenix, AZ" (typically clear)
   - Duration: 2 hours
   - Click "Create Booking"

2. **Create Booking #2 (Potentially Bad Weather):**
   - Student: Bob Martinez (Private Pilot)
   - Instructor: Dan Thompson
   - Date: Tomorrow at 2:00 PM
   - Location: "Seattle, WA" (often cloudy/rainy)
   - Duration: 2 hours
   - Click "Create Booking"

**Highlight:**
> "The system automatically logs every action. Let's check the Notifications section..."

**Actions:**
- Scroll to Notification Center
- **Show:** Booking confirmation notifications
- **Point out:** Unread count badge, priority levels

---

### Part 4: Weather Monitoring (2 minutes)

**Script:**
> "The system automatically checks weather every 30 minutes, but we can test it manually. Let's fetch weather for Seattle to see what conditions we're dealing with."

**Actions:**

1. **Test Weather API:**
   - Scroll to "Weather Test" section
   - Enter Location: "Seattle, WA"
   - Click "Fetch Weather"
   - **Wait for response** (2-3 seconds)

2. **Review Weather Data:**
   - **Point out key metrics:**
     - Temperature
     - Visibility (may be < 3 miles)
     - Ceiling (may be < 1000 ft)
     - Wind speed
     - Conditions (cloudy, rain, etc.)

**Highlight:**
> "This data is cached for 30 minutes to reduce API costs. In production, this runs automatically for all upcoming bookings."

---

### Part 5: Conflict Detection (2 minutes)

**Script:**
> "Now, let's check if Bob's flight in Seattle violates his Private Pilot weather minimums. Remember, he needs at least 3 miles visibility and 1000 ft ceiling."

**Actions:**

1. **Manual Conflict Check:**
   - Scroll to "Weather Conflicts" section
   - Find Bob's booking in the dropdown
   - Click "Check Booking for Conflicts"
   - **Wait for analysis** (1-2 seconds)

2. **Review Conflict Details:**
   - **If conflict found:**
     - **Point out:** Red "ACTIVE" badge
     - **Show:** Violation list (e.g., "Visibility 2.5 mi < 3 mi required")
     - **Explain:** Severity calculation (high/medium/low)
   - **If no conflict:**
     - **Explain:** "In this case, Seattle weather is good enough! Let's pretend it's worse..."

3. **Check Notifications:**
   - Scroll to Notification Center
   - **Show:** New high-priority weather conflict notification
   - **Point out:** Auto-generated message with details

**Highlight:**
> "The system compares actual weather against training-level-specific minimums and automatically creates high-priority notifications when conflicts are found."

---

### Part 6: AI Reschedule Suggestions (2-3 minutes)

**Script:**
> "When a conflict is detected, we can generate AI-powered reschedule suggestions. The AI considers weather forecasts, training requirements, and historical patterns to find optimal alternatives."

**Actions:**

1. **Generate Reschedule Options:**
   - Scroll to "AI Reschedule Suggestions" section
   - Find the conflict
   - Click "Generate Reschedule Options"
   - **Wait for AI** (3-5 seconds)
   - **Show loading indicator**

2. **Review AI Suggestions:**
   - **Point out 3 options:**
     - Option 1: [Date/Time] + Reasoning
     - Option 2: [Date/Time] + Reasoning
     - Option 3: [Date/Time] + Reasoning
   - **Highlight:** Weather forecast for each option
   - **Explain:** AI prioritizes safety + convenience

3. **Accept a Suggestion:**
   - Click "Accept This Option" on Option 1
   - **Confirmation dialog appears**
   - Click OK
   - **Success message shows**

4. **Verify Booking Updated:**
   - Scroll to Data Display (Bookings View)
   - **Show:** Booking status changed to "rescheduled"
   - **Show:** New scheduled date/time
   - **Status badge:** Green with "RESCHEDULED"

5. **Check Notifications:**
   - **Show:** New notification for accepted reschedule
   - **Point out:** Notification links to booking

**Highlight:**
> "The AI uses GPT-4o-mini or Claude 3.5 Sonnet to analyze weather patterns and generate safe, practical alternatives. All actions are logged for compliance."

---

### Part 7: Dashboard Features (1-2 minutes)

**Script:**
> "Let's explore the enhanced dashboard that provides powerful filtering, search, and real-time updates."

**Actions:**

1. **Filtering Demo:**
   - Scroll to "Enhanced Bookings Dashboard"
   - **Filter by Status:** Select "Rescheduled"
   - **Show:** Only rescheduled bookings appear
   - **Filter by Date:** Select "Next 7 Days"
   - **Show:** Results narrowed
   - Click "Clear All Filters"

2. **Search Demo:**
   - Type "Bob" in search box
   - **Show:** Real-time filtering as you type
   - **Highlight:** Searches student, instructor, location, status

3. **View Modes:**
   - Click "Switch to Students View"
   - **Show:** Card-based student display with badges
   - Search for "Instrument"
   - **Show:** Carol Davis appears
   - Click "Switch to Bookings View"

**Highlight:**
> "All data updates in real-time via Convex subscriptions. No manual refresh needed. Notice the connection status indicator at the top."

---

### Part 8: Audit Trail & History (1 minute)

**Script:**
> "Every action in the system is logged for compliance and analysis. Let's review the audit trail."

**Actions:**

1. **Review Audit Log:**
   - Scroll to "Audit Trail & History"
   - **Show statistics cards:**
     - Total events (7 days)
     - Breakdown by entity type
   
2. **Filter Audit Logs:**
   - Filter by Entity: "Booking"
   - **Show:** Only booking-related events
   - Search: "created"
   - **Show:** All booking creation events

3. **View Entry Details:**
   - Click "View details" on any entry
   - **Show:** Full JSON with before/after state
   - **Point out:** Timestamp, actor, action type

**Highlight:**
> "This provides complete traceability for regulatory compliance. You can see who did what, when, and what changed."

---

### Part 9: System Architecture (1 minute)

**Script:**
> "The system is built on Convex, which provides real-time database, serverless functions, and scheduled jobs. No separate backend server needed!"

**Actions:**
- Open ARCHITECTURE.md (if available)
- **Or verbally explain:**
  - Backend: Convex (database + functions)
  - Frontend: React + TypeScript + Vite
  - AI: OpenAI GPT-4o-mini or Anthropic Claude 3.5 Sonnet
  - Weather: OpenWeatherMap API
  - Scheduled jobs: Every 30 min for weather, hourly for cache cleanup

**Highlight:**
> "Convex handles real-time updates, automatic scaling, and scheduled jobs out of the box. The entire system deploys with a single command."

---

## Demo Conclusion (30 seconds)

**Script:**
> "To summarize, the Flight Rescheduler v2 provides:
> - ✅ Automated weather monitoring with training-level-specific minimums
> - ✅ Real-time conflict detection and notifications
> - ✅ AI-powered reschedule suggestions
> - ✅ Production-ready dashboard with filtering and search
> - ✅ Complete audit logging for compliance
> - ✅ All built on modern, scalable technology
>
> The system is ready for production deployment and can handle hundreds of bookings with minimal API costs thanks to intelligent caching. Thank you!"

---

## Q&A Preparation

**Common Questions:**

1. **Q: How accurate is the weather data?**
   - A: Uses OpenWeatherMap, which sources from NOAA and other professional services. 30-minute cache for cost efficiency.

2. **Q: What if both AI providers fail?**
   - A: System gracefully handles errors, logs them, and notifies users. Manual rescheduling always available.

3. **Q: Can this scale to multiple flight schools?**
   - A: Yes! Convex auto-scales. Would need multi-tenancy features for production.

4. **Q: What about instructor availability?**
   - A: Current version focuses on weather conflicts. Instructor scheduling is a future enhancement.

5. **Q: How much does it cost to run?**
   - A: Free tier sufficient for demo/dev:
     - OpenWeatherMap: 1,000 calls/day free
     - Convex: Generous free tier
     - AI: ~$0.10-0.50 per day with caching

6. **Q: Is this production-ready?**
   - A: Core features yes! Would need: authentication, email/SMS, mobile app, advanced analytics for full production.

---

## Troubleshooting

**Issue: Convex not connected**
- Check: `npx convex dev` running
- Check: Green dot in header
- Check: Browser console for errors

**Issue: Weather API fails**
- Check: `OPENWEATHER_API_KEY` in Convex dashboard
- Check: API key valid and not rate-limited
- Check: Network console for 401/403 errors

**Issue: AI generation fails**
- Check: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` set
- Check: API key valid and has credits
- Check: Network console for API errors

**Issue: No data showing**
- Refresh page
- Check Convex connection
- Check browser console for errors

---

## Post-Demo Actions

1. ✅ Walk through code structure if technical audience
2. ✅ Show Convex dashboard (database, functions, logs)
3. ✅ Discuss deployment process
4. ✅ Share GitHub repository
5. ✅ Provide contact information

---

**Demo Script Version:** 1.0  
**Last Updated:** November 9, 2025  
**Estimated Time:** 5-10 minutes  
**Complexity:** Intermediate

