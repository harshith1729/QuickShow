import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import Loading from '../components/Loading';
import isoTimeFormat from '../lib/isoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';
import { ArrowRight, Clock, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatDateString } from '../lib/dateUtils';

const SeatLayout = () => {
  const { axios, user, getToken } = useAppContext();
  const groupRows = [['A', 'B'], ['C', 'D'], ['E', 'F'], ['G', 'H'], ['I', 'J']];
  const { id, date } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showData, setShowData] = useState(null);
  const [availableShows, setAvailableShows] = useState([]);
  const navigate = useNavigate();
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      console.log("=== FULL API RESPONSE ===");
      console.log("Complete data:", data);
      
      if (data.success) {
        setShowData(data.movie || data.show || data); 
        
        if (data.dateTime && data.dateTime[date]) {
          setAvailableShows(data.dateTime[date]);
          console.log("Shows for date:", data.dateTime[date]);
        } else {
          console.log("No shows found for date:", date);
          setAvailableShows([]);
        }
      }
    } catch (error) {
      console.log("API Error:", error);
      toast.error("Failed to load show details");
    }
  };

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast.error("Please select a show time first");
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast.error("You can only select 5 seats");
    }
    if (occupiedSeats.includes(seatId)) {
      return toast.error('This seat is already booked');
    }
    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(seat => seat !== seatId)
        : [...prev, seatId]
    );
  };

  const bookTickets = async () => {
    try {
      if (!user) {
        return toast.error("Please login to proceed");
      }
      if (!selectedTime || selectedSeats.length === 0) {
        return toast.error("Please select time and seats");
      }

      const { data } = await axios.post(
        '/api/booking/create',
        {
          showId: selectedTime.showId,
          dateTimeKey: selectedTime.dateTimeKey,
          selectedSeats
        },
        {
          headers: { Authorization: `Bearer ${await getToken()}` }
        }
      );

      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("Booking error:", error);
      toast.error(error.response?.data?.message || "Booking failed");
    }
  };

  const renderSeats = (row, count = 9) => {
    return (
      <div key={row} className="flex gap-1.5 sm:gap-2 mt-2">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: count }, (_, i) => {
            const seatId = `${row}${i + 1}`;
            const isOccupied = occupiedSeats.includes(seatId);
            const isSelected = selectedSeats.includes(seatId);
            
            return (
              <button
                key={seatId}
                onClick={() => handleSeatClick(seatId)}
                disabled={isOccupied}
                className={`
                  h-7 w-7 sm:h-8 sm:w-8 
                  rounded border border-primary/60 
                  cursor-pointer transition 
                  hover:border-primary 
                  text-[10px] sm:text-xs
                  flex items-center justify-center
                  ${isSelected ? "bg-primary text-white border-primary" : "hover:bg-primary/10"}
                  ${isOccupied ? "opacity-50 cursor-not-allowed bg-gray-600" : ""}
                `}
              >
                {seatId}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const getOccupiedSeats = async () => {
    try {
      if (!selectedTime || !selectedTime.showId || !selectedTime.dateTimeKey) {
        console.log("Missing required data for fetching occupied seats");
        return;
      }

      setLoadingSeats(true);
      const { data } = await axios.get(
        `/api/booking/seats/${selectedTime.showId}/${selectedTime.dateTimeKey}`
      );

      if (data.success) {
        setOccupiedSeats(data.occupiedSeats || []);
        console.log("✅ Occupied seats:", data.occupiedSeats);
      } else {
        toast.error(data.message || "Failed to fetch occupied seats");
        setOccupiedSeats([]);
      }
    } catch (error) {
      console.log("Error fetching occupied seats:", error);
      toast.error(error.response?.data?.message || "Failed to fetch occupied seats");
      setOccupiedSeats([]);
    } finally {
      setLoadingSeats(false);
    }
  };

  // Format date for display
const formatDate = (dateStr) => {
  return formatDateString(dateStr);
};

  useEffect(() => {
    getShow();
  }, [id]);

  useEffect(() => {
    if (selectedTime && selectedTime.showId && selectedTime.dateTimeKey) {
      setSelectedSeats([]);
      getOccupiedSeats();
    }
  }, [selectedTime]);

  return showData ? (
    <div className='flex flex-col lg:flex-row px-4 sm:px-6 md:px-16 lg:px-32 pt-20 pb-8 md:pt-28 md:pb-12 gap-6 lg:gap-8'>
      {/* Available Timings - Mobile: Full width, Desktop: Sidebar */}
      <div className='w-full lg:w-60 bg-primary/10 border border-primary/20 rounded-lg py-4 sm:py-6 px-3 sm:px-4 h-max lg:sticky lg:top-28'>
        <div className='flex items-center gap-2 mb-3 sm:mb-4'>
          <Calendar className='w-4 h-4 text-primary' />
          <p className='text-sm sm:text-base font-semibold'>
            {formatDate(date)}
          </p>
        </div>
        
        <p className='text-base sm:text-lg font-semibold mb-3 sm:mb-4'>Available Timings</p>
        
        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2'>
          {availableShows.length > 0 ? (
            availableShows.map((showItem, index) => (
              <div
                key={index}
                onClick={() => setSelectedTime(showItem)}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg cursor-pointer transition ${
                  selectedTime?.time === showItem.time
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/20'
                }`}
              >
                <Clock className='w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0' />
                <p className='text-xs sm:text-sm font-medium'>
                  {isoTimeFormat(showItem.time)}
                </p>
              </div>
            ))
          ) : (
            <p className='text-xs sm:text-sm text-gray-400 col-span-full'>
              No showtimes available for this date
            </p>
          )}
        </div>
      </div>

      {/* Seat Layout */}
      <div className='relative flex-1 flex flex-col items-center'>
        <BlurCircle top='-100px' left='-100px' />
        <BlurCircle bottom='0px' right='0px' />
        
        <h1 className='text-xl sm:text-2xl font-semibold mb-4 sm:mb-6'>Select Your Seat</h1>
        
        {/* Screen */}
        <img 
          src={assets.screenImage} 
          alt="screen" 
          className='max-w-full w-full sm:w-4/5 md:w-3/4 mb-2' 
        />
        <p className='text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8'>SCREEN SIDE</p>

        {/* Seat Selection Status */}
        {!selectedTime && (
          <div className='mb-6 text-center px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg'>
            <p className='text-xs sm:text-sm text-yellow-500'>
              Please select a show time to view available seats
            </p>
          </div>
        )}

        {loadingSeats && (
          <div className='mb-6 text-center'>
            <p className='text-xs sm:text-sm text-gray-400'>Loading seats...</p>
          </div>
        )}

        {/* Seat Layout */}
        <div className='flex flex-col items-center w-full text-xs text-gray-300 overflow-x-auto pb-4'>
          <div className='min-w-max'>
            {/* First two rows (A, B) - centered at top */}
            <div className='flex flex-col items-center mb-6 sm:mb-8'>
              {groupRows[0].map(row => renderSeats(row))}
            </div>

            {/* Remaining rows in two columns with aisle gap */}
            <div className='grid grid-cols-2 gap-x-8 sm:gap-x-12 md:gap-x-16 gap-y-6 sm:gap-y-8'>
              {groupRows.slice(1).map((group, idx) => (
                <div key={idx} className='flex flex-col'>
                  {group.map(row => renderSeats(row))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 text-xs sm:text-sm'>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 sm:h-7 sm:w-7 rounded border border-primary/60'></div>
            <span className='text-gray-400'>Available</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 sm:h-7 sm:w-7 rounded bg-primary border border-primary'></div>
            <span className='text-gray-400'>Selected</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='h-6 w-6 sm:h-7 sm:w-7 rounded bg-gray-600 opacity-50'></div>
            <span className='text-gray-400'>Occupied</span>
          </div>
        </div>

        {/* Selected Seats Info */}
        {selectedSeats.length > 0 && (
          <div className='mt-6 sm:mt-10 text-center px-4 py-3 bg-primary/10 rounded-lg border border-primary/20'>
            <p className='text-xs sm:text-sm text-gray-400'>Selected Seats:</p>
            <p className='text-primary font-semibold text-base sm:text-lg mt-1'>
              {selectedSeats.join(', ')}
            </p>
          </div>
        )}

        <button
          onClick={bookTickets}
          disabled={!selectedTime || selectedSeats.length === 0}
          className='flex items-center gap-2 mt-8 sm:mt-12 px-8 sm:px-10 py-2.5 sm:py-3 text-xs sm:text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Proceed to checkout
          <ArrowRight strokeWidth={3} className='w-3 h-3 sm:w-4 sm:h-4' />
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;