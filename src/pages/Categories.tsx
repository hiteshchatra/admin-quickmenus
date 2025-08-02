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
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
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

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedCategories,
    goToPage,
    itemsPerPage,
    totalItems
  } = usePagination({
    data: categories,
    itemsPerPage: 8
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800">
            Categories
          </h1>
          <p className="text-gray-600 mt-2 lg:mt-3 text-base lg:text-lg">
            Organize your menu items into beautiful categories
          </p>
        </div>
        <Button
          onClick={handleAddCategory}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full lg:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Categories */}
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-yellow-100 flex items-center justify-center border border-yellow-200 flex-shrink-0">
                <FolderOpen className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                {loading ? (
                  <Skeleton className="h-8 lg:h-10 w-16 lg:w-20 mb-1 lg:mb-2 bg-gray-200 rounded-lg" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800">{categories.length}</p>
                )}
                <p className="text-xs lg:text-sm text-gray-500 font-medium">Total Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visible Categories */}
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-yellow-100 flex items-center justify-center border border-yellow-200 flex-shrink-0">
                <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                {loading ? (
                  <Skeleton className="h-8 lg:h-10 w-16 lg:w-20 mb-1 lg:mb-2 bg-gray-200 rounded-lg" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800">{categories.filter(cat => cat.visible).length}</p>
                )}
                <p className="text-xs lg:text-sm text-gray-500 font-medium">Visible</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hidden Categories */}
        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
                <EyeOff className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" />
              </div>
              <div className="min-w-0">
                {loading ? (
                  <Skeleton className="h-8 lg:h-10 w-16 lg:w-20 mb-1 lg:mb-2 bg-gray-200 rounded-lg" />
                ) : (
                  <p className="text-2xl lg:text-3xl font-bold text-gray-800">{categories.filter(cat => !cat.visible).length}</p>
                )}
                <p className="text-xs lg:text-sm text-gray-500 font-medium">Hidden</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card className="bg-white border border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 lg:p-6">
          <CardTitle className="text-lg lg:text-xl font-bold text-gray-800 flex items-center space-x-2">
            <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
              <FolderOpen className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
            </div>
            <span>All Categories</span>
          </CardTitle>
          <CardDescription className="text-gray-600 text-sm lg:text-base">
            Manage your menu categories and their visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 bg-gray-50 border border-gray-200 rounded-lg lg:rounded-xl gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-4 h-4 bg-gray-300" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2 bg-gray-300 rounded-lg" />
                      <Skeleton className="h-4 w-48 bg-gray-300 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-20 bg-gray-300 rounded-lg" />
                    <Skeleton className="h-8 w-8 bg-gray-300 rounded-lg" />
                    <Skeleton className="h-8 w-8 bg-gray-300 rounded-lg" />
                  </div>
                </div>
              ))
            ) : categories.length === 0 ? (
              <div className="text-center py-12 lg:py-16 bg-gray-50 rounded-xl lg:rounded-2xl border-2 border-dashed border-gray-300">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 lg:mb-6 border border-gray-200">
                  <FolderOpen className="w-8 h-8 lg:w-10 lg:h-10 text-gray-600" />
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-2 lg:mb-3">No categories yet</h3>
                <p className="text-gray-600 mb-6 lg:mb-8 max-w-md mx-auto text-sm lg:text-base px-4">
                  Create your first category to organize your menu items and make them easier for customers to browse
                </p>
                <Button 
                  onClick={handleAddCategory}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Category
                </Button>
              </div>
            ) : (
              paginatedCategories.map((category: Category, index) => (
                <div
                  key={category.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between p-4 lg:p-6 bg-white border border-gray-200 rounded-lg lg:rounded-xl hover:bg-gray-50 transition-colors duration-300 gap-4"
                >
                  <div className="flex items-start space-x-3 lg:space-x-4 w-full lg:w-auto min-w-0">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-gray-100 flex items-center justify-center cursor-grab hover:bg-gray-200 transition-colors duration-300 border border-gray-200 flex-shrink-0 mt-1 lg:mt-0">
                      <GripVertical className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
                    </div>
                    
                    {/* Category Image */}
                    {category.image && (
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-2">
                        <h3 className="font-bold text-base lg:text-lg text-gray-800 truncate">
                          {category.name}
                        </h3>
                        <Badge 
                          variant={category.visible ? "default" : "secondary"}
                          className={`text-xs ${category.visible 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                          } font-medium`}
                        >
                          {category.visible ? "Visible" : "Hidden"}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs"
                        >
                          {getCategoryItemCount(category.id)} items
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 break-words">
                        {category.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:gap-3 w-full lg:w-auto">
                    <div className="flex items-center space-x-2 lg:space-x-3 bg-gray-100 rounded-lg p-2 border border-gray-200 flex-1 lg:flex-none">
                      <Label htmlFor={`visible-${category.id}`} className="text-xs lg:text-sm font-medium text-gray-700">
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
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 flex-shrink-0"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="hidden sm:inline ml-2">Edit</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={getCategoryItemCount(category.id) > 0}
                      className="border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline ml-2">Delete</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {categories.length > 0 && (
            <div className="mt-6 lg:mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white mx-4 lg:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg lg:text-xl font-bold text-gray-800">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm lg:text-base">
              {editingCategory
                ? 'Update the category information below.'
                : 'Create a new category to organize your menu items.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 lg:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g., Appetizers, Main Courses, Desserts"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of this category"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="border-gray-300 focus:border-red-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Category Image</Label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                currentImage={formData.image}
                loading={imageUploading}
              />
            </div>

            <div className="flex items-center space-x-3 p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Switch
                id="visible"
                checked={formData.visible}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, visible: checked }))}
              />
              <Label htmlFor="visible" className="text-sm font-medium text-gray-700">Make this category visible to customers</Label>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 border-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCategory}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
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