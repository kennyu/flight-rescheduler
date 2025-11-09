import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Flight Booking CRUD Operations
 * 
 * Handles all booking lifecycle management including creation,
 * updates, status transitions, and retrieval operations.
 */

// ===== MUTATIONS (Write Operations) =====

/**
 * Create a new flight booking
 * Validates student and instructor existence before creating
 */
export const create = mutation({
  args: {
    studentId: v.id("students"),
    instructorId: v.id("instructors"),
    scheduledDate: v.number(), // Unix timestamp
    departureLocation: v.object({
      name: v.string(),
      lat: v.number(),
      lon: v.number(),
    }),
    destinationLocation: v.optional(
      v.object({
        name: v.string(),
        lat: v.number(),
        lon: v.number(),
      })
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate student exists
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Validate instructor exists
    const instructor = await ctx.db.get(args.instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    // Validate scheduledDate is in the future
    if (args.scheduledDate < now) {
      throw new Error("Scheduled date must be in the future");
    }

    // Create booking
    const bookingId = await ctx.db.insert("flightBookings", {
      studentId: args.studentId,
      instructorId: args.instructorId,
      scheduledDate: args.scheduledDate,
      departureLocation: args.departureLocation,
      destinationLocation: args.destinationLocation,
      status: "scheduled",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "booking",
      entityId: bookingId,
      action: "created",
      actorType: "system",
      timestamp: now,
      details: {
        studentId: args.studentId,
        instructorId: args.instructorId,
        scheduledDate: args.scheduledDate,
      },
      newState: { status: "scheduled" },
    });

    // Trigger booking confirmation notification
    await ctx.scheduler.runAfter(0, internal.notifications.createBookingConfirmedNotification, {
      bookingId,
      studentId: args.studentId,
      instructorId: args.instructorId,
    });

    return bookingId;
  },
});

/**
 * Update booking status with validation
 * Enforces valid status transitions
 */
export const updateStatus = mutation({
  args: {
    bookingId: v.id("flightBookings"),
    newStatus: v.union(
      v.literal("scheduled"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
      v.literal("completed"),
      v.literal("weather-conflict")
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const previousStatus = booking.status;

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      scheduled: ["cancelled", "completed", "weather-conflict", "rescheduled"],
      "weather-conflict": ["cancelled", "rescheduled", "scheduled"],
      rescheduled: ["scheduled", "cancelled", "completed"],
      cancelled: [], // Terminal state
      completed: [], // Terminal state
    };

    if (!validTransitions[previousStatus]?.includes(args.newStatus)) {
      throw new Error(
        `Invalid status transition from ${previousStatus} to ${args.newStatus}`
      );
    }

    const now = Date.now();

    // Update booking
    await ctx.db.patch(args.bookingId, {
      status: args.newStatus,
      updatedAt: now,
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "booking",
      entityId: args.bookingId,
      action: "status_updated",
      actorType: "system",
      timestamp: now,
      details: { reason: args.reason },
      previousState: { status: previousStatus },
      newState: { status: args.newStatus },
    });

    // Trigger cancellation notification if status changed to cancelled
    if (args.newStatus === "cancelled") {
      await ctx.scheduler.runAfter(0, internal.notifications.createBookingCancelledNotification, {
        bookingId: args.bookingId,
        studentId: booking.studentId,
        instructorId: booking.instructorId,
        reason: args.reason,
      });
    }

    return { success: true, previousStatus, newStatus: args.newStatus };
  },
});

/**
 * Reschedule a booking to a new date/time
 */
export const reschedule = mutation({
  args: {
    bookingId: v.id("flightBookings"),
    newScheduledDate: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Validate new date is in the future
    const now = Date.now();
    if (args.newScheduledDate < now) {
      throw new Error("New scheduled date must be in the future");
    }

    const previousDate = booking.scheduledDate;

    // Update booking
    await ctx.db.patch(args.bookingId, {
      scheduledDate: args.newScheduledDate,
      status: "rescheduled",
      updatedAt: now,
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "booking",
      entityId: args.bookingId,
      action: "rescheduled",
      actorType: "system",
      timestamp: now,
      details: { reason: args.reason },
      previousState: { scheduledDate: previousDate },
      newState: { scheduledDate: args.newScheduledDate },
    });

    return { success: true, previousDate, newDate: args.newScheduledDate };
  },
});

/**
 * Update booking notes
 */
export const updateNotes = mutation({
  args: {
    bookingId: v.id("flightBookings"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    await ctx.db.patch(args.bookingId, {
      notes: args.notes,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a booking (soft delete by marking as cancelled)
 */
export const remove = mutation({
  args: {
    bookingId: v.id("flightBookings"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const now = Date.now();

    // Soft delete by updating status
    await ctx.db.patch(args.bookingId, {
      status: "cancelled",
      updatedAt: now,
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "booking",
      entityId: args.bookingId,
      action: "deleted",
      actorType: "system",
      timestamp: now,
      details: { reason: args.reason },
      previousState: { status: booking.status },
      newState: { status: "cancelled" },
    });

    return { success: true };
  },
});

// ===== QUERIES (Read Operations) =====

/**
 * Get a single booking by ID with related data
 */
export const get = query({
  args: { bookingId: v.id("flightBookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) {
      return null;
    }

    // Fetch related student and instructor
    const student = await ctx.db.get(booking.studentId);
    const instructor = await ctx.db.get(booking.instructorId);

    return {
      ...booking,
      student,
      instructor,
    };
  },
});

/**
 * List all bookings with optional filtering
 */
export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("cancelled"),
        v.literal("rescheduled"),
        v.literal("completed"),
        v.literal("weather-conflict")
      )
    ),
    studentId: v.optional(v.id("students")),
    instructorId: v.optional(v.id("instructors")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let bookings;

    // Apply filters
    if (args.status) {
      bookings = await ctx.db
        .query("flightBookings")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else if (args.studentId) {
      bookings = await ctx.db
        .query("flightBookings")
        .withIndex("by_student", (q) => q.eq("studentId", args.studentId!))
        .collect();
    } else if (args.instructorId) {
      bookings = await ctx.db
        .query("flightBookings")
        .withIndex("by_instructor", (q) => q.eq("instructorId", args.instructorId!))
        .collect();
    } else {
      bookings = await ctx.db.query("flightBookings").collect();
    }

    // Sort by scheduled date (descending - newest first)
    bookings.sort((a, b) => b.scheduledDate - a.scheduledDate);

    // Apply limit if specified
    if (args.limit) {
      bookings = bookings.slice(0, args.limit);
    }

    // Enrich with student and instructor data
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const student = await ctx.db.get(booking.studentId);
        const instructor = await ctx.db.get(booking.instructorId);
        return {
          ...booking,
          student,
          instructor,
        };
      })
    );

    return enrichedBookings;
  },
});

/**
 * Get upcoming bookings (scheduled in the future)
 */
export const getUpcoming = query({
  args: {
    studentId: v.optional(v.id("students")),
    instructorId: v.optional(v.id("instructors")),
    hoursAhead: v.optional(v.number()), // Default 48 hours
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const hoursAhead = args.hoursAhead ?? 48;
    const futureTime = now + hoursAhead * 60 * 60 * 1000;

    let bookingsQuery = ctx.db.query("flightBookings");

    // Filter by student or instructor if provided
    if (args.studentId) {
      bookingsQuery = bookingsQuery.withIndex("by_student_and_status", (q) =>
        q.eq("studentId", args.studentId!).eq("status", "scheduled")
      );
    } else if (args.instructorId) {
      bookingsQuery = bookingsQuery.withIndex("by_instructor_and_status", (q) =>
        q.eq("instructorId", args.instructorId!).eq("status", "scheduled")
      );
    } else {
      bookingsQuery = bookingsQuery.withIndex("by_status", (q) =>
        q.eq("status", "scheduled")
      );
    }

    const bookings = await bookingsQuery.collect();

    // Filter by date range
    const upcomingBookings = bookings.filter(
      (b) => b.scheduledDate >= now && b.scheduledDate <= futureTime
    );

    // Enrich with student and instructor data
    const enrichedBookings = await Promise.all(
      upcomingBookings.map(async (booking) => {
        const student = await ctx.db.get(booking.studentId);
        const instructor = await ctx.db.get(booking.instructorId);
        return {
          ...booking,
          student,
          instructor,
        };
      })
    );

    return enrichedBookings.sort((a, b) => a.scheduledDate - b.scheduledDate);
  },
});

/**
 * Get bookings by date range
 */
export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    status: v.optional(
      v.union(
        v.literal("scheduled"),
        v.literal("cancelled"),
        v.literal("rescheduled"),
        v.literal("completed"),
        v.literal("weather-conflict")
      )
    ),
  },
  handler: async (ctx, args) => {
    let bookingsQuery = ctx.db
      .query("flightBookings")
      .withIndex("by_scheduled_date");

    const bookings = await bookingsQuery.collect();

    // Filter by date range and optional status
    const filteredBookings = bookings.filter((b) => {
      const inDateRange =
        b.scheduledDate >= args.startDate && b.scheduledDate <= args.endDate;
      const matchesStatus = args.status ? b.status === args.status : true;
      return inDateRange && matchesStatus;
    });

    // Enrich with student and instructor data
    const enrichedBookings = await Promise.all(
      filteredBookings.map(async (booking) => {
        const student = await ctx.db.get(booking.studentId);
        const instructor = await ctx.db.get(booking.instructorId);
        return {
          ...booking,
          student,
          instructor,
        };
      })
    );

    return enrichedBookings.sort((a, b) => a.scheduledDate - b.scheduledDate);
  },
});

/**
 * Get bookings with active weather conflicts
 */
export const getWithConflicts = query({
  handler: async (ctx) => {
    const bookings = await ctx.db
      .query("flightBookings")
      .withIndex("by_status", (q) => q.eq("status", "weather-conflict"))
      .collect();

    // Enrich with student, instructor, and conflict data
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const student = await ctx.db.get(booking.studentId);
        const instructor = await ctx.db.get(booking.instructorId);

        // Get active conflicts for this booking
        const conflicts = await ctx.db
          .query("weatherConflicts")
          .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
          .filter((q) => q.eq(q.field("resolved"), false))
          .collect();

        return {
          ...booking,
          student,
          instructor,
          conflicts,
        };
      })
    );

    return enrichedBookings;
  },
});

/**
 * Get booking statistics
 */
export const getStats = query({
  args: {
    studentId: v.optional(v.id("students")),
    instructorId: v.optional(v.id("instructors")),
  },
  handler: async (ctx, args) => {
    let bookingsQuery = ctx.db.query("flightBookings");

    if (args.studentId) {
      bookingsQuery = bookingsQuery.withIndex("by_student", (q) =>
        q.eq("studentId", args.studentId!)
      );
    } else if (args.instructorId) {
      bookingsQuery = bookingsQuery.withIndex("by_instructor", (q) =>
        q.eq("instructorId", args.instructorId!)
      );
    }

    const bookings = await bookingsQuery.collect();

    const stats = {
      total: bookings.length,
      scheduled: bookings.filter((b) => b.status === "scheduled").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
      rescheduled: bookings.filter((b) => b.status === "rescheduled").length,
      weatherConflicts: bookings.filter((b) => b.status === "weather-conflict")
        .length,
    };

    return stats;
  },
});

