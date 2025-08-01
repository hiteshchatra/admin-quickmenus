import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth/AuthProvider';
import { User, Mail, Lock, Store, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getUserProfile,
  updateUserProfile,
  createUserProfile,
  UserProfile
} from '@/lib/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [profileData, setProfileData] = useState({
    restaurantName: '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        setDataLoading(true);
        let profile = await getUserProfile(user.uid);

        // If profile doesn't exist, create one
        if (!profile) {
          profile = await createUserProfile(user.uid, user.email || '', 'My Restaurant');
        }

        setUserProfile(profile);
        setProfileData(prev => ({
          ...prev,
          restaurantName: profile?.restaurantName || '',
          email: user.email || ''
        }));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  const handleUpdateProfile = async () => {
    if (!user || !profileData.restaurantName.trim()) {
      toast({
        title: "Error",
        description: "Restaurant name is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await updateUserProfile(user.uid, {
        restaurantName: profileData.restaurantName
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    if (profileData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!profileData.currentPassword) {
      toast({
        title: "Error",
        description: "Current password is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(user.email!, profileData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, profileData.newPassword);

      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });

      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      let errorMessage = "Failed to change password.";

      if (error.code === 'auth/wrong-password') {
        errorMessage = "Current password is incorrect.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "New password is too weak.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and restaurant information
        </p>
      </div>

      {/* Restaurant Information */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Store className="w-5 h-5 text-primary" />
            <span>Restaurant Information</span>
          </CardTitle>
          <CardDescription>
            Update your restaurant details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            {dataLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Input
                id="restaurantName"
                placeholder="Enter your restaurant name"
                value={profileData.restaurantName}
                onChange={(e) => setProfileData(prev => ({ ...prev, restaurantName: e.target.value }))}
                className="admin-input"
              />
            )}
          </div>

          <Button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="bg-gradient-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>Account Information</span>
          </CardTitle>
          <CardDescription>
            View and manage your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="admin-input pl-10 bg-muted/50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <div>
                <p className="text-sm font-medium">Account Status: Active</p>
                <p className="text-xs text-muted-foreground">
                  Your account is in good standing
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-primary" />
            <span>Change Password</span>
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="Enter your current password"
              value={profileData.currentPassword}
              onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="admin-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              value={profileData.newPassword}
              onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="admin-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={profileData.confirmPassword}
              onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="admin-input"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={loading || !profileData.currentPassword || !profileData.newPassword || !profileData.confirmPassword}
            variant="outline"
          >
            <Lock className="w-4 h-4 mr-2" />
            {loading ? 'Changing Password...' : 'Change Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="admin-card border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-destructive/20 rounded-lg">
              <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};