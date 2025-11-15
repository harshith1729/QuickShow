import express from 'express';
import { createBooking, getOccupiedSeats, cancelBooking } from '../controllers/bookingController.js';
import { clerkMiddleware, requireAuth } from '@clerk/express';

const bookingRouter = express.Router();

bookingRouter.post('/create', clerkMiddleware(), requireAuth(), createBooking);
bookingRouter.get('/seats/:showId/:dateTimeKey', getOccupiedSeats);
bookingRouter.delete('/cancel/:bookingId', clerkMiddleware(), requireAuth(), cancelBooking); // ⭐ New route

export default bookingRouter;