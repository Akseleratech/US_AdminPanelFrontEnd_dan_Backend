import React, { useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { Navigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (error) {
      setError('Gagal masuk: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side: Form */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-white px-8 py-12">
        <img src="/images/logo.png" alt="UnionSpace Logo" className="mb-8 w-64" />
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Masuk</h2>
          <p className="mb-6 text-gray-600">Masuk dengan username dan password untuk mengakses dashboard</p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900 placeholder-gray-500 mb-2 shadow-sm"
                placeholder="Email address"
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-green-900 rounded-md focus:outline-none focus:ring-2 focus:ring-green-700 text-gray-900 placeholder-gray-500 shadow-sm"
                placeholder="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.336-3.234.938-4.675m1.675-2.325A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.336 3.234-.938 4.675m-1.675 2.325A9.956 9.956 0 0112 21c-2.21 0-4.267-.72-5.938-1.95M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm7.938-2.675A9.956 9.956 0 0021 12c0 5.523-4.477 10-10 10a9.956 9.956 0 01-7.938-3.325M3.062 7.325A9.956 9.956 0 013 12c0 5.523 4.477 10 10 10a9.956 9.956 0 007.938-3.325" /></svg>
                )}
              </button>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-md text-white bg-green-900 hover:bg-green-800 font-medium text-base shadow-md focus:outline-none focus:ring-2 focus:ring-green-700 disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Right Side: Image */}
      <div className="hidden md:block md:w-1/2 h-screen">
        <img
          src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80"
          alt="Office background"
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
};

export default Login;
