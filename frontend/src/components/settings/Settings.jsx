import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Save, Percent, AlertCircle } from 'lucide-react';

export default function Settings() {
  const [taxRate, setTaxRate] = useState(11);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  }, []);

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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Percent className="w-6 h-6" />
            Pengaturan Umum
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola pengaturan sistem yang berlaku untuk seluruh aplikasi
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}

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
    </div>
  );
} 