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

// CORS
app.use(cors({
  origin: "https://quickshow-iota-mocha.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Stripe webhook (must be BEFORE express.json)
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);

// JSON parser
app.use(express.json());

// Clerk auth
app.use(clerkMiddleware());

// Test route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Debug route - remove after fixing
app.get('/debug-env', (req, res) => {
  res.send({
    hasMongoURI: !!process.env.MONGODB_URI,
    starts: process.env.MONGODB_URI?.substring(0, 30)
  });
});

// Routes
app.use('/api/inngest', serve({ client: inngest, functions }));
app.use('/api/show', showRouter);
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);

// Connect DB then start
connectDB()
  .then(() => {
    console.log('✅ DB connected, server ready');
  })
  .catch((err) => {
    console.error('❌ Failed to connect to DB:', err.message);
    process.exit(1);
  });

export default app;