import { CheckCircle, Clock, XCircle, AlertCircle, Archive } from 'lucide-react';

export const getStatusColor = (status) => {
  switch (status) {
    case 'published':
    case 'confirmed': 
    case 'active': 
    case 'available': 
      return 'text-green-600 bg-green-100';
    case 'draft':
      return 'text-gray-600 bg-gray-100';
    case 'archived':
      return 'text-amber-700 bg-amber-100';
    case 'pending': 
      return 'text-yellow-600 bg-yellow-100';
    case 'cancelled': 
    case 'inactive': 
      return 'text-red-600 bg-red-100';
    case 'completed': 
      return 'text-primary-600 bg-primary-100';
    case 'occupied': 
      return 'text-orange-600 bg-orange-100';
    default: 
      return 'text-gray-600 bg-gray-100';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'published':
    case 'confirmed': 
    case 'completed': 
    case 'active': 
    case 'available': 
      return <CheckCircle className="w-4 h-4" />;
    case 'draft':
      return <Clock className="w-4 h-4" />;
    case 'archived':
      return <Archive className="w-4 h-4" />;
    case 'pending': 
      return <Clock className="w-4 h-4" />;
    case 'cancelled': 
    case 'inactive': 
      return <XCircle className="w-4 h-4" />;
    case 'occupied': 
      return <AlertCircle className="w-4 h-4" />;
    default: 
      return <AlertCircle className="w-4 h-4" />;
  }
};

// Helper function to convert service type codes to readable labels
export const getServiceTypeLabel = (serviceType) => {
  const labels = {
    'MTG': 'Meeting/Rapat',
    'WRK': 'Workspace/Kerja',
    'EVT': 'Event/Acara',
    'CFR': 'Conference/Konferensi',
    'TRN': 'Training/Pelatihan',
    'SEM': 'Seminar',
    'WSP': 'Workshop',
    'GEN': 'General/Umum'
  };
  return labels[serviceType] || serviceType;
};

// Parse structured OrderID components
export const parseOrderId = (orderId) => {
  if (!orderId || !orderId.startsWith('ORD-')) {
    return null;
  }

  const parts = orderId.split('-');

  // Format date helper
  const formatDate = (dateStr) => {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  };

  // Old format (5 parts with service type)
  if (parts.length === 5) {
    const [prefix, date, serviceType, source, sequence] = parts;
    return {
      prefix,
      date,
      formattedDate: formatDate(date),
      serviceType,
      serviceTypeLabel: getServiceTypeLabel(serviceType),
      source,
      sourceLabel: source === 'APP' ? 'Mobile App' : 'Manual/CRM',
      sequence,
      full: orderId
    };
  }

  // New format (4 parts without service type)
  if (parts.length === 4) {
    const [prefix, date, source, sequence] = parts;
    return {
      prefix,
      date,
      formattedDate: formatDate(date),
      serviceType: null,
      serviceTypeLabel: null,
      source,
      sourceLabel: source === 'APP' ? 'Mobile App' : 'Manual/CRM',
      sequence,
      full: orderId
    };
  }

  return null;
};

// Get color classes for service type badges
export const getServiceTypeColor = (serviceType) => {
  const colors = {
    'MTG': 'bg-blue-100 text-blue-800',
    'WRK': 'bg-green-100 text-green-800', 
    'EVT': 'bg-purple-100 text-purple-800',
    'CFR': 'bg-indigo-100 text-indigo-800',
    'TRN': 'bg-orange-100 text-orange-800',
    'SEM': 'bg-yellow-100 text-yellow-800',
    'WSP': 'bg-pink-100 text-pink-800',
    'GEN': 'bg-gray-100 text-gray-800'
  };
  return colors[serviceType] || 'bg-gray-100 text-gray-800';
};

// Get color classes for source badges
export const getSourceColor = (source) => {
  return source === 'APP' 
    ? 'bg-emerald-100 text-emerald-800' 
    : 'bg-amber-100 text-amber-800';
};

// Helper function to format date to YYYY-MM-DD without timezone conversion
export const formatDateLocal = (date) => {
  // Use en-CA locale to get ISO format (YYYY-MM-DD) without timezone conversion
  return date.toLocaleDateString('en-CA');
};

// Alternative helper for manual formatting
export const formatDateManual = (date) => {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}; 