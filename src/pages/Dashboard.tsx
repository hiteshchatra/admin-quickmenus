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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-light to-primary/80 p-8 text-white shadow-2xl animate-slide-in-up">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-float"></div>
            <div className="absolute top-1/2 -left-8 w-16 h-16 bg-white/5 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-4 right-1/3 w-12 h-12 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex-1">
              {loading ? (
                <>
                  <Skeleton className="h-12 w-80 mb-3 bg-white/20 rounded-xl" />
                  <Skeleton className="h-6 w-96 bg-white/20 rounded-lg" />
                </>
              ) : (
                <>
                  <h1 className="text-4xl md:text-5xl font-bold mb-3 animate-slide-in-up bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                    Welcome back{userProfile?.restaurantName ? `, ${userProfile.restaurantName}!` : '!'}
                  </h1>
                  <p className="text-white/90 text-xl animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
                    Manage your restaurant menu and track performance
                  </p>
                </>
              )}
            </div>
            <div className="hidden lg:block animate-float">
              <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-2xl">
                <BarChart3 className="w-16 h-16 text-white animate-glow" />
              </div>
            </div>
          </div>
        </div>

      {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Categories Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200 transition-colors">
                Categories
              </CardTitle>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {loading ? (
                <Skeleton className="h-10 w-20 mb-2 bg-blue-200/50 rounded-lg" />
              ) : (
                <div className="text-3xl font-bold text-blue-800 dark:text-blue-200 group-hover:scale-105 transition-transform duration-300">{stats.totalCategories}</div>
              )}
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Menu categories
              </p>
            </CardContent>
          </Card>

          {/* Menu Items Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-200 transition-colors">
                Menu Items
              </CardTitle>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 group-hover:scale-110">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {loading ? (
                <Skeleton className="h-10 w-20 mb-2 bg-purple-200/50 rounded-lg" />
              ) : (
                <div className="text-3xl font-bold text-purple-800 dark:text-purple-200 group-hover:scale-105 transition-transform duration-300">{stats.totalItems}</div>
              )}
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Total menu items
              </p>
            </CardContent>
          </Card>

          {/* Active Items Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200 dark:border-emerald-800 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 group-hover:text-emerald-800 dark:group-hover:text-emerald-200 transition-colors">
                Active Items
              </CardTitle>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              {loading ? (
                <Skeleton className="h-10 w-20 mb-2 bg-emerald-200/50 rounded-lg" />
              ) : (
                <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200 group-hover:scale-105 transition-transform duration-300">{stats.activeItems}</div>
              )}
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                Available to customers
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories Management */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
            <CardHeader className="relative z-10">
              <div className="absolute top-4 right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300 group-hover:scale-110">
                <FolderOpen className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-200 group-hover:text-orange-900 dark:group-hover:text-orange-100 transition-colors">
                Manage Categories
              </CardTitle>
              <CardDescription className="mt-2 text-orange-600 dark:text-orange-400">
                Organize your menu into categories for better customer experience
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="p-3 bg-orange-100/50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    Current categories: <span className="font-bold text-orange-800 dark:text-orange-200 text-lg">{stats.totalCategories}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button asChild className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-orange-500/25 transition-all duration-300">
                    <Link to="/categories">
                      <Eye className="w-4 h-4 mr-2" />
                      View All
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-400 dark:hover:border-orange-600 transition-all duration-300">
                    <Link to="/categories">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Management */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/20 dark:to-rose-900/10 border-rose-200 dark:border-rose-800 hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent"></div>
            <CardHeader className="relative z-10">
              <div className="absolute top-4 right-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg group-hover:shadow-rose-500/25 transition-all duration-300 group-hover:scale-110">
                <UtensilsCrossed className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-rose-800 dark:text-rose-200 group-hover:text-rose-900 dark:group-hover:text-rose-100 transition-colors">
                Manage Menu Items
              </CardTitle>
              <CardDescription className="mt-2 text-rose-600 dark:text-rose-400">
                Add, edit, and manage all your delicious menu items
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div className="p-3 bg-rose-100/50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                  <div className="text-sm text-rose-700 dark:text-rose-300">
                    Current items: <span className="font-bold text-rose-800 dark:text-rose-200 text-lg">{stats.totalItems}</span>
                  </div>
                  <div className="text-sm text-rose-600 dark:text-rose-400 mt-1">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.activeItems} active</span> • <span className="font-semibold text-gray-600 dark:text-gray-400">{stats.totalItems - stats.activeItems} inactive</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button asChild className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg hover:shadow-rose-500/25 transition-all duration-300">
                    <Link to="/menu-items">
                      <Eye className="w-4 h-4 mr-2" />
                      View All
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-400 dark:hover:border-rose-600 transition-all duration-300">
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
          <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/10 border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300 animate-slide-in-up" style={{ animationDelay: '0.7s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-white" />
                </div>
                <span>Recent Menu Items</span>
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Your latest menu additions
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {menuItems.slice(0, 3).map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-white to-slate-50/50 dark:from-slate-900/50 dark:to-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-300 group" style={{ animationDelay: `${0.8 + index * 0.1}s` }}>
                    <div className={`w-3 h-3 rounded-full ${item.available ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' : 'bg-slate-400'} animate-pulse`}></div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">{item.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">{item.categoryName}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">${item.price.toFixed(2)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${item.available ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                          {item.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    // </div>
  );
};