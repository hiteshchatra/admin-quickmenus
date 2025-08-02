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
  Search,
  Star,
  DollarSign,
  Filter,
  Grid3X3,
  List,
  MoreVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { ImageUpload } from '@/components/ui/image-upload';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedItems,
    goToPage,
    itemsPerPage,
    totalItems
  } = usePagination({
    data: filteredItems,
    itemsPerPage: viewMode === 'grid' ? 15 : 6
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

  const stats = {
    total: menuItems.length,
    available: menuItems.filter(item => item.available).length,
    unavailable: menuItems.filter(item => !item.available).length,
    featured: menuItems.filter(item => item.featured).length
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800">
            Menu Items
          </h1>
          <p className="text-gray-600 mt-2 lg:mt-3 text-base lg:text-lg">
            Manage your restaurant's delicious menu items
          </p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleAddItem}
            className="bg-blue-500 hover:bg-blue-600 text-white flex-1 lg:flex-none"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="bg-white border border-gray-200 rounded-lg lg:rounded-xl p-3 lg:p-4 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl lg:text-2xl font-bold text-gray-800">
                {loading ? <Skeleton className="h-6 lg:h-8 w-8 lg:w-12 bg-gray-200" /> : stats.total}
              </p>
              <p className="text-xs lg:text-sm text-gray-500 font-medium">Total Items</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
              <UtensilsCrossed className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg lg:rounded-xl p-3 lg:p-4 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl lg:text-2xl font-bold text-gray-800">
                {loading ? <Skeleton className="h-6 lg:h-8 w-8 lg:w-12 bg-gray-200" /> : stats.available}
              </p>
              <p className="text-xs lg:text-sm text-gray-500 font-medium">Available</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-yellow-100 flex items-center justify-center border border-yellow-200">
              <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg lg:rounded-xl p-3 lg:p-4 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl lg:text-2xl font-bold text-gray-800">
                {loading ? <Skeleton className="h-6 lg:h-8 w-8 lg:w-12 bg-gray-200" /> : stats.unavailable}
              </p>
              <p className="text-xs lg:text-sm text-gray-500 font-medium">Unavailable</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
              <EyeOff className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg lg:rounded-xl p-3 lg:p-4 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl lg:text-2xl font-bold text-gray-800">
                {loading ? <Skeleton className="h-6 lg:h-8 w-8 lg:w-12 bg-gray-200" /> : stats.featured}
              </p>
              <p className="text-xs lg:text-sm text-gray-500 font-medium">Featured</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-yellow-100 flex items-center justify-center border border-yellow-200">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-[200px] border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
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
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3' : 'space-y-4'}>
          {Array.from({ length: viewMode === 'grid' ? 15 : 6 }).map((_, i) => (
            <div key={i} className={viewMode === 'grid' ? 'space-y-1.5' : 'flex items-center space-x-4 p-4 bg-white rounded-xl'}>
              <Skeleton className={viewMode === 'grid' ? 'h-28 lg:h-32 w-full rounded-lg' : 'h-16 w-16 rounded-lg'} />
              {viewMode === 'grid' ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-3 lg:h-4 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                  <Skeleton className="h-2.5 w-full" />
                </div>
              ) : (
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 lg:h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <Card className="bg-white border-2 border-dashed border-gray-300">
          <CardContent className="text-center py-12 lg:py-16">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 lg:mb-6 border border-gray-200">
              <UtensilsCrossed className="w-8 h-8 lg:w-10 lg:h-10 text-gray-600" />
            </div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-800 mb-2 lg:mb-3">No menu items found</h3>
            <p className="text-gray-600 mb-6 lg:mb-8 max-w-md mx-auto text-sm lg:text-base px-4">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first menu item to get started'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button 
                onClick={handleAddItem}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Menu Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-2 lg:gap-3">
          {paginatedItems.map((item, index) => (
            <Card
              key={item.id}
              className="group overflow-hidden bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-1 lg:top-1.5 left-1 lg:left-1.5 flex flex-col gap-0.5">
                  {item.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs px-1 py-0.5">
                      <Star className="w-2 h-2 mr-0.5" />
                      Featured
                    </Badge>
                  )}
                  <Badge
                    variant={item.available ? "default" : "secondary"}
                    className={`text-xs px-1 py-0.5 ${item.available 
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}
                  >
                    {item.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>

                {/* Price */}
                <div className="absolute bottom-1 lg:bottom-1.5 right-1 lg:right-1.5 bg-white rounded px-1 lg:px-1.5 py-0.5 border border-gray-200">
                  <p className="text-xs font-bold text-gray-800 flex items-center">
                    <DollarSign className="w-2 h-2 lg:w-2.5 lg:h-2.5 mr-0.5" />
                    {item.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <CardContent className="p-1.5 lg:p-2">
                <div className="space-y-1">
                  <h3 className="font-bold text-xs lg:text-sm text-gray-800 line-clamp-1">
                    {item.name}
                  </h3>
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200 px-1 py-0.5">
                    {item.categoryName}
                  </Badge>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {item.description || "No description available"}
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditItem(item)}
                      className="flex-1 h-6 text-xs px-2 py-0 hover:bg-blue-50 border-blue-200 text-blue-700"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`flex-1 h-6 text-xs px-2 py-0 ${
                        item.available 
                          ? 'hover:bg-orange-50 border-orange-200 text-orange-700' 
                          : 'hover:bg-green-50 border-green-200 text-green-700'
                      }`}
                    >
                      {item.available ? (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="h-6 w-6 p-0 hover:bg-red-50 border-red-200 text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {paginatedItems.map((item, index) => (
            <Card
              key={item.id}
              className="group overflow-hidden bg-white border border-gray-200 hover:bg-gray-50 transition-colors duration-300"
            >
              <CardContent className="p-3 lg:p-4">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <div className="relative w-12 h-12 lg:w-16 lg:h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 lg:w-6 lg:h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 lg:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base lg:text-lg text-gray-800 truncate">
                          {item.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1 lg:gap-2 mt-1">
                          <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200">
                            {item.categoryName}
                          </Badge>
                          {item.featured && (
                            <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          <Badge
                            variant={item.available ? "default" : "secondary"}
                            className={`text-xs ${item.available 
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200" 
                              : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 lg:mt-2 line-clamp-1">
                          {item.description || "No description available"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end space-x-3 lg:space-x-4">
                        <div className="text-right">
                          <p className="text-lg lg:text-xl font-bold text-gray-800 flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {item.price.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                            className="h-8 px-3 hover:bg-blue-50 border-blue-200 text-blue-700"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAvailability(item.id)}
                            className={`h-8 px-3 ${
                              item.available 
                                ? 'hover:bg-orange-50 border-orange-200 text-orange-700' 
                                : 'hover:bg-green-50 border-green-200 text-green-700'
                            }`}
                          >
                            {item.available ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Show
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 border-red-200 text-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredItems.length > 0 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
          />
        </div>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white mx-4 lg:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg lg:text-xl font-bold text-gray-800">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm lg:text-base">
              {editingItem
                ? 'Update the menu item information below.'
                : 'Create a new menu item for your restaurant.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <Label htmlFor="itemName" className="text-sm font-medium text-gray-700">Item Name *</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Grilled Salmon"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-gray-700">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this delicious item..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px] lg:min-h-[100px] border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
              <Label className="text-sm font-medium text-gray-700">Item Image</Label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                currentImage={formData.image}
                loading={imageUploading}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 lg:gap-4 p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <Switch
                  id="available"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
                />
                <Label htmlFor="available" className="text-sm font-medium text-gray-700">Available to customers</Label>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
                <Label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured item</Label>
              </div>
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
                onClick={handleSaveItem}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
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