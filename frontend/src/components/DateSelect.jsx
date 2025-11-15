import React, { useState } from 'react';
import BlurCircle from './BlurCircle';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DateSelect = ({ dateTime, id }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const datesPerPage = 4;

  // Get array of dates from dateTime object
  const dates = Object.keys(dateTime || {});
  const totalPages = Math.ceil(dates.length / datesPerPage);

  // Get current page dates
  const startIndex = currentPage * datesPerPage;
  const endIndex = startIndex + datesPerPage;
  const currentDates = dates.slice(startIndex, endIndex);

  const onBookHandler = () => {
    if (!selected) {
      toast.error('Please select a date');
      return;
    }
    navigate(`/movies/${id}/${selected}`);
    scrollTo(0, 0);
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('en-US', { month: 'short' })
    };
  };

  if (!dateTime || dates.length === 0) {
    return (
      <div id='dateSelect' className='pt-10'>
        <div className='flex flex-col items-center justify-center p-8 bg-primary/10 border border-primary/20 rounded-lg'>
          <p className='text-gray-400'>No dates available for booking</p>
        </div>
      </div>
    );
  }

  return (
    <div id='dateSelect' className='pt-10'>
      <div className='relative p-8 bg-primary/10 border border-primary/20 rounded-lg'>
        <BlurCircle top='-100px' left='-100px' />
        <BlurCircle bottom='100px' right='0px' />
        
        <div className='w-full'>
          <p className='text-lg font-semibold mb-6'>Choose Date</p>
          
          <div className='flex items-center gap-4'>
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 0}
              className={`flex-shrink-0 transition ${
                currentPage === 0 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:text-primary cursor-pointer'
              }`}
            >
              <ChevronLeftIcon width={28} height={28} />
            </button>

            {/* Date Buttons */}
            <div className='flex items-center gap-4'>
              {currentDates.map((date) => {
                const { day, month } = formatDate(date);
                return (
                  <button
                    onClick={() => setSelected(date)}
                    key={date}
                    className={`flex flex-col items-center justify-center h-20 w-20 rounded-xl cursor-pointer transition-all flex-shrink-0 ${
                      selected === date
                        ? 'bg-primary text-white scale-105'
                        : 'border border-primary/70 hover:border-primary hover:bg-primary/10'
                    }`}
                  >
                    <span className='font-semibold text-xl'>{day}</span>
                    <span className='text-sm'>{month}</span>
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={currentPage >= totalPages - 1}
              className={`flex-shrink-0 transition ${
                currentPage >= totalPages - 1
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:text-primary cursor-pointer'
              }`}
            >
              <ChevronRightIcon width={28} height={28} />
            </button>

            {/* Book Now Button - Same line as dates */}
            <button
              onClick={onBookHandler}
              className='ml-auto bg-primary text-white px-10 py-4 rounded-xl hover:bg-primary/90 transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base'
            >
              Book Now
            </button>
          </div>

          {/* Selected Date Info */}
          {selected && (
            <div className='mt-6 text-sm text-gray-400'>
              Selected: {new Date(selected).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateSelect;