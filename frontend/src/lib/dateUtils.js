// lib/dateUtils.js

// Your existing function
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

/**
 * Parse dateTimeKey (supports ISO format and custom format)
 * Returns object with formatted date and time
 */
export const parseDateTimeKey = (dateTimeKey) => {
  try {
    if (!dateTimeKey) {
      return { 
        date: 'Date not available', 
        time: 'Time not available',
        dateObj: null,
        timeObj: null
      };
    }

    // Check if it's an ISO format (contains 'T')
    if (dateTimeKey.includes('T')) {
      const dateObj = new Date(dateTimeKey);
      
      if (isNaN(dateObj.getTime())) {
        return { 
          date: 'Invalid date', 
          time: 'Invalid time',
          dateObj: null,
          timeObj: null
        };
      }
      
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const formattedTime = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return { 
        date: formattedDate, 
        time: formattedTime,
        dateObj,
        timeObj: dateObj
      };
    }

    // Otherwise parse as "YYYY-MM-DD_HH:mm" format
    const [datePart, timePart] = dateTimeKey.split('_');
    
    if (!datePart) {
      return { 
        date: 'Invalid date', 
        time: 'Invalid time',
        dateObj: null,
        timeObj: null
      };
    }
    
    // Parse date
    const [year, month, day] = datePart.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    
    // Parse time if available
    let formattedTime = 'Time not specified';
    let timeObj = null;
    
    if (timePart) {
      const [hours, minutes] = timePart.split(':');
      timeObj = new Date();
      timeObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      formattedTime = timeObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    return { 
      date: formattedDate, 
      time: formattedTime,
      dateObj,
      timeObj
    };
  } catch (error) {
    console.error('Error parsing dateTimeKey:', error);
    return { 
      date: 'Invalid date', 
      time: 'Invalid time',
      dateObj: null,
      timeObj: null
    };
  }
};

/**
 * Format ISO date string to readable format
 */
export const formatISODate = (isoString) => {
  try {
    if (!isoString) return 'Date not available';
    
    const date = new Date(isoString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting ISO date:', error);
    return 'Invalid date';
  }
};

/**
 * Format date string (YYYY-MM-DD) to readable format
 */
export const formatDateString = (dateString) => {
  try {
    if (!dateString) return 'Date not available';
    
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date string:', error);
    return 'Invalid date';
  }
};