import Booking from "../models/booking.js";
import User from "../models/users.js";
import Show from "../models/show.js";

// API to check if user is admin
export const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true });
};

// API to get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch paid bookings
    const bookings = await Booking.find({ isPaid: true });

    // Fetch all active shows (where endDate is today or in the future)
    const activeShows = await Show.find({
      endDate: { $gte: today },
    }).populate("movie");

    // Fetch total users
    const totalUser = await User.countDocuments();

    // Calculate total bookings and revenue from all shows
    let totalBookingsCount = 0;
    let totalRevenueAmount = 0;

    // Loop through all shows to count bookings in occupiedSeats
    const allShows = await Show.find({});
    allShows.forEach((show) => {
      if (show.occupiedSeats) {
        // occupiedSeats is a Map: { "2025-11-15_10:00": { "A1": "userId", "A2": "userId" } }
        for (const [dateTimeKey, seats] of Object.entries(show.occupiedSeats)) {
          const seatsCount = Object.keys(seats).length;
          totalBookingsCount += seatsCount;
          totalRevenueAmount += seatsCount * show.showPrice;
        }
      }
    });

    // Prepare dashboard data
    const dashboardData = {
      totalBookings: totalBookingsCount,
      totalRevenue: totalRevenueAmount,
      activeShows,
      totalUser,
    };

    res.json({ success: true, dashboardData });
  } catch (err) {
    console.error("Dashboard Error:", err.message);
    res.json({ success: false, message: err.message });
  }
};

// API to get all shows
export const getAllShows = async (req, res) => {
  try {
    const shows = await Show.find()
      .populate("movie")
      .sort({ startDate: 1 });
    res.json({ success: true, shows });
  } catch (err) {
    console.error(err.message);
    res.json({ success: false, message: err.message });
  }
};

// API to get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user")
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err.message);
    res.json({ success: false, message: err.message });
  }
};