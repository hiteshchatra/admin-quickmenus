import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Eye,
  EyeOff,
  GripVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Category,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  subscribeToCategories,
  getMenuItems
} from '@/lib/firestore';
import { uploadCategoryImage, deleteImage } from '@/lib/storage';

export const Categories: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visible: true,
    image: ''
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [categoriesData, itemsData] = await Promise.all([
          getCategories(user.uid),
          getMenuItems(user.uid)
        ]);
        setCategories(categoriesData);
        setMenuItems(itemsData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribe = subscribeToCategories(user.uid, (updatedCategories) => {
      setCategories(updatedCategories);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const getCategoryItemCount = (categoryId: string) => {
    return menuItems.filter(item => item.categoryId === categoryId).length;
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', visible: true, image: '' });
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      visible: category.visible,
      image: category.image || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    try {
      if (editingCategory) {
        await updateCategory(user.uid, editingCategory.id, formData);
        toast({
          title: "Category updated",
          description: `"${formData.name}" has been updated successfully.`,
        });
      } else {
        await addCategory(user.uid, {
          ...formData,
          order: categories.length + 1,
        });
        toast({
          title: "Category added",
          description: `"${formData.name}" has been added successfully.`,
        });
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save category.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user) return;

    const itemCount = getCategoryItemCount(categoryId);
    if (itemCount > 0) {
      toast({
        title: "Cannot delete category",
        description: "This category contains menu items. Please remove all items first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteCategory(user.uid, categoryId);
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (categoryId: string) => {
    if (!user) return;

    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    try {
      await updateCategory(user.uid, categoryId, { visible: !category.visible });
      toast({
        title: "Category updated",
        description: `"${category.name}" is now ${category.visible ? 'hidden' : 'visible'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category visibility.",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = async (file: File) => {
    if (!user) return;

    setImageUploading(true);
    try {
      // Create a temporary ID for new categories
      const categoryId = editingCategory?.id || `temp_${Date.now()}`;
      const imageUrl = await uploadCategoryImage(user.uid, categoryId, file);

      setFormData(prev => ({ ...prev, image: imageUrl }));

      toast({
        title: "Image uploaded",
        description: "Category image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageRemove = async () => {
    if (formData.image) {
      try {
        await deleteImage(formData.image);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
    setFormData(prev => ({ ...prev, image: '' }));
  };

  return (
    <div className="space-y-6 animate-slide-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-slide-in-up">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
        Categories
          </h1>
          <p className="text-muted-foreground mt-2 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        Organize your menu items into categories
          </p>
        </div>
        <Button
          onClick={handleAddCategory}
          className="admin-button admin-gradient shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] w-full md:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-2xl font-bold">{categories.filter(cat => cat.visible).length}</p>
                )}
                <p className="text-sm text-muted-foreground">Visible</p>
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
                  <p className="text-2xl font-bold">{categories.filter(cat => !cat.visible).length}</p>
                )}
                <p className="text-sm text-muted-foreground">Hidden</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card className="admin-card">
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            Manage your menu categories and their visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-4 h-4" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No categories yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first category to organize your menu items
                </p>
                <Button onClick={handleAddCategory}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Category
                </Button>
              </div>
            ) : (
              categories.map((category: Category) => (
                <div
                  key={category.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-center space-x-4 w-full md:w-auto">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center space-x-3">
                        <h3 className="font-medium">{category.name}</h3>
                        <Badge variant={category.visible ? "default" : "secondary"}>
                          {category.visible ? "Visible" : "Hidden"}
                        </Badge>
                        <Badge variant="outline">
                          {getCategoryItemCount(category.id)} items
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 break-words">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center space-x-2 w-full md:w-auto">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`visible-${category.id}`} className="text-sm">
                        {category.visible ? "Visible" : "Hidden"}
                      </Label>
                      <Switch
                        id={`visible-${category.id}`}
                        checked={category.visible}
                        onCheckedChange={() => handleToggleVisibility(category.id)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                      className="mt-2 md:mt-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={getCategoryItemCount(category.id) > 0}
                      className="mt-2 md:mt-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="admin-card">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category information below.'
                : 'Create a new category to organize your menu items.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g., Appetizers, Main Courses, Desserts"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="admin-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of this category"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="admin-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Category Image</Label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                currentImage={formData.image}
                loading={imageUploading}
              />
            </div>

            <div className="flex items-center space-x-3">
              <Switch
                id="visible"
                checked={formData.visible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible: checked }))}
              />
              <Label htmlFor="visible">Make this category visible to customers</Label>
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
                onClick={handleSaveCategory}
                className="flex-1 bg-gradient-primary"
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};