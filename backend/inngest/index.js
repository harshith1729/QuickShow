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

/* -------------------------------------------------------------------------- */
/*                               1. USER CREATED                               */
/* -------------------------------------------------------------------------- */
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    await User.create({
      _id: id,
      name: `${first_name} ${last_name}`,
      email: email_addresses[0].email_address,
      image: image_url,
    });

    return { status: "✅ User created successfully" };
  }
);

/* -------------------------------------------------------------------------- */
/*                              2. USER DELETED                                */
/* -------------------------------------------------------------------------- */
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await User.findByIdAndDelete(event.data.id);
    return { status: "✅ User deleted successfully" };
  }
);

/* -------------------------------------------------------------------------- */
/*                              3. USER UPDATED                                */
/* -------------------------------------------------------------------------- */
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    await User.findByIdAndUpdate(id, {
      name: `${first_name} ${last_name}`,
      email: email_addresses[0].email_address,
      image: image_url,
    });

    return { status: "✅ User updated successfully" };
  }
);

/* -------------------------------------------------------------------------- */
/*                     4. PAYMENT TIMEOUT: RELEASE SEATS                      */
/* -------------------------------------------------------------------------- */
const handlePaymentTimeout = inngest.createFunction(
  { id: "handle-payment-timeout" },
  { event: "booking/payment.timeout" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    return await step.run("check-and-mark-expired-booking", async () => {
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        return { status: "❌ Booking not found" };
      }

      if (booking.isPaid || booking.paymentStatus === "completed") {
        return { status: "✅ Payment already completed" };
      }

      if (new Date() >= booking.expiresAt) {
        const show = await Show.findById(booking.show);

        if (show) {
          const occupiedSeatsForSlot =
            show.occupiedSeats.get(booking.dateTimeKey) || {};

          booking.bookedSeats.forEach((seat) => {
            delete occupiedSeatsForSlot[seat];
          });

          show.occupiedSeats.set(booking.dateTimeKey, occupiedSeatsForSlot);
          show.markModified("occupiedSeats");
          await show.save();
        }

        booking.paymentStatus = "failed";
        booking.paymentLink = null;
        await booking.save();

        return { status: "✅ Booking expired and marked failed" };
      }

      return { status: "⏳ Booking still valid" };
    });
  }
);

/* -------------------------------------------------------------------------- */
/*                    5. SEND BOOKING CONFIRMATION EMAIL                      */
/* -------------------------------------------------------------------------- */
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    return await step.run("send-confirmation-email-step", async () => {
      const booking = await Booking.findById(bookingId)
        .populate({ path: "show", populate: { path: "movie" } })
        .populate("user");

      if (!booking || !booking.user || !booking.show?.movie) {
        return { status: "❌ Missing booking data" };
      }

      try {
        // ⭐ Correct Date Parsing for format "2025-11-15_07:00"
        const [datePart, timePart] = booking.dateTimeKey.split("_");
        const showDate = new Date(`${datePart}T${timePart}:00+05:30`);

        await sendEmail({
          to: booking.user.email,
          subject: `Payment Confirmation: "${booking.show.movie.title}" booked!`,
          body: `
            <div style="font-family: Arial; line-height: 1.5;">
              <h2>Hi ${booking.user.name},</h2>
              <p>Your booking for <strong>"${booking.show.movie.title}"</strong> is confirmed.</p>

              <p>
                <strong>Date:</strong> ${showDate.toLocaleDateString("en-IN")}<br/>
                <strong>Time:</strong> ${showDate.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

              <p>Enjoy the show! 🍿</p>
              <p>- QuickShow Team</p>
            </div>
          `,
        });

        return { status: "✅ Email sent successfully" };
      } catch (err) {
        console.error("❌ Email Error:", err);
        throw err;
      }
    });
  }
);

/* -------------------------------------------------------------------------- */
/*                         6. SEND SHOW REMINDER EMAILS                        */
/* -------------------------------------------------------------------------- */
const sendShowRemainders = inngest.createFunction(
  { id: "send-show-remainders" },
  { cron: "0 */8 * * *" },
  async ({ step }) => {
    const windowStart = new Date();
    const windowEnd = new Date(windowStart.getTime() + 8 * 60 * 60 * 1000);

    const remainderTasks = await step.run("prepare-remainder-tasks", async () => {
      const bookings = await Booking.find({
        dateTimeKey: {
          $gte: windowStart.toISOString(),
          $lte: windowEnd.toISOString(),
        },
        isPaid: true,
      })
        .populate("user")
        .populate({ path: "show", populate: { path: "movie" } });

      return bookings
        .map((booking) => {
          if (!booking.user || !booking.show?.movie) return null;

          return {
            userEmail: booking.user.email,
            userName: booking.user.name,
            movieTitle: booking.show.movie.title,
            showTime: booking.dateTimeKey,
          };
        })
        .filter(Boolean);
    });

    if (remainderTasks.length === 0)
      return { sent: 0, message: "No Reminders to Send" };

    const results = await step.run("send-all-remainders", async () => {
      return await Promise.allSettled(
        remainderTasks.map((task) => {
          // ⭐ Correct Date Parsing for reminders
          const [d, t] = task.showTime.split("_");
          const showDateTime = new Date(`${d}T${t}:00+05:30`);

          return sendEmail({
            to: task.userEmail,
            subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,
            body: `
              <div style="font-family: Arial; padding: 20px;">
                  <h2>Hello ${task.userName},</h2>
                  <p>This is a quick reminder that your movie:</p>
                  <h3 style="color: #F84565;">"${task.movieTitle}"</h3>
                  <p>
                      is scheduled for <strong>${showDateTime.toLocaleDateString(
                        "en-IN"
                      )}</strong> at
                      <strong>${showDateTime.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</strong>.
                  </p>
                  <p>It’s starting in the next few hours — get ready!</p>
                  <p>Enjoy the show!<br/>QuickShow Team</p>
              </div>
            `,
          });
        })
      );
    });

    return {
      sent: results.filter((r) => r.status === "fulfilled").length,
      failed: results.filter((r) => r.status === "rejected").length,
    };
  }
);

/* -------------------------------------------------------------------------- */
/*                        7. NEW SHOW NOTIFICATIONS                           */
/* -------------------------------------------------------------------------- */
const sendNewShowNotifications = inngest.createFunction(
  { id: "send-new-show-notifications" },
  { event: "app/show.added" },
  async ({ event, step }) => {
    const { movieTitle } = event.data;

    const users = await step.run("get-all-users", async () => {
      return User.find({}).select("name email");
    });

    if (users.length === 0) {
      return { message: "No users to notify." };
    }

    await step.run("send-notification-batch", async () => {
      await Promise.allSettled(
        users.map((user) =>
          sendEmail({
            to: user.email,
            subject: `🎬 New Show Added: ${movieTitle}`,
            body: `
              <div style="font-family: Arial; padding: 20px;">
                <h2>Hi ${user.name},</h2>
                <p>A new show has been added:</p>
                <h3 style="color:#F84565">${movieTitle}</h3>
                <p>Check it out on QuickShow!</p>
                <p>- QuickShow Team</p>
              </div>
            `,
          })
        )
      );
    });

    return { message: `Sent notifications to ${users.length} users.` };
  }
);

/* -------------------------------------------------------------------------- */
/*                              EXPORT FUNCTIONS                               */
/* -------------------------------------------------------------------------- */
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  handlePaymentTimeout,
  sendBookingConfirmationEmail,
  sendShowRemainders,
  sendNewShowNotifications,
];
