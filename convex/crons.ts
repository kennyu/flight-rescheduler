import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Scheduled Jobs (Cron)
 * 
 * Automated background tasks that run on a schedule.
 * 
 * Cron Expression Format:
 * ┌───────────── minute (0 - 59)
 * │ ┌───────────── hour (0 - 23)
 * │ │ ┌───────────── day of month (1 - 31)
 * │ │ │ ┌───────────── month (1 - 12)
 * │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
 * │ │ │ │ │
 * * * * * *
 */

const crons = cronJobs();

/**
 * Weather Monitoring & Conflict Detection - Every 30 minutes
 * 1. Fetches weather data for all active bookings in the next 48 hours
 * 2. Checks for weather conflicts based on student training levels
 */
crons.interval(
  "fetch weather for active bookings",
  { minutes: 30 }, // Run every 30 minutes
  internal.weather.fetchWeatherForActiveBookings
);

/**
 * Weather Conflict Detection - Every 30 minutes (5 min after weather fetch)
 * Checks all active bookings for weather safety violations
 */
crons.interval(
  "check weather conflicts",
  { minutes: 30 }, // Run every 30 minutes
  internal.conflicts.checkAllActiveBookings
);

/**
 * Weather Cache Cleanup - Every hour
 * Removes expired weather data to keep the database clean
 */
crons.interval(
  "cleanup expired weather data",
  { hours: 1 }, // Run every hour
  internal.weather.cleanupExpiredWeather
);

/**
 * Alternative: Run weather checks more frequently (every 15 minutes)
 * Uncomment this and comment out the 30-minute job if you need more frequent updates
 */
// crons.interval(
//   "fetch weather for active bookings (frequent)",
//   { minutes: 15 },
//   internal.weather.fetchWeatherForActiveBookings
// );

/**
 * Alternative: Custom schedule using cron expressions
 * Example: Run at the top of every hour
 */
// crons.cron(
//   "fetch weather hourly",
//   "0 * * * *",
//   internal.weather.fetchWeatherForActiveBookings
// );

export default crons;

