/**
 * Convex API Entry Point
 * 
 * This file serves as the main export point for all Convex functions.
 * Import this in your React app to access all backend operations.
 * 
 * Usage:
 * import { api } from "../convex/_generated/api";
 * const bookings = useQuery(api.bookings.list);
 */

// Re-export all modules for easy access
export * as bookings from "./bookings";
export * as students from "./students";
export * as instructors from "./instructors";
export * as weather from "./weather";
export * as conflicts from "./conflicts";
export * as reschedule from "./reschedule";
export * as notifications from "./notifications";

