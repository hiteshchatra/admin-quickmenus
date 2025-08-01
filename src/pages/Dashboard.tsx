import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderOpen,
  UtensilsCrossed,
  Eye,
  TrendingUp,
  Plus,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  getCategories,
  getMenuItems,
  getUserProfile,
  Category,
  MenuItem,
  UserProfile
} from '@/lib/firestore';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [profileData, categoriesData, menuItemsData] = await Promise.all([
          getUserProfile(user.uid),
          getCategories(user.uid),
          getMenuItems(user.uid)
        ]);

        setUserProfile(profileData);
        setCategories(categoriesData);
        setMenuItems(menuItemsData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, toast]);

  const stats = {
    totalCategories: categories.length,
    totalItems: menuItems.length,
    activeItems: menuItems.filter(item => item.available).length,
    totalViews: 0 // This would come from analytics in a real app
  };

  return (
    <div className="space-y-8 animate-slide-in-up">
      {/* Welcome Section */}
      <div className="admin-card p-8 admin-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50 pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="animate-slide-in-up">
            {loading ? (
              <>
                <Skeleton className="h-9 w-64 mb-2 bg-white/20" />
                <Skeleton className="h-6 w-80 bg-white/20" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-2 animate-slide-in-up">
                  Welcome back{userProfile?.restaurantName ? `, ${userProfile.restaurantName}!` : '!'}
                </h1>
                <p className="text-white/90 text-lg animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                  Manage your restaurant menu and track performance
                </p>
              </>
            )}
          </div>
          <div className="hidden md:block animate-float">
            <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-[var(--shadow-soft)]">
              <BarChart3 className="w-12 h-12 text-white animate-glow" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Categories
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1 admin-shimmer" />
            ) : (
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">{stats.totalCategories}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Menu categories
            </p>
          </CardContent>
        </Card>

        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Menu Items
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1 admin-shimmer" />
            ) : (
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">{stats.totalItems}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Total menu items
            </p>
          </CardContent>
        </Card>

        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-success transition-colors">
              Active Items
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1 admin-shimmer" />
            ) : (
              <div className="text-2xl font-bold text-success group-hover:text-success/80 transition-colors">{stats.activeItems}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Available to customers
            </p>
          </CardContent>
        </Card>

        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Total Views
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Eye className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16 mb-1 admin-shimmer" />
            ) : (
              <div className="text-2xl font-bold group-hover:text-primary transition-colors">{stats.totalViews}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Menu page views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="admin-card group animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
          <CardHeader className="relative">
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FolderOpen className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="flex items-center space-x-2 group-hover:text-primary transition-colors">
              <span>Manage Categories</span>
            </CardTitle>
            <CardDescription className="mt-2">
              Organize your menu into categories for better customer experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Current categories: <span className="font-semibold text-foreground">{stats.totalCategories}</span>
              </div>
              <div className="flex space-x-3">
                <Button asChild className="flex-1 admin-button admin-gradient">
                  <Link to="/categories">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Link>
                </Button>
                <Button variant="outline" asChild className="admin-button hover:border-primary">
                  <Link to="/categories">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="admin-card group animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader className="relative">
            <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="flex items-center space-x-2 group-hover:text-primary transition-colors">
              <span>Manage Menu Items</span>
            </CardTitle>
            <CardDescription className="mt-2">
              Add, edit, and manage all your delicious menu items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Current items: <span className="font-semibold text-foreground">{stats.totalItems}</span> (<span className="font-semibold text-success">{stats.activeItems} active</span>)
              </div>
              <div className="flex space-x-3">
                <Button asChild className="flex-1 admin-button admin-gradient">
                  <Link to="/menu-items">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Link>
                </Button>
                <Button variant="outline" asChild className="admin-button hover:border-primary">
                  <Link to="/menu-items">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Items */}
      {!loading && menuItems.length > 0 && (
        <Card className="admin-card">
          <CardHeader>
            <CardTitle>Recent Menu Items</CardTitle>
            <CardDescription>
              Your latest menu additions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {menuItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${item.available ? 'bg-success' : 'bg-muted-foreground'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.categoryName} • ${item.price.toFixed(2)} • {item.available ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};