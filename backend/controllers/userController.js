// Api controller function to get user bookings
import Booking from '../models/booking.js';
import { clerkClient } from '@clerk/express';
import Movie from '../models/movie.js';

export const getUserBookings = async(req, res) => {
    try{
        const user = req.auth.userId; // Fixed: removed parentheses
        const bookings = await Booking.find({user}).populate({
            path: 'show',
            populate: {path: 'movie'}
        }).sort({createdAt: -1});
        res.json({success: true, bookings});
    }catch(err){
        console.error(err.message);
        res.status(500).json({success: false, message: err.message});
    }
}

// api controller function to update favourite movie in clerk user MetaData
export const updateFavourite = async(req, res) => {
    try{
        const {movieId} = req.body;
        const userId = req.auth.userId; // Fixed: removed parentheses
        
        if (!userId) {
            return res.status(401).json({success: false, message: "User not authenticated"});
        }

        const user = await clerkClient.users.getUser(userId);
        const currentFavourites = user.privateMetadata.favourites || [];
        
        let updatedFavourites;
        if (!currentFavourites.includes(movieId)) {
            updatedFavourites = [...currentFavourites, movieId];
        } else {
            updatedFavourites = currentFavourites.filter(id => id !== movieId);
        }
        
        await clerkClient.users.updateUser(userId, {
            privateMetadata: {
                ...user.privateMetadata,
                favourites: updatedFavourites
            },
        });
        
        res.json({success: true, message: "Favorites updated successfully"});
    }catch(err){
        console.error(err.message);
        res.status(500).json({success: false, message: err.message});
    }
}

export const getFavourites = async(req, res) => {
    try{
        const userId = req.auth.userId; // Fixed: removed parentheses
        
        if (!userId) {
            return res.status(401).json({success: false, message: "User not authenticated"});
        }

        const user = await clerkClient.users.getUser(userId);
        const favourites = user.privateMetadata.favourites || [];
        
        // If no favourites, return empty array
        if (favourites.length === 0) {
            return res.json({success: true, movies: []});
        }
        
        // Getting movies from database
        const movies = await Movie.find({_id: {$in: favourites}});
        res.json({success: true, movies});
    }catch(err){
        console.error(err.message);
        res.status(500).json({success: false, message: err.message});
    }
}