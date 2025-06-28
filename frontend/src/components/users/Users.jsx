import React from 'react';

const Users = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Kelola pengguna dan akun pelanggan</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
        <div className="text-center">
          <p className="text-gray-500 max-w-md mx-auto">
            Halaman ini akan berisi fitur untuk mengelola pengguna, akun pelanggan, dan hak akses sistem.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Users; 