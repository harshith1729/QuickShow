import { Inngest } from "inngest";
import connectDB from "../configs/db.js";
import User from "../models/users.js";
import Booking from "../models/booking.js";
import Show from "../models/show.js";
import Movie from '../models/movie.js';
import sendEmail from "../configs/nodeMailer.js";

// ✅ Ensure DB connection before using any function
await connectDB();

// Create Inngest client
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// --- 1. Create user ---
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      _id: id,
      name: `${first_name} ${last_name}`,
      email: email_addresses[0].email_address,
      image: image_url,
    };

    await User.create(userData);
    return { status: "✅ User created successfully" };
  }
);

// --- 2. Delete user ---
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
    return { status: "✅ User deleted successfully" };
  }
);

// --- 3. Update user ---
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      name: `${first_name} ${last_name}`,
      email: email_addresses[0].email_address,
      image: image_url,
    };

    await User.findByIdAndUpdate(id, userData);
    return { status: "✅ User updated successfully" };
  }
);

// --- 4. Handle payment timeout (5 minutes) - Release seats & MARK AS FAILED ---
const handlePaymentTimeout = inngest.createFunction(
  { id: "handle-payment-timeout" },
  { event: "booking/payment.timeout" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    return await step.run("check-and-mark-expired-booking", async () => {
      console.log(`⏰ Checking payment status for booking ${bookingId}`);

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        console.log(`❌ Booking ${bookingId} not found`);
        return { status: "❌ Booking not found" };
      }

      // If payment is already completed, do nothing
      if (booking.isPaid || booking.paymentStatus === 'completed') {
        console.log(`✅ Booking ${bookingId} already paid`);
        return { status: "✅ Payment already completed" };
      }

      // Check if booking has expired
      if (new Date() >= booking.expiresAt) {
        console.log(`⏱️ Booking ${bookingId} has expired. Releasing seats and marking as failed...`);

        // Release the seats
        const show = await Show.findById(booking.show);
        if (show) {
          const occupiedSeatsForSlot = show.occupiedSeats.get(booking.dateTimeKey) || {};
          
          // Remove the user's seats
          booking.bookedSeats.forEach((seat) => {
            delete occupiedSeatsForSlot[seat];
          });
          
          show.occupiedSeats.set(booking.dateTimeKey, occupiedSeatsForSlot);
          show.markModified('occupiedSeats');
          await show.save();

          console.log(`✅ Released seats ${booking.bookedSeats.join(', ')} for booking ${bookingId}`);
        }

        // ‼️ CHANGE: Update status to 'failed' instead of deleting
        booking.paymentStatus = 'failed';
        booking.paymentLink = null; // Invalidate the old payment link
        await booking.save();
        
        console.log(`🗑️ Marked expired booking ${bookingId} as 'failed'`);

        return { 
          status: "✅ Booking expired, seats released, and status set to 'failed'",
          bookingId: bookingId,
          releasedSeats: booking.bookedSeats
        };
      }

      console.log(`⏳ Booking ${bookingId} still within time limit`);
      return { status: "⏳ Booking still valid" };
    });
  }
);

// --- 5. Ingest function to send email when user books a show ---
// ⭐ CORRECTION: Renamed function, fixed ID, uses step.run, and checks for null booking.
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" }, // ⭐ FIX: Corrected ID typo
  { event: "app/show.booked" },
  async ({ event, step }) => { // ⭐ FIX: Correct signature
    const { bookingId } = event.data;

    return await step.run("send-confirmation-email-step", async () => {
      const booking = await Booking.findById(bookingId).populate({
        path: 'show',
        populate: { path: "movie" }
      }).populate('user');

      // ⭐ FIX: Add check for booking
      if (!booking) {
        console.error(`❌ Booking ${bookingId} not found for sending email.`);
        return { status: "❌ Booking not found" };
      }

      // ⭐ FIX: Add check for populated data
      if (!booking.user || !booking.show || !booking.show.movie) {
        console.error(`❌ Booking ${bookingId} is missing user or show/movie data.`);
        return { status: "❌ Missing booking data" };
      }

      try {
        await sendEmail({
          to: booking.user.email,
          subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
          body: `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi ${booking.user.name},</h2>
            <p>Your booking for <strong style="color: #F84565;">"${booking.show.movie.title}"</strong> is confirmed.</p>
            <p>
              <strong>Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}<br/>
              <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })}
            </p>
            <p>Enjoy the show! 🍿</p>
            <p>Thanks for booking with us!<br/>- QuickShow Team</p>
          </div>`
        });

        console.log(`✅ Confirmation email sent for booking ${bookingId}`);
        return { status: "✅ Email sent successfully" };

      } catch (error) {
        console.error(`❌ Failed to send email for booking ${bookingId}:`, error);
        // Throw error to let Inngest retry
        throw error;
      }
    });
  }
);

// Export all functions
export const functions = [
  syncUserCreation, 
  syncUserDeletion, 
  syncUserUpdation,
  handlePaymentTimeout,
  sendBookingConfirmationEmail // ⭐ FIX: Added missing function to export array
];