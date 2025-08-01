import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  UtensilsCrossed,
  TrendingUp,
  Eye,
  EyeOff,
  BarChart3,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  getPlatformStats,
  getAllRestaurantStats,
  RestaurantStats,
  isSuperAdmin
} from '@/lib/firestore';
import { format } from 'date-fns';
import { getAllUsers } from '@/lib/firestore';


export const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [restaurantStats, setRestaurantStats] = useState<RestaurantStats[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  useEffect(() => {
    async function fetchAndLogUsers() {
      try {
        const users = await getAllUsers();
        console.log("All Firestore users:", users);
      } catch (e) {
        console.error("Error fetching users:", e);
      }
    }
    fetchAndLogUsers();
  }, []);
  useEffect(() => {
    if (!user) return;

    const checkAuthAndLoadData = async () => {
      try {
        setLoading(true);
        
        // Check if user is super admin
        const isSuperAdminUser = await isSuperAdmin(user.uid);
        if (!isSuperAdminUser) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }
        
        setIsAuthorized(true);

        // Load platform data
        const [platformData, restaurantData] = await Promise.all([
          getPlatformStats(),
          getAllRestaurantStats()
        ]);

        setPlatformStats(platformData);
        setRestaurantStats(restaurantData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load super admin dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [user, toast]);

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="admin-card p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the Super Admin dashboard.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-in-up">
      {/* Header */}
      <div className="admin-card p-8 admin-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="animate-slide-in-up">
            <h1 className="text-3xl font-bold mb-2 animate-slide-in-up">
              Super Admin Dashboard
            </h1>
            <p className="text-white/90 text-lg animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Manage all restaurants and monitor platform performance
            </p>
          </div>
          <div className="hidden md:block animate-float">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-[var(--shadow-soft)]">
              <Shield className="w-12 h-12 text-white animate-glow" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Total Restaurants
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1 admin-shimmer" />
            ) : (
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">
                {platformStats?.totalRestaurants || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Registered restaurants
            </p>
          </CardContent>
        </Card>

        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-success transition-colors">
              Active Restaurants
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
              <Activity className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1 admin-shimmer" />
            ) : (
              <div className="text-2xl font-bold text-success group-hover:text-success/80 transition-colors">
                {platformStats?.activeRestaurants || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Total Menu Items
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1 admin-shimmer" />
            ) : (
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">
                {platformStats?.totalMenuItems || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Across all restaurants
            </p>
          </CardContent>
        </Card>

        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Avg Items/Restaurant
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1 admin-shimmer" />
            ) : (
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">
                {platformStats?.averageItemsPerRestaurant || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Average menu size
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Restaurant Overview */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Restaurant Overview</span>
          </CardTitle>
          <CardDescription>
            Monitor all registered restaurants and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))
            ) : restaurantStats.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No restaurants registered</h3>
                <p className="text-muted-foreground">
                  Restaurants will appear here once they register on the platform
                </p>
              </div>
            ) : (
              restaurantStats.map((restaurant) => (
                <div
                  key={restaurant.userId}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{restaurant.restaurantName}</h3>
                        <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{restaurant.email}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{restaurant.totalCategories} categories</span>
                        <span>{restaurant.totalMenuItems} items</span>
                        <span>{restaurant.activeMenuItems} active</span>
                        <span>Joined {format(restaurant.createdAt.toDate(), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/super-admin/restaurants/${restaurant.userId}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="admin-card group animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader className="relative">
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="flex items-center space-x-2 group-hover:text-primary transition-colors">
              <span>Restaurant Management</span>
            </CardTitle>
            <CardDescription className="mt-2">
              View, manage, and monitor all registered restaurants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total restaurants: <span className="font-semibold text-foreground">{platformStats?.totalRestaurants || 0}</span>
              </div>
              <Button 
                className="w-full admin-button admin-gradient"
                onClick={() => navigate('/super-admin/restaurants')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Manage Restaurants
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card group animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader className="relative">
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="flex items-center space-x-2 group-hover:text-primary transition-colors">
              <span>User Management</span>
            </CardTitle>
            <CardDescription className="mt-2">
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Active users: <span className="font-semibold text-foreground">{platformStats?.activeRestaurants || 0}</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full admin-button hover:border-primary"
                onClick={() => navigate('/super-admin/users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};