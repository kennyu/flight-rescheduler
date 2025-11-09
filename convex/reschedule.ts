import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * AI-Powered Rescheduling System
 * 
 * Uses OpenAI or Anthropic to generate optimal reschedule suggestions
 * when weather conflicts are detected.
 * 
 * Features:
 * - Generates 3+ reschedule options with reasoning
 * - Considers weather forecasts
 * - Respects training-level-specific weather minimums
 * - Includes confidence scores for each option
 */

// ===== TYPES =====

interface RescheduleOption {
  date: number; // Unix timestamp
  reasoning: string;
  weatherForecast?: string;
  score: number; // 0-100 confidence
}

interface AIRescheduleResponse {
  options: RescheduleOption[];
  overallReasoning: string;
  model: string;
}

// ===== WEATHER MINIMUMS =====

const WEATHER_MINIMUMS_TEXT = {
  "student-pilot": "Student Pilot requires: Visibility > 5 miles, Clear skies (no clouds), Winds < 10 knots",
  "private-pilot": "Private Pilot requires: Visibility > 3 miles, Ceiling > 1000 feet, Winds < 15 knots, VFR conditions",
  "instrument-rated": "Instrument Rated pilot allows IMC but requires: Winds < 25 knots, No thunderstorms, No icing conditions",
};

// ===== AI INTEGRATION =====

/**
 * Generate reschedule suggestions using OpenAI
 */
async function generateRescheduleWithOpenAI(
  bookingInfo: any,
  conflictInfo: any
): Promise<AIRescheduleResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured in Convex environment");
  }

  const systemPrompt = `You are an expert flight scheduling assistant for a flight school.
Your job is to suggest optimal reschedule times when weather conditions are unsafe for a student's training level.

Weather Minimums by Training Level:
- Student Pilot: Visibility > 5 mi, Clear skies (no clouds), Winds < 10 kt
- Private Pilot: Visibility > 3 mi, Ceiling > 1000 ft, Winds < 15 kt
- Instrument Rated: Winds < 25 kt, No thunderstorms, No icing (IMC acceptable)

Generate exactly 3 alternative times that:
1. Are within the next 7 days
2. Are likely to have better weather (based on typical patterns)
3. Respect the student's training level requirements
4. Prefer morning slots (8 AM - 12 PM) for better weather stability
5. Include reasoning for why each time is a good choice

Respond in JSON format with this structure:
{
  "options": [
    {
      "date": "ISO 8601 datetime string",
      "reasoning": "Why this time is optimal",
      "weatherForecast": "Expected weather summary",
      "score": 85
    }
  ],
  "overallReasoning": "Summary of the rescheduling strategy"
}`;

  const userPrompt = `Current booking:
- Student: ${bookingInfo.studentName}
- Training Level: ${bookingInfo.trainingLevel}
- Original Date: ${new Date(bookingInfo.originalDate).toLocaleString()}
- Location: ${bookingInfo.location}

Weather Conflict:
- Violations: ${conflictInfo.violations.join(", ")}
- Severity: ${conflictInfo.severity}
- Current Weather: ${conflictInfo.currentWeather}

Weather Requirements: ${WEATHER_MINIMUMS_TEXT[bookingInfo.trainingLevel as keyof typeof WEATHER_MINIMUMS_TEXT]}

Please suggest 3 optimal reschedule times within the next 7 days.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    // Convert ISO dates to Unix timestamps
    const options: RescheduleOption[] = content.options.map((opt: any) => ({
      date: new Date(opt.date).getTime(),
      reasoning: opt.reasoning,
      weatherForecast: opt.weatherForecast,
      score: opt.score || 80,
    }));

    return {
      options,
      overallReasoning: content.overallReasoning,
      model: "gpt-4o-mini",
    };
  } catch (error) {
    console.error("OpenAI error:", error);
    throw error;
  }
}

/**
 * Generate reschedule suggestions using Anthropic Claude
 */
async function generateRescheduleWithClaude(
  bookingInfo: any,
  conflictInfo: any
): Promise<AIRescheduleResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured in Convex environment");
  }

  const systemPrompt = `You are an expert flight scheduling assistant. Generate 3 optimal reschedule times for a conflicted flight lesson, considering weather minimums for the student's training level. Respond in JSON format only.`;

  const userPrompt = `Current booking:
- Student: ${bookingInfo.studentName}
- Training Level: ${bookingInfo.trainingLevel}
- Original Date: ${new Date(bookingInfo.originalDate).toLocaleString()}
- Location: ${bookingInfo.location}

Weather Conflict:
- Violations: ${conflictInfo.violations.join(", ")}
- Severity: ${conflictInfo.severity}
- Current Weather: ${conflictInfo.currentWeather}

Weather Requirements: ${WEATHER_MINIMUMS_TEXT[bookingInfo.trainingLevel as keyof typeof WEATHER_MINIMUMS_TEXT]}

Respond with JSON:
{
  "options": [{"date": "ISO datetime", "reasoning": "...", "weatherForecast": "...", "score": 85}],
  "overallReasoning": "..."
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: systemPrompt + "\n\n" + userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.content[0].text);

    // Convert ISO dates to Unix timestamps
    const options: RescheduleOption[] = content.options.map((opt: any) => ({
      date: new Date(opt.date).getTime(),
      reasoning: opt.reasoning,
      weatherForecast: opt.weatherForecast,
      score: opt.score || 80,
    }));

    return {
      options,
      overallReasoning: content.overallReasoning,
      model: "claude-3-5-sonnet-20241022",
    };
  } catch (error) {
    console.error("Anthropic error:", error);
    throw error;
  }
}

// ===== ACTIONS =====

/**
 * Generate reschedule suggestions for a conflicted booking
 */
export const generateRescheduleOptions = action({
  args: {
    bookingId: v.id("flightBookings"),
    conflictId: v.id("weatherConflicts"),
  },
  handler: async (ctx, args) => {
    // Get booking with all related data
    const data = await ctx.runQuery(internal.reschedule.getBookingForReschedule, {
      bookingId: args.bookingId,
      conflictId: args.conflictId,
    });

    if (!data) {
      throw new Error("Booking or conflict not found");
    }

    // Prepare data for AI
    const bookingInfo = {
      studentName: data.student.name,
      trainingLevel: data.student.trainingLevel,
      originalDate: data.booking.scheduledDate,
      location: data.booking.departureLocation.name,
    };

    const conflictInfo = {
      violations: data.conflict.violatedConditions,
      severity: data.conflict.severity,
      currentWeather: `${data.weather.conditions}, Visibility: ${data.weather.visibility.toFixed(1)} mi, Wind: ${data.weather.windSpeed.toFixed(1)} kt`,
    };

    // Try OpenAI first, fallback to Anthropic
    let aiResponse: AIRescheduleResponse;
    try {
      if (process.env.OPENAI_API_KEY) {
        aiResponse = await generateRescheduleWithOpenAI(bookingInfo, conflictInfo);
      } else if (process.env.ANTHROPIC_API_KEY) {
        aiResponse = await generateRescheduleWithClaude(bookingInfo, conflictInfo);
      } else {
        throw new Error("No AI API key configured (OPENAI_API_KEY or ANTHROPIC_API_KEY)");
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      // Fallback to rule-based suggestions if AI fails
      aiResponse = generateFallbackSuggestions(bookingInfo);
    }

    // Store suggestions in database
    const rescheduleId = await ctx.runMutation(
      internal.reschedule.storeRescheduleOptions,
      {
        bookingId: args.bookingId,
        conflictId: args.conflictId,
        options: aiResponse.options,
        aiModel: aiResponse.model,
        aiReasoning: aiResponse.overallReasoning,
      }
    );

    return {
      rescheduleId,
      options: aiResponse.options,
      reasoning: aiResponse.overallReasoning,
    };
  },
});

/**
 * Fallback rule-based suggestions if AI fails
 */
function generateFallbackSuggestions(bookingInfo: any): AIRescheduleResponse {
  const original = new Date(bookingInfo.originalDate);
  const options: RescheduleOption[] = [];

  // Option 1: Next day, morning
  const tomorrow = new Date(original);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  options.push({
    date: tomorrow.getTime(),
    reasoning: "Next day morning slot typically has better weather conditions and visibility.",
    weatherForecast: "Expected clear conditions",
    score: 75,
  });

  // Option 2: 2 days later, mid-morning
  const dayAfter = new Date(original);
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(10, 0, 0, 0);
  options.push({
    date: dayAfter.getTime(),
    reasoning: "Two-day buffer allows weather systems to pass. Mid-morning offers stable conditions.",
    weatherForecast: "Likely improved conditions",
    score: 80,
  });

  // Option 3: 3 days later, early morning
  const threeDays = new Date(original);
  threeDays.setDate(threeDays.getDate() + 3);
  threeDays.setHours(8, 0, 0, 0);
  options.push({
    date: threeDays.getTime(),
    reasoning: "Extended forecast window. Early morning minimizes afternoon weather instability.",
    weatherForecast: "Generally favorable",
    score: 85,
  });

  return {
    options,
    overallReasoning: "Rule-based suggestions prioritizing morning hours within 3 days for weather stability.",
    model: "fallback-rules",
  };
}

// ===== INTERNAL QUERIES =====

export const getBookingForReschedule = query({
  args: {
    bookingId: v.id("flightBookings"),
    conflictId: v.id("weatherConflicts"),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    const student = await ctx.db.get(booking.studentId);
    if (!student) return null;

    const conflict = await ctx.db.get(args.conflictId);
    if (!conflict) return null;

    const weather = await ctx.db.get(conflict.weatherDataId);
    if (!weather) return null;

    return { booking, student, conflict, weather };
  },
});

// ===== INTERNAL MUTATIONS =====

export const storeRescheduleOptions = internalMutation({
  args: {
    bookingId: v.id("flightBookings"),
    conflictId: v.id("weatherConflicts"),
    options: v.array(
      v.object({
        date: v.number(),
        reasoning: v.string(),
        weatherForecast: v.optional(v.string()),
        score: v.number(),
      })
    ),
    aiModel: v.string(),
    aiReasoning: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if suggestions already exist
    const existing = await ctx.db
      .query("rescheduleOptions")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        suggestedDates: args.options,
        aiModel: args.aiModel,
        aiReasoning: args.aiReasoning,
        generatedAt: now,
      });
      return existing._id;
    } else {
      // Create new
      const rescheduleId = await ctx.db.insert("rescheduleOptions", {
        bookingId: args.bookingId,
        conflictId: args.conflictId,
        suggestedDates: args.options,
        aiModel: args.aiModel,
        aiReasoning: args.aiReasoning,
        generatedAt: now,
        status: "pending",
      });

      // Trigger notification for new reschedule suggestions
      const booking = await ctx.db.get(args.bookingId);
      if (booking) {
        await ctx.scheduler.runAfter(0, internal.notifications.createRescheduleNotification, {
          bookingId: args.bookingId,
          studentId: booking.studentId,
          instructorId: booking.instructorId,
          optionsCount: args.options.length,
        });
      }

      return rescheduleId;
    }
  },
});

// ===== PUBLIC QUERIES =====

/**
 * Get reschedule options for a booking
 */
export const getRescheduleOptions = query({
  args: { bookingId: v.id("flightBookings") },
  handler: async (ctx, args) => {
    const options = await ctx.db
      .query("rescheduleOptions")
      .withIndex("by_booking", (q) => q.eq("bookingId", args.bookingId))
      .collect();

    // Sort by generation date (newest first)
    options.sort((a, b) => b.generatedAt - a.generatedAt);

    return options;
  },
});

/**
 * Get all pending reschedule options
 */
export const listPendingReschedules = query({
  handler: async (ctx) => {
    const options = await ctx.db
      .query("rescheduleOptions")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Enrich with booking and student data
    const enriched = await Promise.all(
      options.map(async (opt) => {
        const booking = await ctx.db.get(opt.bookingId);
        if (!booking) return null;

        const student = await ctx.db.get(booking.studentId);
        const instructor = await ctx.db.get(booking.instructorId);

        return {
          ...opt,
          booking,
          student,
          instructor,
        };
      })
    );

    return enriched.filter((o) => o !== null);
  },
});

// ===== PUBLIC MUTATIONS =====

/**
 * Accept a reschedule option
 */
export const acceptRescheduleOption = mutation({
  args: {
    rescheduleId: v.id("rescheduleOptions"),
    selectedOptionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const reschedule = await ctx.db.get(args.rescheduleId);
    if (!reschedule) {
      throw new Error("Reschedule options not found");
    }

    const selectedOption = reschedule.suggestedDates[args.selectedOptionIndex];
    if (!selectedOption) {
      throw new Error("Invalid option index");
    }

    const now = Date.now();

    // Update booking with new date
    await ctx.db.patch(reschedule.bookingId, {
      scheduledDate: selectedOption.date,
      status: "rescheduled",
      updatedAt: now,
    });

    // Mark reschedule as accepted
    await ctx.db.patch(args.rescheduleId, {
      status: "accepted",
      selectedOptionIndex: args.selectedOptionIndex,
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "reschedule",
      entityId: args.rescheduleId,
      action: "accepted",
      actorType: "system",
      timestamp: now,
      details: {
        newDate: selectedOption.date,
        reasoning: selectedOption.reasoning,
      },
    });

    return { success: true, newDate: selectedOption.date };
  },
});

/**
 * Reject reschedule options
 */
export const rejectRescheduleOptions = mutation({
  args: {
    rescheduleId: v.id("rescheduleOptions"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.rescheduleId, {
      status: "rejected",
    });

    // Log in audit trail
    await ctx.db.insert("auditLog", {
      entityType: "reschedule",
      entityId: args.rescheduleId,
      action: "rejected",
      actorType: "system",
      timestamp: now,
      details: { reason: args.reason },
    });

    return { success: true };
  },
});

/**
 * Manually trigger reschedule generation for a conflict
 */
export const triggerRescheduleGeneration = mutation({
  args: {
    bookingId: v.id("flightBookings"),
    conflictId: v.id("weatherConflicts"),
  },
  handler: async (ctx, args) => {
    // Schedule the AI action to run
    await ctx.scheduler.runAfter(0, internal.reschedule.generateRescheduleOptions, args);

    return { success: true, message: "Reschedule generation scheduled" };
  },
});

