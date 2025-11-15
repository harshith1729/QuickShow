import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";

import {
  isAdmin,
  getDashboardData,
  getAllShows,
  getAllBookings,
} from "../controllers/adminController.js";

import { adminDeleteBooking } from "../controllers/bookingController.js";
import { isAdminMiddleware } from "../middleware/auth.js";

const adminRouter = express.Router();

// Check admin
adminRouter.get(
  "/is-admin",
  clerkMiddleware(),
  requireAuth(),
  isAdminMiddleware,
  isAdmin
);

// Dashboard stats
adminRouter.get(
  "/dashboard",
  clerkMiddleware(),
  requireAuth(),
  isAdminMiddleware,
  getDashboardData
);

// All shows
adminRouter.get(
  "/shows",
  clerkMiddleware(),
  requireAuth(),
  isAdminMiddleware,
  getAllShows
);

// All bookings
adminRouter.get(
  "/bookings",
  clerkMiddleware(),
  requireAuth(),
  isAdminMiddleware,
  getAllBookings
);

// Delete a booking (ADMIN ONLY)
adminRouter.delete(
  "/booking/:bookingId",
  clerkMiddleware(),
  requireAuth(),
  isAdminMiddleware,
  adminDeleteBooking
);

export default adminRouter;
