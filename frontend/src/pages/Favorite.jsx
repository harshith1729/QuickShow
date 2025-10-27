import React from 'react'
import {dummyShowsData} from '../assets/assets'
import MovieCard from '../components/MoiveCard'
import BlurCircle from '../components/BlurCircle'

const Favorite = () => {
  return dummyShowsData.length > 0 ? (
    <div
      className="relative my-40 mb-60 px-6 md:px-12 lg:px-24 overflow-hidden min-h-[80vh]"
    >
      <BlurCircle top='150px' left='0px' />
      <BlurCircle bottom='50px' right='50px' />
      <h1 className="text-lg font-medium my-4">Your Favourite Movies</h1>
      
      {/* ✅ Changed from flex-wrap to grid for consistent card sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {dummyShowsData.map((movie) => (
          <MovieCard movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold text-center">No movies available</h1>
    </div>
  )
}

export default Favorite