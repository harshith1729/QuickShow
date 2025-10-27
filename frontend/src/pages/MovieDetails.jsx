import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { dummyDateTimeData, dummyShowsData } from '../assets/assets';
import BlurCircle from '../components/BlurCircle';
import { Heart, PlayCircleIcon, StarIcon } from 'lucide-react';
import timeFormat from '../lib/timeFormat';
import DateSelect from '../components/DateSelect';
import MovieCard from '../components/MoiveCard';
import { generateDateRange } from '../lib/dateUtils';

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);

  const getShow = async () => {
    try {
      setLoading(true);
      const foundShow = dummyShowsData.find(show => show._id === id);
      if (foundShow) {
        // Generate real-time dates with show times
        const realTimeDates = generateDateRange(4, dummyDateTimeData);
        
        setShow({
          movie: foundShow,
          dateTime: realTimeDates
        });
      }
    } catch (error) {
      console.error('Error fetching show:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-gray-400'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-xl text-gray-400'>Movie not found</p>
          <button 
            onClick={() => navigate('/movies')} 
            className='mt-4 px-6 py-2 bg-primary text-white rounded hover:bg-primary-dull transition'
          >
            Back to Movies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='px-6 md:px-16 lg:px-40 pt-30 md:pt-50 pb-20'>
      {/* Movie Header Section */}
      <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto mb-20'>
        <img 
          src={show.movie.poster_path} 
          alt={show.movie.title}
          className='max-md:mx-auto rounded-xl h-104 max-w-70 object-cover'
        />
        <div className='relative flex flex-col gap-3'>
          <BlurCircle top='-100px' left='-100px' />
          <p className='text-primary'>English</p>
          <h1 className='text-4xl font-semibold max-w-96 text-balance'>
            {show.movie.title}
          </h1>
          <div className='flex items-center gap-2 text-gray-300'>
            <StarIcon className='w-5 h-5 text-primary fill-primary' />
            <span>{show.movie.vote_average.toFixed(1)} User Rating</span>
          </div>
          <p className='text-gray-400 mt-2 text-sm leading-tight max-w-xl'>
            {show.movie.overview}
          </p>
          <p className='text-gray-300'>
            {timeFormat(show.movie.runtime)} • {show.movie.genres.map(genre => genre.name).join(', ')} • {show.movie.release_date.split('-')[0]}
          </p>
          <div className='flex items-center flex-wrap gap-4 mt-4'>
            <button className='flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 transition rounded-md font-medium cursor-pointer active:scale-95'>
              <PlayCircleIcon className='w-5 h-5' />
              Watch Trailer
            </button>
            <a 
              href="#dateSelect" 
              className='flex items-center px-7 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'
            >
              Buy Tickets
            </a>
            <button className='bg-gray-700 p-2.5 rounded-full transition cursor-pointer active:scale-95 hover:bg-gray-600'>
              <Heart className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      <div className='mb-20'>
        <p className='text-lg font-medium mb-8'>Your Favourite Cast</p>
        <div className='overflow-x-auto no-scrollbar'>
          <div className='flex items-center gap-6 w-max'>
            {show.movie.casts && show.movie.casts.slice(0, 12).map((cast, index) => (
              <div key={index} className='flex flex-col items-center text-center min-w-fit'>
                <div className='w-20 h-20 rounded-full bg-gray-700 overflow-hidden'>
                  <img 
                    src={cast.profile_path || cast.profilepath || 'https://via.placeholder.com/80'} 
                    alt={cast.name}
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=' + cast.name.charAt(0);
                    }}
                  />
                </div>
                <p className='font-medium text-xs mt-3 max-w-20'>{cast.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <DateSelect dateTime={show.dateTime} id={id} />

      {/* Similar Movies Section */}
      <div className='mt-20'>
        <p className='text-lg font-medium mb-8'>You may also like</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto'>
          {dummyShowsData.slice(0, 4).map((movie, index) => (
            <MovieCard key={index} movie={movie} />
          ))}
        </div>
      </div>

      {/* Show More Button */}
      <div className='flex justify-center mt-12'>
        <button 
          onClick={() => { navigate('/movies'); scrollTo(0, 0); }} 
          className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer active:scale-95'
        >
          Show more
        </button>
      </div>
    </div>
  );
};

export default MovieDetails;