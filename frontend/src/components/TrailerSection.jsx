import React, { useState } from 'react'
import { dummyTrailers } from '../assets/assets'
import BlurCircle from './BlurCircle';

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);

  // Extract YouTube video ID from URL
  const getYouTubeID = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeID(currentTrailer.videoUrl);

  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
      <p className='text-white font-medium text-2xl mb-6'>Trailers</p>

      {/* Video Player - Direct YouTube Embed (Shown First) */}
      <div className='relative mb-6'>
        <BlurCircle top='-100px' right='-100px' />
        <div className='w-full'>
          <div className='relative w-full rounded-2xl overflow-hidden' style={{ paddingBottom: '56.25%' }}>
            <iframe
              className='absolute top-0 left-0 w-full h-full'
              src={`https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </div>

      {/* Trailer thumbnails selector (Below the video) */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {dummyTrailers.map((trailer, index) => (
          <div
            key={index}
            className={`cursor-pointer transition-all duration-300 rounded-xl overflow-hidden ${
              currentTrailer.videoUrl === trailer.videoUrl 
                ? 'ring-2 ring-red-500 scale-105' 
                : 'opacity-60 hover:opacity-100'
            }`}
            onClick={() => setCurrentTrailer(trailer)}
          >
            <img 
              src={trailer.image} 
              alt={`Trailer ${index + 1}`}
              className='w-full h-full object-cover'
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TrailerSection