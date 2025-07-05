import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import useSpaceAvailability from '../../hooks/useSpaceAvailability';

const AvailabilityCalendar = ({ 
  spaceId, 
  selectedDate, 
  onDateSelect, 
  pricingType = 'daily',
  dateRange = null 
}) => {
  const { availability, loading, error, getDisabledDates, getBookingsForDate } = useSpaceAvailability(spaceId, dateRange);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading availability...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 text-sm">Error loading availability: {error}</p>
      </div>
    );
  }

  if (!spaceId) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-600 text-sm">Please select a space first to view availability</p>
      </div>
    );
  }

  const disabledDates = getDisabledDates();
  const today = new Date();

  // Custom day content to show booking indicators
  const renderDayContent = (day) => {
    const bookings = getBookingsForDate(day);
    const hasBookings = bookings.length > 0;
    
    return (
      <div className="relative">
        <span>{day.getDate()}</span>
        {hasBookings && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
        )}
      </div>
    );
  };

  // Custom modifiers for styling
  const modifiers = {
    disabled: disabledDates,
    booked: disabledDates,
    today: today,
  };

  const modifiersStyles = {
    booked: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      fontWeight: 'bold',
    },
    today: {
      backgroundColor: '#3b82f6',
      color: 'white',
      fontWeight: 'bold',
    },
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Space Availability</h4>
          {availability?.summary && (
            <div className="text-sm text-gray-600">
              {availability.summary.availableDays}/{availability.summary.totalDaysChecked} days available
            </div>
          )}
        </div>

        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={[
            { before: today },
            ...disabledDates
          ]}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          formatters={{
            formatDay: renderDayContent,
          }}
          className="mx-auto"
        />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 border border-red-300 rounded mr-2"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
            <span>Available</span>
          </div>
        </div>
      </div>

      {/* Show booking details for selected date */}
      {selectedDate && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">
            {selectedDate.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h5>
          
          {(() => {
            const bookings = getBookingsForDate(selectedDate);
            if (bookings.length === 0) {
              return (
                <p className="text-green-600 text-sm">✅ This date is available for booking</p>
              );
            } else {
              return (
                <div className="space-y-2">
                  <p className="text-red-600 text-sm">❌ This date has existing bookings:</p>
                  {bookings.map((booking, index) => (
                    <div key={index} className="bg-white p-2 rounded border text-sm">
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-gray-600">
                        {new Date(booking.startDate).toLocaleDateString('id-ID')} - {new Date(booking.endDate).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.pricingType} • {booking.status}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
          })()}
        </div>
      )}

      {/* Hourly booking time slots */}
      {pricingType === 'hourly' && selectedDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Available Time Slots</h5>
          <p className="text-blue-700 text-sm">
            For hourly bookings, please select your preferred time in the date/time fields above. 
            The system will validate availability when you submit the form.
          </p>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar; 