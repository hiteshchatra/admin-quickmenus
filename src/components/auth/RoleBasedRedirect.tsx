import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { getUserProfile } from '@/lib/firestore';

interface RoleBasedRedirectProps {
  children: React.ReactNode;
}

export const RoleBasedRedirect: React.FC<RoleBasedRedirectProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      if (!user || loading) return;

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="admin-card p-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-75"></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-150"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};