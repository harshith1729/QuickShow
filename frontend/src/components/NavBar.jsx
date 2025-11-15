import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { Menu, Search, TicketPlus } from "lucide-react";
import { UserButton, useUser, useClerk } from "@clerk/clerk-react";
import { useAppContext } from "../context/AppContext";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const { favouriteMovies } = useAppContext();

  const hasFavourites = favouriteMovies && favouriteMovies.length > 0;

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-start px-6 md:px-16 lg:px-36 py-5">

      {/* Logo */}
      <Link to="/" className="flex items-center mr-12">
        <img src={assets.logo} alt="Logo" className="w-36 h-auto" />
      </Link>

      {/* Navbar Center */}
      <div
        className="
          flex items-center justify-center gap-8 
          px-8 py-3 rounded-full border border-gray-500/30 
          backdrop-blur-lg bg-black/70 text-white 
          transition-all duration-300 ease-in-out 
          w-[360px]
        "
      >
        <Link to="/">Home</Link>

        <Link to="/movies">Movies</Link>

        <Link
          to="/favourite"
          className="relative hover:text-red-400 transition-colors"
        >
          Favourites
          {hasFavourites && (
            <span className="absolute -top-2 -right-3 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </Link>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-8 ml-auto">

        {/* Search Icon */}
        <Search
          className="max-md:hidden w-7 h-7 cursor-pointer text-white hover:text-primary transition-colors"
          onClick={() => navigate("/search")}
        />

        {!user ? (
          <button
            className="px-4 py-1 sm:px-6 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium"
            onClick={() => openSignIn()}
          >
            Login
          </button>
        ) : (
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-12 h-12", // ⬅️ Increased profile picture size
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action
                label="My Bookings"
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate("/mybookings")}
              />
            </UserButton.MenuItems>
          </UserButton>
        )}

        {/* Mobile Menu Icon */}
        <Menu
          className="max-md:ml-4 md:hidden w-9 h-9 cursor-pointer text-white"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
    </div>
  );
};

export default NavBar;
