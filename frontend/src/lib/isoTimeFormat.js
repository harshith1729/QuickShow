// lib/isoTimeFormat.js

/**
 * Converts ISO time string to readable 12-hour format
 * Works with: "2024-11-15T04:30:00.000Z" format
 */
const isoTimeFormat = (isoString) => {
  try {
    if (!isoString) {
      return 'Time not available';
    }

    // Create date object from ISO string
    const date = new Date(isoString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }

    // Format to 12-hour time with AM/PM
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata' // IST timezone
    });

    return formattedTime;
  } catch (error) {
    console.error('Error formatting ISO time:', error);
    return 'Invalid time';
  }
};

export default isoTimeFormat;