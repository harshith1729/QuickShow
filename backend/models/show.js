import mongoose from 'mongoose';

const showSchema = new mongoose.Schema(
    {
        movie: { type: String, required: true, ref: 'Movie' },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        showtimes: { type: [String], required: true }, // Array of times like ["10:00", "14:00", "18:00", "21:00"]
        showPrice: { type: Number, required: true },
        occupiedSeats: { 
            type: Map, 
            of: Object, 
            default: {} 
        }, // Structure: { "2025-11-15_10:00": { "A1": "userId", "A2": "userId" } }
    },
    { minimize: false, timestamps: true }
)

// Index for efficient queries
showSchema.index({ movie: 1, startDate: 1, endDate: 1 });

const Show = mongoose.model('Show', showSchema);

export default Show;