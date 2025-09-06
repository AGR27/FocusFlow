"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  email: string;
  avatar_url: string | null;
  first_name: string;
  last_name?: string | null;
  dob?: string | null;
}

// Define the shape of our AuthContext
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{error: Error | null}>;
  userProfile: UserProfile | null;
  signUp: (email: string, password: string) => Promise<{error: Error | null}>;
  signOut: () => Promise<{error: Error | null}>;
}

// Create the context with default (null) values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap your app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getOrCreateUserProfile = async (currentUser: User) => {
    setLoading(true);
    console.log("getOrCreateUserProfile: Starting for user ID:", currentUser.id);
    try {
      const {data: existingProfile, error: getProfileError} = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (getProfileError && getProfileError.code !== 'PGRST116') {
        console.error("getOrCreateUserProfile: Error fetching existing profile:", getProfileError.message);
        throw getProfileError;
      }
      console.log("getOrCreateUserProfile: Existing profile found:", existingProfile);

      let profileDataToUpdate: Partial<UserProfile> = {}

      // If no profile exists OR if existing profile is incomplete (e.g., from basic trigger)
      if (!existingProfile || !existingProfile.first_name) {
        const userMetadata = currentUser.user_metadata;
        console.log("getOrCreateUserProfile: User metadata from OAuth:", userMetadata);

        // Populate fields from OAuth metadata if available, otherwise leave null or use existing
        profileDataToUpdate = {
          email: existingProfile?.email || currentUser.email || null,
          first_name: existingProfile?.first_name || userMetadata.first_name || userMetadata.given_name || userMetadata.name?.split(' ')[0] || null,
          last_name: existingProfile?.last_name || userMetadata.last_name || userMetadata.family_name || userMetadata.name?.split(' ').slice(1).join(' ') || null,
          avatar_url: existingProfile?.avatar_url || userMetadata.avatar_url || null,
          // DOB is rarely provided by OAuth, so it will likely remain null unless explicitly set later
          dob: existingProfile?.dob || null // Keep existing DOB if any, otherwise null
        };
      } else {
        // If profile exists and is complete, use it as is
        profileDataToUpdate = existingProfile;
        console.log("getOrCreateUserProfile: Profile already complete, no update needed from OAuth metadata.");
      }

      // Perform the update/insert (upsert can be an alternative, but update is fine with trigger)
      // We are updating the row that the database trigger created.
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
            id: currentUser.id, // Ensure ID is always set for upsert
            ...profileDataToUpdate,
            updated_at: new Date().toISOString() // Update timestamp
        }, { onConflict: 'id' }) // On conflict with ID, update existing row
        .select() // Select the updated row to get the latest data
        .single();

      if (updateError) {
        console.error("getOrCreateUserProfile: Error during upsert:", updateError);
        throw updateError;
      }

      console.log("getOrCreateUserProfile: Profile upsert successful:", updatedProfile);

      setUserProfile(updatedProfile as UserProfile); // Set the fetched/updated profile

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error fetching or updating profile:", errorMessage);
      setUserProfile(null); // Clear profile if there's an error
    } finally {
      setLoading(false); // Ensure loading is reset
    }
  };

  // Effect to listen for Supabase auth state changes
  useEffect(() => {
    const {data: authListener} = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        if(session?.user) {
          getOrCreateUserProfile(session.user);
        }
        else {
          setUserProfile(null);
          setLoading(false);
        }
        
      }
    );

    // Initial check (useful if user is already logged in but page was refreshed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
        if(session?.user) {
          getOrCreateUserProfile(session.user);
        }
        else {
          setUserProfile(null);
          setLoading(false);
        }
    });

    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Run once on mount

  // Supabase Sign In function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      console.error('Sign In Error:', error.message);
      return { error };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    console.log("signUp: Attempting email/password signup for:", email);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        console.error("signUp: Auth signup error:", error);
        throw error;
      }

      if (data?.user) {
        console.log("signUp: Auth signup successful, user ID:", data.user.id);
        // After signup, we need to create or update the user profile
        await getOrCreateUserProfile(data.user);
      }
      return { error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Sign Up Error:', errorMessage);
      return { error: error instanceof Error ? error : new Error(errorMessage) };
    } finally {
      setLoading(false);
    }
  };

  // Supabase Sign Out function
  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      console.error('Sign Out Error:', error.message);
      return { error };
    }
    return { error: null };
  };

  const value = { user, userProfile, loading, signIn, signUp, signOut };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
