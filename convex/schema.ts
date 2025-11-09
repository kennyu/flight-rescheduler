import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Flight Rescheduler Database Schema
 * 
 * This schema defines all data models for the weather cancellation
 * and AI rescheduling system for flight lessons.
 */

export default defineSchema({
  /**
   * Students
   * Stores student information and training level for weather minimum calculations
   */
  students: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    trainingLevel: v.union(
      v.literal("student-pilot"),
      v.literal("private-pilot"),
      v.literal("instrument-rated")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_training_level", ["trainingLevel"]),

  /**
   * Instructors
   * Stores instructor information
   */
  instructors: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_email", ["email"]),

  /**
   * Flight Bookings
   * Core booking information with status tracking
   */
  flightBookings: defineTable({
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
    status: v.union(
      v.literal("scheduled"),
      v.literal("cancelled"),
      v.literal("rescheduled"),
      v.literal("completed"),
      v.literal("weather-conflict")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_instructor", ["instructorId"])
    .index("by_status", ["status"])
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_student_and_status", ["studentId", "status"])
    .index("by_instructor_and_status", ["instructorId", "status"]),

  /**
   * Weather Data
   * Cached weather information with TTL for API optimization
   */
  weatherData: defineTable({
    locationName: v.string(),
    lat: v.number(),
    lon: v.number(),
    timestamp: v.number(), // Unix timestamp of weather observation
    fetchedAt: v.number(), // When we fetched this data
    expiresAt: v.number(), // TTL - when to refresh
    visibility: v.number(), // in miles
    ceiling: v.optional(v.number()), // in feet
    windSpeed: v.number(), // in knots
    windDirection: v.optional(v.number()), // degrees
    temperature: v.number(), // Celsius
    conditions: v.string(), // e.g., "Clear", "Clouds", "Rain", "Thunderstorm"
    hasThunderstorms: v.boolean(),
    hasIcing: v.boolean(),
    rawData: v.optional(v.string()), // JSON string of full API response
  })
    .index("by_location", ["lat", "lon"])
    .index("by_expires", ["expiresAt"])
    .index("by_location_and_expires", ["lat", "lon", "expiresAt"]),

  /**
   * Weather Conflicts
   * Detected conflicts between bookings and weather conditions
   */
  weatherConflicts: defineTable({
    bookingId: v.id("flightBookings"),
    detectedAt: v.number(),
    weatherDataId: v.id("weatherData"),
    studentTrainingLevel: v.union(
      v.literal("student-pilot"),
      v.literal("private-pilot"),
      v.literal("instrument-rated")
    ),
    violatedConditions: v.array(v.string()), // e.g., ["visibility", "wind"]
    severity: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    resolved: v.boolean(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_booking", ["bookingId"])
    .index("by_resolved", ["resolved"])
    .index("by_detected_at", ["detectedAt"]),

  /**
   * Reschedule Options
   * AI-generated rescheduling suggestions
   */
  rescheduleOptions: defineTable({
    bookingId: v.id("flightBookings"),
    conflictId: v.id("weatherConflicts"),
    suggestedDates: v.array(
      v.object({
        date: v.number(), // Unix timestamp
        reasoning: v.string(),
        weatherForecast: v.optional(v.string()),
        score: v.optional(v.number()), // 0-100 confidence score
      })
    ),
    aiModel: v.string(), // e.g., "gpt-4", "claude-3"
    aiReasoning: v.string(), // Overall reasoning from AI
    generatedAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    selectedOptionIndex: v.optional(v.number()),
  })
    .index("by_booking", ["bookingId"])
    .index("by_status", ["status"])
    .index("by_generated_at", ["generatedAt"]),

  /**
   * Notifications
   * In-app notification system for alerts and updates
   */
  notifications: defineTable({
    bookingId: v.optional(v.id("flightBookings")),
    recipientType: v.union(v.literal("student"), v.literal("instructor")),
    recipientId: v.union(v.id("students"), v.id("instructors")),
    type: v.union(
      v.literal("weather-conflict"),
      v.literal("reschedule-suggestion"),
      v.literal("booking-confirmed"),
      v.literal("booking-cancelled")
    ),
    title: v.string(),
    message: v.string(),
    priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
    read: v.boolean(),
    sentAt: v.number(),
    readAt: v.optional(v.number()),
    metadata: v.optional(v.any()), // Additional context data
  })
    .index("by_recipient", ["recipientId"])
    .index("by_type", ["type"])
    .index("by_read", ["read"])
    .index("by_recipient_and_read", ["recipientId", "read"])
    .index("by_sent_at", ["sentAt"]),

  /**
   * Audit Log
   * Track all significant actions for compliance and analysis
   */
  auditLog: defineTable({
    entityType: v.union(
      v.literal("booking"),
      v.literal("weather"),
      v.literal("reschedule"),
      v.literal("notification")
    ),
    entityId: v.string(), // Generic ID reference
    action: v.string(), // e.g., "created", "updated", "cancelled", "conflict_detected"
    actorType: v.optional(
      v.union(v.literal("student"), v.literal("instructor"), v.literal("system"))
    ),
    actorId: v.optional(v.string()),
    timestamp: v.number(),
    details: v.optional(v.any()), // JSON object with action details
    previousState: v.optional(v.any()),
    newState: v.optional(v.any()),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),
});

