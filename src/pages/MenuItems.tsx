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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    itemsPerPage: viewMode === 'grid' ? 12 : 8
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange/5 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 animate-slide-in-up">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent">
              Menu Items
            </h1>
            <p className="text-muted-foreground mt-3 text-lg animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
              Manage your restaurant's delicious menu items
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
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
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/90 text-white shadow-xl hover:shadow-primary/25 transition-all duration-300 group"
            >
              <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Add Menu Item
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200 group-hover:scale-105 transition-transform duration-300">
                  {loading ? <Skeleton className="h-8 w-12 bg-blue-200/50" /> : stats.total}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Items</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 group-hover:scale-105 transition-transform duration-300">
                  {loading ? <Skeleton className="h-8 w-12 bg-emerald-200/50" /> : stats.available}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Available</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/25 transition-all duration-300 group-hover:scale-110">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/20 dark:to-slate-900/10 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-lg hover:shadow-slate-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 group-hover:scale-105 transition-transform duration-300">
                  {loading ? <Skeleton className="h-8 w-12 bg-slate-200/50" /> : stats.unavailable}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Unavailable</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg group-hover:shadow-slate-500/25 transition-all duration-300 group-hover:scale-110">
                <EyeOff className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 group animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-800 dark:text-amber-200 group-hover:scale-105 transition-transform duration-300">
                  {loading ? <Skeleton className="h-8 w-12 bg-amber-200/50" /> : stats.featured}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Featured</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg group-hover:shadow-amber-500/25 transition-all duration-300 group-hover:scale-110">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
          </div> */}
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-950/50 dark:to-gray-900/30 border-gray-200 dark:border-gray-800 shadow-lg animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full lg:w-[200px] border-gray-300 dark:border-gray-600">
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
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {Array.from({ length: viewMode === 'grid' ? 8 : 6 }).map((_, i) => (
              <div key={i} className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-xl'}>
                <Skeleton className={viewMode === 'grid' ? 'h-48 w-full rounded-xl' : 'h-16 w-16 rounded-lg'} />
                {viewMode === 'grid' ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/30 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <UtensilsCrossed className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">No menu items found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first menu item to get started'
                }
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <Button 
                  onClick={handleAddItem}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-orange-500/25 transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Menu Item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedItems.map((item, index) => (
              <Card
                key={item.id}
                className="group overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300 animate-slide-in-up"
                style={{ animationDelay: `${0.7 + index * 0.05}s` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {item.featured && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge
                      variant={item.available ? "default" : "secondary"}
                      className={item.available 
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg" 
                        : "bg-gray-500 text-white border-0 shadow-lg"
                      }
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 hover:bg-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditItem(item)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAvailability(item.id)}>
                          {item.available ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                          {item.available ? 'Make Unavailable' : 'Make Available'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Price */}
                  <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {item.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300 line-clamp-1">
                        {item.name}
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {item.categoryName}
                    </Badge>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {item.description || "No description available"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedItems.map((item, index) => (
              <Card
                key={item.id}
                className="group overflow-hidden bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900/50 dark:to-gray-800/30 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 animate-slide-in-up"
                style={{ animationDelay: `${0.7 + index * 0.05}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300 truncate">
                            {item.name}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-gray-100 dark:bg-gray-800">
                              {item.categoryName}
                            </Badge>
                            {item.featured && (
                              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            <Badge
                              variant={item.available ? "default" : "secondary"}
                              className={`text-xs ${item.available 
                                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0" 
                                : "bg-gray-500 text-white border-0"
                              }`}
                            >
                              {item.available ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-1">
                            {item.description || "No description available"}
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 ml-4">
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {item.price.toFixed(2)}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditItem(item)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleAvailability(item.id)}>
                                {item.available ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                                {item.available ? 'Make Unavailable' : 'Make Available'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-950/50 dark:to-gray-900/30">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                {editingItem
                  ? 'Update the menu item information below.'
                  : 'Create a new menu item for your restaurant.'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="itemName" className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Name *</Label>
                  <Input
                    id="itemName"
                    placeholder="e.g., Grilled Salmon"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-gray-700 dark:text-gray-300">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this delicious item..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[100px] border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger className="border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400">
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
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Item Image</Label>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  onImageRemove={handleImageRemove}
                  currentImage={formData.image}
                  loading={imageUploading}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
                  />
                  <Label htmlFor="available" className="text-sm font-medium text-gray-700 dark:text-gray-300">Available to customers</Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured item</Label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 border-gray-300 dark:border-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveItem}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};