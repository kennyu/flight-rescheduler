import { v } from "convex/values";
import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Weather Conflict Detection
 * 
 * Compares weather data against training-level-specific minimums
 * and flags unsafe bookings as conflicts.
 * 
 * Weather Minimums:
 * - Student Pilot: Visibility > 5 mi, Clear skies, Winds < 10 kt
 * - Private Pilot: Visibility > 3 mi, Ceiling > 1000 ft, Winds < 15 kt
 * - Instrument Rated: No thunderstorms, No icing, Winds < 25 kt (IMC acceptable)
 */

// ===== TYPES =====

type TrainingLevel = "student-pilot" | "private-pilot" | "instrument-rated";

interface WeatherMinimums {
  minVisibility?: number; // miles
  minCeiling?: number; // feet
  maxWindSpeed: number; // knots
  requiresClearSkies: boolean;
  allowIMC: boolean; // Instrument Meteorological Conditions
  allowThunderstorms: boolean;
  allowIcing: boolean;
}

// ===== WEATHER MINIMUMS BY TRAINING LEVEL =====

const WEATHER_MINIMUMS: Record<TrainingLevel, WeatherMinimums> = {
  "student-pilot": {
    minVisibility: 5, // miles
    minCeiling: undefined, // Clear skies required
    maxWindSpeed: 10, // knots
    requiresClearSkies: true,
    allowIMC: false,
    allowThunderstorms: false,
    allowIcing: false,
  },
  "private-pilot": {
    minVisibility: 3, // miles
    minCeiling: 1000, // feet
    maxWindSpeed: 15, // knots
    requiresClearSkies: false,
    allowIMC: false, // VFR only
    allowThunderstorms: false,
    allowIcing: false,
  },
  "instrument-rated": {
    minVisibility: undefined, // IMC acceptable
    minCeiling: undefined, // Any ceiling acceptable
    maxWindSpeed: 25, // knots
    requiresClearSkies: false,
    allowIMC: true,
    allowThunderstorms: false,
    allowIcing: false,
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Check if weather violates training level minimums
 */
function checkWeatherViolations(
  weather: Doc<"weatherData">,
  trainingLevel: TrainingLevel
): { violations: string[]; severity: "high" | "medium" | "low" } {
  const minimums = WEATHER_MINIMUMS[trainingLevel];
  const violations: string[] = [];

  // Check visibility
  if (minimums.minVisibility && weather.visibility < minimums.minVisibility) {
    violations.push(
      `Visibility ${weather.visibility.toFixed(1)} mi < ${minimums.minVisibility} mi required`
    );
  }

  // Check ceiling (cloud height)
  if (minimums.minCeiling) {
    if (!weather.ceiling) {
      // No ceiling data might mean clear or uncertain
      if (!minimums.requiresClearSkies) {
        // For private/instrument, assume worst case if no ceiling data
        violations.push(`Ceiling data unavailable (${minimums.minCeiling} ft required)`);
      }
    } else if (weather.ceiling < minimums.minCeiling) {
      violations.push(
        `Ceiling ${weather.ceiling} ft < ${minimums.minCeiling} ft required`
      );
    }
  }

  // Check clear skies requirement (student pilot)
  if (minimums.requiresClearSkies && weather.ceiling !== undefined) {
    violations.push(`Clouds present (clear skies required for student pilot)`);
  }

  // Check wind speed
  if (weather.windSpeed > minimums.maxWindSpeed) {
    violations.push(
      `Wind ${weather.windSpeed.toFixed(1)} kt > ${minimums.maxWindSpeed} kt maximum`
    );
  }

  // Check thunderstorms
  if (!minimums.allowThunderstorms && weather.hasThunderstorms) {
    violations.push(`Thunderstorms present (not allowed)`);
  }

  // Check icing
  if (!minimums.allowIcing && weather.hasIcing) {
    violations.push(`Icing conditions present (not allowed)`);
  }

  // Determine severity
  let severity: "high" | "medium" | "low" = "low";
  if (
    weather.hasThunderstorms ||
    weather.hasIcing ||
    weather.windSpeed > minimums.maxWindSpeed * 1.5
  ) {
    severity = "high";
  } else if (violations.length >= 2) {
    severity = "medium";
  }

  return { violations, severity };
}

// ===== INTERNAL ACTIONS =====

/**
 * Check a specific booking for weather conflicts
 */
export const checkBookingForConflicts = internalAction({
  args: {
    bookingId: v.id("flightBookings"),
  },
  handler: async (ctx, args) => {
    // Get booking with student info
    const booking = await ctx.runQuery(internal.conflicts.getBookingWithStudent, {
      bookingId: args.bookingId,
    });

    if (!booking) {
      console.warn(`Booking ${args.bookingId} not found`);
      return null;
    }

    if (booking.status !== "scheduled") {
      // Skip non-scheduled bookings
      return null;
    }

    // Get weather for departure location
    const weather = await ctx.runQuery(internal.conflicts.getLatestWeatherForLocation, {
      lat: booking.departureLocation.lat,
      lon: booking.departureLocation.lon,
    });

    if (!weather) {
      console.log(`No weather data available for booking ${args.bookingId}`);
      return null;
    }

    // Check for violations
    const { violations, severity } = checkWeatherViolations(
      weather,
      booking.student.trainingLevel
    );

    if (violations.length > 0) {
      // Create or update conflict
      const conflictId = await ctx.runMutation(internal.conflicts.createOrUpdateConflict, {
        bookingId: args.bookingId,
        weatherDataId: weather._id,
        studentTrainingLevel: booking.student.trainingLevel,
        violations,
        severity,
      });

      // Update booking status to weather-conflict
      await ctx.runMutation(internal.conflicts.markBookingAsConflict, {
        bookingId: args.bookingId,
      });

      return { hasConflict: true, conflictId, violations, severity };
    } else {
      // Check if there was a previous conflict that should be resolved
      await ctx.runMutation(internal.conflicts.resolveConflictsForBooking, {
        bookingId: args.bookingId,
      });

      // Update booking status back to scheduled if it was in conflict
      await ctx.runMutation(internal.conflicts.clearBookingConflict, {
        bookingId: args.bookingId,
      });

      return { hasConflict: false };
    }
  },
});

/**
 * Check all active bookings for conflicts
 */
export const checkAllActiveBookings = internalAction({
  handler: async (ctx) => {
    const now = Date.now();
    const futureTime = now + 48 * 60 * 60 * 1000; // 48 hours

    // Get all scheduled bookings in the next 48 hours
    const bookings = await ctx.runQuery(internal.conflicts.getActiveBookings, {
      startTime: now,
      endTime: futureTime,
    });

    console.log(`Checking ${bookings.length} bookings for weather conflicts`);

    const results = {
      total: bookings.length,
      conflicts: 0,
      resolved: 0,
      errors: 0,
    };

    for (const booking of bookings) {
      try {
        const result = await ctx.runAction(internal.conflicts.checkBookingForConflicts, {
          bookingId: booking._id,
        });

        if (result?.hasConflict) {
          results.conflicts++;
        } else if (result && !result.hasConflict) {
          results.resolved++;
        }
      } catch (error) {
        console.error(`Error checking booking ${booking._id}:`, error);
        results.errors++;
      }
    }

    return results;
  },
});

// ===== INTERNAL QUERIES =====

export const getBookingWithStudent = query({
  args: { bookingId: v.id("flightBookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const student = await ctx.db.get(booking.studentId);
    if (!student) return null;

    return { ...booking, student };
  },
});

export const getLatestWeatherForLocation = query({
  args: {
    lat: v.number(),
    lon: v.number(),
  },
  handler: async (ctx, args) => {
    const weatherList = await ctx.db
      .query("weatherData")
      .withIndex("by_location", (q) => q.eq("lat", args.lat).eq("lon", args.lon))
      .collect();

    if (weatherList.length === 0) return null;

    // Return the most recent
    return weatherList.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );
  },
});

export const getActiveBookings = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("flightBookings")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    // Filter by date range
    return bookings.filter(
      (b) => b.scheduledDate >= args.startTime && b.scheduledDate <= args.endTime
    );
  },
});

// ===== INTERNAL MUTATIONS =====

export const createOrUpdateConflict = internalMutation({
  args: {
    bookingId: v.id("flightBookings"),
    weatherDataId: v.id("weatherData"),
    studentTrainingLevel: v.union(
      v.literal("student-pilot"),
      v.literal("private-pilot"),
      v.literal("instrument-rated")
    ),
    violations: v.array(v.string()),
    severity: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if conflict already exists
    const existing = await ctx.db
      .query("weatherConflicts")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .filter((q) => q.eq(q.field("resolved"), false))
      .first();

    if (existing) {
      // Update existing conflict
      await ctx.db.patch(existing._id, {
        weatherDataId: args.weatherDataId,
        violatedConditions: args.violations,
        severity: args.severity,
        detectedAt: now,
      });
      return existing._id;
    } else {
      // Create new conflict
      const conflictId = await ctx.db.insert("weatherConflicts", {
        bookingId: args.bookingId,
        detectedAt: now,
        weatherDataId: args.weatherDataId,
        studentTrainingLevel: args.studentTrainingLevel,
        violatedConditions: args.violations,
        severity: args.severity,
        resolved: false,
      });

      // Trigger notification for new conflict
      const booking = await ctx.db.get(args.bookingId);
      if (booking) {
        await ctx.scheduler.runAfter(0, internal.notifications.createConflictNotification, {
          bookingId: args.bookingId,
          studentId: booking.studentId,
          instructorId: booking.instructorId,
          violations: args.violations,
          severity: args.severity,
        });
      }

      return conflictId;
    }
  },
});

export const markBookingAsConflict = internalMutation({
  args: { bookingId: v.id("flightBookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (booking && booking.status === "scheduled") {
      await ctx.db.patch(args.bookingId, {
        status: "weather-conflict",
        updatedAt: Date.now(),
      });
    }
  },
});

export const resolveConflictsForBooking = internalMutation({
  args: { bookingId: v.id("flightBookings") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const conflicts = await ctx.db
      .query("weatherConflicts")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .filter((q) => q.eq(q.field("resolved"), false))
      .collect();

    for (const conflict of conflicts) {
      await ctx.db.patch(conflict._id, {
        resolved: true,
        resolvedAt: now,
      });
    }
  },
});

export const clearBookingConflict = internalMutation({
  args: { bookingId: v.id("flightBookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (booking && booking.status === "weather-conflict") {
      await ctx.db.patch(args.bookingId, {
        status: "scheduled",
        updatedAt: Date.now(),
      });
    }
  },
});

// ===== PUBLIC QUERIES =====

/**
 * Get all active conflicts
 */
export const listActiveConflicts = query({
  handler: async (ctx) => {
    const conflicts = await ctx.db
      .query("weatherConflicts")
      .withIndex("by_resolved", (q) => q.eq("resolved", false))
      .collect();

    // Enrich with booking, student, and weather data
    const enriched = await Promise.all(
      conflicts.map(async (conflict) => {
        const booking = await ctx.db.get(conflict.bookingId);
        if (!booking) return null;

        const student = await ctx.db.get(booking.studentId);
        const instructor = await ctx.db.get(booking.instructorId);
        const weather = await ctx.db.get(conflict.weatherDataId);

        return {
          ...conflict,
          booking,
          student,
          instructor,
          weather,
        };
      })
    );

    return enriched.filter((c) => c !== null);
  },
});

/**
 * Get conflicts for a specific booking
 */
export const getConflictsByBooking = query({
  args: { bookingId: v.id("flightBookings") },
  handler: async (ctx, args) => {
    const conflicts = await ctx.db
      .query("weatherConflicts")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    // Sort by detection time (newest first)
    conflicts.sort((a, b) => b.detectedAt - a.detectedAt);

    return conflicts;
  },
});

/**
 * Get conflict statistics
 */
export const getConflictStats = query({
  handler: async (ctx) => {
    const allConflicts = await ctx.db.query("weatherConflicts").collect();

    const active = allConflicts.filter((c) => !c.resolved);
    const resolved = allConflicts.filter((c) => c.resolved);

    const bySeverity = {
      high: active.filter((c) => c.severity === "high").length,
      medium: active.filter((c) => c.severity === "medium").length,
      low: active.filter((c) => c.severity === "low").length,
    };

    const byTrainingLevel = {
      studentPilot: active.filter((c) => c.studentTrainingLevel === "student-pilot")
        .length,
      privatePilot: active.filter((c) => c.studentTrainingLevel === "private-pilot")
        .length,
      instrumentRated: active.filter(
        (c) => c.studentTrainingLevel === "instrument-rated"
      ).length,
    };

    return {
      total: allConflicts.length,
      active: active.length,
      resolved: resolved.length,
      bySeverity,
      byTrainingLevel,
    };
  },
});

// ===== PUBLIC MUTATIONS =====

/**
 * Manually trigger conflict check for a specific booking
 */
export const checkBooking = mutation({
  args: { bookingId: v.id("flightBookings") },
  handler: async (ctx, args) => {
    // Schedule the check to run
    await ctx.scheduler.runAfter(0, internal.conflicts.checkBookingForConflicts, {
      bookingId: args.bookingId,
    });

    return { success: true, message: "Conflict check scheduled" };
  },
});

/**
 * Manually resolve a conflict
 */
export const resolveConflict = mutation({
  args: {
    conflictId: v.id("weatherConflicts"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) {
      throw new Error("Conflict not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.conflictId, {
      resolved: true,
      resolvedAt: now,
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "weather",
      entityId: args.conflictId,
      action: "conflict_resolved",
      actorType: "system",
      timestamp: now,
      details: { reason: args.reason },
    });

    return { success: true };
  },
});

