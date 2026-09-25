import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps routes that require the user to be authenticated. If the session
// restore check is still running, we show a loading state instead of
// redirecting prematurely.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <p className="page-loading">Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
