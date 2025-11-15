import axios from 'axios';
import Movie from '../models/movie.js';
import Show from '../models/show.js';
import { inngest } from '../inngest/index.js';

// Helper function to get UTC midnight for today
const getTodayUTC = () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Use setUTCHours for consistency
    return today;
}

//API to get now playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
            headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
        });

        const movies = data.results;
        res.json({ success: true, movies: movies });
    } catch (err) {
        console.error('Error fetching now playing movies:', err.message);
        res.json({ success: false, message: err.message });
    }
}

//API to add a new show to database
export const addShow = async (req, res) => {
    try {
        const { movieId, startDate, endDate, showtimes, showPrice } = req.body;
        
        // ⭐ FIX: Treat date strings as UTC to avoid timezone bugs.
        // Appending T00:00:00.000Z makes "2025-11-16" become Nov 16 UTC, not Nov 16 local time.
        const start = new Date(`${startDate}T00:00:00.000Z`);
        
        // Set end date to the *end* of the day in UTC.
        const end = new Date(`${endDate}T23:59:59.999Z`);
        
        if (end < start) {
            return res.json({ success: false, message: 'End date must be after start date' });
        }
        
        let movie = await Movie.findById(movieId);
        
        if (!movie) {
            // fetch movie details from TMDB
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers: { Authorization: `Bearer ${process.env.TMDB_API_KEY}` }
                })
            ]);
            
            const movieApidata = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;

            const movieDetails = {
                _id: movieId,
                title: movieApidata.title,
                overview: movieApidata.overview,
                poster_path: movieApidata.poster_path,
                backdrop_path: movieApidata.backdrop_path,
                releasedate: movieApidata.release_date,
                original_language: movieApidata.original_language,
                tagline: movieApidata.tagline,
                genres: movieApidata.genres,
                casts: movieCreditsData.cast.slice(0, 5), // top 5 casts
                vote_average: movieApidata.vote_average,
                runtime: movieApidata.runtime
            }
            
            // Create new movie in database
            movie = await Movie.create(movieDetails);
        }
        
        // Create the show with date range and showtimes
        await Show.create({
            movie: movieId,
            startDate: start, // Already a UTC date object
            endDate: end,     // Already a UTC date object
            showtimes: showtimes, // Array like ["10:00", "14:00", "18:00", "21:00"]
            showPrice,
            occupiedSeats: new Map()
        });
        
        // trigger inngest event 
        await inngest.send({
            name : "app/show.added",
            data : {movieTitle: movie.title}
        });
        
        res.json({ success: true, message: 'Show added successfully' });
        
    } catch (err) {
        console.error('Error adding show:', err.message);
        res.json({ success: false, message: err.message });
    }
}


// API to get all shows from the database (active shows only)
export const getAllShows = async (req, res) => {
    try {
        // ⭐ FIX: Get today at UTC midnight
        const today = getTodayUTC();
        
        const shows = await Show.find({ 
            endDate: { $gte: today } // Show is still active
        })
            .populate('movie')
            .sort({ startDate: 1 });
        
        // Filter unique movies using Map
        const uniqueMoviesMap = new Map();
        shows.forEach(show => {
            if (show.movie && !uniqueMoviesMap.has(show.movie._id.toString())) {
                uniqueMoviesMap.set(show.movie._id.toString(), show.movie);
            }
        });
        
        const uniqueMovies = Array.from(uniqueMoviesMap.values());
        
        res.json({ success: true, shows: uniqueMovies });
    } catch (err) {
        console.error('Error fetching shows:', err.message);
        res.json({ success: false, message: err.message });
    }
}

//API to get an individual show from the database
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;
        // ⭐ FIX: Get today at UTC midnight
        const today = getTodayUTC();
        
        // Get all active shows for the movie
        const shows = await Show.find({ 
            movie: movieId, 
            endDate: { $gte: today }
        });

        const movie = await Movie.findById(movieId);
        
        if (!movie) {
            return res.json({ success: false, message: 'Movie not found' });
        }
        
        if (shows.length === 0) {
            return res.json({ success: false, message: 'No active shows for this movie' });
        }
        
        // Build dateTime object with available showtimes
        const dateTime = {};
        
        shows.forEach((show) => {
            const start = new Date(show.startDate); // Already UTC
            const end = new Date(show.endDate);     // Already UTC
            
            // Generate all dates between start and end
            // ⭐ FIX: Use setUTCDate and getDate() to loop correctly in UTC
            for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
                
                // Only include dates from today onwards
                if (d >= today) {
                    // ⭐ FIX: Use toISOString to get the correct YYYY-MM-DD string
                    const dateStr = d.toISOString().split("T")[0];
                    
                    if (!dateTime[dateStr]) {
                        dateTime[dateStr] = [];
                    }
                    
                    // Add all showtimes for this date
                    show.showtimes.forEach((time) => { // time is "10:00"
                        const dateTimeKey = `${dateStr}_${time}`;
                        const occupiedSeatsForSlot = show.occupiedSeats.get(dateTimeKey) || {};
                        
                        dateTime[dateStr].push({
                            // time: `${dateStr}T${time}:00`, // This creates a local time
                            // ⭐ FIX: Create the UTC datetime string correctly
                            time: `${dateStr}T${time}:00.000Z`,
                            showId: show._id,
                            dateTimeKey: dateTimeKey, // This will be used to identify the specific slot
                            showPrice: show.showPrice,
                            occupiedSeats: occupiedSeatsForSlot
                        });
                    });
                }
            }
        });
        
        res.json({ success: true, movie, dateTime });
    } catch (err) {
        console.error('Error fetching show:', err.message);
        res.json({ success: false, message: err.message });
    }
}