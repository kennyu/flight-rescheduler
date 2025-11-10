/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as audit from "../audit.js";
import type * as bookings from "../bookings.js";
import type * as conflicts from "../conflicts.js";
import type * as crons from "../crons.js";
import type * as index from "../index.js";
import type * as instructors from "../instructors.js";
import type * as notifications from "../notifications.js";
import type * as reschedule from "../reschedule.js";
import type * as students from "../students.js";
import type * as weather from "../weather.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  audit: typeof audit;
  bookings: typeof bookings;
  conflicts: typeof conflicts;
  crons: typeof crons;
  index: typeof index;
  instructors: typeof instructors;
  notifications: typeof notifications;
  reschedule: typeof reschedule;
  students: typeof students;
  weather: typeof weather;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
