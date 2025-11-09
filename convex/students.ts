import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Student Management Operations
 * 
 * Handles student CRUD operations including training level management
 */

// ===== MUTATIONS =====

/**
 * Create a new student
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    trainingLevel: v.union(
      v.literal("student-pilot"),
      v.literal("private-pilot"),
      v.literal("instrument-rated")
    ),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("Student with this email already exists");
    }

    const now = Date.now();

    const studentId = await ctx.db.insert("students", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      trainingLevel: args.trainingLevel,
      createdAt: now,
      updatedAt: now,
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "booking", // Using booking as closest match
      entityId: studentId,
      action: "student_created",
      actorType: "system",
      timestamp: now,
      newState: { trainingLevel: args.trainingLevel },
    });

    return studentId;
  },
});

/**
 * Update student information
 */
export const update = mutation({
  args: {
    studentId: v.id("students"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    trainingLevel: v.optional(
      v.union(
        v.literal("student-pilot"),
        v.literal("private-pilot"),
        v.literal("instrument-rated")
      )
    ),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // If email is being changed, check for duplicates
    if (args.email && args.email !== student.email) {
      const existing = await ctx.db
        .query("students")
        .withIndex("by_email", (q) => q.eq("email", args.email!))
        .first();

      if (existing) {
        throw new Error("Student with this email already exists");
      }
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.name) updates.name = args.name;
    if (args.email) updates.email = args.email;
    if (args.phone) updates.phone = args.phone;
    if (args.trainingLevel) updates.trainingLevel = args.trainingLevel;

    await ctx.db.patch(args.studentId, updates);

    return { success: true };
  },
});

/**
 * Delete a student (only if no bookings exist)
 */
export const remove = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Check for existing bookings
    const bookings = await ctx.db
      .query("flightBookings")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .first();

    if (bookings) {
      throw new Error(
        "Cannot delete student with existing bookings. Cancel bookings first."
      );
    }

    await ctx.db.delete(args.studentId);

    return { success: true };
  },
});

// ===== QUERIES =====

/**
 * Get a single student by ID
 */
export const get = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.studentId);
  },
});

/**
 * Get student by email
 */
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * List all students with optional filtering
 */
export const list = query({
  args: {
    trainingLevel: v.optional(
      v.union(
        v.literal("student-pilot"),
        v.literal("private-pilot"),
        v.literal("instrument-rated")
      )
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("students");

    if (args.trainingLevel) {
      query = query.withIndex("by_training_level", (q) =>
        q.eq("trainingLevel", args.trainingLevel!)
      );
    }

    return await query.collect();
  },
});

/**
 * Get students with upcoming bookings
 */
export const getWithUpcomingBookings = query({
  handler: async (ctx) => {
    const now = Date.now();
    const students = await ctx.db.query("students").collect();

    const studentsWithBookings = await Promise.all(
      students.map(async (student) => {
        const upcomingBookings = await ctx.db
          .query("flightBookings")
          .withIndex("by_student_and_status", (q) =>
            q.eq("studentId", student._id).eq("status", "scheduled")
          )
          .collect();

        const futureBookings = upcomingBookings.filter(
          (b) => b.scheduledDate >= now
        );

        return {
          ...student,
          upcomingBookingsCount: futureBookings.length,
          nextBookingDate:
            futureBookings.length > 0
              ? Math.min(...futureBookings.map((b) => b.scheduledDate))
              : null,
        };
      })
    );

    return studentsWithBookings;
  },
});

