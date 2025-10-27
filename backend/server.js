import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

const app = express();
const port = 3000;

//Connect to DB before starting the server
await connectDB();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/inngest', serve({ client: inngest, functions }));

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
