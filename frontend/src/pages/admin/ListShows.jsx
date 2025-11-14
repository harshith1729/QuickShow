import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import Title from '../../components/admin/title';   
import { dateFormat } from '../../lib/dateFormat';  
import { useAppContext } from '../../context/AppContext';

const ListShows = () => {

  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const {axios, getToken, user} = useAppContext();

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllShows = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-shows", {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      setShows(data.shows)
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // Calculate total bookings and earnings for a show
  const calculateStats = (show) => {
    let totalBookings = 0;
    let totalEarnings = 0;
    
    // Loop through all date-time slots in occupiedSeats Map
    if (show.occupiedSeats) {
      for (const [dateTimeKey, seats] of Object.entries(show.occupiedSeats)) {
        const seatsCount = Object.keys(seats).length;
        totalBookings += seatsCount;
        totalEarnings += seatsCount * show.showPrice;
      }
    }
    
    return { totalBookings, totalEarnings };
  };

  useEffect(() => {
    if(user){
      getAllShows();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />
      <div className="max-w-5xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Movie Name</th>
              <th className="p-2 font-medium">Show Period</th>
              <th className="p-2 font-medium">Daily Showtimes</th>
              <th className="p-2 font-medium">Total Bookings</th>
              <th className="p-2 font-medium">Earnings</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {shows.map((show, index) => {
              const { totalBookings, totalEarnings } = calculateStats(show);
              return (
                <tr
                  key={index}
                  className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
                >
                  <td className="p-2 min-w-45 pl-5">{show.movie.title}</td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span>{dateFormat(show.startDate)}</span>
                      <span className="text-xs text-gray-400">to</span>
                      <span>{dateFormat(show.endDate)}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1 max-w-48">
                      {show.showtimes.map((time, idx) => (
                        <span key={idx} className="text-xs bg-primary/20 px-2 py-0.5 rounded">
                          {time}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">{totalBookings}</td>
                  <td className="p-2">
                    {currency} {totalEarnings}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default ListShows;