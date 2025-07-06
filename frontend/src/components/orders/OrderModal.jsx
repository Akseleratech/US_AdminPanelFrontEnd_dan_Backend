import React, { useState, useEffect } from 'react';
import { X, Calendar, User, MapPin } from 'lucide-react';
import useCustomers from '../../hooks/useCustomers';
import useSpaces from '../../hooks/useSpaces';
import AvailabilityCalendar from '../common/AvailabilityCalendar';
import HalfDaySessionSelector from '../common/HalfDaySessionSelector';
import useSpaceAvailability from '../../hooks/useSpaceAvailability';
import { formatDateLocal, formatDateTimeLocal } from '../../utils/helpers';

const OrderModal = ({ isOpen, onClose, onSave, editingOrder = null }) => {
  const { customers, loading: customersLoading } = useCustomers();
  const { spaces, loading: spacesLoading } = useSpaces();

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    spaceId: '',
    spaceName: '',
    amount: 0,
    pricingType: 'daily', // hourly, halfday, daily, monthly
    startDate: '',
    endDate: '',
    status: 'pending',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedHalfDaySession, setSelectedHalfDaySession] = useState(null);

  // Get availability data for the selected space
  const { isDateAvailable, getBookingsForDate, getBookedHoursForDate, isDateFullyBooked } = useSpaceAvailability(formData.spaceId);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingOrder) {
        // Helper function to safely format date
        const formatDateForInput = (dateValue, pricingType = 'daily') => {
          if (!dateValue) return '';
          try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '';
            
            if (pricingType === 'hourly' || pricingType === 'halfday') {
              // For datetime-local input format: YYYY-MM-DDTHH:MM - use local time
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day}T${hours}:${minutes}`;
            } else {
              // For date input format: YYYY-MM-DD - use formatDateLocal to avoid timezone issues
              return formatDateLocal(date);
            }
          } catch (error) {
            console.warn('Invalid date value:', dateValue);
            return '';
          }
        };

        const pricingType = editingOrder.pricingType || 'daily';
        setFormData({
          customerId: editingOrder.customerId || '',
          customerName: editingOrder.customerName || editingOrder.customer || '',
          customerEmail: editingOrder.customerEmail || '',
          spaceId: editingOrder.spaceId || '',
          spaceName: editingOrder.spaceName || '',
          amount: editingOrder.amount || 0,
          pricingType: pricingType,
          startDate: formatDateForInput(editingOrder.startDate, pricingType),
          endDate: formatDateForInput(editingOrder.endDate, pricingType),
          status: editingOrder.status || 'pending',
          notes: editingOrder.notes || ''
        });

        // Initialize calendar and session states for editing
        if (editingOrder.startDate && editingOrder.endDate) {
          const startDate = new Date(editingOrder.startDate);
          const endDate = new Date(editingOrder.endDate);
          
          // Set calendar selection
          setSelectedDateRange({ from: startDate, to: endDate });
          
          // For half-day orders, also set the session selection
          if (pricingType === 'halfday') {
            const startHour = startDate.getHours();
            const endHour = endDate.getHours();
            
            // Find matching session based on start and end hours
            const sessionOptions = [
              { id: 'morning', startHour: 6, endHour: 12, label: 'Pagi', timeLabel: '06:00 - 12:00' },
              { id: 'afternoon', startHour: 8, endHour: 14, label: 'Siang', timeLabel: '08:00 - 14:00' },
              { id: 'day', startHour: 10, endHour: 16, label: 'Siang-Sore', timeLabel: '10:00 - 16:00' },
              { id: 'evening', startHour: 12, endHour: 18, label: 'Sore', timeLabel: '12:00 - 18:00' },
              { id: 'night', startHour: 18, endHour: 24, label: 'Malam', timeLabel: '18:00 - 24:00' }
            ];
            
            const matchingSession = sessionOptions.find(session => 
              session.startHour === startHour && session.endHour === endHour
            );
            
            if (matchingSession) {
              setSelectedHalfDaySession({
                ...matchingSession,
                startDateTime: startDate,
                endDateTime: endDate
              });
            }
          }
        }
        
        // Show calendar if space is selected
        setShowCalendar(!!editingOrder.spaceId);
      } else {
        setFormData({
          customerId: '',
          customerName: '',
          customerEmail: '',
          spaceId: '',
          spaceName: '',
          amount: 0,
          pricingType: 'daily',
          startDate: '',
          endDate: '',
          status: 'pending',
          notes: ''
        });
        
        // Reset calendar and session states for new orders
        setSelectedDateRange(null);
        setSelectedHalfDaySession(null);
        setShowCalendar(false);
      }
      setErrors({});
    }
  }, [isOpen, editingOrder]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for pricing type changes
    if (name === 'pricingType') {
      const currentPricingType = formData.pricingType;
      const newPricingType = value;
      
      // Reset dates when switching between hourly and non-hourly to avoid format issues
      if ((currentPricingType === 'hourly' && newPricingType !== 'hourly') ||
          (currentPricingType !== 'hourly' && newPricingType === 'hourly')) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          startDate: '',
          endDate: '',
          amount: 0
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const selectedCustomer = customers.find(c => c.id === customerId);
    
    setFormData(prev => ({
      ...prev,
      customerId,
      customerName: selectedCustomer ? selectedCustomer.name : '',
      customerEmail: selectedCustomer ? selectedCustomer.email : ''
    }));
  };

  const handleSpaceChange = (e) => {
    const spaceId = e.target.value;
    const selectedSpace = spaces.find((s) => s.id === spaceId);

    setFormData((prev) => ({
      ...prev,
      spaceId,
      spaceName: selectedSpace ? selectedSpace.name : '',
      // Reset dates when changing space to avoid confusion
      startDate: '',
      endDate: '',
      amount: 0
    }));

    // Reset calendar state when space changes
    setSelectedDateRange(null);
    setShowCalendar(!!spaceId); // Show calendar when space is selected
  };

  const handleDateRangeSelect = (range) => {
    setSelectedDateRange(range);
    if (range) {
      if (formData.pricingType === 'hourly') {
        // For hourly pricing, use local datetime format for datetime-local input
        const formatForInput = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };
        
        setFormData(prev => ({
          ...prev,
          startDate: range.from ? formatForInput(range.from) : '',
          endDate: range.to ? formatForInput(range.to) : ''
        }));
      } else if (formData.pricingType === 'halfday') {
        // For halfday, only set date, time will be handled by session selector
        setFormData(prev => ({
          ...prev,
          startDate: range.from ? formatDateLocal(range.from) : '',
          endDate: range.from ? formatDateLocal(range.from) : '' // Same day for halfday
        }));
        // Reset session when date changes
        setSelectedHalfDaySession(null);
      } else {
        // For other pricing types, use formatDateLocal to avoid timezone issues
        setFormData(prev => ({
          ...prev,
          startDate: range.from ? formatDateLocal(range.from) : '',
          endDate: range.to ? formatDateLocal(range.to) : ''
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        startDate: '',
        endDate: ''
      }));
      setSelectedHalfDaySession(null);
    }
  };

  const handleHalfDaySessionSelect = (sessionData) => {
    setSelectedHalfDaySession(sessionData);
    
    // Update form data with session times - use local time format for datetime-local input
    const formatForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setFormData(prev => ({
      ...prev,
      startDate: formatForInput(sessionData.startDateTime),
      endDate: formatForInput(sessionData.endDateTime)
    }));
  };

  // Helper to calculate total amount based on pricing type & date range
  const calculateTotalAmount = (spaceId, startDate, endDate, pricingType) => {
    if (!spaceId) return 0;
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) return 0;

    const rate = space.pricing?.[pricingType] ?? 0;
    if (!rate) return 0;

    // For hourly pricing, we need both start and end date/time
    if (pricingType === 'hourly') {
      if (!startDate || !endDate) return rate;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return rate;
      
      const diffHours = Math.ceil((end - start) / (1000 * 60 * 60)); // hours
      return diffHours * rate;
    }
    
    // For halfday pricing, calculate based on half-day periods
    if (pricingType === 'halfday') {
      if (!startDate || !endDate) return rate;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return rate;
      
      // For half-day sessions, if start and end are the same day, it's just 1 session
      if (start.toDateString() === end.toDateString()) {
        return rate; // Single half-day session
      }
      
      // For multi-day half-day bookings, calculate based on days
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      const diffDays = Math.floor((end - start) / MS_PER_DAY) + 1;
      const halfDayPeriods = diffDays * 2; // 2 half-days per day
      return halfDayPeriods * rate;
    }
    
    // For daily pricing
    if (pricingType === 'daily') {
      if (!startDate || !endDate) return rate;

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return rate;

      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      const diffDays = Math.floor((end - start) / MS_PER_DAY) + 1; // inclusive count
      return diffDays * rate;
    }
    
    // For monthly pricing
    if (pricingType === 'monthly') {
      if (!startDate || !endDate) return rate;
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return rate;
      
      const diffMonths = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)); // approximate months
      return diffMonths * rate;
    }
    
    return rate;
  };

  // Recalculate amount whenever space or dates change
  useEffect(() => {
    const newAmount = calculateTotalAmount(formData.spaceId, formData.startDate, formData.endDate, formData.pricingType);
    setFormData((prev) => {
      if (prev.amount === newAmount) return prev;
      return { ...prev, amount: newAmount };
    });
  }, [formData.spaceId, formData.startDate, formData.endDate, formData.pricingType, spaces]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) newErrors.customerId = 'Customer is required';
    if (!formData.spaceId) newErrors.spaceId = 'Space is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate >= endDate) {
        newErrors.endDate = formData.pricingType === 'hourly' 
          ? 'End time must be after start time' 
          : 'End date must be after start date';
      }
      
      // Additional validation for hourly pricing
      if (formData.pricingType === 'hourly') {
        const diffHours = (endDate - startDate) / (1000 * 60 * 60);
        if (diffHours > 24) {
          newErrors.endDate = 'Untuk pricing per jam, durasi maksimal 24 jam';
        }
        if (diffHours < 1) {
          newErrors.endDate = 'Durasi minimal 1 jam';
        }
      }
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than Rp. 0';
    }

    // Check availability for the selected dates
    if (formData.spaceId && formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Check if start date is available
      if (!isDateAvailable(startDate)) {
        const bookings = getBookingsForDate(startDate);
        if (bookings.length > 0) {
          newErrors.startDate = `Start date is not available. Existing booking by ${bookings[0].customerName}`;
        }
      }
      
      // For multi-day bookings, check if end date is available
      if (formData.pricingType !== 'hourly' && startDate.toDateString() !== endDate.toDateString()) {
        if (!isDateAvailable(endDate)) {
          const bookings = getBookingsForDate(endDate);
          if (bookings.length > 0) {
            newErrors.endDate = `End date is not available. Existing booking by ${bookings[0].customerName}`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Temporary: use simple ISO string conversion for testing
      const startDateToSend = formData.startDate ? new Date(formData.startDate).toISOString() : null;
      const endDateToSend = formData.endDate ? new Date(formData.endDate).toISOString() : null;
      
      const orderData = {
        ...formData,
        amount: parseFloat(formData.amount || 0),
        pricingType: formData.pricingType,
        startDate: startDateToSend,
        endDate: endDateToSend,
        source: 'manual' // Menandakan bahwa order ini dibuat manual
      };

      console.log('🔍 Sending order data:', orderData);
      await onSave(orderData);
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      setErrors({ submit: 'Failed to save order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePricingTypeSelect = (pricingType) => {
    setFormData(prev => {
      if (prev.pricingType === pricingType) return prev; // no change

      const requiresReset = (prev.pricingType === 'hourly' && pricingType !== 'hourly') ||
                            (prev.pricingType !== 'hourly' && pricingType === 'hourly') ||
                            (prev.pricingType === 'halfday' && pricingType !== 'halfday') ||
                            (prev.pricingType !== 'halfday' && pricingType === 'halfday');

      if (requiresReset) {
        setSelectedDateRange(null); // Reset calendar selection when switching pricing types
        setSelectedHalfDaySession(null); // Reset session selection
      }

      return {
        ...prev,
        pricingType,
        startDate: requiresReset ? '' : prev.startDate,
        endDate: requiresReset ? '' : prev.endDate,
        amount: 0
      };
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingOrder ? 'Edit Order' : 'Add New Order'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Customer *
            </label>
            <select
              name="customerId"
              value={formData.customerId}
              onChange={handleCustomerChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.customerId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={customersLoading}
            >
              <option value="">Select Customer</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </select>
            {errors.customerId && <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>}
          </div>

          {/* Space Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Space *
            </label>
            <select
              name="spaceId"
              value={formData.spaceId}
              onChange={handleSpaceChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors.spaceId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={spacesLoading}
            >
              <option value="">Select Space</option>
              {spaces?.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name} - {space.building?.name}
                </option>
              ))}
            </select>
            {errors.spaceId && <p className="text-red-500 text-xs mt-1">{errors.spaceId}</p>}
          </div>

          {/* Pricing Type Cards */}
          {formData.spaceId && (() => {
            const selectedSpace = spaces.find(s => s.id === formData.spaceId);
            if (!selectedSpace || !selectedSpace.pricing) return null;
            
            const formatCurrency = (amount) => {
              if (!amount) return 'Tidak tersedia';
              return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(amount);
            };
            
            return (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Informasi Pricing:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <button type="button" role="button" tabIndex="0" onClick={() => handlePricingTypeSelect('hourly')} className={`text-center p-2 rounded cursor-pointer focus:outline-none ${formData.pricingType === 'hourly' ? 'bg-blue-100 border border-blue-300 ring-2 ring-primary' : 'bg-white hover:bg-gray-100'}`}>
                    <p className="text-gray-600">Per Jam</p>
                    <p className="font-medium">{formatCurrency(selectedSpace.pricing.hourly)}</p>
                  </button>
                  <button type="button" role="button" tabIndex="0" onClick={() => handlePricingTypeSelect('halfday')} className={`text-center p-2 rounded cursor-pointer focus:outline-none ${formData.pricingType === 'halfday' ? 'bg-blue-100 border border-blue-300 ring-2 ring-primary' : 'bg-white hover:bg-gray-100'}`}>
                    <p className="text-gray-600">Per 1/2 Hari</p>
                    <p className="font-medium">{formatCurrency(selectedSpace.pricing.halfday)}</p>
                  </button>
                  <button type="button" role="button" tabIndex="0" onClick={() => handlePricingTypeSelect('daily')} className={`text-center p-2 rounded cursor-pointer focus:outline-none ${formData.pricingType === 'daily' ? 'bg-blue-100 border border-blue-300 ring-2 ring-primary' : 'bg-white hover:bg-gray-100'}`}>
                    <p className="text-gray-600">Per Hari</p>
                    <p className="font-medium">{formatCurrency(selectedSpace.pricing.daily)}</p>
                  </button>
                  <button type="button" role="button" tabIndex="0" onClick={() => handlePricingTypeSelect('monthly')} className={`text-center p-2 rounded cursor-pointer focus:outline-none ${formData.pricingType === 'monthly' ? 'bg-blue-100 border border-blue-300 ring-2 ring-primary' : 'bg-white hover:bg-gray-100'}`}>
                    <p className="text-gray-600">Per Bulan</p>
                    <p className="font-medium">{formatCurrency(selectedSpace.pricing.monthly)}</p>
                  </button>
                </div>
                
                {/* Current calculation info */}
                {formData.startDate && formData.endDate && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Total Estimasi:</strong> {formatCurrency(formData.amount)}
                    </p>
                    <div className="text-xs text-blue-600 mt-1">
                      {formData.pricingType === 'hourly' && formData.startDate && formData.endDate && (
                        <>
                          <div>📅 {new Date(formData.startDate).toLocaleDateString('id-ID')}</div>
                          <div>🕐 {new Date(formData.startDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} - {new Date(formData.endDate).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</div>
                          <div>({Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60))} jam × {formatCurrency(selectedSpace.pricing.hourly)})</div>
                        </>
                      )}
                      {formData.pricingType === 'halfday' && formData.startDate && formData.endDate && (
                        <>
                          <div>📅 {new Date(formData.startDate).toLocaleDateString('id-ID')} - {new Date(formData.endDate).toLocaleDateString('id-ID')}</div>
                          <div>({Math.floor(((new Date(formData.endDate) - new Date(formData.startDate)) / (24 * 60 * 60 * 1000)) + 1) * 2} setengah hari × {formatCurrency(selectedSpace.pricing.halfday)})</div>
                        </>
                      )}
                      {formData.pricingType === 'daily' && formData.startDate && formData.endDate && (
                        <>
                          <div>📅 {new Date(formData.startDate).toLocaleDateString('id-ID')} - {new Date(formData.endDate).toLocaleDateString('id-ID')}</div>
                          <div>({Math.floor(((new Date(formData.endDate) - new Date(formData.startDate)) / (24 * 60 * 60 * 1000)) + 1)} hari × {formatCurrency(selectedSpace.pricing.daily)})</div>
                        </>
                      )}
                      {formData.pricingType === 'monthly' && formData.startDate && formData.endDate && (
                        <>
                          <div>📅 {new Date(formData.startDate).toLocaleDateString('id-ID')} - {new Date(formData.endDate).toLocaleDateString('id-ID')}</div>
                          <div>({Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24 * 30))} bulan × {formatCurrency(selectedSpace.pricing.monthly)})</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}



          {/* Availability Calendar */}
          {showCalendar && (
            <div className="border-t pt-4">
              <AvailabilityCalendar
                spaceId={formData.spaceId}
                selectedRange={selectedDateRange}
                onDateRangeSelect={handleDateRangeSelect}
                pricingType={formData.pricingType === 'halfday' ? 'single' : formData.pricingType}
              />
            </div>
          )}

          {/* Half-Day Session Selector */}
          {showCalendar && formData.pricingType === 'halfday' && selectedDateRange?.from && (
            <div className="border-t pt-4">
              <HalfDaySessionSelector
                selectedDate={selectedDateRange.from}
                selectedSession={selectedHalfDaySession}
                onSessionSelect={handleHalfDaySessionSelect}
                bookedHours={getBookedHoursForDate(selectedDateRange.from)}
                getBookingsForDate={getBookingsForDate}
              />
            </div>
          )}

          {/* Manual Amount Override */}
          {formData.spaceId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Amount (IDR) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Rp. 0"
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Amount dihitung otomatis berdasarkan pricing type dan durasi. Anda bisa mengedit manual jika diperlukan.
              </p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Additional notes (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingOrder ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderModal;