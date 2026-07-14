import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * ProtectedRoute component that guards routes based on authentication and role.
 *
 * @param allowedRoles - Array of roles that can access this route.
 *                       If empty/undefined, any authenticated user can access.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, isLoading, fetchUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // On mount, try to fetch user from server if not already loaded
    if (!isAuthenticated && isLoading) {
      fetchUser();
    }
  }, [isAuthenticated, isLoading, fetchUser]);

  // Still checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.1rem',
        color: '#64748b',
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid #e2e8f0',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Đang kiểm tra xác thực...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      // User doesn't have required role - redirect to their default dashboard
      const rolePathMap = {
        ADMIN: '/admin/dashboard',
        DENTIST: '/dentist/dashboard',
        EMPLOYEE: '/employee/dashboard',
        PATIENT: '/patient/dashboard',
      };
      const redirectPath = rolePathMap[user.role] || '/';
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Authorized - render child routes
  return <Outlet />;
}
