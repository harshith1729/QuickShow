import React from 'react';
import { assets } from '../assets/assets';
import bgImage from '../assets/backgroundImage.png'; // ✅ import background
import { ArrowRight } from "lucide-react";

import { Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {

    const navigate = useNavigate()
  return (
    <div
      className="flex flex-col items-start justify-center gap-4 px-6 md:px-12 lg:px-24 bg-cover bg-center h-screen"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <img src={assets.marvelLogo} alt="Marvel Logo" className="max-h-11 lg:h-11 mt-20" />

      <h1 className="text-5xl md:text-[70px] md:leading-snug font-semibold max-w-lg">
        Guardians <br /> of the Galaxy
      </h1>

      <div className="flex items-center gap-3 text-gray-300 text-sm">
        <span>Action | Adventure | Sci-Fi</span>
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5" /> 2018
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" /> 2h 8m
        </div>
      </div>
      <p className='max-w-md text-gray-300 text-sm'>In a post-apocalyptic 
        world where cities ride on wheels and consume each other to survive, 
        two people meet in London and try to stop a conspiracy.</p>
        <button onClick={() => navigate('/movies')} className='flex items-center gap-2 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
            Explore Movies
            <ArrowRight className="w-3.5 h-3.5"/>
        </button>
    </div>
  );
};

export default HeroSection;