import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Loading from '../../components/Loading';
import Title from "../../components/admin/Title";
import { ChartLineIcon, CircleDollarSignIcon, PlayCircleIcon, UsersIcon, StarIcon } from 'lucide-react';  
import BlurCircle from '../../components/BlurCircle';  
import { dateFormat } from '../../lib/dateFormat';     
import { useAppContext } from '../../context/AppContext';

const Dashboard = () => {

  const {axios, getToken, user, image_base_url} = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY || "₹";
  const hasFetched = useRef(false);

  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeShows: [],
    totalUser: 0
  });

  const [loading, setLoading] = useState(true);

  const dashboardCards = [
    { title: "Total Bookings", value: dashboardData.totalBookings || "0", icon: ChartLineIcon },
    { title: "Total Revenue", value: currency + (dashboardData.totalRevenue || "0"), icon: CircleDollarSignIcon },
    { title: "Active Shows", value: dashboardData.activeShows?.length || "0", icon: PlayCircleIcon },
    { title: "Total Users", value: dashboardData.totalUser || "0", icon: UsersIcon }
  ];

  const fetchDashboardData = async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    try {
      const {data} = await axios.get("/api/admin/dashboard", {
        headers: {Authorization: `Bearer ${await getToken()}`}
      });
      
      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      console.error("Error fetching Dashboard Data:", error);
      toast.error(error.response?.data?.message || "Error fetching dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="Admin" text2="Dashboard" />

      {/* Cards Section */}
      <div className="relative flex flex-wrap gap-4 mt-6">
        <div className="flex flex-wrap gap-4 w-full">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/20 rounded-md max-w-50 w-full"
            >
              <div>
                <h1 className="text-sm">{card.title}</h1>
                <p className="text-xl font-medium mt-1">{card.value}</p>
              </div>
              <card.icon className="w-6 h-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Active Shows Section */}
      <p className="mt-10 text-lg font-medium">Active Shows</p>
      <div className="relative flex flex-wrap gap-6 mt-4 max-w-5xl">
        <BlurCircle top="100px" left="-10%" />
        {Array.isArray(dashboardData.activeShows) && dashboardData.activeShows.length > 0 ? (
          dashboardData.activeShows.map((item) => {
            if (!item || !item.movie) return null;
            
            return (
              <div
                key={item._id}
                className="w-55 rounded-lg overflow-hidden h-full pb-3 bg-primary/10 border border-primary/20 hover:-translate-y-1 transition duration-300"
              >
                <img
                  src={image_base_url ? image_base_url + item.movie.poster_path : item.movie.poster_path}
                  alt={item.movie.title || "Movie poster"}
                  className="h-60 w-full object-cover"
                />
                <p className="font-medium p-2 truncate">{item.movie.title}</p>
                <div className="flex items-center justify-between px-2">
                  <p className="text-lg font-medium">
                    {currency} {item.showPrice}
                  </p>
                  <p className="flex items-center gap-1 text-sm text-gray-400 mt-1 pr-1">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {item.movie.vote_average?.toFixed(1) || "N/A"}
                  </p>
                </div>
                <div className="px-2 pt-2 text-sm text-gray-500">
                  <p>{dateFormat(item.startDate)} - {dateFormat(item.endDate)}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.showtimes?.slice(0, 3).map((time, idx) => (
                      <span key={idx} className="text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                        {time}
                      </span>
                    ))}
                    {item.showtimes?.length > 3 && (
                      <span className="text-xs text-gray-400">+{item.showtimes.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-sm">No active shows available</p>
        )}
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default Dashboard;