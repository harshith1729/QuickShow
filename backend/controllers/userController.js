import Booking from '../models/booking.js';
import { clerkClient } from '@clerk/express';
import Movie from '../models/movie.js';

export const getUserBookings = async(req, res) => {
    try{
        const user = req.auth.userId;
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

export const updateFavourite = async(req, res) => {
    try{
        const {movieId} = req.body;
        const userId = req.auth.userId;
        
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
        const userId = req.auth.userId;
        
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
        
        // ⭐ NEW: Get the IDs of movies that actually exist
        const existingMovieIds = movies.map(movie => movie._id.toString());
        
        // ⭐ NEW: Find deleted movie IDs (those in favourites but not in database)
        const deletedMovieIds = favourites.filter(id => !existingMovieIds.includes(id));
        
        // ⭐ NEW: If there are deleted movies, clean them up from Clerk
        if (deletedMovieIds.length > 0) {
            console.log(`🧹 Cleaning up ${deletedMovieIds.length} deleted movies from user ${userId}'s favorites`);
            
            const updatedFavourites = favourites.filter(id => existingMovieIds.includes(id));
            
            await clerkClient.users.updateUser(userId, {
                privateMetadata: {
                    ...user.privateMetadata,
                    favourites: updatedFavourites
                },
            });
            
            console.log(`✅ Removed deleted movies: ${deletedMovieIds.join(', ')}`);
        }
        
        res.json({success: true, movies});
    }catch(err){
        console.error(err.message);
        res.status(500).json({success: false, message: err.message});
    }
}