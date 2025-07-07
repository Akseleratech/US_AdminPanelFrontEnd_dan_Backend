import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// General Components
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import LoadingSpinner from './components/common/LoadingSpinner.jsx';

// Page Components (Lazy Loaded)
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard.jsx'));
const Orders = React.lazy(() => import('./components/orders/Orders.jsx'));
const Spaces = React.lazy(() => import('./components/spaces/Spaces.jsx'));
const Buildings = React.lazy(() => import('./components/buildings/Buildings.jsx'));
const Cities = React.lazy(() => import('./components/cities/Cities.jsx'));
const Layanan = React.lazy(() => import('./components/layanan/Layanan.jsx'));
const Amenities = React.lazy(() => import('./components/amenities/Amenities.jsx'));
const Promo = React.lazy(() => import('./components/promo/Promo.jsx'));
const Article = React.lazy(() => import('./components/article/Article.jsx'));
const Customers = React.lazy(() => import('./components/customers/Customers.jsx'));
const Finance = React.lazy(() => import('./components/finance/Finance.jsx'));
const Settings = React.lazy(() => import('./components/settings/Settings.jsx'));
const Login = React.lazy(() => import('./components/auth/Login.jsx'));

// Contexts
import { GlobalRefreshProvider } from './contexts/GlobalRefreshContext.jsx';
import { AuthProvider, useAuth } from './components/auth/AuthContext.jsx';

const Layout = ({ children }) => (
  <div className="flex h-screen bg-gray-100">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
        {children}
      </main>
    </div>
  </div>
);

const PrivateRoutes = () => {
  const { user, loading, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have admin access to this system.
            </p>
            <button
              onClick={async () => {
                try {
                  await logout();
                } catch (err) {
                  console.error('Logout error:', err);
                } finally {
                  navigate('/login', { replace: true });
                }
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/spaces" element={<Spaces />} />
          <Route path="/buildings" element={<Buildings />} />
          <Route path="/cities" element={<Cities />} />
          <Route path="/layanan" element={<Layanan />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/promo" element={<Promo />} />
          <Route path="/articles" element={<Article />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/finance/*" element={<Finance />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
              </Suspense>
      </Layout>
    );
};

const App = () => {
  return (
    <GlobalRefreshProvider>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<PrivateRoutes />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </GlobalRefreshProvider>
  );
};

export default App; 