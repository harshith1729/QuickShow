import React, { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { Menu, Search, TicketPlus, X } from "lucide-react";
import { UserButton, useUser, useClerk } from "@clerk/clerk-react";




const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate  = useNavigate();

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 bg-transparent">
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="Logo" className="w-36 h-auto" />
      </Link>

      <div
        className={`
          max-md:absolute max-md:left-0 max-md:top-0 z-50
          flex flex-col items-center max-md:justify-center md:flex-row
          gap-8 max-md:h-screen md:px-8 py-3
          max-md:font-medium max-md:text-lg
          md:rounded-full border-gray-300/20 bg-black/70
          backdrop-blur md:border md:bg-white/10
          overflow-hidden transition-[width] duration-300
          ${isOpen ? "max-md:w-full" : "max-md:w-0"}
        `}
      >
        <X
          className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
          onClick={() => setIsOpen(false)}
        />

        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/">Home</Link>
        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/movies">Movies</Link>
        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/">Theaters</Link>
        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/">Releases</Link>
        <Link onClick={() => { window.scrollTo(0, 0); setIsOpen(false); }} to="/favourite">Favorites</Link>
      </div>

      <div className="flex items-center gap-8">
        <Search className="max-md:hidden w-6 h-6 cursor-pointer" />
        {!user ? (
          <button
            className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
            onClick={() => openSignIn()}
          >
            Login
          </button>
        ) : (
          <UserButton >
            <UserButton.MenuItems>
              <UserButton.Action  label="My Bookings"
               labelIcon={<TicketPlus width = {15} />} onClick={()=>
                navigate('/mybookings')
               } />
            </UserButton.MenuItems>
          </UserButton>
        )}
      </div>

      <Menu
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

export default NavBar;
