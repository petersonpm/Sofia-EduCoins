import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SofiaDashboard from './pages/SofiaDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AvatarShop from './pages/AvatarShop';

// Protect child-only routes
function ChildRoute({ children }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">
        Carregando aventura...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'CHILD') {
    return <Navigate to="/parent" replace />;
  }

  return children;
}

// Protect parent-only routes
function ParentRoute({ children }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">
        Carregando painel familiar...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'PARENT') {
    return <Navigate to="/child" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Child Private Routes */}
          <Route 
            path="/child" 
            element={
              <ChildRoute>
                <SofiaDashboard />
              </ChildRoute>
            } 
          />
          <Route 
            path="/shop" 
            element={
              <ChildRoute>
                <AvatarShop />
              </ChildRoute>
            } 
          />

          {/* Parent Private Route */}
          <Route 
            path="/parent" 
            element={
              <ParentRoute>
                <ParentDashboard />
              </ParentRoute>
            } 
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
