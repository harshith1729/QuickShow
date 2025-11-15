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
      // ⭐ FIX: Handle null last names
      name: [first_name, last_name].filter(Boolean).join(' '),
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
      // ⭐ FIX: Handle null last names
      name: [first_name, last_name].filter(Boolean).join(' '),
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
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    return await step.run("send-confirmation-email-step", async () => {
      const booking = await Booking.findById(bookingId).populate({
        path: 'show',
        populate: { path: "movie" }
      }).populate('user');

      if (!booking) {
        console.error(`❌ Booking ${bookingId} not found for sending email.`);
        return { status: "❌ Booking not found" };
      }

      if (!booking.user || !booking.show || !booking.show.movie) {
        console.error(`❌ Booking ${bookingId} is missing user or show/movie data.`);
        return { status: "❌ Missing booking data" };
      }

      try {
        // ⭐ FIX: Add defensive check for missing dateTimeKey
        const showDate = booking.dateTimeKey ? new Date(booking.dateTimeKey) : null;
        
        // Log error if date is missing (helps you debug the root cause)
        if (!showDate) {
          console.error(`❌ CRITICAL: Booking ${bookingId} is missing dateTimeKey! Email will show 'Not Specified'.`);
        }

        const emailDate = showDate 
          ? showDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }) 
          : 'Date Not Specified';
          
        const emailTime = showDate 
          ? showDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
          : 'Time Not Specified';

        await sendEmail({
          to: booking.user.email,
          subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
          body: `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi ${booking.user.name},</h2>
            <p>Your booking for <strong style="color: #F84565;">"${booking.show.movie.title}"</strong> is confirmed.</p>
            <p>
              <strong>Date:</strong> ${emailDate}<br/>
              <strong>Time:</strong> ${emailTime}
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

// --- 6. Ingest function to send show remainders ---
// ⭐ FIX: Corrected the entire logic to query Bookings instead of Shows
const sendShowRemainders = inngest.createFunction(
  {id : "send-show-remainders"},
  {cron: "0 */8 * * *"}, // execute every 8 hours (at 00:00, 08:00, 16:00 UTC)
  async({step})=>{
    
    // Find all *paid* bookings in the *next* 8 hours
    const windowStart = new Date();
    const windowEnd = new Date(windowStart.getTime() + 8 * 60 * 60 * 1000);

    // Prepare Remainder Tasks
    const remainderTasks = await step.run("prepare-remainder-tasks", async () => {
      const bookings = await Booking.find({
        dateTimeKey: { 
          $gte: windowStart.toISOString(), // Compare ISO strings
          $lte: windowEnd.toISOString() 
        },
        isPaid: true // Only remind for paid bookings
      }).populate('user').populate({ path: 'show', populate: { path: 'movie' } });

      const tasks = bookings
        .map(booking => {
          // Ensure all data is populated
          if (!booking.user || !booking.show || !booking.show.movie) {
            console.warn(`Skipping reminder for booking ${booking._id}, missing data.`);
            return null;
          }
          return {
            userEmail: booking.user.email,
            userName: booking.user.name,
            movieTitle: booking.show.movie.title,
            showTime: booking.dateTimeKey // This is the correct ISO date string
          };
        })
        .filter(task => task !== null); // Remove any null (incomplete) tasks
      
      return tasks;
    });

    if (remainderTasks.length === 0) {
      return { sent: 0, message: "No Reminders to Send" };
    }

    // Send remainder emails in parallel
    const results = await step.run('send-all-remainders', async () => {
      return await Promise.allSettled(
        remainderTasks.map(task => {
          const showDateTime = new Date(task.showTime); // Parse the ISO string
          return sendEmail({
            to: task.userEmail,
            subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,
            body: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Hello ${task.userName},</h2>
                <p>This is a quick reminder that your movie:</p>
                <h3 style="color: #F84565;">"${task.movieTitle}"</h3>
                <p>
                    is scheduled for <strong>${showDateTime.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' })}</strong> at
                    <strong>${showDateTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</strong>.
                </p>
                <p>It's starting in the next 8 hours - make sure you're ready!</p>
                <br/>
                <p>Enjoy the show!<br/>QuickShow Team</p>
            </div>`
          });
        })
      );
    });

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;
    return {
      sent,
      failed,
      message: `Sent ${sent} remainder(s), ${failed} failed.`
    };
  }
);

// --- 7. Send new show notifications ---
const sendNewShowNotifications = inngest.createFunction(
  // ⭐ FIX: The key must be 'id', not 'send'
  { id: "send-new-show-notifications" },
  { event: "app/show.added" },
  // ⭐ FIX: Refactored to use step.run for robustness
  async ({ event, step }) => {
    const { movieTitle } = event.data;

    // First, get all users
    const users = await step.run("get-all-users", async () => {
      return User.find({}).select("name email");
    });

    if (users.length === 0) {
      return { message: "No users to notify." };
    }

    // Create a list of email tasks
    const tasks = users.map(user => ({
      userEmail: user.email,
      userName: user.name, // Will be used in the body
    }));

    // Send all emails in parallel using step.run
    await step.run("send-notification-batch", async () => {
      await Promise.allSettled(
        tasks.map(task => {
          const subject = `🎬 New Show Added: ${movieTitle}`;
          const body = `<div style="font-family: Arial, sans-serif; padding: 20px;">
              
              {/* ⭐ FIX: Changed 'userName' (which was undefined) to 'task.userName' */}
              <h2>Hi ${task.userName},</h2>

              <p>We've just added a new show to our library:</p>
              <h3 style="color: #F84565;">"${movieTitle}"</h3>
              
              <p>Visit our website to check it out!</p>
              <br/>
              <p>Thanks,<br/>QuickShow Team</p>
          </div>`;
          
          return sendEmail({
            to: task.userEmail,
            subject,
            body,
          });
        })
      );
    });

    return { message: `Sent notifications to ${users.length} users.` };
  }
);


// Export all functions
export const functions = [
  syncUserCreation, 
  syncUserDeletion, 
  syncUserUpdation,
  handlePaymentTimeout,
  sendBookingConfirmationEmail,
  sendShowRemainders,
  sendNewShowNotifications
];