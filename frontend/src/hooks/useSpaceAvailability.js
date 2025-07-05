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

  // Helper function to check if a date is available
  const isDateAvailable = (date) => {
    if (!availability?.availableDates) return true;
    
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    const dayInfo = availability.availableDates.find(d => d.date === dateStr);
    
    return dayInfo ? dayInfo.available : true;
  };

  // Helper function to get bookings for a specific date
  const getBookingsForDate = (date) => {
    if (!availability?.availableDates) return [];
    
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    const dayInfo = availability.availableDates.find(d => d.date === dateStr);
    
    return dayInfo ? dayInfo.bookings : [];
  };

  // Helper function to get disabled dates for calendar
  const getDisabledDates = () => {
    if (!availability?.availableDates) return [];
    
    return availability.availableDates
      .filter(d => !d.available)
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
    isTimeSlotAvailable
  };
};

export default useSpaceAvailability; 