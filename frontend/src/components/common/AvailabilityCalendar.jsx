import React, { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import useSpaceAvailability from '../../hooks/useSpaceAvailability';

const AvailabilityCalendar = ({ 
  spaceId, 
  selectedRange,
  onDateRangeSelect, 
  pricingType = 'daily',
  dateRange = null,
  spaceData = null // Add space data to check operational hours
}) => {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const { availability, loading, error, getDisabledDates, getBookingsForDate, getBookedHoursForDate, isDateFullyBooked } = useSpaceAvailability(spaceId, dateRange);

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

  // Function to check if a day is closed based on operational hours
  const isClosedDay = (date) => {
    if (!spaceData?.operationalHours) return false;
    
    const { operationalHours } = spaceData;
    
    // If always open, never closed
    if (operationalHours.isAlwaysOpen) return false;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    
    // Check if the day is marked as closed
    return !operationalHours.schedule?.[dayName]?.isOpen;
  };

  // Function to get all closed days for the current month view
  const getClosedDaysInMonth = (date) => {
    const closedDays = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const current = new Date(firstDay);
    while (current <= lastDay) {
      if (isClosedDay(current)) {
        closedDays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    return closedDays;
  };

  // Custom day content to show booking indicators
  const renderDayContent = (day) => {
    const bookings = getBookingsForDate(day);
    const hasBookings = bookings.length > 0;
    const bookedHours = getBookedHoursForDate(day);
    const isFullyBooked = isDateFullyBooked(day);
    const isClosed = isClosedDay(day);
    
    // Calculate percentage of hours booked (for progress bar)
    const bookedPercentage = bookedHours.length / 24; // 24 hours in a day
    
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${
        isClosed && pricingType !== 'monthly' ? 'text-gray-400' : ''
      }`}>
        <span>{day.getDate()}</span>
        
        {/* Closed indicator - different display for monthly vs other pricing types */}
        {isClosed && (
          <div className="absolute inset-0 flex items-center justify-center">
            {pricingType === 'monthly' ? (
              // For monthly: Show small dot indicator instead of X
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" title="Tutup (dapat dipilih untuk booking bulanan)"></div>
            ) : (
              // For other pricing types: Show X mark
              <div className="w-4 h-4 text-gray-400">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
                  <path d="M11.354 4.646a.5.5 0 0 0-.708 0L8 7.293 5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0 0-.708z"/>
                </svg>
              </div>
            )}
          </div>
        )}
        
        {/* Dot indicator for any bookings - only show if not closed */}
        {!isClosed && hasBookings && (
          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
            isFullyBooked ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
        )}
        
        {/* Progress bar for hourly bookings - only show if not closed */}
        {!isClosed && bookedHours.length > 0 && (
          <div
            className={`absolute bottom-0 left-0 h-0.5 ${
              isFullyBooked ? 'bg-red-500' : 'bg-yellow-500/70'
            }`}
            style={{ width: `${bookedPercentage * 100}%` }}
          />
        )}
      </div>
    );
  };

  // Get closed days for current month to add to modifiers
  const closedDays = spaceData ? getClosedDaysInMonth(today) : [];

  // Custom modifiers for styling
  // For monthly pricing, don't disable closed days to allow flexibility
  const shouldDisableClosedDays = pricingType !== 'monthly';
  const modifiers = {
    disabled: shouldDisableClosedDays ? [...disabledDates, ...closedDays] : disabledDates, // Don't disable closed days for monthly
    fullyBooked: disabledDates,
    closed: closedDays,
    today: today,
  };

  const modifiersStyles = {
    fullyBooked: {
      backgroundColor: '#fee2e2',
      color: '#dc2626',
      fontWeight: 'bold',
    },
    closed: {
      backgroundColor: '#f3f4f6',
      color: '#9ca3af',
      fontWeight: 'normal',
      textDecoration: 'line-through',
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
          mode={pricingType === 'hourly' || pricingType === 'single' ? 'single' : 'range'}
          selected={pricingType === 'hourly' || pricingType === 'single' ? selectedRange?.from : selectedRange}
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
            } else if (pricingType === 'single') {
              // For single date selection (halfday)
              if (selected) {
                onDateRangeSelect({ from: selected, to: selected });
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
          
          {/* Closed day indicator - different for monthly vs other pricing */}
          {pricingType === 'monthly' ? (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2 relative">
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full"></div>
              </div>
              <span>Closed (selectable for monthly)</span>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2 relative text-gray-400 flex items-center justify-center">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-2 h-2">
                  <path d="M11.354 4.646a.5.5 0 0 0-.708 0L8 7.293 5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0 0-.708z"/>
                </svg>
              </div>
              <span>Closed</span>
            </div>
          )}
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 border border-red-300 rounded mr-2 relative">
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <span>Fully Booked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2 relative">
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-2 h-0.5 bg-yellow-500"></div>
            </div>
            <span>Partially Booked</span>
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
              const bookedHours = getBookedHoursForDate(selectedRange.from);
              const isClosed = isClosedDay(selectedRange.from);
              
              if (isClosed) {
                return (
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <p className="text-red-600 text-sm flex items-center">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1">
                        <path d="M11.354 4.646a.5.5 0 0 0-.708 0L8 7.293 5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0 0-.708z"/>
                      </svg>
                      ❌ Space tutup pada hari ini
                    </p>
                  </div>
                );
              }
              
              if (bookings.length === 0) {
                return (
                  <p className="text-green-600 text-sm">✅ This date and time appears to be available</p>
                );
              } else {
                return (
                  <div className="space-y-2">
                    <p className="text-yellow-600 text-sm">⚠️ This date has existing bookings:</p>
                    
                    {/* Show booked hours */}
                    {bookedHours.length > 0 && (
                      <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                        <p className="text-xs font-medium text-yellow-800">Jam Terbooking:</p>
                        <p className="text-xs text-yellow-700">
                          {bookedHours.sort((a, b) => a - b).map(hour => `${hour.toString().padStart(2, '0')}:00`).join(', ')}
                        </p>
                      </div>
                    )}
                    
                    {/* Show booking details */}
                    {bookings.map((booking, index) => (
                      <div key={index} className="bg-white p-2 rounded border text-sm">
                        <div className="font-medium">{booking.customerName}</div>
                        <div className="text-gray-600">
                          {booking.pricingType === 'hourly' ? (
                            <>
                              {new Date(booking.startDate).toLocaleDateString('id-ID')} • {' '}
                              {new Date(booking.startDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} - {' '}
                              {new Date(booking.endDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                            </>
                          ) : (
                            <>
                              {new Date(booking.startDate).toLocaleDateString('id-ID')} - {new Date(booking.endDate).toLocaleDateString('id-ID')}
                            </>
                          )}
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
              
              // Check for closed days in the range
              const closedDatesInRange = [];
              const rangeCurrent = new Date(selectedRange.from);
              const rangeEnd = new Date(selectedRange.to);
              
              while (rangeCurrent <= rangeEnd) {
                if (isClosedDay(rangeCurrent)) {
                  closedDatesInRange.push(new Date(rangeCurrent));
                }
                rangeCurrent.setDate(rangeCurrent.getDate() + 1);
              }

              if (conflictDates.length === 0 && (closedDatesInRange.length === 0 || pricingType === 'monthly')) {
                return (
                  <div className="space-y-1">
                    <p className="text-green-600 text-sm">✅ Selected date range appears to be available</p>
                    {pricingType === 'monthly' && closedDatesInRange.length > 0 && (
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <p className="text-blue-700 text-xs">
                          ℹ️ <strong>Monthly Booking:</strong> Space akan tutup pada {closedDatesInRange.length} hari dalam periode ini, 
                          namun Anda tetap dapat menggunakan space pada hari operasional lainnya.
                        </p>
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div className="space-y-2">
                    {closedDatesInRange.length > 0 && pricingType !== 'monthly' && (
                      <>
                        <p className="text-red-600 text-sm">❌ Selected date range includes closed days:</p>
                        {closedDatesInRange.map((closedDate, index) => (
                          <div key={index} className="bg-red-50 p-2 rounded border border-red-200 text-sm">
                            <div className="font-medium text-red-700 flex items-center">
                              <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1">
                                <path d="M11.354 4.646a.5.5 0 0 0-.708 0L8 7.293 5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0 0-.708z"/>
                              </svg>
                              {closedDate.toLocaleDateString('id-ID', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric' 
                              })} - Space Tutup
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {closedDatesInRange.length > 0 && pricingType === 'monthly' && (
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <p className="text-blue-700 text-sm flex items-center">
                          ℹ️ <strong>Monthly Booking:</strong> Space akan tutup pada {closedDatesInRange.length} hari dalam periode ini, 
                          namun Anda tetap dapat menggunakan space pada hari operasional lainnya.
                        </p>
                      </div>
                    )}
                    
                    {conflictDates.length > 0 && (
                      <>
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
                      </>
                    )}
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