import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getUserProfile } from '@/lib/firestore';

export const useRestaurantName = () => {
  const [restaurantName, setRestaurantName] = useState('QR Menu Admin');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadRestaurantName = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.restaurantName) {
          setRestaurantName(profile.restaurantName);
        }
      } catch (error) {
        console.error('Failed to load restaurant name:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantName();
  }, [user]);

  return { restaurantName, loading };
};