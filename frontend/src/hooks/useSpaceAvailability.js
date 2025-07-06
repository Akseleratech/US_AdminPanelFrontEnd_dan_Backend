import { useState, useEffect } from 'react';
import { spacesAPI } from '../services/api';

const useSpaceAvailability = (spaceId, dateRange = null) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAvailability = async (id = spaceId, range = dateRange) => {
    if (!id) {
      setAvailability(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = {};
      if (range?.from) params.from = range.from;
      if (range?.to) params.to = range.to;

      const response = await spacesAPI.getAvailability(id, params);

      // tangani error dari backend
      if (response?.success === false) {
        throw new Error(response.error?.message || 'Failed to fetch availability');
      }

      // simpan hanya bagian data-nya
      setAvailability(response.data);
    } catch (err) {
      setError(err.message);
      setAvailability(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [spaceId, dateRange?.from, dateRange?.to]);

  // Helper function to format date to avoid timezone issues
  const formatDateLocal = (date) => {
    if (!(date instanceof Date)) return date;
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format without timezone conversion
  };

  // Helper function to check if a date is available
  const isDateAvailable = (date) => {
    if (!availability?.availableDates) return true;
    
    const dateStr = formatDateLocal(date);
    const dayInfo = availability.availableDates.find(d => d.date === dateStr);
    
    return dayInfo ? dayInfo.available : true;
  };

  // Helper function to get bookings for a specific date
  const getBookingsForDate = (date) => {
    if (!availability?.availableDates) return [];
    
    const dateStr = formatDateLocal(date);
    const dayInfo = availability.availableDates.find(d => d.date === dateStr);
    
    return dayInfo ? dayInfo.bookings : [];
  };

  // Helper function to get booked hours for a specific date
  const getBookedHoursForDate = (date) => {
    if (!availability?.bookedSlots) return [];
    
    const dateStr = formatDateLocal(date); // YYYY-MM-DD
    return availability.bookedSlots
      .filter(slot => {
        // slot is an object with datetime property
        if (typeof slot === 'string') {
          return slot.startsWith(dateStr);
        } else if (slot && slot.datetime) {
          return slot.datetime.startsWith(dateStr);
        }
        return false;
      })
      .map(slot => {
        // Extract hour from datetime
        const datetime = typeof slot === 'string' ? slot : slot.datetime;
        return new Date(datetime).getHours();
      })
      .filter((hour, index, arr) => arr.indexOf(hour) === index); // Remove duplicates
  };

  // Helper function to check if a date is fully booked (all day occupied)
  const isDateFullyBooked = (date) => {
    if (!availability?.availableDates) return false;
    
    const dateStr = formatDateLocal(date);
    const dayInfo = availability.availableDates.find(d => d.date === dateStr);
    
    if (!dayInfo) return false;
    
    // Check if there are any full-day bookings (daily, monthly) - halfday allows multiple bookings
    const hasFullDayBookings = dayInfo.bookings.some(booking => 
      ['daily', 'monthly'].includes(booking.pricingType)
    );
    
    if (hasFullDayBookings) return true;
    
    // For hourly bookings, check if most hours are booked (>= 18 hours = 75%)
    const bookedHours = getBookedHoursForDate(date);
    return bookedHours.length >= 18;
  };

  // Helper function to get disabled dates for calendar (only fully booked dates)
  const getDisabledDates = () => {
    if (!availability?.availableDates) return [];
    
    return availability.availableDates
      .filter(d => isDateFullyBooked(new Date(d.date)))
      .map(d => new Date(d.date));
  };

  // Helper function to check if a time slot is available (for hourly bookings)
  const isTimeSlotAvailable = (datetime) => {
    if (!availability?.bookedSlots) return true;
    
    const datetimeStr = datetime instanceof Date ? datetime.toISOString() : datetime;
    return !availability.bookedSlots.some(slot => 
      slot.datetime === datetimeStr
    );
  };

  return {
    availability,
    loading,
    error,
    refreshAvailability: fetchAvailability,
    isDateAvailable,
    getBookingsForDate,
    getDisabledDates,
    isTimeSlotAvailable,
    getBookedHoursForDate,
    isDateFullyBooked
  };
};

export default useSpaceAvailability; 