import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Instructor Management Operations
 * 
 * Handles instructor CRUD operations
 */

// ===== MUTATIONS =====

/**
 * Create a new instructor
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("instructors")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Instructor with this email already exists");
    }

    const now = Date.now();

    const instructorId = await ctx.db.insert("instructors", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      createdAt: now,
      updatedAt: now,
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "booking", // Using booking as closest match
      entityId: instructorId,
      action: "instructor_created",
      actorType: "system",
      timestamp: now,
    });

    return instructorId;
  },
});

/**
 * Update instructor information
 */
export const update = mutation({
  args: {
    instructorId: v.id("instructors"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const instructor = await ctx.db.get(args.instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    // If email is being changed, check for duplicates
    if (args.email && args.email !== instructor.email) {
      const existing = await ctx.db
        .query("instructors")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();

      if (existing) {
        throw new Error("Instructor with this email already exists");
      }
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name) updates.name = args.name;
    if (args.email) updates.email = args.email;
    if (args.phone) updates.phone = args.phone;

    await ctx.db.patch(args.instructorId, updates);

    return { success: true };
  },
});

/**
 * Delete an instructor (only if no bookings exist)
 */
export const remove = mutation({
  args: { instructorId: v.id("instructors") },
  handler: async (ctx, args) => {
    const instructor = await ctx.db.get(args.instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    // Check for existing bookings
    const bookings = await ctx.db
      .query("flightBookings")
      .withIndex("by_instructor", (q) => q.eq("instructorId", args.instructorId))
      .first();

    if (bookings) {
      throw new Error(
        "Cannot delete instructor with existing bookings. Reassign or cancel bookings first."
      );
    }

    await ctx.db.delete(args.instructorId);

    return { success: true };
  },
});

// ===== QUERIES =====

/**
 * Get a single instructor by ID
 */
export const get = query({
  args: { instructorId: v.id("instructors") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.instructorId);
  },
});

/**
 * Get instructor by email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("instructors")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * List all instructors
 */
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("instructors").collect();
  },
});

/**
 * Get instructors with their schedule
 */
export const getWithSchedule = query({
  args: {
    hoursAhead: v.optional(v.number()), // Default 48 hours
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const hoursAhead = args.hoursAhead ?? 48;
    const futureTime = now + hoursAhead * 60 * 60 * 1000;

    const instructors = await ctx.db.query("instructors").collect();

    const instructorsWithSchedule = await Promise.all(
      instructors.map(async (instructor) => {
        const allBookings = await ctx.db
          .query("flightBookings")
          .withIndex("by_instructor_and_status", (q) =>
            q.eq("instructorId", instructor._id).eq("status", "scheduled")
          )
          .collect();

        const upcomingBookings = allBookings
          .filter((b) => b.scheduledDate >= now && b.scheduledDate <= futureTime)
          .sort((a, b) => a.scheduledDate - b.scheduledDate);

        return {
          ...instructor,
          upcomingBookingsCount: upcomingBookings.length,
          nextBookingDate:
            upcomingBookings.length > 0
              ? upcomingBookings[0].scheduledDate
              : null,
          upcomingBookings,
        };
      })
    );

    return instructorsWithSchedule;
  },
});

/**
 * Get instructor statistics
 */
export const getStats = query({
  args: { instructorId: v.id("instructors") },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("flightBookings")
      .withIndex("by_instructor", (q) => q.eq("instructorId", args.instructorId))
      .collect();

    return {
      total: bookings.length,
      scheduled: bookings.filter((b) => b.status === "scheduled").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };
  },
});

