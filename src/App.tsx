import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProfileProvider } from './contexts/ProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Dashboard from './components/dashboard/Dashboard';
import CreateRoadmapPage from './pages/CreateRoadmapPage';
import RoadmapViewerPage from './pages/RoadmapViewerPage';
import HomePage from './pages/HomePage';
import MockInterview from './components/interview/MockInterview';
import ProfilePage from './pages/ProfilePage';

// App routes component
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes - HomePage accessible to all */}
        <Route 
          path="/" 
          element={<HomePage />} 
        />
        <Route 
          path="/home" 
          element={<HomePage />} 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <SignupForm />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreateRoadmapPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/roadmap" 
          element={
            <ProtectedRoute>
              <RoadmapViewerPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mock-interview" 
          element={
            <ProtectedRoute>
              <MockInterview />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ProfileProvider>
            <AppRoutes />
          </ProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;