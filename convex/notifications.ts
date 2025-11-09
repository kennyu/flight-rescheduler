import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * In-App Notification System
 * 
 * Delivers real-time notifications to students and instructors
 * when important events occur (conflicts, reschedules, bookings).
 */

// ===== INTERNAL MUTATIONS (Auto-triggered) =====

/**
 * Create a notification for weather conflict detection
 */
export const createConflictNotification = internalMutation({
  args: {
    bookingId: v.id("flightBookings"),
    studentId: v.id("students"),
    instructorId: v.id("instructors"),
    violations: v.array(v.string()),
    severity: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return;

    const violationText = args.violations.join(", ");
    const severityEmoji = args.severity === "high" ? "🔴" : args.severity === "medium" ? "🟡" : "🟢";

    // Notify student
    await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: "student",
      recipientId: args.studentId,
      type: "weather-conflict",
      title: `${severityEmoji} Weather Conflict Detected`,
      message: `Your flight on ${new Date(booking.scheduledDate).toLocaleString()} has unsafe weather conditions. Violations: ${violationText}`,
      priority: args.severity === "high" ? "high" : "medium",
      read: false,
      sentAt: now,
      metadata: { violations: args.violations, severity: args.severity },
    });

    // Notify instructor
    await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: "instructor",
      recipientId: args.instructorId,
      type: "weather-conflict",
      title: `${severityEmoji} Weather Conflict Detected`,
      message: `Flight on ${new Date(booking.scheduledDate).toLocaleString()} has unsafe weather. Violations: ${violationText}`,
      priority: args.severity === "high" ? "high" : "medium",
      read: false,
      sentAt: now,
      metadata: { violations: args.violations, severity: args.severity },
    });

    return { success: true };
  },
});

/**
 * Create notification for AI-generated reschedule suggestions
 */
export const createRescheduleNotification = internalMutation({
  args: {
    bookingId: v.id("flightBookings"),
    studentId: v.id("students"),
    instructorId: v.id("instructors"),
    optionsCount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return;

    // Notify student
    await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: "student",
      recipientId: args.studentId,
      type: "reschedule-suggestion",
      title: "🤖 New Reschedule Options Available",
      message: `AI has suggested ${args.optionsCount} optimal times for your flight originally scheduled on ${new Date(booking.scheduledDate).toLocaleString()}. Review the options to reschedule.`,
      priority: "medium",
      read: false,
      sentAt: now,
      metadata: { optionsCount: args.optionsCount },
    });

    // Notify instructor
    await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: "instructor",
      recipientId: args.instructorId,
      type: "reschedule-suggestion",
      title: "🤖 New Reschedule Options Available",
      message: `AI has suggested ${args.optionsCount} optimal times for the flight on ${new Date(booking.scheduledDate).toLocaleString()}.`,
      priority: "medium",
      read: false,
      sentAt: now,
      metadata: { optionsCount: args.optionsCount },
    });

    return { success: true };
  },
});

/**
 * Create notification for booking confirmation
 */
export const createBookingConfirmedNotification = internalMutation({
  args: {
    bookingId: v.id("flightBookings"),
    studentId: v.id("students"),
    instructorId: v.id("instructors"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return;

    // Notify student
    await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: "student",
      recipientId: args.studentId,
      type: "booking-confirmed",
      title: "✅ Flight Lesson Confirmed",
      message: `Your flight lesson is confirmed for ${new Date(booking.scheduledDate).toLocaleString()} at ${booking.departureLocation.name}.`,
      priority: "low",
      read: false,
      sentAt: now,
    });

    // Notify instructor
    await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: "instructor",
      recipientId: args.instructorId,
      type: "booking-confirmed",
      title: "✅ Flight Lesson Confirmed",
      message: `Flight lesson confirmed for ${new Date(booking.scheduledDate).toLocaleString()} at ${booking.departureLocation.name}.`,
      priority: "low",
      read: false,
      sentAt: now,
    });

    return { success: true };
  },
});

/**
 * Create notification for booking cancellation
 */
export const createBookingCancelledNotification = internalMutation({
  args: {
    bookingId: v.id("flightBookings"),
    studentId: v.id("students"),
    instructorId: v.id("instructors"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return;

    const reasonText = args.reason ? ` Reason: ${args.reason}` : "";

    // Notify student
    await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: "student",
      recipientId: args.studentId,
      type: "booking-cancelled",
      title: "❌ Flight Lesson Cancelled",
      message: `Your flight lesson on ${new Date(booking.scheduledDate).toLocaleString()} has been cancelled.${reasonText}`,
      priority: "medium",
      read: false,
      sentAt: now,
      metadata: args.reason ? { reason: args.reason } : undefined,
    });

    // Notify instructor
    await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: "instructor",
      recipientId: args.instructorId,
      type: "booking-cancelled",
      title: "❌ Flight Lesson Cancelled",
      message: `Flight lesson on ${new Date(booking.scheduledDate).toLocaleString()} has been cancelled.${reasonText}`,
      priority: "medium",
      read: false,
      sentAt: now,
      metadata: args.reason ? { reason: args.reason } : undefined,
    });

    return { success: true };
  },
});

// ===== PUBLIC QUERIES =====

/**
 * Get notifications for a specific recipient
 */
export const getNotifications = query({
  args: {
    recipientId: v.union(v.id("students"), v.id("instructors")),
    recipientType: v.union(v.literal("student"), v.literal("instructor")),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let notificationsQuery = ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.recipientId))
      .collect();

    const notifications = await notificationsQuery;

    // Filter by recipient type and read status
    let filtered = notifications.filter((n) => n.recipientType === args.recipientType);

    if (args.unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    // Sort by sent time (newest first)
    filtered.sort((a, b) => b.sentAt - a.sentAt);

    // Apply limit
    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Enrich with booking data
    const enriched = await Promise.all(
      filtered.map(async (notification) => {
        if (!notification.bookingId) return notification;

        const booking = await ctx.db.get(notification.bookingId);
        return {
          ...notification,
          booking,
        };
      })
    );

    return enriched;
  },
});

/**
 * Get unread notification count
 */
export const getUnreadCount = query({
  args: {
    recipientId: v.union(v.id("students"), v.id("instructors")),
    recipientType: v.union(v.literal("student"), v.literal("instructor")),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_read", (q) =>
        q.eq("recipientId", args.recipientId).eq("read", false)
      )
      .collect();

    // Filter by recipient type
    const unread = notifications.filter((n) => n.recipientType === args.recipientType);

    return {
      count: unread.length,
      byType: {
        weatherConflict: unread.filter((n) => n.type === "weather-conflict").length,
        rescheduleSuggestion: unread.filter((n) => n.type === "reschedule-suggestion")
          .length,
        bookingConfirmed: unread.filter((n) => n.type === "booking-confirmed").length,
        bookingCancelled: unread.filter((n) => n.type === "booking-cancelled").length,
      },
      highPriority: unread.filter((n) => n.priority === "high").length,
    };
  },
});

/**
 * Get all notifications (for testing/admin)
 */
export const listAll = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("notifications");

    const notifications = await query.collect();

    // Sort by sent time (newest first)
    notifications.sort((a, b) => b.sentAt - a.sentAt);

    // Apply limit
    const limited = args.limit ? notifications.slice(0, args.limit) : notifications;

    return limited;
  },
});

// ===== PUBLIC MUTATIONS =====

/**
 * Mark a notification as read
 */
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (!notification.read) {
      await ctx.db.patch(args.notificationId, {
        read: true,
        readAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Mark all notifications as read for a recipient
 */
export const markAllAsRead = mutation({
  args: {
    recipientId: v.union(v.id("students"), v.id("instructors")),
    recipientType: v.union(v.literal("student"), v.literal("instructor")),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient_and_read", (q) =>
        q.eq("recipientId", args.recipientId).eq("read", false)
      )
      .collect();

    const now = Date.now();
    const filtered = notifications.filter((n) => n.recipientType === args.recipientType);

    for (const notification of filtered) {
      await ctx.db.patch(notification._id, {
        read: true,
        readAt: now,
      });
    }

    return { success: true, markedCount: filtered.length };
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
    return { success: true };
  },
});

/**
 * Delete all read notifications for a recipient
 */
export const deleteAllRead = mutation({
  args: {
    recipientId: v.union(v.id("students"), v.id("instructors")),
    recipientType: v.union(v.literal("student"), v.literal("instructor")),
  },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.recipientId))
      .collect();

    const toDelete = notifications.filter(
      (n) => n.recipientType === args.recipientType && n.read
    );

    for (const notification of toDelete) {
      await ctx.db.delete(notification._id);
    }

    return { success: true, deletedCount: toDelete.length };
  },
});

/**
 * Manually create a notification (for testing)
 */
export const createManualNotification = mutation({
  args: {
    recipientId: v.union(v.id("students"), v.id("instructors")),
    recipientType: v.union(v.literal("student"), v.literal("instructor")),
    type: v.union(
      v.literal("weather-conflict"),
      v.literal("reschedule-suggestion"),
      v.literal("booking-confirmed"),
      v.literal("booking-cancelled")
    ),
    title: v.string(),
    message: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    bookingId: v.optional(v.id("flightBookings")),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      bookingId: args.bookingId,
      recipientType: args.recipientType,
      recipientId: args.recipientId,
      type: args.type,
      title: args.title,
      message: args.message,
      priority: args.priority,
      read: false,
      sentAt: Date.now(),
    });

    return { success: true, notificationId };
  },
});

