import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";

import {
  isAdmin,
  getDashboardData,
  getAllShows,
  getAllBookings,
} from "../controllers/adminController.js";

import { adminDeleteBooking } from "../controllers/bookingController.js";
import { protectAdmin } from "../middleware/auth.js";

const adminRouter = express.Router();

adminRouter.get(
  "/is-admin",
  clerkMiddleware(),
  requireAuth(),
  protectAdmin,
  isAdmin
);

adminRouter.get(
  "/dashboard",
  clerkMiddleware(),
  requireAuth(),
  protectAdmin,
  getDashboardData
);

adminRouter.get(
  "/shows",
  clerkMiddleware(),
  requireAuth(),
  protectAdmin,
  getAllShows
);

adminRouter.get(
  "/bookings",
  clerkMiddleware(),
  requireAuth(),
  protectAdmin,
  getAllBookings
);

adminRouter.delete(
  "/booking/:bookingId",
  clerkMiddleware(),
  requireAuth(),
  protectAdmin,
  adminDeleteBooking
);

export default adminRouter;
