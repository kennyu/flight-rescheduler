# Flight Rescheduler v2

AI-powered flight lesson rescheduling system with weather monitoring and real-time notifications.

## Overview

Automatically detects weather conflicts for scheduled flight lessons and uses AI to generate optimized rescheduling options based on student training levels and weather minimums.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Convex (database + serverless functions)
- **AI**: OpenAI or Anthropic (via Convex Actions)
- **Weather**: OpenWeatherMap or WeatherAPI.com

## Features

### Core System
- **Real-time weather monitoring** - Automatic checks every 30 minutes
- **Training-level-specific weather minimums** - Student Pilot, Private Pilot, Instrument Rated
- **AI-powered reschedule suggestions** - GPT-4o-mini or Claude 3.5 Sonnet
- **In-app notifications** - Real-time alerts for conflicts, reschedules, and bookings
- **Complete audit logging** - Full history of all actions and changes

### Enhanced Dashboard
- **Advanced filtering** - Filter bookings by status, date range, student, or instructor
- **Real-time search** - Search bookings and students instantly
- **Dual view modes** - Toggle between Bookings and Students views
- **Status badges** - Color-coded status indicators
- **Responsive design** - Works on desktop, tablet, and mobile
- **Live updates** - All data updates in real-time via Convex subscriptions

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Convex

```bash
npx convex dev
```

This will:
- Create a new Convex project (first time only)
- Generate type definitions
- Start the dev server

### 3. Configure Environment Variables

In the Convex dashboard (https://dashboard.convex.dev), add your environment variables:

**Required:**
- `OPENWEATHER_API_KEY` - Get from https://openweathermap.org/api
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - For AI rescheduling

**Note:** Convex uses dashboard environment variables (not `.env` files) for security.

**See `env.example` for detailed configuration instructions and all available options.**

### 4. Scheduled Functions

The following automated jobs run in the background:
- **Weather Monitoring**: Every 30 minutes (checks all bookings in next 48h)
- **Cache Cleanup**: Every hour (removes expired weather data)

### 5. Start Development

Open **two terminals**:

**Terminal 1** (Convex backend):
```bash
npx convex dev
```

**Terminal 2** (React frontend):
```bash
npm run dev:frontend
```

Or run both together:
```bash
npm run dev
```

### 6. Open Testing Dashboard

Open http://localhost:5173 to see the production-ready dashboard where you can:
- Create students and instructors
- Create and manage flight bookings
- Test weather API integration
- See real-time data updates
- Filter and search bookings
- View notifications
- Generate AI reschedule options

### Dashboard Features

**Bookings View:**
- **Filter by Status**: Scheduled, Weather Conflict, Rescheduled, Completed, Cancelled
- **Filter by Date**: Today, Next 7 Days, Next 30 Days, Past Bookings
- **Filter by Student/Instructor**: Select from dropdowns
- **Search**: Type to search by student, instructor, location, or status
- **Clear Filters**: One-click reset

**Students View:**
- **Search**: Find students by name, email, or training level
- **Card Layout**: Clean, organized view with training level badges

**Real-time Updates:**
- All data automatically refreshes when changes occur
- Connection status indicator in header
- No manual refresh needed

**Documentation:**
- **[SETUP.md](SETUP.md)** - Detailed setup and troubleshooting
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and technical details
- **[DEMO_SCRIPT.md](DEMO_SCRIPT.md)** - 5-10 minute demo walkthrough
- **[START-HERE.md](START-HERE.md)** - Quick start guide

## Database Schema

### Core Tables

1. **students** - Student information and training levels
2. **instructors** - Instructor details
3. **flightBookings** - Flight lesson bookings with status
4. **weatherData** - Cached weather information with TTL
5. **weatherConflicts** - Detected weather safety violations
6. **rescheduleOptions** - AI-generated rescheduling suggestions
7. **notifications** - In-app notification system
8. **auditLog** - Complete action tracking

### Weather Minimums by Training Level

| Training Level | Visibility | Ceiling | Wind | Special |
|---------------|-----------|---------|------|---------|
| Student Pilot | > 5 mi | Clear skies | < 10 kt | No clouds |
| Private Pilot | > 3 mi | > 1000 ft | < 15 kt | VFR only |
| Instrument Rated | > 1 mi | Any | < 25 kt | No T-storms/icing |

## Notification System

The system automatically sends real-time notifications to students and instructors for important events:

### Notification Types

1. **Weather Conflict Detected** (High/Medium Priority)
   - Triggered when weather violates training-level minimums
   - Includes violation details and severity level
   - Sent to both student and instructor

2. **Reschedule Suggestions Available** (Medium Priority)
   - Triggered when AI generates new reschedule options
   - Shows number of available options
   - Links to reschedule details

3. **Booking Confirmed** (Low Priority)
   - Sent when new booking is created
   - Includes date, time, and location
   - Confirms lesson with both parties

4. **Booking Cancelled** (Medium Priority)
   - Triggered when booking status changes to cancelled
   - Includes cancellation reason (if provided)
   - Notifies all involved parties

### Features

- Real-time delivery via Convex subscriptions
- Unread badge counter by priority level
- Mark as read / Mark all as read
- Filter by read/unread status
- Automatic deduplication (no spam)
- Linked to related bookings
- "Time ago" timestamps
- Priority-based visual indicators

### Integration Points

Notifications are automatically triggered by:
- `conflicts.ts` → Creates conflict notifications
- `reschedule.ts` → Creates reschedule suggestion notifications
- `bookings.ts` → Creates booking confirmation/cancellation notifications

Test the notification system in the dashboard by:
1. Creating a booking
2. Checking weather for the booking location
3. If weather violates minimums, conflict notification is sent
4. Generating reschedule options creates another notification
5. View notifications in the Notification Center section

## Project Structure

```
flight-rescheduler/
├── convex/
│   ├── schema.ts           # Database schema (8 tables)
│   ├── students.ts         # Student CRUD operations
│   ├── instructors.ts      # Instructor CRUD operations
│   ├── bookings.ts         # Booking management + notifications
│   ├── weather.ts          # Weather API + caching (30-min TTL)
│   ├── conflicts.ts        # Weather conflict detection + severity
│   ├── reschedule.ts       # AI reschedule generation (OpenAI/Anthropic)
│   ├── notifications.ts    # In-app notification system
│   ├── audit.ts            # Audit trail + compliance logging
│   ├── crons.ts            # Scheduled jobs (weather monitoring)
│   └── index.ts            # API barrel exports
├── src/
│   ├── App.tsx             # Main dashboard with all components
│   ├── index.css           # Responsive styles (mobile/tablet/desktop)
│   └── main.tsx            # App entry point + Convex provider
├── .taskmaster/            # Task management (TaskMaster AI)
├── README.md               # This file
├── ARCHITECTURE.md         # System architecture documentation
├── DEMO_SCRIPT.md          # Demo walkthrough script
├── SETUP.md                # Setup and troubleshooting
└── START-HERE.md           # Quick start guide
```

## Development Workflow

This project uses TaskMaster AI for task management:

```bash
# View all tasks
tm list

# Get next task to work on
tm next

# Update task status
tm set-status --id=1 --status=done

# View specific task details
tm show 1
```

## License

ISC

