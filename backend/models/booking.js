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

// Helper function to release seats from a booking
async function releaseSeatsFromBooking(booking) {
  try {
    if (!booking) return;
    
    console.log(`🗑️ Releasing seats for booking ${booking._id}...`);
    
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
  } catch (error) {
    console.error('Error releasing seats:', error);
  }
}

// ⭐ PRE-DELETE MIDDLEWARE: Automatically release seats when booking is deleted
bookingSchema.pre('findOneAndDelete', async function(next) {
  try {
    const booking = await this.model.findOne(this.getFilter());
    await releaseSeatsFromBooking(booking);
    next();
  } catch (error) {
    console.error('Error in pre-delete middleware:', error);
    next(error);
  }
});

// ⭐ Handle deleteOne
bookingSchema.pre('deleteOne', async function(next) {
  try {
    const booking = await this.model.findOne(this.getFilter());
    await releaseSeatsFromBooking(booking);
    next();
  } catch (error) {
    console.error('Error in deleteOne middleware:', error);
    next(error);
  }
});

// ⭐ Handle deleteMany - important for bulk deletes
bookingSchema.pre('deleteMany', async function(next) {
  try {
    const bookings = await this.model.find(this.getFilter());
    
    console.log(`🗑️ Bulk deleting ${bookings.length} bookings...`);
    
    // Release seats for each booking
    for (const booking of bookings) {
      await releaseSeatsFromBooking(booking);
    }
    
    next();
  } catch (error) {
    console.error('Error in deleteMany middleware:', error);
    next(error);
  }
});

// ⭐ STATIC METHOD: Clean up orphaned seats (seats occupied but no booking exists)
bookingSchema.statics.cleanupOrphanedSeats = async function() {
  try {
    console.log('🧹 Starting orphaned seats cleanup...');
    
    const shows = await Show.find({});
    let totalCleaned = 0;

    for (const show of shows) {
      const dateTimeKeys = Array.from(show.occupiedSeats.keys());
      let showUpdated = false;
      
      for (const dateTimeKey of dateTimeKeys) {
        const occupiedSeatsForSlot = show.occupiedSeats.get(dateTimeKey) || {};
        const seatIds = Object.keys(occupiedSeatsForSlot);
        
        if (seatIds.length === 0) continue;
        
        for (const seatId of seatIds) {
          const userId = occupiedSeatsForSlot[seatId];
          
          // Check if there's an active booking for this seat
          const booking = await this.findOne({
            show: show._id,
            dateTimeKey: dateTimeKey,
            bookedSeats: seatId,
            user: userId
          });
          
          // If no booking found, this seat is orphaned
          if (!booking) {
            console.log(`  🧹 Removing orphaned seat: ${seatId} (show: ${show._id}, time: ${dateTimeKey})`);
            delete occupiedSeatsForSlot[seatId];
            totalCleaned++;
            showUpdated = true;
          }
        }
        
        show.occupiedSeats.set(dateTimeKey, occupiedSeatsForSlot);
      }
      
      if (showUpdated) {
        show.markModified('occupiedSeats');
        await show.save();
      }
    }

    console.log(`✅ Orphaned seats cleanup complete! Removed ${totalCleaned} orphaned seats.`);
    return { success: true, cleanedSeats: totalCleaned };
  } catch (error) {
    console.error('Error cleaning up orphaned seats:', error);
    return { success: false, error: error.message };
  }
};

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;