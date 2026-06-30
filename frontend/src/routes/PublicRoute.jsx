import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';

export const PublicRoute = () => {
  const { isSignedIn, loading, user } = useAuthContext();

  if (loading) return null;
  if (isSignedIn) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return <Outlet />;
};
