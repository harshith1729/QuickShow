import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';

const app = express();

// ✅ CORS (FIXED)
app.use(cors({
  origin: "https://quickshow-iota-mocha.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

// ✅ Stripe webhook (must be BEFORE express.json)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// ✅ JSON parser
app.use(express.json());

// ✅ DB connection middleware (FIXED for Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).send("Database connection failed");
  }
});

// ✅ Clerk auth
app.use(clerkMiddleware());

// ✅ Test route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// ✅ Routes
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);

// ❌ REMOVE app.listen (IMPORTANT)
// ✅ Export for Vercel
export default app;