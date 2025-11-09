import { v } from "convex/values";
import { action, internalAction, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Weather Data Integration
 * 
 * Fetches and caches weather data from OpenWeatherMap API
 * with automatic TTL management and scheduled updates.
 * 
 * Weather API Reference:
 * - OpenWeatherMap: https://openweathermap.org/api
 * - Current Weather: https://api.openweathermap.org/data/2.5/weather
 */

// ===== CONSTANTS =====

const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const OPENWEATHER_API_BASE = "https://api.openweathermap.org/data/2.5/weather";

// ===== TYPES =====

interface OpenWeatherResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
  }>;
  main: {
    temp: number; // Kelvin
    feels_like: number;
    pressure: number;
    humidity: number;
  };
  visibility: number; // meters
  wind: {
    speed: number; // m/s
    deg: number;
  };
  clouds: {
    all: number; // % cloudiness
  };
  dt: number; // Unix timestamp
  sys: {
    country: string;
  };
  name: string;
}

// ===== HELPER FUNCTIONS =====

/**
 * Convert meters to miles
 */
function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

/**
 * Convert meters per second to knots
 */
function mpsToKnots(mps: number): number {
  return mps * 1.94384;
}

/**
 * Convert Kelvin to Celsius
 */
function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15;
}

/**
 * Calculate ceiling height from cloud coverage percentage
 * This is a simplified estimation
 */
function estimateCeiling(cloudCoverage: number): number | undefined {
  if (cloudCoverage === 0) return undefined; // Clear skies
  if (cloudCoverage < 25) return 7000; // Scattered - high ceiling
  if (cloudCoverage < 50) return 4000; // Broken - medium ceiling
  if (cloudCoverage < 75) return 2000; // Overcast - low ceiling
  return 1000; // Heavy overcast - very low ceiling
}

/**
 * Detect thunderstorms from weather condition codes
 */
function hasThunderstorms(weatherConditions: Array<{ id: number }>): boolean {
  // Thunderstorm codes: 200-299
  return weatherConditions.some((w) => w.id >= 200 && w.id < 300);
}

/**
 * Detect icing conditions (simplified)
 * Real icing requires temperature, cloud layers, and precipitation
 */
function hasIcingConditions(
  temp: number,
  weatherConditions: Array<{ id: number; main: string }>
): boolean {
  // Icing likely when temp is 0-10°C and there are clouds/precipitation
  if (temp < 0 || temp > 10) return false;

  // Check for rain, drizzle, or clouds
  return weatherConditions.some(
    (w) =>
      w.main === "Rain" ||
      w.main === "Drizzle" ||
      w.main === "Clouds" ||
      w.main === "Snow"
  );
}

// ===== ACTIONS (External API Calls) =====

/**
 * Fetch current weather data from OpenWeatherMap API
 */
export const fetchWeatherData = action({
  args: {
    lat: v.number(),
    lon: v.number(),
    locationName: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENWEATHER_API_KEY environment variable not set");
    }

    try {
      // Build API URL
      const url = new URL(OPENWEATHER_API_BASE);
      url.searchParams.set("lat", args.lat.toString());
      url.searchParams.set("lon", args.lon.toString());
      url.searchParams.set("appid", apiKey);

      // Fetch weather data
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(
          `OpenWeatherMap API error: ${response.status} ${response.statusText}`
        );
      }

      const data: OpenWeatherResponse = await response.json();

      // Convert and parse data
      const tempCelsius = kelvinToCelsius(data.main.temp);
      const visibilityMiles = metersToMiles(data.visibility);
      const windSpeedKnots = mpsToKnots(data.wind.speed);
      const conditions = data.weather[0]?.main || "Unknown";
      const ceiling = estimateCeiling(data.clouds.all);
      const thunderstorms = hasThunderstorms(data.weather);
      const icing = hasIcingConditions(tempCelsius, data.weather);

      const now = Date.now();
      const expiresAt = now + WEATHER_CACHE_TTL_MS;

      // Store in database via internal mutation
      const weatherId = await ctx.runMutation(internal.weather.storeWeatherData, {
        locationName: args.locationName,
        lat: args.lat,
        lon: args.lon,
        timestamp: data.dt * 1000, // Convert to milliseconds
        fetchedAt: now,
        expiresAt,
        visibility: visibilityMiles,
        ceiling,
        windSpeed: windSpeedKnots,
        windDirection: data.wind.deg,
        temperature: tempCelsius,
        conditions,
        hasThunderstorms: thunderstorms,
        hasIcing: icing,
        rawData: JSON.stringify(data),
      });

      return {
        weatherId,
        data: {
          visibility: visibilityMiles,
          ceiling,
          windSpeed: windSpeedKnots,
          temperature: tempCelsius,
          conditions,
          hasThunderstorms: thunderstorms,
          hasIcing: icing,
        },
      };
    } catch (error) {
      console.error("Error fetching weather data:", error);
      throw error;
    }
  },
});

/**
 * Fetch weather for all active bookings
 * Called by scheduled function
 */
export const fetchWeatherForActiveBookings = internalAction({
  handler: async (ctx) => {
    // Get all upcoming bookings (next 48 hours)
    const now = Date.now();
    const futureTime = now + 48 * 60 * 60 * 1000;

    const bookings = await ctx.runQuery(internal.weather.getActiveBookingsForWeather, {
      startTime: now,
      endTime: futureTime,
    });

    console.log(`Fetching weather for ${bookings.length} active bookings`);

    const results = [];

    for (const booking of bookings) {
      try {
        // Check cache first
        const cached = await ctx.runQuery(internal.weather.getCachedWeather, {
          lat: booking.departureLocation.lat,
          lon: booking.departureLocation.lon,
        });

        if (!cached) {
          // Fetch fresh data
          const result = await ctx.runAction(internal.weather.fetchWeatherData, {
            lat: booking.departureLocation.lat,
            lon: booking.departureLocation.lon,
            locationName: booking.departureLocation.name,
          });
          results.push({ bookingId: booking._id, weatherId: result.weatherId });
        }

        // Also fetch for destination if exists
        if (booking.destinationLocation) {
          const cachedDest = await ctx.runQuery(internal.weather.getCachedWeather, {
            lat: booking.destinationLocation.lat,
            lon: booking.destinationLocation.lon,
          });

          if (!cachedDest) {
            const result = await ctx.runAction(internal.weather.fetchWeatherData, {
              lat: booking.destinationLocation.lat,
              lon: booking.destinationLocation.lon,
              locationName: booking.destinationLocation.name,
            });
            results.push({ bookingId: booking._id, weatherId: result.weatherId });
          }
        }

        // Small delay to respect API rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching weather for booking ${booking._id}:`, error);
      }
    }

    return {
      processed: bookings.length,
      weatherDataFetched: results.length,
      results,
    };
  },
});

// ===== INTERNAL MUTATIONS =====

/**
 * Store weather data in database (internal only)
 */
export const storeWeatherData = internalMutation({
  args: {
    locationName: v.string(),
    lat: v.number(),
    lon: v.number(),
    timestamp: v.number(),
    fetchedAt: v.number(),
    expiresAt: v.number(),
    visibility: v.number(),
    ceiling: v.optional(v.number()),
    windSpeed: v.number(),
    windDirection: v.optional(v.number()),
    temperature: v.number(),
    conditions: v.string(),
    hasThunderstorms: v.boolean(),
    hasIcing: v.boolean(),
    rawData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("weatherData", args);
  },
});

/**
 * Clean up expired weather data
 */
export const cleanupExpiredWeather = internalMutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("weatherData")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .collect();

    for (const weather of expired) {
      await ctx.db.delete(weather._id);
    }

    return { deleted: expired.length };
  },
});

// ===== QUERIES =====

/**
 * Get cached weather data if still valid
 */
export const getCachedWeather = query({
  args: {
    lat: v.number(),
    lon: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find weather data for this location that hasn't expired
    const weatherList = await ctx.db
      .query("weatherData")
      .withIndex("by_location_and_expires", (q) =>
        q.eq("lat", args.lat).eq("lon", args.lon).gt("expiresAt", now)
      )
      .collect();

    // Return the most recent (highest timestamp)
    if (weatherList.length === 0) return null;
    return weatherList.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );
  },
});

/**
 * Get weather for a specific location (fetch if not cached)
 * NOTE: This is a query, so it cannot trigger the action directly
 * The action must be called separately from React
 */
export const getWeatherForLocation = query({
  args: {
    lat: v.number(),
    lon: v.number(),
  },
  handler: async (ctx, args) => {
    const weatherList = await ctx.db
      .query("weatherData")
      .withIndex("by_location", (q) => q.eq("lat", args.lat).eq("lon", args.lon))
      .collect();

    // Return the most recent (highest timestamp)
    if (weatherList.length === 0) return null;
    return weatherList.reduce((latest, current) =>
      current.timestamp > latest.timestamp ? current : latest
    );
  },
});

/**
 * Get all current weather data (not expired)
 */
export const getCurrentWeatherData = query({
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db
      .query("weatherData")
      .withIndex("by_expires", (q) => q.gt("expiresAt", now))
      .collect();
  },
});

/**
 * Get active bookings that need weather monitoring (internal only)
 */
export const getActiveBookingsForWeather = query({
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

/**
 * Get weather history for a location
 */
export const getWeatherHistory = query({
  args: {
    lat: v.number(),
    lon: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("weatherData")
      .withIndex("by_location", (q) => q.eq("lat", args.lat).eq("lon", args.lon))
      .collect();

    // Sort by timestamp (descending - newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit if specified
    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// ===== MUTATIONS (Public) =====

/**
 * Manually trigger weather fetch for a specific location
 */
export const refreshWeatherForLocation = mutation({
  args: {
    lat: v.number(),
    lon: v.number(),
    locationName: v.string(),
  },
  handler: async (ctx, args) => {
    // Note: This schedules the action but doesn't wait for it
    // The actual fetch happens asynchronously
    await ctx.scheduler.runAfter(0, internal.weather.fetchWeatherData, args);

    return { success: true, message: "Weather refresh scheduled" };
  },
});

