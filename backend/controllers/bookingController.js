import Booking from "../models/booking.js";
import Show from "../models/show.js";
import stripe from 'stripe';
import { inngest } from '../inngest/index.js';

// Function to check availability of selected seats
const checkSeatAvailability = async(showId, dateTimeKey, selectedSeats) => {
    try{
        const showData = await Show.findById(showId);
        if(!showData) return false;
        
        // Get occupied seats for the specific date-time slot
        const occupiedSeatsForSlot = showData.occupiedSeats.get(dateTimeKey) || {};
        
        // Check if any selected seat is already taken
        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeatsForSlot[seat]);
        
        if (isAnySeatTaken) {
            console.log("❌ Some seats are already occupied:", selectedSeats.filter(seat => occupiedSeatsForSlot[seat]));
        }
        
        return !isAnySeatTaken;
    }catch(err){
        console.log(err.message);
        return false;
    }
}

// Function to release seats when booking is cancelled/deleted
export const cancelBooking = async(req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.auth?.userId;
        
        if (!userId) {
            return res.json({success: false, message: 'User not authenticated'});
        }

        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return res.json({success: false, message: 'Booking not found'});
        }

        // Check if user owns this booking
        if (booking.user !== userId) {
            return res.json({success: false, message: 'Unauthorized to cancel this booking'});
        }

        // Don't allow canceling paid bookings
        if (booking.isPaid) {
            return res.json({success: false, message: 'Cannot cancel paid bookings'});
        }

        // Release the seats
        const show = await Show.findById(booking.show);
        if (show) {
            const occupiedSeatsForSlot = show.occupiedSeats.get(booking.dateTimeKey) || {};
            
            // Remove the booked seats
            booking.bookedSeats.forEach((seat) => {
                delete occupiedSeatsForSlot[seat];
            });
            
            show.occupiedSeats.set(booking.dateTimeKey, occupiedSeatsForSlot);
            show.markModified('occupiedSeats');
            await show.save();
            
            console.log(`✅ Released seats ${booking.bookedSeats.join(', ')} from show`);
        }

        // Delete the booking
        await Booking.findByIdAndDelete(bookingId);

        res.json({success: true, message: 'Booking cancelled and seats released'});

    } catch(err) {
        console.log(err.message);
        res.json({success: false, message: 'Error cancelling booking'});
    }
}

// Admin function to delete any booking and release seats
export const adminDeleteBooking = async(req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findById(bookingId);
        
        if (!booking) {
            return res.json({success: false, message: 'Booking not found'});
        }

        // Release the seats
        const show = await Show.findById(booking.show);
        if (show) {
            const occupiedSeatsForSlot = show.occupiedSeats.get(booking.dateTimeKey) || {};
            
            // Remove the booked seats
            booking.bookedSeats.forEach((seat) => {
                delete occupiedSeatsForSlot[seat];
            });
            
            show.occupiedSeats.set(booking.dateTimeKey, occupiedSeatsForSlot);
            show.markModified('occupiedSeats');
            await show.save();
            
            console.log(`✅ Admin released seats ${booking.bookedSeats.join(', ')} from show`);
        }

        // Delete the booking
        await Booking.findByIdAndDelete(bookingId);

        res.json({success: true, message: 'Booking deleted and seats released'});

    } catch(err) {
        console.log(err.message);
        res.json({success: false, message: 'Error deleting booking'});
    }
}

export const createBooking = async(req, res) => {
    try{
        const userId = req.auth?.userId;
        
        if (!userId) {
            return res.json({success: false, message: 'User not authenticated'});
        }
        
        const {showId, dateTimeKey, selectedSeats} = req.body;
        const origin = req.headers.origin || req.headers.referer;
        
        if (!showId || !dateTimeKey || !selectedSeats || selectedSeats.length === 0) {
            return res.json({success:false, message:'Missing required booking information'});
        }
        
        // Check the seat availability 
        const isAvailable = await checkSeatAvailability(showId, dateTimeKey, selectedSeats);
        if(!isAvailable){
            return res.json({success:false, message:'Selected seats are already booked. Please choose different seats.'});
        }
        
        // Get show details
        const showData = await Show.findById(showId).populate('movie');
        
        if(!showData){
            return res.json({success:false, message:'Show not found'});
        }

        // Set expiration to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Create a booking 
        const booking = await Booking.create({
            user: userId,
            show: showId,
            dateTimeKey: dateTimeKey,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
            paymentStatus: 'pending', // STATUS starts as 'pending'
            expiresAt: expiresAt
        })
        
        // Get current occupied seats for this slot
        const occupiedSeatsForSlot = showData.occupiedSeats.get(dateTimeKey) || {};
        
        // Add newly booked seats
        selectedSeats.forEach((seat) => {
            occupiedSeatsForSlot[seat] = userId;
        });
        
        // Update the occupied seats for this specific slot
        showData.occupiedSeats.set(dateTimeKey, occupiedSeatsForSlot);
        showData.markModified('occupiedSeats');
        await showData.save();

        console.log(`🎫 Created booking ${booking._id} with seats: ${selectedSeats.join(', ')}`);

        // Stripe gateway initialization
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // Creating line items
        const line_items = [{
            price_data :{
                currency : 'usd',
                product_data : {
                    name : showData.movie.title
                },
                unit_amount : Math.floor(booking.amount) * 100
            },
            quantity : 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url : `${origin}/mybookings`,
            cancel_url : `${origin}/mybookings`,
            line_items : line_items,
            mode : 'payment',
            metadata :{
                bookingId : booking._id.toString(),
            },
            expires_at : Math.floor(Date.now()/1000) + 30*60
        })
        
        booking.paymentLink = session.url;
        await booking.save();

        // ⭐ Schedule payment timeout check after 5 minutes
        await inngest.send({
            name: "booking/payment.timeout",
            data: {
                bookingId: booking._id.toString(),
            },
            ts: expiresAt.getTime(),
        });

        console.log(`⏰ Scheduled payment timeout check for booking ${booking._id} at ${expiresAt.toISOString()}`);

        res.json({success:true, url: session.url});

    }catch(err){
        console.log(err.message);
        res.json({success:false, message:'Error in booking creation'});
    }
}

export const getOccupiedSeats = async(req, res) => {
    try{
        const {showId, dateTimeKey} = req.params;
        
        if (!dateTimeKey) {
            return res.json({success:false, message:'Date and time not specified'});
        }
        
        // First, clean up expired bookings for this show and dateTimeKey
        await cleanupExpiredBookings(showId, dateTimeKey);
        
        const showData = await Show.findById(showId);
        
        if(!showData){
            return res.json({success:false, message:'Show not found'});
        }
        
        // Get occupied seats for the specific date-time slot
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

// NEW: Clean up orphaned seats (seats marked occupied but no booking exists)
export const cleanupOrphanedSeats = async(req, res) => {
    try {
        // Use the static method from the Booking model
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

// Helper function to clean up expired bookings
const cleanupExpiredBookings = async(showId, dateTimeKey) => {
    try {
        // Find all expired unpaid bookings for this show and time
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
                
                // Release seats from all expired bookings
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
            
            // ‼️ CHANGE: Update status to 'failed' instead of deleting
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

// NEW: Get user's bookings with automatic cleanup
export const getMyBookings = async(req, res) => {
    try {
        const userId = req.auth?.userId;
        
        if (!userId) {
            return res.json({success: false, message: 'User not authenticated'});
        }

        const now = new Date();
        
        // ‼️ CHANGE: Fetch ALL bookings for the user.
        const bookings = await Booking.find({ user: userId })
        .populate({
            path: 'show',
            populate: {
                path: 'movie'
            }
        })
        .sort({ createdAt: -1 });

        // Add expiration status to each booking
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