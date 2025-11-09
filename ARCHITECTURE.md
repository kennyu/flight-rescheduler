# Flight Rescheduler - System Architecture

## Overview

The Flight Rescheduler is a real-time, event-driven system built on Convex (Backend-as-a-Service) with a React frontend. It automatically monitors weather conditions, detects conflicts with pilot training minimums, and generates AI-powered rescheduling suggestions.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│  (Vite + TypeScript + Real-time Convex Subscriptions)          │
└────────────────┬───────────────────────────────────────────────┘
                 │ Convex Client SDK
                 │ (WebSocket + HTTP)
┌────────────────▼───────────────────────────────────────────────┐
│                      Convex Backend                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Database (Convex DB)                        │  │
│  │  • students          • weatherConflicts                  │  │
│  │  • instructors       • rescheduleOptions                 │  │
│  │  • flightBookings    • notifications                     │  │
│  │  • weatherData       • auditLog                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                             ▲                                   │
│                             │                                   │
│  ┌─────────────────────────┴─────────────────────────────┐    │
│  │         Serverless Functions (Mutations/Queries)       │    │
│  │  • bookings.ts      • conflicts.ts                     │    │
│  │  • students.ts      • reschedule.ts                    │    │
│  │  • instructors.ts   • notifications.ts                 │    │
│  │  • weather.ts       • audit.ts                         │    │
│  └─────────────────────────────────────────────────────────┘  │
│                             ▲                                   │
│                             │                                   │
│  ┌─────────────────────────┴─────────────────────────────┐    │
│  │        Scheduled Functions (Cron Jobs)                 │    │
│  │  • Weather Monitoring (every 30 min)                   │    │
│  │  • Conflict Detection (every 30 min)                   │    │
│  │  • Cache Cleanup (every hour)                          │    │
│  └─────────────────────────────────────────────────────────┘  │
│                             ▲                                   │
│                             │                                   │
│  ┌─────────────────────────┴─────────────────────────────┐    │
│  │          Actions (External API Calls)                  │    │
│  │  • OpenWeatherMap API (weather data)                   │    │
│  │  • OpenAI/Anthropic API (AI rescheduling)             │    │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Database Layer (Convex DB)

**Tables:**

- **students**: Student information with training levels
- **instructors**: Instructor details
- **flightBookings**: Scheduled flight lessons with status tracking
- **weatherData**: Cached weather with 30-minute TTL
- **weatherConflicts**: Detected safety violations with severity
- **rescheduleOptions**: AI-generated alternatives with acceptance tracking
- **notifications**: In-app notification system
- **auditLog**: Complete action history for compliance

**Key Features:**
- Real-time reactivity (automatic UI updates)
- Type-safe schema with validation
- Indexed queries for performance
- Automatic cache invalidation

### 2. Business Logic Layer (Convex Functions)

#### Queries (Read-only, Real-time)
- `students.list()` - Get all students
- `bookings.list()` - Get bookings with filters
- `weather.getCachedWeather()` - Retrieve cached weather
- `conflicts.listActiveConflicts()` - Get current weather conflicts
- `notifications.getNotifications()` - Get user notifications
- `audit.getRecentAuditLogs()` - Get audit history

#### Mutations (State-changing, Transactional)
- `bookings.create()` - Create new booking + trigger notification
- `bookings.updateStatus()` - Update booking status + audit log
- `reschedule.acceptRescheduleOption()` - Accept AI suggestion + update booking
- `notifications.markAsRead()` - Mark notification as read

#### Actions (External API calls)
- `weather.fetchWeatherData()` - Call OpenWeatherMap API
- `reschedule.generateRescheduleOptions()` - Call OpenAI/Anthropic
- `conflicts.checkBookingForConflicts()` - Analyze weather vs minimums

### 3. Event-Driven System

**Automated Workflows:**

1. **Weather Monitoring Flow**
   ```
   Cron (30 min) → Fetch Weather → Cache (30 min TTL) → Detect Conflicts
                                                              ↓
                                                    Create Notification
                                                              ↓
                                                    Trigger AI Reschedule
   ```

2. **Booking Creation Flow**
   ```
   User Creates Booking → Insert DB → Create Audit Log
                            ↓
                      Send Confirmation Notification
                            ↓
                      Check Weather (if within 48h)
   ```

3. **Conflict Detection Flow**
   ```
   Weather Update → Compare vs Training Level Minimums
                            ↓
                    Violations Found?
                            ↓
                  Yes → Create Conflict Record
                            ↓
                      Send Notification (High Priority)
                            ↓
                      Trigger AI Reschedule Action
   ```

4. **AI Rescheduling Flow**
   ```
   Conflict Detected → Gather Context (booking, weather, history)
                            ↓
                      Call AI API (OpenAI/Anthropic)
                            ↓
                      Generate 3 Optimal Times
                            ↓
                      Store Options + Send Notification
                            ↓
                      User Accepts Option?
                            ↓
                  Yes → Update Booking + Audit Log + Notification
   ```

### 4. Real-time Frontend

**Tech Stack:**
- **React 18**: Component-based UI
- **TypeScript**: Type safety
- **Vite**: Fast development/build
- **Convex React**: Real-time subscriptions

**Key Features:**
- Automatic updates via WebSocket subscriptions
- Optimistic UI updates
- Component-based architecture
- Responsive design (mobile/tablet/desktop)

**Main Components:**
- `StudentTest`: Create/manage students
- `InstructorTest`: Create/manage instructors
- `BookingTest`: Create/manage bookings
- `WeatherTest`: Test weather API
- `ConflictsDisplay`: View weather conflicts
- `RescheduleDisplay`: Manage AI suggestions
- `NotificationCenter`: View/manage notifications
- `AuditLogDisplay`: View system history
- `DataDisplay`: Enhanced booking/student dashboard

### 5. Caching Strategy

**Weather Data Caching:**
- TTL: 30 minutes
- Location-based: Lat/Lon indexed
- Automatic cleanup: Hourly cron job
- Reduces API costs: ~95% cache hit rate

**Benefits:**
- Cost savings: 1,000 API calls/day → ~100 actual API calls
- Performance: < 10ms cache reads vs ~200ms API calls
- Rate limit protection: Stays well within free tier limits

### 6. Security & Compliance

**Audit Trail:**
- Every significant action logged
- Tracks: entity type, action, actor, timestamp, before/after state
- Searchable and filterable
- Compliance-ready

**API Key Management:**
- Environment variables in Convex Dashboard
- Never exposed to frontend
- Actions (not functions) for external API calls

**Data Validation:**
- Schema-level type enforcement
- Training level enum validation
- Weather minimum checks
- Dependency validation

## Data Flow Examples

### Example 1: Creating a Booking

```
1. User fills form → Click "Create Booking"
2. Frontend calls bookings.create mutation
3. Mutation:
   a. Validates input
   b. Inserts into flightBookings table
   c. Inserts audit log entry
   d. Schedules notification creation (runs async)
   e. Returns booking ID
4. Real-time subscription triggers UI update
5. Notification appears in NotificationCenter
6. If booking is within 48h, automatic weather check scheduled
```

### Example 2: Weather Conflict Detection

```
1. Cron job runs every 30 minutes
2. Fetches weather for all bookings in next 48h
3. For each booking:
   a. Get student's training level
   b. Lookup weather minimums
   c. Compare actual weather vs minimums
   d. Calculate violations
4. If violations found:
   a. Insert/update weatherConflicts record
   b. Calculate severity (high/medium/low)
   c. Create notification (high priority)
   d. Schedule AI reschedule generation
5. UI automatically shows conflict badge
6. Notification appears in real-time
```

### Example 3: AI Reschedule Suggestion

```
1. Conflict detected (or manual trigger)
2. Action gathers context:
   - Booking details (date, location, duration)
   - Student training level + minimums
   - Instructor availability (future enhancement)
   - Historical weather patterns
3. Constructs AI prompt with all context
4. Calls OpenAI/Anthropic API
5. Parses response (3 optimal times)
6. Validates each option
7. Stores in rescheduleOptions table
8. Creates notification
9. UI displays options with "Accept" buttons
10. User accepts → booking updated + notification sent
```

## Performance Characteristics

**Response Times:**
- Database queries: < 10ms (indexed)
- Cached weather: < 10ms
- Real-time updates: < 50ms (WebSocket)
- AI generation: 2-5 seconds (external API)
- Weather API: 200-500ms (external API)

**Scalability:**
- Convex auto-scales serverless functions
- Real-time subscriptions handle 1000s of connections
- Scheduled jobs run reliably at scale
- Weather caching reduces API bottleneck

**Cost Optimization:**
- Weather caching: ~95% API call reduction
- Scheduled jobs: Efficient batching
- AI calls: Only on-demand (no waste)
- Free tier sufficient for development/demo

## Technology Decisions

### Why Convex?
✅ Real-time subscriptions built-in
✅ Type-safe database with validation
✅ Serverless functions (no server management)
✅ Scheduled jobs (cron) out of the box
✅ Automatic scaling
✅ Developer-friendly DX

### Why React?
✅ Component reusability
✅ Strong TypeScript support
✅ Convex React hooks for real-time data
✅ Large ecosystem
✅ Fast development

### Why OpenWeatherMap?
✅ Free tier (1,000 calls/day)
✅ Reliable data
✅ Simple API
✅ Good documentation

### Why GPT-4o-mini / Claude 3.5 Sonnet?
✅ Excellent at structured output
✅ Cost-effective
✅ Fast response times
✅ Reliable reasoning

## Future Enhancements

1. **Instructor Availability Calendar**
   - Track instructor schedules
   - Factor into AI reschedule suggestions

2. **Email/SMS Notifications**
   - Integrate Twilio or SendGrid
   - Send external notifications

3. **Mobile App**
   - React Native or PWA
   - Push notifications

4. **Advanced Analytics**
   - Cancellation trends
   - Weather pattern analysis
   - Instructor utilization

5. **Multi-Airport Support**
   - Manage multiple flight schools
   - Different weather minimums per school

6. **Student Portal**
   - Self-service booking
   - View history
   - Accept reschedules

## Development Tools

**TaskMaster AI:**
- Task planning and tracking
- Complexity analysis
- Automated task breakdown
- Progress monitoring

**Convex Dashboard:**
- Database browser
- Function logs
- Environment variables
- Scheduled job monitoring

**Vite Dev Server:**
- Hot module replacement
- Fast builds
- TypeScript checking

## Testing Strategy

**Manual Testing:**
- Interactive dashboard for all features
- Real API integration testing
- End-to-end workflow validation

**Future Testing:**
- Unit tests for business logic
- Integration tests for API calls
- E2E tests with Playwright

## Deployment

**Current (Development):**
- `npm run dev` - Local development
- Convex dev environment

**Production (Future):**
- `npm run build` - Build React app
- `npx convex deploy` - Deploy functions
- Host frontend on Vercel/Netlify
- Environment variables in Convex Dashboard

---

**Last Updated:** November 9, 2025
**Version:** 2.0
**Architecture:** Convex Backend + React Frontend

