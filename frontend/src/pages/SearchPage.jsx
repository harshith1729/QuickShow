import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext.jsx';
import MovieCard from '../components/MoiveCard.jsx';

const SearchPage = () => {
  const { shows } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const cleanSearch = searchTerm.toLowerCase().trim();

  const filteredShows = (shows || []).filter(show => {
    // Movie may come as show.movie OR directly as show
    const title =
      show?.movie?.title ||   // structure 1
      show?.title ||           // structure 2
      '';

    return title.toLowerCase().includes(cleanSearch);
  });

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-40 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto">

        {/* Search Bar */}
        <div className="relative mb-12">
          <input
            type="text"
            placeholder="Search for a movie..."
            className="w-full pl-14 pr-6 py-4 rounded-full bg-gray-800 text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {searchTerm.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center">
              Start typing to search for a movie.
            </p>
          ) : filteredShows.length > 0 ? (
            filteredShows.map((movie, index) => (
              <MovieCard key={index} movie={movie} />
            ))
          ) : (
            <p className="text-gray-400 col-span-full text-center">
              No movies found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
