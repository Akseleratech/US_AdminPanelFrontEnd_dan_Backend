import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed': 
    case 'active': 
    case 'available': 
      return 'text-green-600 bg-green-100';
    case 'pending': 
      return 'text-yellow-600 bg-yellow-100';
    case 'cancelled': 
    case 'inactive': 
      return 'text-red-600 bg-red-100';
    case 'completed': 
      return 'text-blue-600 bg-blue-100';
    case 'occupied': 
      return 'text-orange-600 bg-orange-100';
    default: 
      return 'text-gray-600 bg-gray-100';
  }
};

export const getStatusIcon = (status) => {
  switch (status) {
    case 'confirmed': 
    case 'completed': 
    case 'active': 
    case 'available': 
      return <CheckCircle className="w-4 h-4" />;
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