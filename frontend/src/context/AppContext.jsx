import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext()

export const AppProvider = ({children}) => {

    const [isAdmin, setIsAdmin] = useState(false)
    const [shows, setShows] = useState([])
    const [favouriteMovies, setFavouriteMovies] = useState([])
    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const {user} = useUser();
    const {getToken} = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const fetchIsAdmin = async () => {
        try{
            const token = await getToken();
            if (!token) {
                console.warn("No token available for admin check");
                setIsAdmin(false);
                return;
            }

            const {data} = await axios.get('/api/admin/is-admin', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setIsAdmin(data.isAdmin || false);
            
            if(!data.isAdmin && location.pathname.startsWith('/admin')){
                navigate('/')
                toast.error('You are not authorized to access admin panel');
            }

        }catch(err){
            console.error("Error fetching admin status:", err.response?.data || err.message);
            setIsAdmin(false);
            
            // Don't show toast for 404 errors (endpoint not found)
            if (err.response?.status !== 404) {
                toast.error('Error fetching admin status');
            }
        }
    }

    //function to fetch shows
    const fetchShows = async () => {
        try{
            const {data} = await axios.get('/api/show/all');
            if(data.success){
                setShows(data.shows);
            }else{
                toast.error('Error fetching shows', data.message);
            }
        }catch(err){
            console.error("Error fetching shows", err);
            toast.error('Error fetching shows');
        }
    }
    
    const fetchFavouriteMovies = async () => {
        try{
            const token = await getToken();
            if (!token || !user) {
                console.warn("No token or user available");
                setFavouriteMovies([]);
                return;
            }

            const {data} = await axios.get('/api/user/favourites', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if(data.success){
                setFavouriteMovies(data.movies || []);
            } else {
                console.error("Failed to fetch favourites:", data.message);
                setFavouriteMovies([]);
            }
        }catch(err){
            console.error("Error fetching favourite movies", err);
            // Don't show error toast for unauthorized users
            if (err.response?.status !== 401) {
                toast.error('Error fetching favourite movies');
            }
            setFavouriteMovies([]);
        }
    }

    const toggleFavourite = async (movieId) => {
        if (!user) {
            toast.error('Please login to add favourites');
            return false;
        }

        try {
            const token = await getToken();
            const {data} = await axios.post('/api/user/update-favourite', 
                { movieId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                toast.success(data.message);
                await fetchFavouriteMovies(); // Refresh favourites
                return true;
            } else {
                toast.error(data.message || 'Failed to update favourites');
                return false;
            }
        } catch (err) {
            console.error("Error toggling favourite:", err);
            toast.error('Failed to update favourites');
            return false;
        }
    }

    const isFavourite = (movieId) => {
        return favouriteMovies.some(movie => movie._id === movieId);
    }

    useEffect(() => {
        fetchShows();
    }, [])

    useEffect(() => {
        if(user){
            fetchIsAdmin();
            fetchFavouriteMovies(); 
        } else {
            // Reset states when user logs out
            setIsAdmin(false);
            setFavouriteMovies([]);
        }
    }, [user])

    const value = {
        axios,
        fetchIsAdmin,
        user,
        getToken,
        navigate,
        isAdmin,
        shows,
        favouriteMovies,
        fetchFavouriteMovies,
        toggleFavourite,
        isFavourite,
        image_base_url
    }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)