import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';
import { isSuperAdmin } from '@/lib/firestore';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (!user) {
        setIsAuthorized(false);
        setCheckingAuth(false);
        return;
      }

      try {
        const isSuperAdminUser = await isSuperAdmin(user.uid);
        setIsAuthorized(isSuperAdminUser);
        
        // If user is not super admin, redirect to dashboard immediately
        if (!isSuperAdminUser) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsAuthorized(false);
        // On error, redirect to dashboard
        navigate('/dashboard', { replace: true });
        return;
      } finally {
        setCheckingAuth(false);
      }
    };

    if (!loading) {
      checkSuperAdminStatus();
    }
  }, [user, loading, navigate]);

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="admin-card p-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-75"></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse delay-150"></div>
          </div>
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="admin-card p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have Super Admin permissions to access this area.
          </p>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};