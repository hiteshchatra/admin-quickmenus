import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/components/auth/AuthProvider';
import { ImageUpload } from '@/components/ui/image-upload';
import { User, Mail, Lock, Store, Save, Globe, QrCode, Upload, X, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getUserProfile,
  updateUserProfile,
  createUserProfile,
  UserProfile
} from '@/lib/firestore';
import { uploadQRCodeImage, deleteImage } from '@/lib/storage';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [qrCodeUploading, setQrCodeUploading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [profileData, setProfileData] = useState({
    restaurantName: '',
    email: user?.email || '',
    websiteUrl: '',
    qrCodeImage: '',
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
          profile = await createUserProfile(user.uid, user.email || '', 'My Restaurant', 'restaurant_owner');
        }

        setUserProfile(profile);
        setProfileData(prev => ({
          ...prev,
          restaurantName: profile?.restaurantName || '',
          email: user.email || '',
          websiteUrl: profile?.websiteUrl || '',
          qrCodeImage: profile?.qrCodeImage || ''
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
        restaurantName: profileData.restaurantName,
        websiteUrl: profileData.websiteUrl
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

  const handleQRCodeSelect = async (file: File) => {
    if (!user) return;

    setQrCodeUploading(true);
    try {
      const qrCodeUrl = await uploadQRCodeImage(user.uid, file);
      
      // Update profile with new QR code
      await updateUserProfile(user.uid, {
        qrCodeImage: qrCodeUrl
      });

      setProfileData(prev => ({ ...prev, qrCodeImage: qrCodeUrl }));
      setUserProfile(prev => prev ? { ...prev, qrCodeImage: qrCodeUrl } : null);

      toast({
        title: "QR Code uploaded",
        description: "Your QR code has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setQrCodeUploading(false);
    }
  };

  const handleQRCodeRemove = async () => {
    if (!user) return;

    try {
      if (profileData.qrCodeImage) {
        await deleteImage(profileData.qrCodeImage);
      }

      await updateUserProfile(user.uid, {
        qrCodeImage: ''
      });

      setProfileData(prev => ({ ...prev, qrCodeImage: '' }));
      setUserProfile(prev => prev ? { ...prev, qrCodeImage: '' } : null);

      toast({
        title: "QR Code removed",
        description: "Your QR code has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove QR code.",
        variant: "destructive",
      });
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

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleVisitWebsite = () => {
    if (profileData.websiteUrl && isValidUrl(profileData.websiteUrl)) {
      window.open(profileData.websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-in-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Manage your account and restaurant information
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Information */}
          <div className="xl:col-span-2 space-y-6">
            {/* Restaurant Information */}
            <Card className="admin-card animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    {dataLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            id="websiteUrl"
                            type="url"
                            placeholder="https://your-restaurant-website.com"
                            value={profileData.websiteUrl}
                            onChange={(e) => setProfileData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                            className="admin-input pl-10"
                          />
                        </div>
                        {profileData.websiteUrl && isValidUrl(profileData.websiteUrl) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleVisitWebsite}
                            className="w-full sm:w-auto"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Visit Website
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Add your restaurant's website URL for customers to visit
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-gradient-primary w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="admin-card animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
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

                <div className="p-4 bg-gradient-to-r from-success/10 to-success/5 rounded-lg border border-success/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-success-foreground">Account Status: Active</p>
                      <p className="text-xs text-muted-foreground">
                        Your account is in good standing
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="admin-card animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
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
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={loading || !profileData.currentPassword || !profileData.newPassword || !profileData.confirmPassword}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - QR Code */}
          <div className="xl:col-span-1">
            <Card className="admin-card animate-slide-in-up sticky top-6" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-primary" />
                  <span>QR Code</span>
                </CardTitle>
                <CardDescription>
                  Upload and manage your restaurant's QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>QR Code Image</Label>
                  
                  {dataLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {/* QR Code Display */}
                      {profileData.qrCodeImage ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center p-6 border-2 border-dashed border-border rounded-lg bg-gradient-to-br from-muted/30 to-muted/10">
                            <div className="text-center">
                              <img
                                src={profileData.qrCodeImage}
                                alt="Restaurant QR Code"
                                className="mx-auto max-w-[250px] max-h-[250px] object-contain rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
                              />
                              <p className="text-sm text-muted-foreground mt-3 font-medium">
                                Current QR Code
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <Button
                              variant="outline"
                              onClick={handleQRCodeRemove}
                              className="w-full"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove QR Code
                            </Button>
                            
                            <ImageUpload
                              onImageSelect={handleQRCodeSelect}
                              onImageRemove={() => {}}
                              currentImage=""
                              loading={qrCodeUploading}
                              accept="image/*"
                              className="w-full"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 hover:from-muted/40 hover:to-muted/20 transition-colors duration-300">
                            <div className="text-center">
                              <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                              <h3 className="text-lg font-medium mb-2">No QR Code Uploaded</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Upload a QR code image for your restaurant
                              </p>
                            </div>
                          </div>
                          
                          <ImageUpload
                            onImageSelect={handleQRCodeSelect}
                            onImageRemove={() => {}}
                            currentImage=""
                            loading={qrCodeUploading}
                            accept="image/*"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-3">
                      <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          QR Code Tips
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Upload high-quality images (PNG, JPG, WebP)</li>
                          <li>• Ensure QR code is clearly visible</li>
                          <li>• Test before uploading</li>
                          <li>• Link to menu or website works best</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};