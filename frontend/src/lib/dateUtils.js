// lib/dateUtils.js
export const generateDateRange = (days = 5) => {
  const dateObject = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Format date as YYYY-MM-DD to use as key
    const dateKey = date.toISOString().split('T')[0];
    
    // Popular Indian movie show timings (in 24-hour format)
    const showTimes = [
      { time: `${dateKey}T04:30:00.000Z`, showId: `show_${dateKey}_1` }, // 10:00 AM IST
      { time: `${dateKey}T08:30:00.000Z`, showId: `show_${dateKey}_2` }, // 2:00 PM IST
      { time: `${dateKey}T12:45:00.000Z`, showId: `show_${dateKey}_3` }, // 6:15 PM IST
      { time: `${dateKey}T15:45:00.000Z`, showId: `show_${dateKey}_4` }  // 9:15 PM IST
    ];
    
    dateObject[dateKey] = showTimes;
  }
  
  return dateObject;
};