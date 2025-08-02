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
    <div className="space-y-6 lg:space-y-8">
      {/* Welcome Section */}
      <div className="bg-blue-100 rounded-xl lg:rounded-2xl p-4 lg:p-8 border border-blue-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
            {loading ? (
              <>
                <Skeleton className="h-8 lg:h-12 w-full max-w-80 mb-2 lg:mb-3 bg-blue-200 rounded-xl" />
                <Skeleton className="h-4 lg:h-6 w-full max-w-96 bg-blue-200 rounded-lg" />
              </>
            ) : (
              <>
                <h1 className="text-2xl lg:text-4xl xl:text-5xl font-bold mb-2 lg:mb-3 text-blue-800 leading-tight">
                  Welcome back{userProfile?.restaurantName ? `, ${userProfile.restaurantName}!` : '!'}
                </h1>
                <p className="text-blue-600 text-base lg:text-xl">
                  Manage your restaurant menu and track performance
                </p>
              </>
            )}
          </div>
          <div className="hidden lg:block">
            <div className="w-24 lg:w-32 h-24 lg:h-32 bg-blue-200 rounded-xl lg:rounded-2xl flex items-center justify-center border border-blue-300">
              <BarChart3 className="w-12 lg:w-16 h-12 lg:h-16 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Categories Card */}
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categories
            </CardTitle>
            <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-yellow-100 flex items-center justify-center border border-yellow-200">
              <FolderOpen className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Skeleton className="h-8 lg:h-10 w-16 lg:w-20 mb-1 lg:mb-2 bg-gray-200 rounded-lg" />
            ) : (
              <div className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.totalCategories}</div>
            )}
            <p className="text-xs lg:text-sm text-gray-500 mt-1">
              Menu categories
            </p>
          </CardContent>
        </Card>

        {/* Menu Items Card */}
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Menu Items
            </CardTitle>
            <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-blue-100 flex items-center justify-center border border-blue-200">
              <UtensilsCrossed className="w-4 h-4 lg:w-6 lg:h-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Skeleton className="h-8 lg:h-10 w-16 lg:w-20 mb-1 lg:mb-2 bg-gray-200 rounded-lg" />
            ) : (
              <div className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.totalItems}</div>
            )}
            <p className="text-xs lg:text-sm text-gray-500 mt-1">
              Total menu items
            </p>
          </CardContent>
        </Card>

        {/* Active Items Card */}
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 lg:pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Items
            </CardTitle>
            <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-yellow-100 flex items-center justify-center border border-yellow-200">
              <TrendingUp className="w-4 h-4 lg:w-6 lg:h-6 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <Skeleton className="h-8 lg:h-10 w-16 lg:w-20 mb-1 lg:mb-2 bg-gray-200 rounded-lg" />
            ) : (
              <div className="text-2xl lg:text-3xl font-bold text-gray-800">{stats.activeItems}</div>
            )}
            <p className="text-xs lg:text-sm text-gray-500 mt-1">
              Available to customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Categories Management */}
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg lg:text-xl font-bold text-gray-800">
                  Manage Categories
                </CardTitle>
                <CardDescription className="mt-2 text-gray-600 text-sm lg:text-base">
                  Organize your menu into categories for better customer experience
                </CardDescription>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-yellow-100 flex items-center justify-center border border-yellow-200 flex-shrink-0">
                <FolderOpen className="w-6 h-6 lg:w-7 lg:h-7 text-yellow-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-gray-700">
                  Current categories: <span className="font-bold text-gray-800 text-base lg:text-lg">{stats.totalCategories}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  <Link to="/categories">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50">
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
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg lg:text-xl font-bold text-gray-800">
                  Manage Menu Items
                </CardTitle>
                <CardDescription className="mt-2 text-gray-600 text-sm lg:text-base">
                  Add, edit, and manage all your delicious menu items
                </CardDescription>
              </div>
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-blue-100 flex items-center justify-center border border-blue-200 flex-shrink-0">
                <UtensilsCrossed className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-700">
                  Current items: <span className="font-bold text-gray-800 text-base lg:text-lg">{stats.totalItems}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold text-yellow-600">{stats.activeItems} active</span> • <span className="font-semibold text-gray-500">{stats.totalItems - stats.activeItems} inactive</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                  <Link to="/menu-items">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50">
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
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl font-bold text-gray-800 flex items-center space-x-2">
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                <UtensilsCrossed className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
              </div>
              <span>Recent Menu Items</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your latest menu additions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {menuItems.slice(0, 3).map((item, index) => (
                <div key={item.id} className="flex items-center space-x-4 p-3 lg:p-4 bg-gray-50 rounded-lg lg:rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors duration-300">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${item.available ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-white text-gray-700 rounded-full border border-gray-200">{item.categoryName}</span>
                      <span className="text-xs font-bold text-gray-800">${item.price.toFixed(2)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${item.available ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-gray-200 text-gray-600 border border-gray-300'}`}>
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
  );
};