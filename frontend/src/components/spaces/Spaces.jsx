import React, { useState } from 'react';
import { Search, Plus, LayoutGrid, MapPin, Users, Clock } from 'lucide-react';

const Spaces = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Mock data untuk demonstrasi - ini akan diganti dengan data real nanti
  const spaces = [
    {
      id: 1,
      name: 'Meeting Room A',
      type: 'Meeting Room',
      capacity: 8,
      building: 'Gedung Utama',
      location: 'Lantai 2',
      status: 'Available',
      features: ['Projector', 'WiFi', 'AC']
    },
    {
      id: 2,
      name: 'Co-working Space 1',
      type: 'Co-working',
      capacity: 20,
      building: 'Gedung B',
      location: 'Lantai 1',
      status: 'Occupied',
      features: ['WiFi', 'Printer', 'AC', 'Kitchen']
    },
    {
      id: 3,
      name: 'Private Office 101',
      type: 'Private Office',
      capacity: 4,
      building: 'Gedung Utama',
      location: 'Lantai 1',
      status: 'Available',
      features: ['WiFi', 'AC', 'Phone']
    }
  ];

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.building.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Occupied': return 'bg-red-100 text-red-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

     const getTypeIcon = (type) => {
     switch (type) {
       case 'Meeting Room': return <Users className="w-4 h-4" />;
       case 'Co-working': return <LayoutGrid className="w-4 h-4" />;
       case 'Private Office': return <MapPin className="w-4 h-4" />;
       default: return <LayoutGrid className="w-4 h-4" />;
     }
   };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-200 text-green-800' 
            : 'bg-red-100 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Spaces Management</h1>
          <p className="text-gray-600">Kelola ruang kerja dan fasilitas dalam gedung</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spaces</p>
              <p className="text-2xl font-bold text-gray-900">{spaces.length}</p>
            </div>
                         <div className="p-3 bg-blue-100 rounded-full">
               <LayoutGrid className="w-6 h-6 text-blue-600" />
             </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {spaces.filter(s => s.status === 'Available').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-red-600">
                {spaces.filter(s => s.status === 'Occupied').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {spaces.reduce((total, space) => total + space.capacity, 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search spaces..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        </div>
        <button
          onClick={() => showNotification('Fitur tambah space akan segera tersedia')}
          className="flex items-center px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover shadow-primary transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Space
        </button>
      </div>

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSpaces.map((space) => (
          <div key={space.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(space.type)}
                  <h3 className="text-lg font-semibold text-gray-900">{space.name}</h3>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(space.status)}`}>
                  {space.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {space.type}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Capacity:</strong> {space.capacity} orang
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Building:</strong> {space.building}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {space.location}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Features:</p>
                <div className="flex flex-wrap gap-1">
                  {space.features.map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  onClick={() => showNotification(`Viewing details for ${space.name}`)}
                >
                  View Details
                </button>
                <button 
                  className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  onClick={() => showNotification(`Editing ${space.name}`)}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

             {filteredSpaces.length === 0 && (
         <div className="text-center py-12">
           <LayoutGrid className="w-12 h-12 text-gray-400 mx-auto mb-4" />
           <h3 className="text-lg font-medium text-gray-900 mb-2">No spaces found</h3>
           <p className="text-gray-600">Try adjusting your search criteria or add a new space.</p>
         </div>
       )}
    </div>
  );
};

export default Spaces; 