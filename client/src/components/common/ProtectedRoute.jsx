// Redirects unauthenticated users to /login.
// Redirects authenticated users who haven't done onboarding to /onboarding.
// Shows a loading state while auth is being verified.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // While checking existing token, show a loader
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: '10px', color: 'var(--text-secondary)'
      }}>
        <Loader size={20} className="spin" />
        <span>Loading...</span>
      </div>
    );
  }

  // Not logged in → go to login, remember where they were trying to go
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but hasn't done onboarding → go to onboarding
  // Allow /onboarding itself to avoid infinite redirect
  if (!user?.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

export default ProtectedRoute;
