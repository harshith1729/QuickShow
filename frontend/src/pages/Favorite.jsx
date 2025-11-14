import React from "react";
import MovieCard from "../components/MoiveCard";
import BlurCircle from "../components/BlurCircle";
import { useAppContext } from "../context/AppContext";

const Favorite = () => {
  const { favouriteMovies, image_base_url } = useAppContext();

  if (!favouriteMovies) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-primary text-lg font-medium animate-pulse">
          Loading Favorites...
        </p>
      </div>
    );
  }

  if (favouriteMovies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-3xl font-bold text-center">No movies available</h1>
      </div>
    );
  }

  return (
    <div className="relative my-40 mb-60 px-6 md:px-12 lg:px-24 overflow-hidden min-h-[80vh]">
      <BlurCircle top="150px" left="0px" />
      <BlurCircle bottom="50px" right="50px" />
      <h1 className="text-lg font-medium my-4">Your Favourite Movies</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {favouriteMovies.map((movie) => (
          <MovieCard movie={movie} key={movie._id} image_base_url={image_base_url} />
        ))}
      </div>
    </div>
  );
};

export default Favorite;