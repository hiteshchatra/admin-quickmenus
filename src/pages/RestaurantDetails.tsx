import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  ArrowLeft,
  Mail,
  Calendar,
  FolderOpen,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Activity,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  getUserProfile,
  getCategories,
  getMenuItems,
  UserProfile,
  Category,
  MenuItem,
  isSuperAdmin
} from '@/lib/firestore';
import { format } from 'date-fns';

export const RestaurantDetails: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!user || !userId) return;

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
        const [restaurantData, categoriesData, menuItemsData] = await Promise.all([
          getUserProfile(userId),
          getCategories(userId),
          getMenuItems(userId)
        ]);

        if (!restaurantData) {
          toast({
            title: "Restaurant not found",
            description: "The requested restaurant could not be found.",
            variant: "destructive",
          });
          navigate('/super-admin/restaurants');
          return;
        }

        setRestaurant(restaurantData);
        setCategories(categoriesData);
        setMenuItems(menuItemsData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load restaurant details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [user, userId, toast, navigate]);

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="admin-card p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to view restaurant details.
          </p>
          <Button variant="outline" onClick={() => navigate('/super-admin/restaurants')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const activeMenuItems = menuItems.filter(item => item.available);
  const visibleCategories = categories.filter(cat => cat.visible);

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/super-admin/restaurants')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Restaurants
        </Button>
        <div className="flex-1">
          {loading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              {restaurant?.restaurantName}
            </h1>
          )}
        </div>
      </div>

      {/* Restaurant Info Card */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Restaurant Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : restaurant ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Restaurant Name</label>
                  <p className="text-lg font-semibold">{restaurant.restaurantName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p>{restaurant.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={restaurant.role === 'super_admin' ? "default" : "secondary"}>
                      {restaurant.role === 'super_admin' ? 'Super Admin' : 'Restaurant Owner'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                      {restaurant.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p>{format(restaurant.createdAt.toDate(), 'MMMM dd, yyyy')}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <p>{format(restaurant.updatedAt.toDate(), 'MMMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{categories.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-success" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-success">{visibleCategories.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Visible Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{menuItems.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Menu Items</p>
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
                  <p className="text-2xl font-bold text-success">{activeMenuItems.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Active Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="menu-items">Menu Items</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                All categories created by this restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))
                ) : categories.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No categories</h3>
                    <p className="text-muted-foreground">
                      This restaurant hasn't created any categories yet
                    </p>
                  </div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FolderOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {format(category.createdAt.toDate(), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={category.visible ? "default" : "secondary"}>
                          {category.visible ? "Visible" : "Hidden"}
                        </Badge>
                        <Badge variant="outline">
                          Order: {category.order}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="menu-items">
          <Card className="admin-card">
            <CardHeader>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>
                All menu items created by this restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  ))
                ) : menuItems.length === 0 ? (
                  <div className="text-center py-12">
                    <UtensilsCrossed className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No menu items</h3>
                    <p className="text-muted-foreground">
                      This restaurant hasn't created any menu items yet
                    </p>
                  </div>
                ) : (
                  menuItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <UtensilsCrossed className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>Category: {item.categoryName}</span>
                            <span>Created {format(item.createdAt.toDate(), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-medium">{item.price.toFixed(2)}</span>
                        </div>
                        <Badge variant={item.available ? "default" : "secondary"}>
                          {item.available ? "Available" : "Unavailable"}
                        </Badge>
                        {item.featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};