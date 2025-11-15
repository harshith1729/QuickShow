// lib/dateUtils.js

// Generate next N days starting from TODAY
export const generateDateRange = (days = 30) => {
  const dateObject = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const dateKey = date.toISOString().split('T')[0];

    const showTimes = [
      { time: `${dateKey}T04:30:00.000Z`, showId: `show_${dateKey}_1` },
      { time: `${dateKey}T08:30:00.000Z`, showId: `show_${dateKey}_2` },
      { time: `${dateKey}T12:45:00.000Z`, showId: `show_${dateKey}_3` },
      { time: `${dateKey}T15:45:00.000Z`, showId: `show_${dateKey}_4` }
    ];

    dateObject[dateKey] = showTimes;
  }

  return dateObject;
};

// ------------------------------
// OTHER UTILITIES (UNCHANGED)
// ------------------------------

export const parseDateTimeKey = (dateTimeKey) => {
  try {
    if (!dateTimeKey) {
      return { date: 'Date not available', time: 'Time not available', dateObj: null, timeObj: null };
    }

    if (dateTimeKey.includes('T')) {
      const dateObj = new Date(dateTimeKey);

      if (isNaN(dateObj.getTime())) {
        return { date: 'Invalid date', time: 'Invalid time', dateObj: null, timeObj: null };
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

      return { date: formattedDate, time: formattedTime, dateObj, timeObj: dateObj };
    }

    const [datePart, timePart] = dateTimeKey.split('_');

    if (!datePart) {
      return { date: 'Invalid date', time: 'Invalid time', dateObj: null, timeObj: null };
    }

    const [year, month, day] = datePart.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

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

    return { date: formattedDate, time: formattedTime, dateObj, timeObj };

  } catch (error) {
    console.error('Error parsing dateTimeKey:', error);
    return { date: 'Invalid date', time: 'Invalid time', dateObj: null, timeObj: null };
  }
};

export const formatISODate = (isoString) => {
  try {
    if (!isoString) return 'Date not available';
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Invalid date';

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

export const formatDateString = (dateString) => {
  try {
    if (!dateString) return 'Date not available';
    
    const [year, month, day] = dateString.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    if (isNaN(dateObj.getTime())) return 'Invalid date';

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
