import { Inngest } from "inngest";
import { User } from "../models/Users"; 

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

    // ✅ Return something
    return { status: "user created" };
  }
);

// --- 2. Delete user ---
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
    return { status: "user deleted" };
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

    
    return { status: "user updated" };
  }
);

// Export all functions
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];
