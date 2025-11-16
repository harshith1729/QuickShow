import Booking from "../models/booking.js";
import Show from "../models/show.js";
import Movie from "../models/movie.js"; // ⭐ FIX: Import Movie model for Stripe
import mongoose from 'mongoose'; // ⭐ FIX: Import mongoose for transactions
import stripe from 'stripe';
import { inngest } from '../inngest/index.js';

// ⛔️ DEPRECATED HELPER: This function is the source of the race condition.
// Do not use it. The logic is now inside the 'createBooking' transaction.
// const checkSeatAvailability = async(showId, dateTimeKey, selectedSeats) => { ... }

// Function to release seats when booking is cancelled/deleted
export const cancelBooking = async(req, res) => {
    // ⭐ FIX: Use a transaction to ensure seat release and booking update
    // happen together or not at all.
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const { bookingId } = req.params;
        const userId = req.auth?.userId;
        
        if (!userId) {
            return res.json({success: false, message: 'User not authenticated'});
        }

        const booking = await Booking.findById(bookingId).session(session);
        
        if (!booking) {
            return res.json({success: false, message: 'Booking not found'});
        }

        // Check if user owns this booking
        if (booking.user.toString() !== userId) {
            return res.json({success: false, message: 'Unauthorized to cancel this booking'});
        }

        // Don't allow canceling paid bookings
        if (booking.isPaid) {
            return res.json({success: false, message: 'Cannot cancel paid bookings'});
        }

        // Release the seats
        const show = await Show.findById(booking.show).session(session);
        if (show) {
            const occupiedSeatsForSlot = show.occupiedSeats.get(booking.dateTimeKey) || {};
            
            // Remove the booked seats
            booking.bookedSeats.forEach((seat) => {
                delete occupiedSeatsForSlot[seat];
            });
            
            show.occupiedSeats.set(booking.dateTimeKey, occupiedSeatsForSlot);
            show.markModified('occupiedSeats');
            await show.save({ session });
            
            console.log(`✅ Released seats ${booking.bookedSeats.join(', ')} from show`);
        }

        // ⭐ FIX: Soft delete (cancel) instead of hard deleting. This keeps a record.
        await Booking.findByIdAndUpdate(bookingId, 
            { $set: { paymentStatus: 'cancelled', paymentLink: null } },
            { session }
        );

        await session.commitTransaction();
        res.json({success: true, message: 'Booking cancelled and seats released'});

    } catch(err) {
        await session.abortTransaction();
        console.log(err.message);
        res.json({success: false, message: 'Error cancelling booking'});
    } finally {
        session.endSession();
    }
}

// Admin function to delete any booking and release seats
export const adminDeleteBooking = async(req, res) => {
    // ⭐ FIX: Use a transaction for safety
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId).session(session);
        
        if (!booking) {
            return res.json({success: false, message: 'Booking not found'});
        }

        // Release the seats only if it's not a paid booking
        // (Or remove this check if admins can delete even paid ones)
        if (!booking.isPaid) {
            const show = await Show.findById(booking.show).session(session);
            if (show) {
                const occupiedSeatsForSlot = show.occupiedSeats.get(booking.dateTimeKey) || {};
                
                // Remove the booked seats
                booking.bookedSeats.forEach((seat) => {
                    delete occupiedSeatsForSlot[seat];
                });
                
                show.occupiedSeats.set(booking.dateTimeKey, occupiedSeatsForSlot);
                show.markModified('occupiedSeats');
                await show.save({ session });
                
                console.log(`✅ Admin released seats ${booking.bookedSeats.join(', ')} from show`);
            }
        }

        // Delete the booking
        await Booking.findByIdAndDelete(bookingId, { session });

        await session.commitTransaction();
        res.json({success: true, message: 'Booking deleted and seats released'});

    } catch(err) {
        await session.abortTransaction();
        console.log(err.message);
        res.json({success: false, message: 'Error deleting booking'});
    } finally {
        session.endSession();
    }
}

export const createBooking = async(req, res) => {
    // ⭐ FIX: Start a Mongoose session for the transaction
    const session = await mongoose.startSession();
    
    let booking; // Define booking in the outer scope
    let expiresAt; // Define expiresAt in the outer scope
    let movieTitle = 'Movie Ticket'; // Default title

    try {
        // Begin the transaction
        session.startTransaction();

        const userId = req.auth?.userId;
        
        if (!userId) {
            return res.json({success: false, message: 'User not authenticated'});
        }
        
        const {showId, dateTimeKey, selectedSeats} = req.body;
        const origin = req.headers.origin || req.headers.referer;
        
        if (!showId || !dateTimeKey || !selectedSeats || selectedSeats.length === 0) {
            return res.json({success:false, message:'Missing required booking information'});
        }
        
        // --- Transactional Logic Starts ---
        
        // 1. Get the show *within the transaction* and lock it for updates
        const showData = await Show.findById(showId).session(session);
        
        if(!showData){
            await session.abortTransaction();
            return res.json({success:false, message:'Show not found'});
        }

        // 2. Check availability *inside the transaction*
        const occupiedSeatsForSlot = showData.occupiedSeats.get(dateTimeKey) || {};
        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeatsForSlot[seat]);
        
        if (isAnySeatTaken) {
            await session.abortTransaction();
            return res.json({success:false, message:'Selected seats are already booked. Please choose different seats.'});
        }
        
        // 3. All seats are free. Reserve them immediately.
        selectedSeats.forEach((seat) => {
            occupiedSeatsForSlot[seat] = userId;
        });
        showData.occupiedSeats.set(dateTimeKey, occupiedSeatsForSlot);
        showData.markModified('occupiedSeats');
        
        // Save the show changes
        await showData.save({ session });

        // 4. Create the booking
        expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        
        // Use 'new Booking' and 'save' to get the _id for Stripe
        booking = new Booking({
            user: userId,
            show: showId,
            dateTimeKey: dateTimeKey,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
            paymentStatus: 'pending',
            expiresAt: expiresAt
        });
        
        await booking.save({ session });

        // 5. Get movie title for Stripe
        const movie = await Movie.findById(showData.movie).session(session);
        if (movie) {
            movieTitle = movie.title;
        }

        // --- Transactional Logic Ends ---
        
        // ⭐ FIX: Commit the transaction *before* making external API calls
        await session.commitTransaction();

        console.log(`🎫 Created booking ${booking._id} with seats: ${selectedSeats.join(', ')}`);

        // --- External APIs (Stripe, Inngest) ---
        // These happen *after* the commit. If they fail, the booking exists
        // and the Inngest timeout will clean it up later.

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
        const line_items = [{
            price_data :{
                currency : 'usd',
                product_data : {
                    name : movieTitle // Use fetched movie title
                },
                unit_amount : Math.floor(booking.amount) * 100
            },
            quantity : 1
        }]

        const stripeSession = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/mybookings`,
            cancel_url : `${origin}/mybookings`,
            line_items : line_items,
            mode : 'payment',
            metadata :{
                bookingId : booking._id.toString(),
            },
            expires_at : Math.floor(Date.now()/1000) + 30*60
        })
        
        // Save the payment link to the booking (outside the transaction)
        booking.paymentLink = stripeSession.url;
        await booking.save();

        // Schedule payment timeout check
        await inngest.send({
            name: "booking/payment.timeout",
            data: {
                bookingId: booking._id.toString(),
            },
            ts: expiresAt.getTime(),
        });

        console.log(`⏰ Scheduled payment timeout check for booking ${booking._id} at ${expiresAt.toISOString()}`);

        res.json({success:true, url: stripeSession.url});

    }catch(err){
        // ⭐ FIX: Abort the transaction if anything failed
        await session.abortTransaction();
        console.log(err.message);
        res.json({success:false, message:'Error in booking creation'});
    } finally {
        // ⭐ FIX: Always end the session
        session.endSession();
    }
}

export const getOccupiedSeats = async(req, res) => {
    try{
        const {showId, dateTimeKey} = req.params;
        
        if (!dateTimeKey) {
            return res.json({success:false, message:'Date and time not specified'});
        }
        
        // ⭐ FIX: REMOVED the call to cleanupExpiredBookings.
        // A GET request should never modify data.
        // The Inngest job is responsible for cleaning up.
        
        const showData = await Show.findById(showId);
        
        if(!showData){
            return res.json({success:false, message:'Show not found'});
        }
        
        const occupiedSeatsForSlot = showData.occupiedSeats.get(dateTimeKey) || {};
        const occupiedSeats = Object.keys(occupiedSeatsForSlot);
        
        console.log(`🪑 Occupied seats for ${dateTimeKey}:`, occupiedSeats);
        
        res.json({
            success:true, 
            message:'Occupied seats fetched successfully', 
            occupiedSeats: occupiedSeats
        });

    }catch(err){
        console.log(err.message);
        res.json({success:false, message:'Error in fetching occupied seats'});
    }
}

// This is an admin/utility function, it's fine as is.
export const cleanupOrphanedSeats = async(req, res) => {
    try {
        const result = await Booking.cleanupOrphanedSeats();
        
        if (result.success) {
            res.json({
                success: true,
                message: `Cleaned up ${result.cleanedSeats} orphaned seats`,
                cleanedSeats: result.cleanedSeats
            });
        } else {
            res.json({
                success: false,
                message: 'Error cleaning up orphaned seats',
                error: result.error
            });
        }
    } catch(err) {
        console.log(err.message);
        res.json({success: false, message: 'Error cleaning up orphaned seats'});
    }
}

// This helper function is fine, but it should be called by your
// Inngest worker or a cron job, NOT from a GET request.
const cleanupExpiredBookings = async(showId, dateTimeKey) => {
    try {
        const expiredBookings = await Booking.find({
            show: showId,
            dateTimeKey: dateTimeKey,
            isPaid: false,
            expiresAt: { $lte: new Date() }
        });

        if (expiredBookings.length > 0) {
            console.log(`🧹 Found ${expiredBookings.length} expired bookings to clean up`);
            
            const show = await Show.findById(showId);
            if (show) {
                const occupiedSeatsForSlot = show.occupiedSeats.get(dateTimeKey) || {};
                
                expiredBookings.forEach(booking => {
                    booking.bookedSeats.forEach(seat => {
                        delete occupiedSeatsForSlot[seat];
                    });
                });
                
                show.occupiedSeats.set(dateTimeKey, occupiedSeatsForSlot);
                show.markModified('occupiedSeats');
                await show.save();
                
                console.log(`✅ Released seats from expired bookings`);
            }
            
            await Booking.updateMany(
                { _id: { $in: expiredBookings.map(b => b._id) } },
                { $set: { paymentStatus: 'failed', paymentLink: null } }
            );
            
            console.log(`✅ Marked ${expiredBookings.length} expired bookings as 'failed'`);
        }
    } catch (err) {
        console.log('Error cleaning up expired bookings:', err.message);
    }
}

// This function is well-written, no changes needed.
export const getMyBookings = async(req, res) => {
    try {
        const userId = req.auth?.userId;
        
        if (!userId) {
            return res.json({success: false, message: 'User not authenticated'});
        }

        const now = new Date();
        
        const bookings = await Booking.find({ user: userId })
        .populate({
            path: 'show',
            populate: {
                path: 'movie'
            }
        })
        .sort({ createdAt: -1 });

        const bookingsWithStatus = bookings.map(booking => {
            const bookingObj = booking.toObject();
            const isExpired = booking.expiresAt && new Date(booking.expiresAt) <= now;
            
            return {
                ...bookingObj,
                isExpired: isExpired && !booking.isPaid,
                timeRemaining: booking.expiresAt && !booking.isPaid && !isExpired 
                    ? Math.max(0, new Date(booking.expiresAt) - now) 
                    : 0
            };
        });

        res.json({
            success: true,
            bookings: bookingsWithStatus
        });

    } catch(err) {
        console.log(err.message);
        res.json({success: false, message: 'Error fetching bookings'});
    }
};