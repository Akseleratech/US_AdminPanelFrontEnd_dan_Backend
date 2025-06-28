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