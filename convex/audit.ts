/**
 * Audit Log Module
 * Provides queries to retrieve audit trail entries for compliance and analysis
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

// ===== PUBLIC QUERIES =====

/**
 * Get audit log for a specific entity
 */
export const getAuditLogForEntity = query({
  args: {
    entityType: v.union(
      v.literal("booking"),
      v.literal("weather"),
      v.literal("reschedule"),
      v.literal("notification")
    ),
    entityId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_entity", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .order("desc")
      .take(limit);

    return logs;
  },
});

/**
 * Get recent audit logs (all entities)
 */
export const getRecentAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
    entityType: v.optional(
      v.union(
        v.literal("booking"),
        v.literal("weather"),
        v.literal("reschedule"),
        v.literal("notification")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    let logsQuery = ctx.db.query("auditLog").withIndex("by_timestamp");

    const logs = await logsQuery.order("desc").take(limit);

    // Filter by entity type if specified
    if (args.entityType) {
      return logs.filter((log) => log.entityType === args.entityType);
    }

    return logs;
  },
});

/**
 * Get audit logs by action type
 */
export const getAuditLogsByAction = query({
  args: {
    action: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_action", (q) => q.eq("action", args.action))
      .order("desc")
      .take(limit);

    return logs;
  },
});

/**
 * Get audit statistics
 */
export const getAuditStatistics = query({
  args: {
    since: v.optional(v.number()), // Timestamp
  },
  handler: async (ctx, args) => {
    const since = args.since || Date.now() - 7 * 24 * 60 * 60 * 1000; // Last 7 days

    // Get all logs since timestamp
    const allLogs = await ctx.db.query("auditLog").collect();
    const recentLogs = allLogs.filter((log) => log.timestamp >= since);

    // Count by entity type
    const byEntityType = recentLogs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by action
    const byAction = recentLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by actor type
    const byActorType = recentLogs.reduce((acc, log) => {
      const actor = log.actorType || "unknown";
      acc[actor] = (acc[actor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs: recentLogs.length,
      byEntityType,
      byAction,
      byActorType,
      timeRange: {
        since,
        until: Date.now(),
      },
    };
  },
});

/**
 * Search audit logs
 */
export const searchAuditLogs = query({
  args: {
    searchTerm: v.optional(v.string()),
    entityType: v.optional(
      v.union(
        v.literal("booking"),
        v.literal("weather"),
        v.literal("reschedule"),
        v.literal("notification")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const startDate = args.startDate || 0;
    const endDate = args.endDate || Date.now();

    // Get logs in date range
    const allLogs = await ctx.db.query("auditLog").collect();
    let logs = allLogs.filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );

    // Filter by entity type
    if (args.entityType) {
      logs = logs.filter((log) => log.entityType === args.entityType);
    }

    // Search in action and entity ID
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.action.toLowerCase().includes(term) ||
          log.entityId.toLowerCase().includes(term) ||
          (log.actorId && log.actorId.toLowerCase().includes(term))
      );
    }

    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp - a.timestamp);

    return logs.slice(0, limit);
  },
});

