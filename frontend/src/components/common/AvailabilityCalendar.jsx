import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import useSpaceAvailability from '../../hooks/useSpaceAvailability';

const AvailabilityCalendar = ({ 
  spaceId, 
  selectedRange,
  onDateRangeSelect, 
  pricingType = 'daily',
  dateRange = null 
}) => {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
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
          mode={pricingType === 'hourly' ? 'single' : 'range'}
          selected={pricingType === 'hourly' ? selectedRange?.from : selectedRange}
          onSelect={(selected) => {
            if (pricingType === 'hourly') {
              // For hourly, we only select one day and use time inputs
              if (selected) {
                const startDateTime = new Date(selected);
                const endDateTime = new Date(selected);
                
                // Set times
                const [startHour, startMin] = startTime.split(':');
                const [endHour, endMin] = endTime.split(':');
                
                startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
                endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
                
                onDateRangeSelect({ from: startDateTime, to: endDateTime });
              } else {
                onDateRangeSelect(null);
              }
            } else {
              // For other pricing types, use date range
              onDateRangeSelect(selected);
            }
          }}
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

        {/* Time picker for hourly bookings */}
        {pricingType === 'hourly' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h5 className="text-sm font-medium text-blue-900 mb-2">Select Time Range</h5>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-blue-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    // Update the selected range with new time
                    if (selectedRange?.from) {
                      const startDateTime = new Date(selectedRange.from);
                      const endDateTime = new Date(selectedRange.from);
                      
                      const [startHour, startMin] = e.target.value.split(':');
                      const [endHour, endMin] = endTime.split(':');
                      
                      startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
                      endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
                      
                      onDateRangeSelect({ from: startDateTime, to: endDateTime });
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-blue-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    // Update the selected range with new time
                    if (selectedRange?.from) {
                      const startDateTime = new Date(selectedRange.from);
                      const endDateTime = new Date(selectedRange.from);
                      
                      const [startHour, startMin] = startTime.split(':');
                      const [endHour, endMin] = e.target.value.split(':');
                      
                      startDateTime.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
                      endDateTime.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
                      
                      onDateRangeSelect({ from: startDateTime, to: endDateTime });
                    }
                  }}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

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

      {/* Show selected date range and booking details */}
      {selectedRange && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">
            Selected {pricingType === 'hourly' ? 'Date & Time' : 'Date Range'}
          </h5>
          
          {pricingType === 'hourly' ? (
            <div className="mb-3">
              <p className="text-sm text-gray-700">
                📅 {selectedRange.from?.toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-sm text-gray-700">
                🕐 {selectedRange.from?.toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })} - {selectedRange.to?.toLocaleTimeString('id-ID', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          ) : (
            <div className="mb-3">
              {selectedRange.from && (
                <p className="text-sm text-gray-700">
                  📅 From: {selectedRange.from.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
              {selectedRange.to && (
                <p className="text-sm text-gray-700">
                  📅 To: {selectedRange.to.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
          )}
          
          {/* Check availability for the selected range */}
          {(() => {
            if (pricingType === 'hourly') {
              // For hourly, check the specific date
              const bookings = getBookingsForDate(selectedRange.from);
              if (bookings.length === 0) {
                return (
                  <p className="text-green-600 text-sm">✅ This date and time appears to be available</p>
                );
              } else {
                return (
                  <div className="space-y-2">
                    <p className="text-yellow-600 text-sm">⚠️ This date has existing bookings (please verify time conflicts):</p>
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
            } else {
              // For other pricing types, check range availability
              if (!selectedRange.from || !selectedRange.to) {
                return (
                  <p className="text-gray-600 text-sm">📅 Please select both start and end dates</p>
                );
              }
              
              // Check each date in the range for conflicts
              const conflictDates = [];
              const currentDate = new Date(selectedRange.from);
              const endDate = new Date(selectedRange.to);
              
              while (currentDate <= endDate) {
                const bookings = getBookingsForDate(currentDate);
                if (bookings.length > 0) {
                  conflictDates.push({
                    date: new Date(currentDate),
                    bookings: bookings
                  });
                }
                currentDate.setDate(currentDate.getDate() + 1);
              }
              
              if (conflictDates.length === 0) {
                return (
                  <p className="text-green-600 text-sm">✅ Selected date range appears to be available</p>
                );
              } else {
                return (
                  <div className="space-y-2">
                    <p className="text-red-600 text-sm">❌ Selected date range has booking conflicts:</p>
                    {conflictDates.map((conflict, index) => (
                      <div key={index} className="bg-white p-2 rounded border text-sm">
                        <div className="font-medium text-red-700">
                          {conflict.date.toLocaleDateString('id-ID', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        {conflict.bookings.map((booking, bookingIndex) => (
                          <div key={bookingIndex} className="text-xs text-gray-600 ml-2">
                            • {booking.customerName} ({booking.pricingType})
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              }
            }
          })()}
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar; 