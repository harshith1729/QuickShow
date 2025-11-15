import React from 'react';
import bgImage from '../assets/backgroundImage1.jpg'; // Assuming this is the Nani/Jersey image
import { ArrowRight, Calendar as CalendarIcon, Clock as ClockIcon } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <div
            className="flex flex-col items-start justify-center gap-4 px-6 md:px-12 lg:px-24 bg-cover bg-center h-screen text-white"
            style={{
                // Lighter gradient: 60% opacity fading to transparent
                backgroundImage: `
                    linear-gradient(to right, rgba(0, 0, 0, 0.6) 25%, transparent 70%), 
                    url(${bgImage})
                `
            }}
        >
            <h1 
                className="text-5xl md:text-[70px] md:leading-snug font-bold max-w-lg mt-20"
                style={{ textShadow: '2px 2px 10px rgba(0, 0, 0, 0.8)' }} // Stronger shadow
            >
                Jersey
            </h1>

            {/* === CHANGED === */}
            {/* Increased from text-sm to text-base and updated icons to match */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-200 text-base font-medium">
                <span>Sports | Drama</span>
                <span className="text-gray-400">|</span>
                <div className="flex items-center gap-1.5"> {/* Added slight gap for icon */}
                    <CalendarIcon className="w-4 h-4" /> 2019
                </div>
                <span className="text-gray-400">|</span>
                <div className="flex items-center gap-1.5"> {/* Added slight gap for icon */}
                    <ClockIcon className="w-4 h-4" /> 2h 40m
                </div>
            </div>

            {/* === CHANGED === */}
            {/* Increased from text-sm to text-lg and added leading-relaxed */}
            <p 
                className='max-w-md text-gray-200 text-lg leading-relaxed' 
                style={{ textShadow: '1px 1px 6px rgba(0, 0, 0, 0.7)' }} 
            >
                A talented but failed cricketer decides to return to the sport in his late thirties,
                driven by a desire to represent the Indian team and fulfill his son's wish for a jersey.
            </p>

            <button 
                onClick={() => navigate('/movies')} 
                className='flex items-center gap-2 px-6 py-3 text-sm bg-red-600 hover:bg-red-700 transition rounded-full font-medium cursor-pointer mt-4'
            >
                Watch Now
                <ArrowRight className="w-3.5 h-3.5"/>
            </button>
        </div>
    );
};

export default HeroSection;