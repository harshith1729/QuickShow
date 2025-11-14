import React, { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast';
import Loading from '../../components/Loading';
import Title from '../../components/admin/title';
import { kConverter } from '../../lib/kConverter';
import { CheckIcon, Star, Trash2, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const AddShows = () => {

    const {axios, getToken, user, image_base_url} = useAppContext()
    const currency = import.meta.env.VITE_CURRENCY
    const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showtimes, setShowtimes] = useState([]);
    const [timeInput, setTimeInput] = useState("");
    const [showPrice, setShowPrice] = useState(""); 
    const [addingShow, setAddingShow] = useState(false)

    const fetchNowPlayingMovies = async () => {
        try {
            const {data} = await axios.get('/api/show/now-playing', {
                headers: {Authorization: `Bearer ${await getToken()}`}
            })
            if (data.success) {
                setNowPlayingMovies(data.movies)
            }
        } catch (err) {
            console.error('Error in fetching movies', err)
            toast.error('Failed to fetch movies')
        }
    };
    
    const handleAddTime = () => {
        if (!timeInput) {
            toast.error('Please enter a time');
            return;
        }
        
        if (showtimes.includes(timeInput)) {
            toast.error('This showtime is already added');
            return;
        }
        
        setShowtimes(prev => [...prev, timeInput].sort());
        toast.success('Showtime added');
        setTimeInput("");
    };

    const handleRemoveTime = (time) => {
        setShowtimes(prev => prev.filter(t => t !== time));
        toast.success('Showtime removed');
    };

    // Toggle movie selection
    const handleMovieSelect = (movieId) => {
        setSelectedMovie(prev => prev === movieId ? null : movieId);
    };

    const handleSubmit = async () => {
        try {
            setAddingShow(true)
            
            // Validation
            if (!selectedMovie) {
                toast.error("Please select a movie");
                setAddingShow(false);
                return;
            }
            if (!startDate || !endDate) {
                toast.error("Please select start and end dates");
                setAddingShow(false);
                return;
            }
            if (new Date(endDate) < new Date(startDate)) {
                toast.error("End date must be after start date");
                setAddingShow(false);
                return;
            }
            if (showtimes.length === 0) {
                toast.error("Please add at least one showtime");
                setAddingShow(false);
                return;
            }
            if (!showPrice) {
                toast.error("Please enter show price");
                setAddingShow(false);
                return;
            }
            
            const payLoad = {
                movieId: selectedMovie,
                startDate,
                endDate,
                showtimes,
                showPrice: Number(showPrice)
            }

            const {data} = await axios.post('/api/show/add', payLoad, {
                headers: {Authorization: `Bearer ${await getToken()}`}
            })
            
            if (data.success) {
                toast.success(data.message || 'Show added successfully!');
                // Reset form
                setSelectedMovie(null);
                setStartDate("");
                setEndDate("");
                setShowtimes([]);
                setShowPrice("");
            } else {
                toast.error(data.message || 'Failed to add show');
            }
        } catch (error) {
            console.error("Submission Error: ", error);
            toast.error(error.response?.data?.message || "An error occurred, please try again.");
        } finally {
            setAddingShow(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchNowPlayingMovies();
        }
    }, [user])

    return nowPlayingMovies.length > 0 ? (
        <>
            <Title text1="Add" text2="Shows"/>
            <p className='mt-10 text-lg font-medium'>Now Playing Movies</p>
            <div className="overflow-x-auto pb-4">
                <div className="group flex flex-wrap gap-4 mt-4 w-max">
                    {nowPlayingMovies.map((movie) => (
                        <div 
                            key={movie.id} 
                            className={`relative max-w-40 cursor-pointer 
                                group-hover:not-hover:opacity-40 hover:-translate-y-1 transition 
                                duration-300 ${selectedMovie === movie.id ? 'ring-2 ring-primary rounded-lg' : ''}`} 
                            onClick={() => handleMovieSelect(movie.id)}
                        >
                            <div className="relative rounded-lg overflow-hidden">
                                <img src={image_base_url + movie.poster_path} alt="" className="w-full 
                                    object-cover brightness-90" />
                                <div className="text-sm flex items-center justify-between 
                                    p-2 bg-black/70 w-full absolute bottom-0 left-0">
                                    <p className="flex items-center gap-1 
                                        text-gray-400">
                                        <Star className="w-4 h-4 text-primary 
                                            fill-primary" />
                                        {movie.vote_average.toFixed(1)}
                                    </p>
                                    <p className="text-gray-300">{kConverter(movie.vote_count)} Votes</p>
                                </div>
                            </div>
                            {selectedMovie === movie.id && (
                                <div className="absolute top-2 right-2 flex items-center 
                                    justify-center bg-primary h-6 w-6 rounded">
                                    <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </div>
                            )}
                            <p className='font-medium truncate'>{movie.title}</p>
                            <p className='font-medium truncate'>{movie.release_date}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Date Range Selection */}
            <div className="mt-8 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input 
                        type="date" 
                        value={startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-600 px-3 py-2 rounded-md outline-none"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2">End Date</label>
                    <input 
                        type="date" 
                        value={endDate}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-600 px-3 py-2 rounded-md outline-none"
                    />
                </div>
            </div>

            {/* Show Price */}
            <div className="mt-6">
                <label className="block text-sm font-medium mb-2">Show Price</label>
                <div className="inline-flex items-center gap-2 border border-gray-600 
                    px-3 py-2 rounded-md">
                    <p className="text-gray-400 text-sm">{currency}</p>
                    <input 
                        min={0} 
                        type="number" 
                        value={showPrice} 
                        onChange={(e) => setShowPrice(e.target.value)} 
                        placeholder="Enter show price" 
                        className="outline-none" 
                    />
                </div>
            </div>
            
            {/* Daily Showtimes */}
            <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                    Daily Showtimes (These times will be available every day)
                </label>
                <div className="inline-flex gap-3 border border-gray-600 p-1 pl-3 rounded-lg">
                    <input 
                        type="time" 
                        value={timeInput} 
                        onChange={(e) => setTimeInput(e.target.value)} 
                        className="outline-none rounded-md" 
                    />
                    <button 
                        onClick={handleAddTime} 
                        className="bg-primary/80 text-white px-4 py-2 text-sm rounded-lg 
                        hover:bg-primary cursor-pointer"
                    >
                        Add Time
                    </button>
                </div>
            </div>
            
            {/* Display Selected Showtimes */}
            {showtimes.length > 0 && (
                <div className="mt-6">
                    <h2 className="mb-3 font-medium">Selected Showtimes</h2>
                    <div className="flex flex-wrap gap-2">
                        {showtimes.map((time) => (
                            <div 
                                key={time} 
                                className="border border-primary px-3 py-2 flex items-center gap-2 rounded-md bg-primary/5"
                            >
                                <span className="font-medium">{time}</span>
                                <X 
                                    onClick={() => handleRemoveTime(time)} 
                                    className="w-4 h-4 text-red-500 hover:text-red-700 cursor-pointer" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Summary */}
            {selectedMovie && startDate && endDate && showtimes.length > 0 && (
                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-gray-300">
                        Show runs from <span className="text-primary font-medium">{startDate}</span> to <span className="text-primary font-medium">{endDate}</span>
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                        Daily showtimes: <span className="text-primary font-medium">{showtimes.join(', ')}</span>
                    </p>
                </div>
            )}
            
            <button 
                onClick={handleSubmit} 
                disabled={addingShow} 
                className="bg-primary text-white px-8 py-2 mt-6 rounded 
                hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 
                disabled:cursor-not-allowed"
            >
                {addingShow ? 'Adding Show...' : 'Add Show'}
            </button>
        </>
    ) : <Loading />
}

export default AddShows