import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Search,
  Eye,
  EyeOff,
  UtensilsCrossed,
  FolderOpen,
  Calendar,
  Mail,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import {
  getAllRestaurantStats,
  toggleRestaurantStatus,
  RestaurantStats,
  isSuperAdmin
} from '@/lib/firestore';
import { format } from 'date-fns';

export const RestaurantManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<RestaurantStats[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAuthorized, setIsAuthorized] = useState(false);

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

        // Load restaurant data
        const restaurantData = await getAllRestaurantStats();
        setRestaurants(restaurantData);
        setFilteredRestaurants(restaurantData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load restaurant data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [user, toast]);

  // Filter restaurants based on search and status
  useEffect(() => {
    let filtered = restaurants;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(restaurant =>
        restaurant.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(restaurant =>
        statusFilter === 'active' ? restaurant.isActive : !restaurant.isActive
      );
    }

    setFilteredRestaurants(filtered);
  }, [restaurants, searchTerm, statusFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleRestaurantStatus(userId);
      
      // Update local state
      setRestaurants(prev => prev.map(restaurant =>
        restaurant.userId === userId
          ? { ...restaurant, isActive: !currentStatus }
          : restaurant
      ));

      toast({
        title: "Status updated",
        description: `Restaurant has been ${currentStatus ? 'deactivated' : 'activated'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update restaurant status.",
        variant: "destructive",
      });
    }
  };

  const handleViewRestaurant = (userId: string) => {
    navigate(`/super-admin/restaurants/${userId}`);
  };

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="admin-card p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access restaurant management.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedRestaurants,
    goToPage,
    itemsPerPage,
    totalItems
  } = usePagination({
    data: filteredRestaurants,
    itemsPerPage: 10
  });

  const activeCount = restaurants.filter(r => r.isActive).length;
  const inactiveCount = restaurants.length - activeCount;

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Restaurant Management
          </h1>
          <p className="text-muted-foreground mt-2 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            Monitor and manage all registered restaurants
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{restaurants.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Restaurants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-success" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-success">{activeCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <EyeOff className="w-5 h-5 text-muted-foreground" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{inactiveCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Restaurants</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-input pl-10"
                />
              </div>
            </div>
            
            <div className="md:w-48">
              <Label htmlFor="status">Status Filter</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Restaurants</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant List */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle>All Restaurants</CardTitle>
          <CardDescription>
            {filteredRestaurants.length} of {restaurants.length} restaurants
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
            ) : filteredRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No restaurants found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No restaurants have registered yet'
                  }
                </p>
              </div>
            ) : (
              paginatedRestaurants.map((restaurant) => (
                <div
                  key={restaurant.userId}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors gap-4"
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
                      <div className="flex items-center space-x-1 mb-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground truncate">{restaurant.email}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <FolderOpen className="w-3 h-3" />
                          <span>{restaurant.totalCategories} categories</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <UtensilsCrossed className="w-3 h-3" />
                          <span>{restaurant.totalMenuItems} items</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-3 h-3" />
                          <span>{restaurant.activeMenuItems} active</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {format(restaurant.createdAt.toDate(), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`status-${restaurant.userId}`} className="text-sm">
                        {restaurant.isActive ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id={`status-${restaurant.userId}`}
                        checked={restaurant.isActive}
                        onCheckedChange={() => handleToggleStatus(restaurant.userId, restaurant.isActive)}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRestaurant(restaurant.userId)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredRestaurants.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};