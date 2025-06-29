import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const AmenityModal = ({ isOpen, onClose, onSave, amenity, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (amenity && mode === 'edit') {
        setFormData({
          name: amenity.name || '',
          description: amenity.description || '',
          icon: amenity.icon || ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          icon: ''
        });
      }
      setError('');
    }
  }, [isOpen, amenity, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Amenity name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} amenity.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md m-4 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-gray-50/50 z-10">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'edit' ? 'Edit Amenity' : 'Create New Amenity'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
              placeholder="Enter amenity name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
              placeholder="Enter description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <input
              type="text"
              name="icon"
              value={formData.icon}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
              placeholder="Enter icon name or emoji"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 ring-primary transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover focus:outline-none focus:ring-2 ring-primary shadow-primary transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AmenityModal; 