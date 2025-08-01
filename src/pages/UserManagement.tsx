import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Users,
  Search,
  Shield,
  User,
  Mail,
  Calendar,
  Edit2,
  AlertTriangle,
  Crown,
  Building2
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import {
  getAllUsers,
  updateUserRole,
  toggleRestaurantStatus,
  UserProfile,
  isSuperAdmin
} from '@/lib/firestore';
import { format } from 'date-fns';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'restaurant_owner' | 'super_admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

        // Load user data
        const userData = await getAllUsers();
        setUsers(userData);
        setFilteredUsers(userData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load user data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [user, toast]);

  // Filter users based on search, role, and status
  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.restaurantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user =>
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleRestaurantStatus(userId);
      
      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, isActive: !currentStatus }
          : user
      ));

      toast({
        title: "Status updated",
        description: `User has been ${currentStatus ? 'deactivated' : 'activated'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'restaurant_owner' | 'super_admin') => {
    try {
      await updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, role: newRole }
          : user
      ));

      toast({
        title: "Role updated",
        description: `User role has been changed to ${newRole.replace('_', ' ')}.`,
      });
      
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password reset sent",
        description: `Password reset email has been sent to ${email}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  if (!isAuthorized && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="admin-card p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access user management.
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
    paginatedData: paginatedUsers,
    goToPage,
    itemsPerPage,
    totalItems
  } = usePagination({
    data: filteredUsers,
    itemsPerPage: 10
  });

  const superAdminCount = users.filter(u => u.role === 'super_admin').length;
  const restaurantOwnerCount = users.filter(u => u.role === 'restaurant_owner').length;
  const activeCount = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-muted-foreground mt-2 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
            Manage user accounts, roles, and permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{users.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-yellow-500">{superAdminCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-blue-500">{restaurantOwnerCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Restaurant Owners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="admin-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-success" />
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-success">{activeCount}</p>
                )}
                <p className="text-sm text-muted-foreground">Active Users</p>
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
              <Label htmlFor="search">Search Users</Label>
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
              <Label htmlFor="role">Role Filter</Label>
              <select
                id="role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | 'restaurant_owner' | 'super_admin')}
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="restaurant_owner">Restaurant Owners</option>
                <option value="super_admin">Super Admins</option>
              </select>
            </div>
            
            <div className="md:w-48">
              <Label htmlFor="status">Status Filter</Label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} of {users.length} users
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
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters' 
                    : 'No users have registered yet'
                  }
                </p>
              </div>
            ) : (
              paginatedUsers.map((userProfile) => (
                <div
                  key={userProfile.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      userProfile.role === 'super_admin' ? 'bg-yellow-500/10' : 'bg-primary/10'
                    }`}>
                      {userProfile.role === 'super_admin' ? (
                        <Crown className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{userProfile.restaurantName}</h3>
                        <Badge variant={userProfile.role === 'super_admin' ? "default" : "secondary"}>
                          {userProfile.role === 'super_admin' ? 'Super Admin' : 'Restaurant Owner'}
                        </Badge>
                        <Badge variant={userProfile.isActive ? "default" : "secondary"}>
                          {userProfile.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1 mb-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground truncate">{userProfile.email}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Joined {format(userProfile.createdAt.toDate(), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`status-${userProfile.id}`} className="text-sm">
                        {userProfile.isActive ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id={`status-${userProfile.id}`}
                        checked={userProfile.isActive}
                        onCheckedChange={() => handleToggleStatus(userProfile.id, userProfile.isActive)}
                        disabled={userProfile.id === user?.uid} // Can't disable own account
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(userProfile)}
                      disabled={userProfile.id === user?.uid} // Can't edit own role
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePasswordReset(userProfile.email)}
                    >
                      Reset Password
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
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

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="admin-card">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role and permissions for {editingUser?.restaurantName}
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Current Information</Label>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="font-medium">{editingUser.restaurantName}</p>
                  <p className="text-sm text-muted-foreground">{editingUser.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Current role: {editingUser.role === 'super_admin' ? 'Super Admin' : 'Restaurant Owner'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Select New Role</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <input
                      type="radio"
                      id="restaurant_owner"
                      name="role"
                      value="restaurant_owner"
                      checked={editingUser.role === 'restaurant_owner'}
                      onChange={() => {}}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <Label htmlFor="restaurant_owner" className="font-medium">Restaurant Owner</Label>
                      <p className="text-sm text-muted-foreground">
                        Can manage their own restaurant menu and settings
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <input
                      type="radio"
                      id="super_admin"
                      name="role"
                      value="super_admin"
                      checked={editingUser.role === 'super_admin'}
                      onChange={() => {}}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <Label htmlFor="super_admin" className="font-medium">Super Admin</Label>
                      <p className="text-sm text-muted-foreground">
                        Full access to all restaurants and platform management
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleRoleChange(
                    editingUser.id, 
                    editingUser.role === 'super_admin' ? 'restaurant_owner' : 'super_admin'
                  )}
                  className="flex-1 bg-gradient-primary"
                >
                  Change to {editingUser.role === 'super_admin' ? 'Restaurant Owner' : 'Super Admin'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};