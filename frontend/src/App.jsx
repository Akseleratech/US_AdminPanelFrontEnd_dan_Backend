import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
const Customers = React.lazy(() => import('./components/customers/Customers.jsx'));
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
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return user ? (
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
          <Route path="/customers" element={<Customers />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  ) : (
    <Navigate to="/login" replace />
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