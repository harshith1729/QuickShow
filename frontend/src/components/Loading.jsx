import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Loading = () => {
  const {nextUrl} = useParams();
  const navigate = useNavigate();

  useEffect(()=>{
    if(nextUrl){
      setTimeout(()=>{
        navigate('/'+nextUrl)
      },8000)
    }
  },[])
  return (
    <div className="flex flex-col justify-center items-center h-[60vh] gap-6">
      {/* Spinning Circle Loader */}
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="w-16 h-16 border-4 border-gray-700 border-t-primary rounded-full animate-spin"></div>
        
        {/* Inner pulsing circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full animate-pulse opacity-60"></div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <p className="text-primary text-lg font-medium animate-pulse">
          Loading...
        </p>
        <div className="flex gap-1 justify-center mt-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
};

export default Loading;