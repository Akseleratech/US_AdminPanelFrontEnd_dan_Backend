import React, { useState, useEffect } from 'react';
import { XCircle } from 'lucide-react';

const Modal = ({ type, activeTab, onClose, services = [], cities = [] }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {type === 'add' ? 'Tambah' : 'Edit'} {activeTab === 'spaces' ? 'Space' : activeTab === 'cities' ? 'Kota' : activeTab === 'services' ? 'Layanan' : 'Item'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          {activeTab === 'spaces' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Space</label>
                <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layanan</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih Layanan</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Pilih Kota</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas</label>
                <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga</label>
                <input type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </>
          )}
          
          {activeTab === 'cities' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kota</label>
                <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </>
          )}
          
          {activeTab === 'services' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Layanan</label>
                <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
              </div>
            </>
          )}
          
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {type === 'add' ? 'Tambah' : 'Simpan'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal; 