import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon } from 'lucide-react';
import timeFormat from '../lib/timeFormat';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  return (
    <div
      className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl 
                 transition-all duration-300 ease-in-out cursor-pointer
                 hover:-translate-y-2 hover:scale-105 hover:shadow-xl hover:shadow-primary/20
                 max-w-[260px] w-full'
    >
      <img
        onClick={() => {
          navigate(`/movies/${movie._id}`);
          scrollTo(0, 0);
        }}
        src={movie.backdrop_path}
        alt={movie.title}
        className='rounded-xl w-full h-40 object-cover object-center'
      />
      <p className='font-semibold mt-3 truncate'>{movie.title}</p>
      <p className='text-xs text-gray-400 mt-2'>
        {new Date(movie.release_date).getFullYear()} •{' '}
        {movie.genres.slice(0, 2).map((genre) => genre.name).join(' | ')} •{' '}
        {timeFormat(movie.runtime)}
      </p>
      <div className='flex items-center justify-between mt-4 pb-1'>
        <button
          onClick={() => {
            navigate(`/movies/${movie._id}`);
            scrollTo(0, 0);
          }}
          className='px-4 py-2 text-xs bg-primary hover:bg-primary-dull transition rounded-full font-medium'
        >
          Buy Tickets
        </button>
        <p className='flex items-center gap-1 text-sm text-gray-400'>
          <StarIcon className='w-4 h-4 text-primary fill-primary' />
          {movie.vote_average.toFixed(1)}
        </p>
      </div>
    </div>
  );
};

export default MovieCard;