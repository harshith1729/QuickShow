import Booking from "../models/booking.js";
import Show from "../models/show.js";
import stripe from 'stripe'
//function to check availability of selected seats
const checkSeatAvailability = async(showId, dateTimeKey, selectedSeats) => {
    try{
        const showData = await Show.findById(showId);
        if(!showData) return false;
        
        // Get occupied seats for the specific date-time slot
        const occupiedSeatsForSlot = showData.occupiedSeats.get(dateTimeKey) || {};
        
        // Check if any selected seat is already taken
        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeatsForSlot[seat]);
        return !isAnySeatTaken;
    }catch(err){
        console.log(err.message);
        return false;
    }
}

export const createBooking = async(req, res) => {
    try{
        const {userId} = req.auth();
        const {showId, dateTimeKey, selectedSeats} = req.body;
        const {origin} = req.headers;
        
        // Validate required fields
        if (!showId || !dateTimeKey || !selectedSeats || selectedSeats.length === 0) {
            return res.json({success:false, message:'Missing required booking information'});
        }
        
        // check the seat availability 
        const isAvailable = await checkSeatAvailability(showId, dateTimeKey, selectedSeats);
        if(!isAvailable){
            return res.json({success:false, message:'Selected seats are already booked. Please choose different seats.'});
        }
        
        // get show details
        const showData = await Show.findById(showId).populate('movie');
        
        if(!showData){
            return res.json({success:false, message:'Show not found'});
        }

        //create a booking 
        const booking = await Booking.create({
            user: userId,
            show: showId,
            dateTimeKey: dateTimeKey, // Store which specific slot was booked
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
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

        // Stripe gateway initialiation
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // creating line items
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
            success_url : `${origin}/loading/mybookings`,
            cancel_url : `${origin}/mybookings`,
            line_items : line_items,
            mode : 'payment',
            metadata :{
                bookingId : booking._id.toString(),

            },
            expires_at : Math.floor(Date.now()/1000) + 30*60 //expires in 30 min
        })
        booking.paymentLink = session.url;
        await booking.save();

        res.json({success:true, url : session});

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
        
        const showData = await Show.findById(showId);
        
        if(!showData){
            return res.json({success:false, message:'Show not found'});
        }
        
        // Get occupied seats for the specific date-time slot
        const occupiedSeatsForSlot = showData.occupiedSeats.get(dateTimeKey) || {};
        const occupiedSeats = Object.keys(occupiedSeatsForSlot);
        
        res.json({success:true, message:'Occupied seats fetched successfully', occupiedSeats: occupiedSeats});

    }catch(err){
        console.log(err.message);
        res.json({success:false, message:'Error in fetching occupied seats'});
    }
}