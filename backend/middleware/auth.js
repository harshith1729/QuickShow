import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await clerkClient.users.getUser(userId);

    if (user.privateMetadata?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Admin authentication error:", err);
    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};
