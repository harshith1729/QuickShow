import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import Loading from '../components/Loading';
import isoTimeFormat from '../lib/isoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';
import { ArrowRight, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

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

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);
      console.log("=== FULL API RESPONSE ===");
      console.log("Complete data:", data);
      console.log("data.success:", data.success);
      console.log("data.movie:", data.movie);
      console.log("data.dateTime:", data.dateTime);
      console.log("Date from URL:", date);
      
      if (data.success) {
        // Store the entire response for now to see what we have
        setShowData(data.movie || data.show || data); 
        
        // Check if dateTime exists and has shows for the selected date
        if (data.dateTime && data.dateTime[date]) {
          setAvailableShows(data.dateTime[date]);
          console.log("Shows for date:", data.dateTime[date]);
        } else {
          console.log("No shows found for date:", date);
          console.log("Available dates:", data.dateTime ? Object.keys(data.dateTime) : 'No dateTime object');
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
      return toast('This seat is already booked');
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
          showId: selectedTime.showId, // Use showId from the selected time object
          dateTimeKey: selectedTime.dateTimeKey, // Use dateTimeKey from the selected time object
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
      <div key={row} className="flex gap-2 mt-2">
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: count }, (_, i) => {
            const seatId = `${row}${i + 1}`;
            const isOccupied = occupiedSeats.includes(seatId);
            return (
              <button
                key={seatId}
                onClick={() => handleSeatClick(seatId)}
                disabled={isOccupied}
                className={`h-8 w-8 rounded border border-primary/60 cursor-pointer transition hover:border-primary text-xs ${
                  selectedSeats.includes(seatId)
                    ? "bg-primary text-white"
                    : "hover:bg-primary/10"
                } ${isOccupied ? "opacity-50 cursor-not-allowed" : ""}`}
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

      const { data } = await axios.get(
        `/api/booking/seats/${selectedTime.showId}/${selectedTime.dateTimeKey}`
      );

      if (data.success) {
        setOccupiedSeats(data.occupiedSeats || []);
      } else {
        toast.error(data.message || "Failed to fetch occupied seats");
        setOccupiedSeats([]);
      }
    } catch (error) {
      console.log("Error fetching occupied seats:", error);
      toast.error(error.response?.data?.message || "Failed to fetch occupied seats");
      setOccupiedSeats([]);
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  useEffect(() => {
    if (selectedTime && selectedTime.showId && selectedTime.dateTimeKey) {
      setSelectedSeats([]); // Clear selected seats when time changes
      getOccupiedSeats();
    }
  }, [selectedTime]);

  return showData ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-32 pt-24 pb-8 md:pt-28 md:pb-12 gap-8'>
      {/* Available Timings */}
      <div className='w-full md:w-60 bg-primary/10 border border-primary/20 rounded-lg py-6 px-4 h-max md:sticky md:top-28'>
        <p className='text-lg font-semibold mb-4'>Available Timings</p>
        <div className='space-y-2'>
          {availableShows.length > 0 ? (
            availableShows.map((showItem, index) => (
              <div
                key={index}
                onClick={() => setSelectedTime(showItem)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${
                  selectedTime?.time === showItem.time
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/20'
                }`}
              >
                <Clock className='w-4 h-4 flex-shrink-0' />
                <p className='text-sm font-medium'>{isoTimeFormat(showItem.time)}</p>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-400'>No showtimes available for {date}</p>
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
          onClick={bookTickets}
          disabled={!selectedTime || selectedSeats.length === 0}
          className='flex items-center gap-2 mt-12 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
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