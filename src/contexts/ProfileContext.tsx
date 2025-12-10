import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ProfileData {
  displayName: string;
  photoURL: string | null;
}

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    displayName: user?.email?.split('@')[0] || '',
    photoURL: null,
  });
  const [loading, setLoading] = useState(false);

  // Load profile data when user changes
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name, photo_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          displayName: data.display_name || user.email?.split('@')[0] || '',
          photoURL: data.photo_url,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Set default profile from user email
      setProfile({
        displayName: user.email?.split('@')[0] || '',
        photoURL: null,
      });
    }
  };

  const updateProfile = async (data: Partial<ProfileData>) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          display_name: data.displayName,
          photo_url: data.photoURL,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
