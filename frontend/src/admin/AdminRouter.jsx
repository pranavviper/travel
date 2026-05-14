import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './AdminContext';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';

const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const AdminUsers         = lazy(() => import('./pages/AdminUsers'));
const AdminTrips         = lazy(() => import('./pages/AdminTrips'));
const AdminPlaces        = lazy(() => import('./pages/AdminPlaces'));
const AdminFuelPrices    = lazy(() => import('./pages/AdminFuelPrices'));
const AdminTolls         = lazy(() => import('./pages/AdminTolls'));
const AdminAI            = lazy(() => import('./pages/AdminAI'));
const AdminReports       = lazy(() => import('./pages/AdminReports'));
const AdminAnnouncements = lazy(() => import('./pages/AdminAnnouncements'));
const AdminAnalytics     = lazy(() => import('./pages/AdminAnalytics'));
const AdminLogs          = lazy(() => import('./pages/AdminLogs'));
const AdminSettings      = lazy(() => import('./pages/AdminSettings'));

function ProtectedAdminRoute({ children, roles }) {
  const { adminToken, adminUser } = useAdmin();
  if (!adminToken) return <Navigate to="/admin" replace />;
  
  if (roles && !roles.includes(adminUser?.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <AdminLayout>
      <Suspense fallback={<div className="admin-loading"><div className="spinner" /></div>}>
        {children}
      </Suspense>
    </AdminLayout>
  );
}

function AdminLoginGate() {
  const { adminToken } = useAdmin();
  if (adminToken) return <Navigate to="/admin/dashboard" replace />;
  return <AdminLogin />;
}

function AdminRoutes() {
  const STAFF = ['superadmin', 'admin', 'moderator'];
  const ADMIN_PLUS = ['superadmin', 'admin'];
  const SUPER_ONLY = ['superadmin'];

  return (
    <Routes>
      <Route path="/"              element={<AdminLoginGate />} />
      <Route path="/dashboard"     element={<ProtectedAdminRoute roles={STAFF}><AdminDashboard /></ProtectedAdminRoute>} />
      <Route path="/users"         element={<ProtectedAdminRoute roles={ADMIN_PLUS}><AdminUsers /></ProtectedAdminRoute>} />
      <Route path="/trips"         element={<ProtectedAdminRoute roles={STAFF}><AdminTrips /></ProtectedAdminRoute>} />
      <Route path="/places"        element={<ProtectedAdminRoute roles={STAFF}><AdminPlaces /></ProtectedAdminRoute>} />
      <Route path="/fuel-prices"   element={<ProtectedAdminRoute roles={ADMIN_PLUS}><AdminFuelPrices /></ProtectedAdminRoute>} />
      <Route path="/tolls"         element={<ProtectedAdminRoute roles={ADMIN_PLUS}><AdminTolls /></ProtectedAdminRoute>} />
      <Route path="/ai"            element={<ProtectedAdminRoute roles={ADMIN_PLUS}><AdminAI /></ProtectedAdminRoute>} />
      <Route path="/reports"       element={<ProtectedAdminRoute roles={STAFF}><AdminReports /></ProtectedAdminRoute>} />
      <Route path="/announcements" element={<ProtectedAdminRoute roles={ADMIN_PLUS}><AdminAnnouncements /></ProtectedAdminRoute>} />
      <Route path="/analytics"     element={<ProtectedAdminRoute roles={SUPER_ONLY}><AdminAnalytics /></ProtectedAdminRoute>} />
      <Route path="/logs"          element={<ProtectedAdminRoute roles={SUPER_ONLY}><AdminLogs /></ProtectedAdminRoute>} />
      <Route path="/settings"      element={<ProtectedAdminRoute roles={SUPER_ONLY}><AdminSettings /></ProtectedAdminRoute>} />
    </Routes>
  );
}

export default function AdminRouter() {
  return (
    <AdminProvider>
      <AdminRoutes />
    </AdminProvider>
  );
}
