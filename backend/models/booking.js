import mongoose from 'mongoose';
import Show from './show.js';

const bookingSchema = new mongoose.Schema({
  user: { type: String, required: true, ref: 'User' },
  show: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Show' },
  dateTimeKey: { type: String, required: true },
  amount: { type: Number, required: true },
  bookedSeats: { type: [String], required: true },
  isPaid: { type: Boolean, default: false },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'expired'], 
    default: 'pending' 
  },
  paymentLink: { type: String, default: '' },
  expiresAt: { type: Date },
}, { timestamps: true });

// Index for cleaning up expired bookings
bookingSchema.index({ expiresAt: 1 });

// ⭐ PRE-DELETE MIDDLEWARE: Automatically release seats when booking is deleted
bookingSchema.pre('findOneAndDelete', async function(next) {
  try {
    const booking = await this.model.findOne(this.getFilter());
    
    if (booking) {
      console.log(`🗑️ Deleting booking ${booking._id}, releasing seats...`);
      
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
        
        console.log(`✅ Released seats ${booking.bookedSeats.join(', ')} from show ${show._id}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in pre-delete middleware:', error);
    next(error);
  }
});

// ⭐ Also handle deleteOne and deleteMany
bookingSchema.pre('deleteOne', async function(next) {
  try {
    const booking = await this.model.findOne(this.getFilter());
    
    if (booking) {
      console.log(`🗑️ Deleting booking ${booking._id}, releasing seats...`);
      
      const show = await Show.findById(booking.show);
      if (show) {
        const occupiedSeatsForSlot = show.occupiedSeats.get(booking.dateTimeKey) || {};
        
        booking.bookedSeats.forEach((seat) => {
          delete occupiedSeatsForSlot[seat];
        });
        
        show.occupiedSeats.set(booking.dateTimeKey, occupiedSeatsForSlot);
        show.markModified('occupiedSeats');
        await show.save();
        
        console.log(`✅ Released seats ${booking.bookedSeats.join(', ')}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in deleteOne middleware:', error);
    next(error);
  }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;