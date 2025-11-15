import express from 'express';
import { 
    createBooking, 
    getOccupiedSeats, 
    cancelBooking,
    cleanupOrphanedSeats 
} from '../controllers/bookingController.js';
import { clerkMiddleware, requireAuth } from '@clerk/express';

const bookingRouter = express.Router();

// Booking routes
bookingRouter.post('/create', clerkMiddleware(), requireAuth(), createBooking);
bookingRouter.get('/seats/:showId/:dateTimeKey', getOccupiedSeats);
bookingRouter.delete('/cancel/:bookingId', clerkMiddleware(), requireAuth(), cancelBooking);

// Cleanup route - can be called to remove orphaned seats
bookingRouter.post('/cleanup-orphaned-seats', cleanupOrphanedSeats);

export default bookingRouter;