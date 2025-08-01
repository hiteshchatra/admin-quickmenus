import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  collectionGroup 
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  id: string;
  email: string;
  restaurantName: string;
  role: 'restaurant_owner' | 'super_admin';
  isActive: boolean;
  websiteUrl?: string;
  qrCodeImage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  order: number;
  image?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  image?: string;
  available: boolean;
  featured: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User Profile Operations
export const createUserProfile = async (userId: string, email: string, restaurantName: string, role: 'restaurant_owner' | 'super_admin' = 'restaurant_owner') => {
  const now = Timestamp.now();
  const profileData = {
    email,
    restaurantName,
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  
  await setDoc(doc(db, 'users', userId), profileData);
  return { id: userId, ...profileData };
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

// Categories Operations
export const getCategories = async (userId: string): Promise<Category[]> => {
  const q = query(
    collection(db, 'users', userId, 'categories'),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = async (userId: string, categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = Timestamp.now();
  const data = {
    ...categoryData,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(db, 'users', userId, 'categories'), data);
  return { id: docRef.id, ...data };
};

export const updateCategory = async (userId: string, categoryId: string, data: Partial<Category>) => {
  const docRef = doc(db, 'users', userId, 'categories', categoryId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteCategory = async (userId: string, categoryId: string) => {
  const docRef = doc(db, 'users', userId, 'categories', categoryId);
  await deleteDoc(docRef);
};

// Menu Items Operations
export const getMenuItems = async (userId: string): Promise<MenuItem[]> => {
  const q = query(
    collection(db, 'users', userId, 'menuItems'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
};

export const addMenuItem = async (userId: string, itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = Timestamp.now();
  const data = {
    ...itemData,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(db, 'users', userId, 'menuItems'), data);
  return { id: docRef.id, ...data };
};

export const updateMenuItem = async (userId: string, itemId: string, data: Partial<MenuItem>) => {
  const docRef = doc(db, 'users', userId, 'menuItems', itemId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteMenuItem = async (userId: string, itemId: string) => {
  const docRef = doc(db, 'users', userId, 'menuItems', itemId);
  await deleteDoc(docRef);
};

// Real-time listeners
export const subscribeToCategories = (userId: string, callback: (categories: Category[]) => void) => {
  const q = query(
    collection(db, 'users', userId, 'categories'),
    orderBy('order', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    callback(categories);
  });
};

export const subscribeToMenuItems = (userId: string, callback: (items: MenuItem[]) => void) => {
  const q = query(
    collection(db, 'users', userId, 'menuItems'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    callback(items);
  });
};

// Super Admin Operations
export interface RestaurantStats {
  userId: string;
  restaurantName: string;
  email: string;
  isActive: boolean;
  totalCategories: number;
  totalMenuItems: number;
  activeMenuItems: number;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

// Get all restaurant users
export const getAllRestaurants = async (): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['restaurant_owner', 'super_admin']),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    console.error('Error in getAllRestaurants:', error);
    throw error;
  }
};

// Get all users (including super admins)
export const getAllUsers = async (): Promise<UserProfile[]> => {
  const q = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
};

// Get restaurant statistics
export const getRestaurantStats = async (userId: string): Promise<RestaurantStats | null> => {
  try {
    const userProfile = await getUserProfile(userId);
    if (!userProfile) return null;

    const [categories, menuItems] = await Promise.all([
      getCategories(userId),
      getMenuItems(userId)
    ]);

    return {
      userId,
      restaurantName: userProfile.restaurantName,
      email: userProfile.email,
      isActive: userProfile.isActive,
      totalCategories: categories.length,
      totalMenuItems: menuItems.length,
      activeMenuItems: menuItems.filter(item => item.available).length,
      createdAt: userProfile.createdAt,
      lastUpdated: userProfile.updatedAt,
    };
  } catch (error) {
    console.error('Error getting restaurant stats:', error);
    return null;
  }
};

// Get all restaurant statistics
export const getAllRestaurantStats = async (): Promise<RestaurantStats[]> => {
  try {
    const restaurants = await getAllRestaurants();
    const statsPromises = restaurants.map(restaurant => getRestaurantStats(restaurant.id));
    const stats = await Promise.all(statsPromises);
    return stats.filter(stat => stat !== null) as RestaurantStats[];
  } catch (error) {
    console.error('Error in getAllRestaurantStats:', error);
    throw error;
  }
};

// Toggle restaurant active status
export const toggleRestaurantStatus = async (userId: string): Promise<void> => {
  const userProfile = await getUserProfile(userId);
  if (!userProfile) throw new Error('Restaurant not found');
  
  await updateUserProfile(userId, { isActive: !userProfile.isActive });
};

// Update user role
export const updateUserRole = async (userId: string, role: 'restaurant_owner' | 'super_admin'): Promise<void> => {
  await updateUserProfile(userId, { role });
};

// Get global platform statistics
export const getPlatformStats = async () => {
  const restaurants = await getAllRestaurants();
  const allStats = await getAllRestaurantStats();
  
  const totalCategories = allStats.reduce((sum, stat) => sum + stat.totalCategories, 0);
  const totalMenuItems = allStats.reduce((sum, stat) => sum + stat.totalMenuItems, 0);
  const activeMenuItems = allStats.reduce((sum, stat) => sum + stat.activeMenuItems, 0);
  const activeRestaurants = restaurants.filter(r => r.isActive).length;
  
  return {
    totalRestaurants: restaurants.length,
    activeRestaurants,
    inactiveRestaurants: restaurants.length - activeRestaurants,
    totalCategories,
    totalMenuItems,
    activeMenuItems,
    averageItemsPerRestaurant: restaurants.length > 0 ? Math.round(totalMenuItems / restaurants.length) : 0,
  };
};

// Check if user is super admin
export const isSuperAdmin = async (userId: string): Promise<boolean> => {
  const userProfile = await getUserProfile(userId);
  return userProfile?.role === 'super_admin' || false;
};