import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import RoutePlanner from './pages/RoutePlanner';
import Meet from './pages/Meet';
import Mind from './pages/Mind';
import Auth from './pages/Auth';
import MyTrips from './pages/MyTrips';
import AdminRouter from './admin/AdminRouter';

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#fff', border: '1px solid #ffffff20' } }} />
      <Routes>
        {/* Admin Panel — separate layout, no main Sidebar */}
        <Route path="/admin/*" element={<AdminRouter />} />

        {/* Main App */}
        <Route path="/*" element={
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/route" element={<RoutePlanner />} />
                <Route path="/meet" element={<Meet />} />
                <Route path="/mind" element={<Mind />} />
                <Route path="/trips" element={<MyTrips />} />
                <Route path="/auth" element={<Auth />} />
              </Routes>
            </main>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
