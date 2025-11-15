import { Inngest } from "inngest";
import connectDB from "../configs/db.js";
import User from "../models/users.js";
import Booking from "../models/booking.js";
import Show from "../models/show.js";

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

// --- 4. Handle payment timeout ---
const handlePaymentTimeout = inngest.createFunction(
  { id: "handle-payment-timeout" },
  { event: "booking/payment.timeout" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    return await step.run("check-and-expire-booking", async () => {
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
        console.log(`⏱️ Booking ${bookingId} has expired. Releasing seats...`);

        // Mark booking as expired
        booking.paymentStatus = 'expired';
        booking.paymentLink = '';
        await booking.save();

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

        return { 
          status: "✅ Booking expired and seats released",
          bookingId: bookingId,
          releasedSeats: booking.bookedSeats
        };
      }

      console.log(`⏳ Booking ${bookingId} still within time limit`);
      return { status: "⏳ Booking still valid" };
    });
  }
);

// Export all functions
export const functions = [
  syncUserCreation, 
  syncUserDeletion, 
  syncUserUpdation,
  handlePaymentTimeout  // ⭐ Added new function
];