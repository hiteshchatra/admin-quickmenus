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
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  id: string;
  email: string;
  restaurantName: string;
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
export const createUserProfile = async (userId: string, email: string, restaurantName: string) => {
  const now = Timestamp.now();
  const profileData = {
    email,
    restaurantName,
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