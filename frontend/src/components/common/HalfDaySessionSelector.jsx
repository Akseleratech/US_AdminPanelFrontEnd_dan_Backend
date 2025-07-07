import React from 'react';
import { Clock, Sun, Sunset } from 'lucide-react';

const HalfDaySessionSelector = ({ 
  selectedDate, 
  selectedSession, 
  onSessionSelect,
  bookedHours = [],
  getBookingsForDate, // Add this prop to get detailed booking info
  spaceData = null // Add space data to check operational hours
}) => {
  if (!selectedDate) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-600 text-sm">Pilih tanggal terlebih dahulu untuk memilih sesi half-day</p>
      </div>
    );
  }

  // Check if the selected date is a closed day
  const isClosedDay = () => {
    if (!spaceData?.operationalHours) return false;
    
    const { operationalHours } = spaceData;
    
    // If always open, never closed
    if (operationalHours.isAlwaysOpen) return false;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[selectedDate.getDay()];
    
    // Check if the day is marked as closed
    return !operationalHours.schedule?.[dayName]?.isOpen;
  };

  // If the day is closed, show closed message
  if (isClosedDay()) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[selectedDate.getDay()];
    const dayLabel = dayName === 'sunday' ? 'Minggu' : dayName === 'monday' ? 'Senin' : dayName === 'tuesday' ? 'Selasa' : dayName === 'wednesday' ? 'Rabu' : dayName === 'thursday' ? 'Kamis' : dayName === 'friday' ? 'Jumat' : 'Sabtu';
    
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center text-red-600">
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-2">
            <path d="M11.354 4.646a.5.5 0 0 0-.708 0L8 7.293 5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0 0-.708z"/>
          </svg>
          <span className="text-sm font-medium">Space tutup pada hari {dayLabel}</span>
        </div>
        <p className="text-red-500 text-xs mt-1">Tidak ada sesi half-day yang tersedia pada hari ini.</p>
      </div>
    );
  }

  // Define available session options (start hour with 6-hour duration)
  const sessionOptions = [
    { 
      id: 'morning', 
      label: 'Pagi', 
      icon: <Sun className="w-4 h-4" />, 
      startHour: 6, 
      endHour: 12,
      timeLabel: '06:00 - 12:00',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
    },
    { 
      id: 'afternoon', 
      label: 'Siang', 
      icon: <Sun className="w-4 h-4" />, 
      startHour: 8, 
      endHour: 14,
      timeLabel: '08:00 - 14:00',
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    { 
      id: 'day', 
      label: 'Siang-Sore', 
      icon: <Sunset className="w-4 h-4" />, 
      startHour: 10, 
      endHour: 16,
      timeLabel: '10:00 - 16:00',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    { 
      id: 'evening', 
      label: 'Sore', 
      icon: <Sunset className="w-4 h-4" />, 
      startHour: 12, 
      endHour: 18,
      timeLabel: '12:00 - 18:00',
      color: 'bg-purple-50 border-purple-200 text-purple-800'
    },
    { 
      id: 'night', 
      label: 'Malam', 
      icon: <Clock className="w-4 h-4" />, 
      startHour: 18, 
      endHour: 24,
      timeLabel: '18:00 - 24:00',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
    }
  ];

  // Check if a session has conflicts with booked hours
  const hasConflict = (session) => {
    if (!bookedHours || bookedHours.length === 0) return false;
    
    const sessionHours = [];
    for (let hour = session.startHour; hour < session.endHour; hour++) {
      sessionHours.push(hour);
    }
    
    return sessionHours.some(hour => bookedHours.includes(hour));
  };

  // Get conflicting bookings for a session
  const getConflictingBookings = (session) => {
    if (!getBookingsForDate) return [];
    
    const bookings = getBookingsForDate(selectedDate);
    const sessionHours = [];
    for (let hour = session.startHour; hour < session.endHour; hour++) {
      sessionHours.push(hour);
    }
    
    return bookings.filter(booking => {
      if (booking.pricingType === 'hourly') {
        const startHour = new Date(booking.startDate).getHours();
        const endHour = new Date(booking.endDate).getHours();
        const bookingHours = [];
        for (let hour = startHour; hour < endHour; hour++) {
          bookingHours.push(hour);
        }
        return bookingHours.some(hour => sessionHours.includes(hour));
      } else if (booking.pricingType === 'halfday') {
        const startHour = new Date(booking.startDate).getHours();
        const endHour = new Date(booking.endDate).getHours();
        const bookingHours = [];
        for (let hour = startHour; hour < endHour; hour++) {
          bookingHours.push(hour);
        }
        return bookingHours.some(hour => sessionHours.includes(hour));
      } else {
        // Daily, monthly bookings conflict with any half-day session
        return true;
      }
    });
  };

  const handleSessionSelect = (session) => {
    if (hasConflict(session)) return; // Don't allow selection if there's conflict
    
    // Create start and end datetime
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(session.startHour, 0, 0, 0);
    
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(session.endHour, 0, 0, 0);
    
    const sessionData = {
      ...session,
      startDateTime,
      endDateTime
    };
    
    onSessionSelect(sessionData);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Pilih Sesi Half-Day</h4>
          <div className="text-xs text-gray-500">
            {selectedDate.toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sessionOptions.map((session) => {
            const isSelected = selectedSession?.id === session.id;
            const isConflicted = hasConflict(session);
            const conflictingBookings = getConflictingBookings(session);
            const isDisabled = isConflicted;
            
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => handleSessionSelect(session)}
                disabled={isDisabled}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all duration-200
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : isDisabled
                      ? 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed opacity-60'
                      : `${session.color} hover:shadow-md border-opacity-60 hover:border-opacity-100`
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {session.icon}
                    <span className="ml-2 font-medium">{session.label}</span>
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                  {isConflicted && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
                <div className="text-sm opacity-75">
                  {session.timeLabel}
                </div>
                <div className="text-xs mt-1 opacity-60">
                  6 jam sesi
                </div>
                {isConflicted && (
                  <div className="text-xs text-red-600 mt-1 space-y-1">
                    <div className="font-medium">Bentrok dengan:</div>
                    {conflictingBookings.slice(0, 2).map((booking, index) => (
                      <div key={index} className="text-xs">
                        • {booking.customerName} ({booking.pricingType})
                      </div>
                    ))}
                    {conflictingBookings.length > 2 && (
                      <div className="text-xs">
                        • +{conflictingBookings.length - 2} booking lainnya
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Show detailed booking information */}
        {(() => {
          const bookings = getBookingsForDate ? getBookingsForDate(selectedDate) : [];
          
          if (bookings.length === 0 && (!bookedHours || bookedHours.length === 0)) {
            return (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-xs font-medium text-green-800">✅ Tanggal ini tersedia untuk semua sesi</p>
              </div>
            );
          }
          
          return (
            <div className="mt-4 space-y-3">
              {/* Show booked hours summary */}
              {bookedHours && bookedHours.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Jam yang sudah dibooking:</p>
                  <p className="text-xs text-yellow-700">
                    {bookedHours.sort((a, b) => a - b).map(hour => `${hour.toString().padStart(2, '0')}:00`).join(', ')}
                  </p>
                </div>
              )}
              
              {/* Show detailed booking information */}
              {bookings.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs font-medium text-blue-800 mb-2">Detail Booking Hari Ini:</p>
                  <div className="space-y-2">
                    {bookings.map((booking, index) => (
                      <div key={index} className="bg-white p-2 rounded border text-xs">
                        <div className="font-medium text-gray-900">{booking.customerName}</div>
                        <div className="text-gray-600 mt-1">
                          {booking.pricingType === 'hourly' ? (
                            <>
                              🕐 {new Date(booking.startDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} - {' '}
                              {new Date(booking.endDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}
                            </>
                          ) : booking.pricingType === 'halfday' ? (
                            <>
                              🕐 {new Date(booking.startDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} - {' '}
                              {new Date(booking.endDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} (Half Day)
                            </>
                          ) : (
                            <>
                              📅 {new Date(booking.startDate).toLocaleDateString('id-ID')} - {new Date(booking.endDate).toLocaleDateString('id-ID')}
                            </>
                          )}
                        </div>
                        <div className="text-gray-500 mt-1 flex items-center gap-2">
                          <span className="capitalize">{booking.pricingType}</span>
                          <span>•</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            booking.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Selected session info */}
      {selectedSession && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="text-sm font-medium text-blue-900 mb-2">Sesi Terpilih</h5>
          <div className="flex items-center text-blue-800">
            {selectedSession.icon}
            <span className="ml-2 font-medium">{selectedSession.label}</span>
            <span className="ml-2 text-sm">({selectedSession.timeLabel})</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Durasi: 6 jam • {selectedSession.startDateTime?.toLocaleDateString('id-ID')}
          </div>
        </div>
      )}
    </div>
  );
};

export default HalfDaySessionSelector; 