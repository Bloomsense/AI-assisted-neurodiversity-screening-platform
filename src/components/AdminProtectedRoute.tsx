import { Navigate, useLocation } from 'react-router-dom';
import { isAdminAuthenticated } from '../utils/adminAuth';

export default function AdminProtectedRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname, defaultTab: 'admin' }}
      />
    );
  }

  return children;
}
