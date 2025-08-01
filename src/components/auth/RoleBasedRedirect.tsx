import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getUserProfile } from '@/lib/firestore';
import { LoginForm } from './LoginForm';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

export const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      // If still loading, don't do anything
      if (loading) return;

      // If no user, show login form (don't redirect)
      if (!user) return;

      try {
        const userProfile = await getUserProfile(user.uid);
        
        if (userProfile && userProfile.role === 'super_admin') {
          // Redirect super admin to super admin dashboard
          navigate('/super-admin/dashboard', { replace: true });
        } else {
          // Redirect normal users to regular dashboard
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Error checking user role for redirect:', error);
        // On error, default to regular dashboard
        navigate('/dashboard', { replace: true });
      }
    };

    checkUserRoleAndRedirect();
  }, [user, loading, navigate]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse delay-150"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoginForm />
      </div>
    );
  }

  // If user exists, the useEffect will handle the redirect
  // Show loading while redirect is happening
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse delay-150"></div>
        </div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};