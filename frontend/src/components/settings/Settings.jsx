import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../auth/AuthContext';
import { Save, Percent, AlertCircle, Users, Key, UserPlus, Shield, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [taxRate, setTaxRate] = useState(11);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin management states
  const [admins, setAdmins] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [newAdminData, setNewAdminData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin'
  });

  // Tab configuration
  const tabs = [
    {
      id: 'general',
      name: 'Pengaturan Umum',
      icon: SettingsIcon,
      show: true
    },
    {
      id: 'admin',
      name: 'Manajemen Admin',
      icon: Users,
      show: isAdmin
    }
  ];

  const docRef = doc(db, 'settings', 'global');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setTaxRate(data.taxRate || 11);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Gagal memuat pengaturan');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
    if (isAdmin) {
      loadAdmins();
    }
  }, [isAdmin]);

  const loadAdmins = async () => {
    setAdminLoading(true);
    try {
      const adminsRef = collection(db, 'admins');
      const snapshot = await getDocs(adminsRef);
      const adminsList = [];
      snapshot.forEach((doc) => {
        adminsList.push({ id: doc.id, ...doc.data() });
      });
      setAdmins(adminsList);
    } catch (err) {
      console.error('Error loading admins:', err);
      setError('Gagal memuat daftar admin');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Semua field password harus diisi');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Password baru dan konfirmasi tidak cocok');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password baru harus minimal 8 karakter');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordData.newPassword);
      
      setSuccess('Password berhasil diubah!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Password lama tidak benar');
      } else if (err.code === 'auth/weak-password') {
        setError('Password baru terlalu lemah');
      } else {
        setError('Gagal mengubah password: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminData.email || !newAdminData.password || !newAdminData.name) {
      setError('Semua field harus diisi');
      return;
    }

    if (newAdminData.password.length < 8) {
      setError('Password harus minimal 8 karakter');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, newAdminData.email, newAdminData.password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'admins', newUser.uid), {
        email: newAdminData.email,
        name: newAdminData.name,
        role: newAdminData.role,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setSuccess(`Admin ${newAdminData.name} berhasil ditambahkan!`);
      setNewAdminData({ email: '', password: '', name: '', role: 'admin' });
      setShowAddAdmin(false);
      loadAdmins();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding admin:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar');
      } else if (err.code === 'auth/weak-password') {
        setError('Password terlalu lemah');
      } else {
        setError('Gagal menambahkan admin: ' + err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const taxRateNum = Number(taxRate);
      
      if (isNaN(taxRateNum) || taxRateNum < 0 || taxRateNum > 100) {
        throw new Error('Tarif pajak harus berupa angka antara 0-100');
      }

      await setDoc(
        docRef,
        { 
          taxRate: taxRateNum, 
          updatedAt: new Date() 
        },
        { merge: true }
      );
      
      setSuccess('Tarif pajak berhasil diperbarui!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  // Tab navigation component
  const TabNavItem = ({ tabId, icon: Icon, children, show = true }) => {
    if (!show) return null;
    
    return (
      <button
        onClick={() => setActiveTab(tabId)}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === tabId
            ? 'bg-primary text-white'
            : 'text-gray-700 hover:text-primary hover:bg-gray-100'
        }`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {children}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Kelola pengaturan sistem dan akun admin</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <TabNavItem key={tab.id} tabId={tab.id} icon={tab.icon} show={tab.show}>
              {tab.name}
            </TabNavItem>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="px-6 max-w-4xl">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="text-sm text-green-700">{success}</div>
          </div>
        )}

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Percent className="w-5 h-5" />
                Pengaturan Umum
              </h2>
              <p className="text-gray-600 mt-1">
                Kelola pengaturan sistem yang berlaku untuk seluruh aplikasi
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Tax Rate Setting */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarif Pajak (PPN) %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={e => setTaxRate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-8"
                      placeholder="11"
                    />
                    <Percent className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Tarif pajak yang akan digunakan untuk semua invoice. Contoh: 11 untuk PPN 11%
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-sm text-blue-800">
                    <strong>Catatan:</strong> Perubahan tarif pajak akan langsung berlaku untuk:
                    <ul className="mt-2 ml-4 list-disc space-y-1">
                      <li>Invoice baru yang dibuat</li>
                      <li>Laporan keuangan</li>
                      <li>Aplikasi mobile (real-time)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Management Tab */}
        {activeTab === 'admin' && isAdmin && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Manajemen Admin
              </h2>
              <p className="text-gray-600 mt-1">
                Kelola akun admin dan ubah password
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Change Password Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Ubah Password
                  </h3>
                  <button
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    className="text-sm text-primary hover:text-primary-dark"
                  >
                    {showChangePassword ? 'Tutup' : 'Ubah Password'}
                  </button>
                </div>

                {showChangePassword && (
                  <div className="bg-gray-50 p-4 rounded-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password Lama
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Masukkan password lama"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Masukkan password baru (min. 8 karakter)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Konfirmasi Password Baru
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Ulangi password baru"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Mengubah...' : 'Ubah Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Admin Section */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Tambah Admin Baru
                  </h3>
                  <button
                    onClick={() => setShowAddAdmin(!showAddAdmin)}
                    className="text-sm text-primary hover:text-primary-dark"
                  >
                    {showAddAdmin ? 'Tutup' : 'Tambah Admin'}
                  </button>
                </div>

                {showAddAdmin && (
                  <div className="bg-gray-50 p-4 rounded-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newAdminData.email}
                        onChange={e => setNewAdminData({...newAdminData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="admin@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={newAdminData.password}
                        onChange={e => setNewAdminData({...newAdminData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Password (min. 8 karakter)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={newAdminData.name}
                        onChange={e => setNewAdminData({...newAdminData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Nama lengkap admin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={newAdminData.role}
                        onChange={e => setNewAdminData({...newAdminData, role: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddAdmin}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        {saving ? 'Menambah...' : 'Tambah Admin'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin List */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Daftar Admin
                </h3>
                
                {adminLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-md">
                    {admins.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Tidak ada admin yang ditemukan
                      </div>
                    ) : (
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nama
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Dibuat
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {admins.map((admin) => (
                              <tr key={admin.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {admin.name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{admin.email}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    admin.role === 'admin' ? 'bg-green-100 text-green-800' :
                                    admin.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {admin.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {admin.createdAt ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 