import React, { useState, useEffect } from 'react';
import Loading from '../components/Loading';
import BlurCircle from '../components/BlurCircle';
import timeFormat from '../lib/timeFormat';
import { dateFormat } from '../lib/dateFormat';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || '$';
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { axios, getToken, user, image_base_url } = useAppContext();

  const getMyBookings = async () => {
    try {
      const { data } = await axios.get(
        "/api/user/bookings",
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.log(err);
    }
    setIsLoading(false);
  };

  // Get dateTimeKey safely
  const getShowDateTime = (booking) => {
    return (
      booking.dateTimeKey ||
      booking.show?.dateTimeKey ||
      booking.showDateTime ||
      booking.show?.showDateTime ||
      booking.createdAt
    );
  };

  const getFormattedShowTime = (booking) => {
    return (
      booking.time ||
      booking.showTime ||
      booking.show?.time ||
      booking.show?.showTime ||
      null
    );
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
          const showDateTime = getShowDateTime(item);
          const formattedShowTime = getFormattedShowTime(item);
          const movie = item.show?.movie;

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

                    {showDateTime && (
                      <p className='text-gray-400 text-sm mt-1'>
                        Date: {dateFormat(showDateTime)}
                      </p>
                    )}

                    {formattedShowTime && (
                      <p className='text-gray-400 text-sm mt-1'>
                        Time: {formattedShowTime}
                      </p>
                    )}
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

                  {/* Payment Status */}
                  {item.isPaid ? (
                    <span className='bg-green-500/20 text-green-400 px-4 py-1.5 text-sm rounded-full font-medium'>
                      Paid ✓
                    </span>
                  ) : item.paymentLink ? (
                    <Link
                      to={item.paymentLink}
                      className='bg-primary hover:bg-primary-dull px-6 py-2 text-sm rounded-full font-medium cursor-pointer transition active:scale-95'
                    >
                      Pay Now
                    </Link>
                  ) : (
                    <span className='bg-yellow-500/20 text-yellow-400 px-4 py-1.5 text-sm rounded-full font-medium'>
                      Payment Pending
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
