import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dummyShowsData, dummyDateTimeData } from '../assets/assets';
import { assets } from '../assets/assets';
import Loading from '../components/Loading';
import isoTimeFormat from '../lib/isoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';
import { ArrowRight, Clock } from 'lucide-react';
import { generateDateRange } from '../lib/dateUtils';


const SeatLayout = () => {
  const groupRows = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['I', 'J']];
  const { id, date } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState(null);
  const navigate = useNavigate();


  const getShow = async () => {
    const foundShow = dummyShowsData.find(show => show._id === id);
    if (foundShow) {
      const realTimeDates = generateDateRange(4, dummyDateTimeData);
      
      setShow({
        movie: foundShow,
        dateTime: realTimeDates
      });
    }
  };


  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast.error("Please select a show time first");
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast.error("You can only select 5 seats");
    }
    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(seat => seat !== seatId) 
        : [...prev, seatId]
    );
  };


  const renderSeats = (row, count = 9) => {
    return (
      <div key={row} className="flex gap-2 mt-2">
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: count }, (_, i) => {
            const seatId = `${row}${i + 1}`;
            return (
              <button 
                key={seatId} 
                onClick={() => handleSeatClick(seatId)} 
                className={`h-8 w-8 rounded border border-primary/60 cursor-pointer transition hover:border-primary text-xs ${
                  selectedSeats.includes(seatId) 
                    ? "bg-primary text-white" 
                    : "hover:bg-primary/10"
                }`}
              >
                {seatId}
              </button>
            );
          })}
        </div>
      </div>
    );
  };


  useEffect(() => {
    getShow();
  }, []);


  return show ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-32 pt-24 pb-8 md:pt-28 md:pb-12 gap-8'>
      {/* Available Timings */}
      <div className='w-full md:w-60 bg-primary/10 border border-primary/20 rounded-lg py-6 px-4 h-max md:sticky md:top-28'>
        <p className='text-lg font-semibold mb-4'>Available Timings</p>
        <div className='space-y-1'>
          {show.dateTime[date] && show.dateTime[date].length > 0 ? (
            show.dateTime[date].map((item) => (
              <div 
                key={item.time} 
                onClick={() => setSelectedTime(item)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md cursor-pointer transition ${
                  selectedTime?.time === item.time 
                    ? 'bg-primary text-white' 
                    : 'hover:bg-primary/20'
                }`}
              >
                <Clock className='w-4 h-4' />
                <p className='text-sm'>{isoTimeFormat(item.time)}</p>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-400'>No timings available for this date</p>
          )}
        </div>
      </div>


      {/* Seat Layout */}
      <div className='relative flex-1 flex flex-col items-center'>
        <BlurCircle top='-100px' left='-100px' />
        <BlurCircle bottom='0px' right='0px' />
        <h1 className='text-2xl font-semibold mb-6'>Select Your Seat</h1>
        <img src={assets.screenImage} alt="screen" className='max-w-full mb-2' />
        <p className='text-gray-400 text-sm mb-8'>SCREEN SIDE</p>
        
        <div className='flex flex-col items-center w-full text-xs text-gray-300'>
          {/* First two rows (A, B) - centered at top */}
          <div className='flex flex-col items-center mb-8'>
            {groupRows[0].map(row => renderSeats(row))}
          </div>


          {/* Remaining rows in two columns with aisle gap */}
          <div className='grid grid-cols-2 gap-x-16 gap-y-8'>
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx} className='flex flex-col'>
                {group.map(row => renderSeats(row))}
              </div>
            ))}
          </div>
        </div>


        {/* Selected Seats Info */}
        {selectedSeats.length > 0 && (
          <div className='mt-10 text-center'>
            <p className='text-sm text-gray-400'>Selected Seats:</p>
            <p className='text-primary font-semibold text-lg mt-1'>{selectedSeats.join(', ')}</p>
          </div>
        )}


        <button 
          onClick={() => {
            if (!selectedTime) {
              toast.error('Please select a show time');
              return;
            }
            if (selectedSeats.length === 0) {
              toast.error('Please select at least one seat');
              return;
            }
            navigate('/mybookings');
          }}
          className='flex items-center gap-2 mt-12 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'
        >
          Proceed to checkout
          <ArrowRight strokeWidth={3} className='w-4 h-4' />
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};


export default SeatLayout;
