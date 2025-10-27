// lib/dateUtils.js
export const generateDateRange = (days = 4, showTimesData) => {
  const dateObject = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Format date as YYYY-MM-DD to use as key
    const dateKey = date.toISOString().split('T')[0];
    
    // Get existing show times from dummy data or create default ones
    const existingShowTimes = showTimesData ? Object.values(showTimesData)[i] : null;
    
    const showTimes = existingShowTimes || [
      { time: `${dateKey}T01:00:00.000Z`, showId: `show_${dateKey}_1` },
      { time: `${dateKey}T03:00:00.000Z`, showId: `show_${dateKey}_2` },
      { time: `${dateKey}T05:00:00.000Z`, showId: `show_${dateKey}_3` }
    ];
    
    // Add to the object with date as key (YYYY-MM-DD format)
    dateObject[dateKey] = showTimes;
  }
  
  return dateObject;
};