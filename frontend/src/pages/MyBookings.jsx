import React, { useState, useEffect, useRef } from 'react';
import Loading from '../components/Loading';
import BlurCircle from '../components/BlurCircle';
import timeFormat from '../lib/timeFormat';
import { parseDateTimeKey } from '../lib/dateUtils';
import { useAppContext } from '../context/AppContext';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || '₹';
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeftMap, setTimeLeftMap] = useState({});
  const expiredBookingsRef = useRef(new Set()); // Track which bookings we've already shown toast for
  const { axios, getToken, user, image_base_url } = useAppContext();

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get(
        "/api/user/bookings",
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setBookings(data.bookings);
        // ‼️ Initialize timeLeftMap from API data
        const initialTimeLeft = {};
        data.bookings.forEach(booking => {
          if (!booking.isPaid && booking.timeRemaining > 0 && booking.paymentStatus === 'pending') {
            initialTimeLeft[booking._id] = booking.timeRemaining;
          }
        });
        setTimeLeftMap(initialTimeLeft);
      }
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };

  // ⭐ Real-time countdown timer
  useEffect(() => {
    if (bookings.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      const newTimeLeftMap = {};
      let shouldRefresh = false;

      bookings.forEach((booking) => {
        // ‼️ Only count down for 'pending' bookings
        if (!booking.isPaid && booking.expiresAt && booking.paymentStatus === 'pending') {
          const timeLeft = new Date(booking.expiresAt) - now;
          
          if (timeLeft <= 0) {
            newTimeLeftMap[booking._id] = 0;
            
            // Only show toast once per booking
            if (!expiredBookingsRef.current.has(booking._id)) {
              expiredBookingsRef.current.add(booking._id);
              shouldRefresh = true; // Set flag to refresh data from API
            }
          } else {
            newTimeLeftMap[booking._id] = timeLeft;
          }
        }
      });

      setTimeLeftMap(newTimeLeftMap);

      // Refresh bookings only once when expiration detected
      if (shouldRefresh) {
        toast.error('Payment time expired. Please book again.');
        getMyBookings(); // This will fetch the new 'failed' status
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookings]);

  // Format time remaining
  const formatTimeLeft = (milliseconds) => {
    if (milliseconds <= 0) return 'Expired';
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // ⭐ Handle payment link click with expiration check
  const handlePayNow = (booking) => {
    const now = new Date();
    const expiresAt = new Date(booking.expiresAt);
    
    // Check if booking is expired
    if (now > expiresAt || booking.isExpired || !booking.paymentLink) {
      toast.error('Payment time expired. Please create a new booking.');
      getMyBookings(); // Refresh to show updated status
      return;
    }
    
    // Redirect to payment
    window.location.href = booking.paymentLink;
  };

  useEffect(() => {
    if (user) getMyBookings();
  }, [user]);

  if (isLoading) return <Loading />;

  return (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 pb-20 min-h-[80vh]'>
      <BlurCircle top='100px' left='100px' />
      <BlurCircle bottom='0px' right='600px' />

      <h1 className='text-2xl font-semibold mb-8'>My Bookings</h1>

      {bookings.length > 0 ? (
        bookings.map((item) => {
          const movie = item.show?.movie;
          const { date, time } = parseDateTimeKey(item.dateTimeKey);
          // ‼️ Get time from state map, or from API, or 0
          const timeLeft = timeLeftMap[item._id] || (item.paymentStatus === 'pending' ? item.timeRemaining : 0);
          const isExpiring = timeLeft > 0 && timeLeft <= 120000; // Less than 2 minutes

          return (
            <div
              key={item._id}
              className='flex flex-col md:flex-row justify-between bg-primary/10 border border-primary/20 rounded-lg mt-4 p-4 max-w-3xl'
            >
              {/* Left Section */}
              <div className='flex flex-col md:flex-row gap-4'>
                <img
                  src={image_base_url + movie?.poster_path}
                  alt={movie?.title}
                  className='w-full md:w-45 aspect-[2/3] object-cover rounded'
                />

                <div className='flex flex-col justify-between py-2'>
                  <div>
                    <p className='text-lg font-semibold'>{movie?.title}</p>
                    <p className='text-gray-400 text-sm mt-1'>
                      {timeFormat(movie?.runtime)}
                    </p>
                    <p className='text-gray-400 text-sm mt-1'>
                      Date: {date}
                    </p>
                    <p className='text-gray-400 text-sm mt-1'>
                      Time: {time}
                    </p>
                  </div>

                  <div className='mt-4'>
                    <p className='text-sm text-gray-400'>Seats:</p>
                    <p className='text-sm font-medium text-primary'>
                      {item.bookedSeats.join(', ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className='flex flex-col md:items-end md:text-right justify-between p-4 md:p-2'>
                <div className='flex flex-col items-start md:items-end gap-3'>
                  <p className='text-2xl font-semibold'>
                    {currency}
                    {item.amount}
                  </p>

                  {/* ‼️ CORRECTED Payment Status Logic */}
                  {item.isPaid ? (
                    // ✅ Paid bookings
                    <span className='bg-green-500/20 text-green-400 px-4 py-1.5 text-sm rounded-full font-medium'>
                      Paid ✓
                    </span>
                  ) : (item.paymentStatus === 'pending' && !item.isExpired && timeLeft > 0) ? (
                    // 🔵 Active booking with payment link (within 5 minutes)
                    <div className='flex flex-col items-end gap-2'>
                      <button
                        onClick={() => handlePayNow(item)}
                        className='bg-primary hover:bg-primary-dull px-6 py-2 text-sm rounded-full font-medium cursor-pointer transition active:scale-95'
                      >
                        Pay Now
                      </button>
                      {/* Countdown Timer */}
                      <div className={`flex items-center gap-1 text-xs ${isExpiring ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                        <Clock size={14} />
                        <span>Expires in: {formatTimeLeft(timeLeft)}</span>
                      </div>
                    </div>
                  ) : (
                    // ❌ Expired or Failed booking
                    <span className='bg-red-500/20 text-red-400 px-4 py-1.5 text-sm rounded-full font-medium'>
                      Payment Failed
                    </span>
                  )}
                </div>

                <div className='text-sm text-gray-400 mt-4 md:mt-0'>
                  <p>Total Seats: {item.bookedSeats.length}</p>
                  <p>Booking ID: {item._id.slice(-8)}</p>
                  <p className='text-xs mt-1'>
                    Booked: {new Date(item.createdAt).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className='flex flex-col items-center justify-center py-20'>
          <p className='text-gray-400 text-lg'>No bookings found</p>
          <button
            onClick={() => window.location.href = '/movies'}
            className='mt-6 px-8 py-3 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
          >
            Browse Movies
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBookings;