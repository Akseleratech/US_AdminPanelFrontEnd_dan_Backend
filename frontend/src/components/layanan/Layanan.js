import React from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import SpacesTable from './SpacesTable';
import CitiesTable from './CitiesTable';
import ServicesTable from './ServicesTable';

const Layanan = ({ 
  layananSubTab, 
  setLayananSubTab, 
  spaces, 
  cities, 
  services, 
  onEdit, 
  onDelete, 
  onAddNew 
}) => {
  const getTabTitle = () => {
    switch (layananSubTab) {
      case 'spaces': return 'Space';
      case 'cities': return 'Kota';
      case 'services': return 'Layanan';
      default: return 'Space';
    }
  };

  const renderTable = () => {
    switch (layananSubTab) {
      case 'spaces':
        return <SpacesTable spaces={spaces} onEdit={onEdit} onDelete={onDelete} />;
      case 'cities':
        return <CitiesTable cities={cities} onEdit={onEdit} onDelete={onDelete} />;
      case 'services':
        return <ServicesTable services={services} onEdit={onEdit} onDelete={onDelete} />;
      default:
        return <SpacesTable spaces={spaces} onEdit={onEdit} onDelete={onDelete} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setLayananSubTab('spaces')}
          className={`px-4 py-2 font-medium text-sm ${
            layananSubTab === 'spaces'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Spaces
        </button>
        <button
          onClick={() => setLayananSubTab('cities')}
          className={`px-4 py-2 font-medium text-sm ${
            layananSubTab === 'cities'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Kota
        </button>
        <button
          onClick={() => setLayananSubTab('services')}
          className={`px-4 py-2 font-medium text-sm ${
            layananSubTab === 'services'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Layanan
        </button>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${layananSubTab}...`}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>
        <button
          onClick={() => onAddNew()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah {getTabTitle()}
        </button>
      </div>

      {/* Table */}
      {renderTable()}
    </div>
  );
};

export default Layanan; 