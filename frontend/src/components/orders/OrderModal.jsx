import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, MapPin } from 'lucide-react';
import { startOfMonth, endOfMonth } from 'date-fns';
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
    amountBase: 0, // Base price before tax
    invoiceId: null, // Link to invoice
    pricingType: 'daily', // hourly, halfday, daily, monthly, yearly
    startDate: '',
    endDate: '',
    status: 'pending',
    notes: '',
    numberOfMonths: 1, // For monthly pricing
    numberOfYears: 1 // For yearly pricing
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedHalfDaySession, setSelectedHalfDaySession] = useState(null);

  // Helper function to calculate end date for monthly pricing
  const calculateEndDateForMonthly = (startDate, numberOfMonths) => {
    if (!startDate || !numberOfMonths) return null;
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + parseInt(numberOfMonths));
    end.setDate(end.getDate() - 1); // End on the day before to make it inclusive
    return end;
  };

  // Helper function to calculate end date for yearly pricing
  const calculateEndDateForYearly = (startDate, numberOfYears) => {
    if (!startDate || !numberOfYears) return null;
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;
    
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + parseInt(numberOfYears));
    end.setDate(end.getDate() - 1); // End on the day before to make it inclusive
    return end;
  };

  // Calculate availability date range to send to backend
  const availabilityDateRange = useMemo(() => {
    // jika belum ada tanggal terpilih, tampilkan bulan berjalan
    if (!formData.startDate && !formData.endDate) {
      const today = new Date();
      return {
        from: formatDateLocal(startOfMonth(today)),
        to: formatDateLocal(endOfMonth(today))
      };
    }

    // tentukan tanggal paling awal & paling akhir yang sudah terisi di form
    const start = formData.startDate ? new Date(formData.startDate) : null;
    const end = formData.endDate ? new Date(formData.endDate) : null;

    const earliest = start && end ? (start < end ? start : end) : (start || end);
    const latest = start && end ? (start > end ? start : end) : (start || end);

    // bentangkan ke awal-bulan & akhir-bulan agar satu bulan penuh selalu termuat
    return {
      from: formatDateLocal(startOfMonth(earliest)),
      to: formatDateLocal(endOfMonth(latest))
    };
  }, [formData.startDate, formData.endDate]);

  // Get availability data for the selected space
  const { isDateAvailable, getBookingsForDate, getBookedHoursForDate, isDateFullyBooked } = useSpaceAvailability(formData.spaceId, availabilityDateRange);

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
        // Calculate numberOfMonths for existing monthly orders
        let numberOfMonths = 1;
        if (pricingType === 'monthly' && editingOrder.startDate && editingOrder.endDate) {
          const start = new Date(editingOrder.startDate);
          const end = new Date(editingOrder.endDate);
          numberOfMonths = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30)) || 1;
        }

        // Calculate numberOfYears for existing yearly orders
        let numberOfYears = 1;
        if (pricingType === 'yearly' && editingOrder.startDate && editingOrder.endDate) {
          const start = new Date(editingOrder.startDate);
          const end = new Date(editingOrder.endDate);
          numberOfYears = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 365)) || 1;
        }

        setFormData({
          customerId: editingOrder.customerId || '',
          customerName: editingOrder.customerName || editingOrder.customer || '',
          customerEmail: editingOrder.customerEmail || '',
          spaceId: editingOrder.spaceId || '',
          spaceName: editingOrder.spaceName || '',
          amountBase: editingOrder.amountBase || 0,
          invoiceId: editingOrder.invoiceId || null,
          pricingType: pricingType,
          startDate: formatDateForInput(editingOrder.startDate, pricingType),
          endDate: formatDateForInput(editingOrder.endDate, pricingType),
          status: editingOrder.status || 'pending',
          notes: editingOrder.notes || '',
          numberOfMonths: numberOfMonths,
          numberOfYears: numberOfYears
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
          amountBase: 0,
          invoiceId: null,
          pricingType: 'daily',
          startDate: '',
          endDate: '',
          status: 'pending',
          notes: '',
          numberOfMonths: 1,
          numberOfYears: 1
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
          amountBase: 0
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } 
    // Special handling for numberOfMonths changes in monthly pricing
    else if (name === 'numberOfMonths' && formData.pricingType === 'monthly') {
      const newEndDate = formData.startDate ? 
        formatDateLocal(calculateEndDateForMonthly(formData.startDate, value)) : '';
        
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 1,
        endDate: newEndDate
      }));
      
      // Update calendar selection if we have a start date
      if (formData.startDate && newEndDate) {
        setSelectedDateRange({
          from: new Date(formData.startDate),
          to: new Date(newEndDate)
        });
      }
    }
    // Special handling for numberOfYears changes in yearly pricing
    else if (name === 'numberOfYears' && formData.pricingType === 'yearly') {
      const newEndDate = formData.startDate ? 
        formatDateLocal(calculateEndDateForYearly(formData.startDate, value)) : '';
        
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 1,
        endDate: newEndDate
      }));
      
      // Update calendar selection if we have a start date
      if (formData.startDate && newEndDate) {
        setSelectedDateRange({
          from: new Date(formData.startDate),
          to: new Date(newEndDate)
        });
      }
    } 
    else {
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
          amountBase: 0
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
      } else if (formData.pricingType === 'monthly') {
        // Monthly pricing is handled by inline calendar in UI
        // This branch shouldn't be reached for monthly pricing
        return;
      } else if (formData.pricingType === 'yearly') {
        // Yearly pricing is handled by inline calendar in UI
        // This branch shouldn't be reached for yearly pricing
        return;
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
      // Use numberOfMonths from formData if available, otherwise calculate from dates
      const monthsToUse = formData.numberOfMonths || 1;
      return monthsToUse * rate;
    }
    
    // For yearly pricing
    if (pricingType === 'yearly') {
      // Use numberOfYears from formData if available, otherwise calculate from dates
      const yearsToUse = formData.numberOfYears || 1;
      return yearsToUse * rate;
    }
    
    return rate;
  };

  // Recalculate base amount whenever space or dates change
  useEffect(() => {
    const newAmountBase = calculateTotalAmount(formData.spaceId, formData.startDate, formData.endDate, formData.pricingType);
    setFormData((prev) => {
      if (prev.amountBase === newAmountBase) return prev;
      return { ...prev, amountBase: newAmountBase };
    });
  }, [formData.spaceId, formData.startDate, formData.endDate, formData.pricingType, formData.numberOfMonths, formData.numberOfYears, spaces]);

  // Helper function to check if booking time is within operational hours
  const isWithinOperationalHours = (spaceId, startDate, endDate) => {
    if (!spaceId || !startDate || !endDate) return { valid: true };
    
    const selectedSpace = spaces.find(s => s.id === spaceId);
    if (!selectedSpace || !selectedSpace.operationalHours) return { valid: true };
    
    const { operationalHours } = selectedSpace;
    
    // If the space is always open, no need to check
    if (operationalHours.isAlwaysOpen) return { valid: true };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get day names for checking
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // For hourly and halfday pricing, check specific times
    if (formData.pricingType === 'hourly' || formData.pricingType === 'halfday') {
      const startDay = dayNames[start.getDay()];
      const endDay = dayNames[end.getDay()];
      
      // Check if the day is open
      if (!operationalHours.schedule[startDay]?.isOpen) {
        return { 
          valid: false, 
          message: `Space tutup pada hari ${startDay === 'sunday' ? 'Minggu' : startDay === 'monday' ? 'Senin' : startDay === 'tuesday' ? 'Selasa' : startDay === 'wednesday' ? 'Rabu' : startDay === 'thursday' ? 'Kamis' : startDay === 'friday' ? 'Jumat' : 'Sabtu'}` 
        };
      }
      
      // Get operational hours for the day
      const daySchedule = operationalHours.schedule[startDay];
      const [openHour, openMinute] = daySchedule.openTime.split(':').map(Number);
      const [closeHour, closeMinute] = daySchedule.closeTime.split(':').map(Number);
      
      // Create time objects for comparison
      const openTime = new Date(start);
      openTime.setHours(openHour, openMinute, 0, 0);
      
      const closeTime = new Date(start);
      closeTime.setHours(closeHour, closeMinute, 0, 0);
      
      // Check if booking time is within operational hours
      if (start < openTime || end > closeTime) {
        return { 
          valid: false, 
          message: `Booking harus dalam jam operasional: ${daySchedule.openTime} - ${daySchedule.closeTime}` 
        };
      }
      
      // For multi-day hourly bookings, check end day too
      if (startDay !== endDay) {
        if (!operationalHours.schedule[endDay]?.isOpen) {
          return { 
            valid: false, 
            message: `Space tutup pada hari ${endDay === 'sunday' ? 'Minggu' : endDay === 'monday' ? 'Senin' : endDay === 'tuesday' ? 'Selasa' : endDay === 'wednesday' ? 'Rabu' : endDay === 'thursday' ? 'Kamis' : endDay === 'friday' ? 'Jumat' : 'Sabtu'}` 
          };
        }
      }
    }
    
    // For daily pricing, check if any day in the range is closed
    // Monthly pricing ignores closed days (assumes long-term rental with flexibility)
    if (formData.pricingType === 'daily') {
      const current = new Date(start);
      const closedDays = [];
      
      while (current <= end) {
        const dayName = dayNames[current.getDay()];
        if (!operationalHours.schedule[dayName]?.isOpen) {
          const dayLabel = dayName === 'sunday' ? 'Minggu' : dayName === 'monday' ? 'Senin' : dayName === 'tuesday' ? 'Selasa' : dayName === 'wednesday' ? 'Rabu' : dayName === 'thursday' ? 'Kamis' : dayName === 'friday' ? 'Jumat' : 'Sabtu';
          closedDays.push(dayLabel);
        }
        current.setDate(current.getDate() + 1);
      }
      
      if (closedDays.length > 0) {
        return { 
          valid: false, 
          message: `Space tutup pada: ${closedDays.join(', ')}` 
        };
      }
    }
    
    // Monthly pricing: Allow booking even with closed days (long-term rental flexibility)
    if (formData.pricingType === 'monthly') {
      // No operational hours validation for monthly pricing
      // Customer can use space on operational days within the monthly period
      return { valid: true };
    }
    
    // Yearly pricing: Allow booking even with closed days (long-term rental flexibility)
    if (formData.pricingType === 'yearly') {
      // No operational hours validation for yearly pricing
      // Customer can use space on operational days within the yearly period
      return { valid: true };
    }
    
    return { valid: true };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerId) newErrors.customerId = 'Customer is required';
    if (!formData.spaceId) newErrors.spaceId = 'Space is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Different validation rules for different pricing types
      if (formData.pricingType === 'hourly') {
        // For hourly pricing, end time must be after start time
        if (startDate >= endDate) {
          newErrors.endDate = 'End time must be after start time';
        }
      } else if (formData.pricingType === 'daily' || formData.pricingType === 'monthly' || formData.pricingType === 'yearly') {
        // For daily, monthly, and yearly pricing, end date can be same as start date (for 1-day booking)
        if (startDate > endDate) {
          newErrors.endDate = 'End date cannot be before start date';
        }
      } else {
        // For halfday and other pricing types, end date must be after start date
        if (startDate >= endDate) {
          newErrors.endDate = 'End date must be after start date';
        }
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
      
      // Check operational hours
      const operationalCheck = isWithinOperationalHours(formData.spaceId, formData.startDate, formData.endDate);
      if (!operationalCheck.valid) {
        newErrors.startDate = operationalCheck.message;
      }

      // Additional check for closed days (to be safe)
      // Skip this validation for monthly and yearly pricing to allow flexibility
      const selectedSpace = spaces.find(s => s.id === formData.spaceId);
      if (selectedSpace?.operationalHours && !selectedSpace.operationalHours.isAlwaysOpen && formData.pricingType !== 'monthly' && formData.pricingType !== 'yearly') {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        // Check if start date is on a closed day
        const startDay = dayNames[startDate.getDay()];
        if (!selectedSpace.operationalHours.schedule?.[startDay]?.isOpen) {
          const dayLabel = startDay === 'sunday' ? 'Minggu' : startDay === 'monday' ? 'Senin' : startDay === 'tuesday' ? 'Selasa' : startDay === 'wednesday' ? 'Rabu' : startDay === 'thursday' ? 'Kamis' : startDay === 'friday' ? 'Jumat' : 'Sabtu';
          newErrors.startDate = `Space tutup pada hari ${dayLabel}`;
        }
        
        // For multi-day bookings, check if end date is on a closed day
        if (formData.pricingType !== 'hourly' && startDate.toDateString() !== endDate.toDateString()) {
          const endDay = dayNames[endDate.getDay()];
          if (!selectedSpace.operationalHours.schedule?.[endDay]?.isOpen) {
            const dayLabel = endDay === 'sunday' ? 'Minggu' : endDay === 'monday' ? 'Senin' : endDay === 'tuesday' ? 'Selasa' : endDay === 'wednesday' ? 'Rabu' : endDay === 'thursday' ? 'Kamis' : endDay === 'friday' ? 'Jumat' : 'Sabtu';
            newErrors.endDate = `Space tutup pada hari ${dayLabel}`;
          }
        }
      }
    }
    
    if (formData.pricingType === 'halfday' && !selectedHalfDaySession) {
      newErrors.startDate = 'Pilih sesi (pagi/siang/sore)';
    }

    if (!formData.amountBase || formData.amountBase <= 0) {
      newErrors.amountBase = 'Base amount must be greater than Rp. 0';
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
        amountBase: parseFloat(formData.amountBase || 0),
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
                            (prev.pricingType !== 'halfday' && pricingType === 'halfday') ||
                            (prev.pricingType === 'monthly' && pricingType !== 'monthly') ||
                            (prev.pricingType !== 'monthly' && pricingType === 'monthly') ||
                            (prev.pricingType === 'yearly' && pricingType !== 'yearly') ||
                            (prev.pricingType !== 'yearly' && pricingType === 'yearly');

      if (requiresReset) {
        setSelectedDateRange(null); // Reset calendar selection when switching pricing types
        setSelectedHalfDaySession(null); // Reset session selection
      }

      return {
        ...prev,
        pricingType,
        startDate: requiresReset ? '' : prev.startDate,
        endDate: requiresReset ? '' : prev.endDate,
        numberOfMonths: pricingType === 'monthly' ? 1 : prev.numberOfMonths,
        numberOfYears: pricingType === 'yearly' ? 1 : prev.numberOfYears,
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
                  
                  {/* Row 1: Per Jam, Per 1/2 Hari, Per Hari */}
                  <div className="grid grid-cols-3 gap-3 text-sm mb-3">
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
                  </div>
                  
                  {/* Row 2: Per Bulan, Per Tahun */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <button type="button" role="button" tabIndex="0" onClick={() => handlePricingTypeSelect('monthly')} className={`text-center p-2 rounded cursor-pointer focus:outline-none ${formData.pricingType === 'monthly' ? 'bg-blue-100 border border-blue-300 ring-2 ring-primary' : 'bg-white hover:bg-gray-100'}`}>
                      <p className="text-gray-600">Per Bulan</p>
                      <p className="font-medium">{formatCurrency(selectedSpace.pricing.monthly)}</p>
                      <p className="text-xs text-green-600 mt-1">*Mengabaikan hari tutup</p>
                    </button>
                    <button type="button" role="button" tabIndex="0" onClick={() => handlePricingTypeSelect('yearly')} className={`text-center p-2 rounded cursor-pointer focus:outline-none ${formData.pricingType === 'yearly' ? 'bg-blue-100 border border-blue-300 ring-2 ring-primary' : 'bg-white hover:bg-gray-100'}`}>
                      <p className="text-gray-600">Per Tahun</p>
                      <p className="font-medium">{formatCurrency(selectedSpace.pricing.yearly)}</p>
                      <p className="text-xs text-green-600 mt-1">*Mengabaikan hari tutup</p>
                    </button>
                  </div>
                
                {/* Operational Hours Info */}
                {selectedSpace.operationalHours && (
                  <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-1">
                      🕐 Jam Operasional:
                    </p>
                    <div className="text-xs text-green-600">
                      {selectedSpace.operationalHours.isAlwaysOpen ? (
                        <div>24 Jam (Selalu Buka)</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {Object.entries(selectedSpace.operationalHours.schedule).map(([day, schedule]) => {
                            const dayLabel = day === 'sunday' ? 'Minggu' : day === 'monday' ? 'Senin' : day === 'tuesday' ? 'Selasa' : day === 'wednesday' ? 'Rabu' : day === 'thursday' ? 'Kamis' : day === 'friday' ? 'Jumat' : 'Sabtu';
                            return (
                              <div key={day} className={`text-xs ${schedule.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                                <strong>{dayLabel}:</strong> {schedule.isOpen ? `${schedule.openTime} - ${schedule.closeTime}` : 'Tutup'}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    {/* Monthly pricing note */}
                    {formData.pricingType === 'monthly' && !selectedSpace.operationalHours.isAlwaysOpen && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-700">
                          📅 <strong>Catatan Booking Bulanan:</strong> Anda dapat memilih tanggal mulai dan berakhir kapan saja. 
                          Space hanya dapat digunakan pada hari dan jam operasional yang tercantum di atas.
                        </p>
                      </div>
                    )}
                    
                    {/* Yearly pricing note */}
                    {formData.pricingType === 'yearly' && !selectedSpace.operationalHours.isAlwaysOpen && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs text-blue-700">
                          📅 <strong>Catatan Booking Tahunan:</strong> Anda dapat memilih tanggal mulai dan berakhir kapan saja. 
                          Space hanya dapat digunakan pada hari dan jam operasional yang tercantum di atas.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Current calculation info */}
                {formData.startDate && formData.endDate && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Base Price Estimasi:</strong> {formatCurrency(formData.amountBase)}
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
                          <div>({formData.numberOfMonths} bulan × {formatCurrency(selectedSpace.pricing.monthly)})</div>
                        </>
                      )}
                      {formData.pricingType === 'yearly' && formData.startDate && formData.endDate && (
                        <>
                          <div>📅 {new Date(formData.startDate).toLocaleDateString('id-ID')} - {new Date(formData.endDate).toLocaleDateString('id-ID')}</div>
                          <div>({formData.numberOfYears} tahun × {formatCurrency(selectedSpace.pricing.yearly)})</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Monthly Pricing Input */}
          {showCalendar && formData.pricingType === 'monthly' && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-1" />
                Booking Bulanan
              </h4>
              
              {/* Number of Months Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durasi (Bulan) *
                </label>
                <select
                  name="numberOfMonths"
                  value={formData.numberOfMonths}
                  onChange={handleInputChange}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} Bulan
                    </option>
                  ))}
                </select>
              </div>

              {/* Calendar for Start Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Tanggal Mulai *
                </label>
                <AvailabilityCalendar
                  spaceId={formData.spaceId}
                  selectedRange={selectedDateRange}
                  onDateRangeSelect={(range) => {
                    if (range?.from) {
                      // For monthly, we only need start date, then calculate end date
                      const startDate = formatDateLocal(range.from);
                      const endDate = calculateEndDateForMonthly(startDate, formData.numberOfMonths);
                      
                      setFormData(prev => ({
                        ...prev,
                        startDate: startDate,
                        endDate: endDate ? formatDateLocal(endDate) : ''
                      }));
                      
                      setSelectedDateRange({
                        from: range.from,
                        to: endDate || range.from
                      });
                    }
                  }}
                  pricingType="single" // Use single date selection for start date
                  spaceData={spaces.find(s => s.id === formData.spaceId)}
                  dateRange={availabilityDateRange}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              {/* End Date Display */}
              {formData.startDate && formData.numberOfMonths && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Periode Booking:</strong> 
                  </p>
                  <div className="text-xs text-blue-600 mt-1 space-y-1">
                    <div>📅 <strong>Mulai:</strong> {new Date(formData.startDate).toLocaleDateString('id-ID')}</div>
                    <div>📅 <strong>Berakhir:</strong> {formData.endDate ? new Date(formData.endDate).toLocaleDateString('id-ID') : '-'}</div>
                    <div>⏰ <strong>Durasi:</strong> {formData.numberOfMonths} bulan</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Yearly Pricing Input */}
          {showCalendar && formData.pricingType === 'yearly' && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-1" />
                Booking Tahunan
              </h4>
              
              {/* Number of Years Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durasi (Tahun) *
                </label>
                <select
                  name="numberOfYears"
                  value={formData.numberOfYears}
                  onChange={handleInputChange}
                  className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} Tahun
                    </option>
                  ))}
                </select>
              </div>

              {/* Calendar for Start Date Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Tanggal Mulai *
                </label>
                <AvailabilityCalendar
                  spaceId={formData.spaceId}
                  selectedRange={selectedDateRange}
                  onDateRangeSelect={(range) => {
                    if (range?.from) {
                      // For yearly, we only need start date, then calculate end date
                      const startDate = formatDateLocal(range.from);
                      const endDate = calculateEndDateForYearly(startDate, formData.numberOfYears);
                      
                      setFormData(prev => ({
                        ...prev,
                        startDate: startDate,
                        endDate: endDate ? formatDateLocal(endDate) : ''
                      }));
                      
                      setSelectedDateRange({
                        from: range.from,
                        to: endDate || range.from
                      });
                    }
                  }}
                  pricingType="single" // Use single date selection for start date
                  spaceData={spaces.find(s => s.id === formData.spaceId)}
                  dateRange={availabilityDateRange}
                />
                {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
              </div>

              {/* End Date Display */}
              {formData.startDate && formData.numberOfYears && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">
                    <strong>Periode Booking:</strong> 
                  </p>
                  <div className="text-xs text-blue-600 mt-1 space-y-1">
                    <div>📅 <strong>Mulai:</strong> {new Date(formData.startDate).toLocaleDateString('id-ID')}</div>
                    <div>📅 <strong>Berakhir:</strong> {formData.endDate ? new Date(formData.endDate).toLocaleDateString('id-ID') : '-'}</div>
                    <div>⏰ <strong>Durasi:</strong> {formData.numberOfYears} tahun</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Availability Calendar */}
          {showCalendar && formData.pricingType !== 'monthly' && formData.pricingType !== 'yearly' && (
            <div className="border-t pt-4">
              <AvailabilityCalendar
                spaceId={formData.spaceId}
                selectedRange={selectedDateRange}
                onDateRangeSelect={handleDateRangeSelect}
                pricingType={formData.pricingType === 'halfday' ? 'single' : formData.pricingType}
                spaceData={spaces.find(s => s.id === formData.spaceId)}
                dateRange={availabilityDateRange}
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
                spaceData={spaces.find(s => s.id === formData.spaceId)}
              />
            </div>
          )}

          {/* Manual Base Amount Override */}
          {formData.spaceId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price (before tax) *
              </label>
              <input
                type="number"
                name="amountBase"
                value={formData.amountBase}
                onChange={handleInputChange}
                min="0"
                step="1000"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors.amountBase ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Rp. 0"
              />
              {errors.amountBase && <p className="text-red-500 text-xs mt-1">{errors.amountBase}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Base price dihitung otomatis berdasarkan pricing type dan durasi. Tax akan ditambahkan saat generate invoice.
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