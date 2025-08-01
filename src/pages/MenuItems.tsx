import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Edit2,
  Trash2,
  UtensilsCrossed,
  Upload,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { ImageUpload } from '@/components/ui/image-upload';
import { uploadMenuItemImage, deleteImage } from '@/lib/storage';
import {
  MenuItem,
  Category,
  getMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  subscribeToMenuItems,
  getCategories
} from '@/lib/firestore';

export const MenuItems: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    available: true,
    featured: false,
    image: ''
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [menuItemsData, categoriesData] = await Promise.all([
          getMenuItems(user.uid),
          getCategories(user.uid)
        ]);
        setMenuItems(menuItemsData);
        setCategories(categoriesData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load menu items.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const unsubscribe = subscribeToMenuItems(user.uid, (updatedMenuItems) => {
      setMenuItems(updatedMenuItems);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddItem = () => {
    if (categories.length === 0) {
      toast({
        title: "No categories available",
        description: "Please create at least one category before adding menu items.",
        variant: "destructive",
      });
      return;
    }

    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      available: true,
      featured: false,
      image: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      categoryId: item.categoryId,
      available: item.available,
      featured: item.featured,
      image: item.image || ''
    });
    setIsDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim() || !formData.categoryId || formData.price <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    const categoryName = categories.find(cat => cat.id === formData.categoryId)?.name || '';

    try {
      if (editingItem) {
        await updateMenuItem(user.uid, editingItem.id, {
          ...formData,
          categoryName
        });
        toast({
          title: "Item updated",
          description: `"${formData.name}" has been updated successfully.`,
        });
      } else {
        await addMenuItem(user.uid, {
          ...formData,
          categoryName
        });
        toast({
          title: "Item added",
          description: `"${formData.name}" has been added successfully.`,
        });
      }

      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save menu item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!user) return;

    const item = menuItems.find(item => item.id === id);

    try {
      await deleteMenuItem(user.uid, id);
      toast({
        title: "Item deleted",
        description: `"${item?.name}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item.",
        variant: "destructive",
      });
    }
  };

  const handleToggleAvailability = async (id: string) => {
    if (!user) return;

    const item = menuItems.find(item => item.id === id);
    if (!item) return;

    try {
      await updateMenuItem(user.uid, id, { available: !item.available });
      toast({
        title: "Item updated",
        description: `"${item.name}" is now ${item.available ? 'unavailable' : 'available'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item availability.",
        variant: "destructive",
      });
    }
  };

  const handleImageSelect = async (file: File) => {
    if (!user) return;

    setImageUploading(true);
    try {
      // Create a temporary ID for new items
      const itemId = editingItem?.id || `temp_${Date.now()}`;
      const imageUrl = await uploadMenuItemImage(user.uid, itemId, file);

      setFormData(prev => ({ ...prev, image: imageUrl }));

      toast({
        title: "Image uploaded",
        description: "Image has been uploaded successfully.",
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-in-up">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
        Menu Items
          </h1>
          <p className="text-muted-foreground mt-2 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        Manage your restaurant's menu items
          </p>
        </div>
        <Button
          onClick={handleAddItem}
          className="admin-button admin-gradient shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-glow)] w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16 admin-shimmer" />
                ) : (
                  <p className="text-2xl font-bold group-hover:text-primary transition-colors">{menuItems.length}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <UtensilsCrossed className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16 admin-shimmer" />
                ) : (
                  <p className="text-2xl font-bold text-success group-hover:text-success/80 transition-colors">{menuItems.filter(item => item.available).length}</p>
                )}
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                <Eye className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16 admin-shimmer" />
                ) : (
                  <p className="text-2xl font-bold group-hover:text-muted-foreground transition-colors">{menuItems.filter(item => !item.available).length}</p>
                )}
                <p className="text-sm text-muted-foreground">Unavailable</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center group-hover:bg-muted/30 transition-colors">
                <EyeOff className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="admin-stats-card group animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                {loading ? (
                  <Skeleton className="h-8 w-16 admin-shimmer" />
                ) : (
                  <p className="text-2xl font-bold text-warning group-hover:text-warning/80 transition-colors">{menuItems.filter(item => item.featured).length}</p>
                )}
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                <ImageIcon className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="admin-card animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 admin-input"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] admin-input">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, index) => (
          <Card
            key={item.id}
            className="admin-card overflow-hidden group animate-slide-in-up"
            style={{ animationDelay: `${0.7 + index * 0.1}s` }}
          >
            <div className="aspect-video bg-muted relative overflow-hidden">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <ImageIcon className="w-12 h-12 text-muted-foreground group-hover:text-muted-foreground/70 transition-colors" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              <div className="absolute top-3 right-3 flex space-x-2">
                {item.featured && (
                  <Badge className="bg-warning text-warning-foreground shadow-[var(--shadow-soft)] animate-glow">
                    Featured
                  </Badge>
                )}
                <Badge
                  variant={item.available ? "default" : "secondary"}
                  className="shadow-[var(--shadow-soft)]"
                >
                  {item.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {item.categoryName}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={item.available}
                    onCheckedChange={() => handleToggleAvailability(item.id)}
                  />
                  <Label className="text-sm">
                    {item.available ? "Available" : "Unavailable"}
                  </Label>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditItem(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card className="admin-card">
          <CardContent className="text-center py-12">
            <UtensilsCrossed className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No menu items found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first menu item to get started'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={handleAddItem}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Menu Item
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="admin-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Update the menu item information below.'
                : 'Create a new menu item for your restaurant.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Grilled Salmon"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="admin-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="admin-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this delicious item..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="admin-input min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className="admin-input">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Item Image</Label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                currentImage={formData.image}
                loading={imageUploading}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
                />
                <Label htmlFor="available">Available to customers</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
                <Label htmlFor="featured">Featured item</Label>
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
                onClick={handleSaveItem}
                className="flex-1 bg-gradient-primary"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};