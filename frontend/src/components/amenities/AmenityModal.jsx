import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud, Image } from 'lucide-react';

const AmenityModal = ({ isOpen, onClose, onSave, amenity, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (amenity && mode === 'edit') {
        setFormData({
          name: amenity.name || '',
          description: amenity.description || '',
        });
        setIconPreview(amenity.icon || '');
      } else {
        setFormData({ name: '', description: '' });
        setIconPreview('');
      }
      setIconFile(null);
      setError('');
    }
  }, [isOpen, amenity, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    } else {
      setIconFile(null);
      setIconPreview(amenity?.icon || '');
      setError('Please select a valid image file (png, jpg).');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nama fasilitas wajib diisi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      if (iconFile) {
        data.append('icon', iconFile);
      } else if (mode === 'edit') {
        data.append('icon', iconPreview); // pass existing url if not changed
      }
      
      await onSave(data);
      onClose();
    } catch (err) {
      setError(err.message || `Gagal ${mode === 'edit' ? 'memperbarui' : 'membuat'} fasilitas.`);
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
            {mode === 'edit' ? 'Edit Fasilitas' : 'Buat Fasilitas Baru'}
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
              Nama Fasilitas <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
              placeholder="Masukkan nama fasilitas"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
              placeholder="Masukkan deskripsi"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ikon
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center border border-dashed">
                {iconPreview ? (
                  <img src={iconPreview} alt="Preview" className="w-full h-full object-cover rounded-md"/>
                ) : (
                  <Image className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 w-full cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current.click()}
              >
                <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-primary-600">Klik untuk upload</span> atau seret file
                </span>
                <span className="text-xs text-gray-500 mt-1">PNG, JPG (MAX. 800x400px)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  name="icon"
                  className="hidden"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                />
              </div>
            </div>
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
              {loading ? 'Menyimpan...' : (mode === 'edit' ? 'Perbarui' : 'Buat')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AmenityModal; 