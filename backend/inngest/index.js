import { Inngest } from "inngest";
import connectDB from "../configs/db.js";
import User from "../models/Users.js";

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

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
