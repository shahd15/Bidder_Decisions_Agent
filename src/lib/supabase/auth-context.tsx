import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabaseBrowserClient, getSanitizedSupabaseConfig } from "./client";

export interface UserProfile {
  id: string;
  fullName: string;
  role: string;
  email: string;
  companyId: string;
  companyName: string;
  avatarInitials: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLiveSupabaseConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    companyName: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInDemoUser: (userKey?: "marcus" | "eleanor") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PROFILES: Record<string, UserProfile> = {
  marcus: {
    id: "usr-demo-001",
    fullName: "Marcus Sterling",
    role: "Head of Commercial Tendering",
    email: "m.sterling@apexmed-solutions.co.uk",
    companyId: "comp-apexmed-01",
    companyName: "ApexMed Healthcare Solutions Ltd",
    avatarInitials: "MS",
  },
  eleanor: {
    id: "usr-demo-002",
    fullName: "Dr. Eleanor Vance",
    role: "Quality & Compliance Director",
    email: "e.vance@apexmed-solutions.co.uk",
    companyId: "comp-apexmed-01",
    companyName: "ApexMed Healthcare Solutions Ltd",
    avatarInitials: "EV",
  },
};

const AUTH_STORAGE_KEY = "bidder_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { isLive: isLiveSupabaseConfigured } = getSanitizedSupabaseConfig();

  // Initialize Auth state
  useEffect(() => {
    async function initAuth() {
      if (isLiveSupabaseConfigured) {
        try {
          const {
            data: { session: currentSession },
          } = await supabaseBrowserClient.auth.getSession();

          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);

            // Fetch user profile from Supabase profiles table
            const { data: profileData } = await supabaseBrowserClient
              .from("profiles")
              .select("*, companies(name)")
              .eq("id", currentSession.user.id)
              .single();

            if (profileData) {
              setProfile({
                id: profileData.id,
                fullName: profileData.full_name,
                role: profileData.role,
                email: profileData.email || currentSession.user.email || "",
                companyId: profileData.company_id,
                companyName: profileData.companies?.name || "ApexMed Healthcare Solutions Ltd",
                avatarInitials: profileData.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase(),
              });
            }
          }
        } catch (err) {
          console.warn("Supabase auth session fetch notice:", err);
        }
      }

      // Check stored demo session if not connected to live Supabase
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.profile) {
            setProfile(parsed.profile);
            setUser({ id: parsed.profile.id, email: parsed.profile.email } as any);
          }
        } catch {}
      } else {
        // Default authenticated demo session for immediate exploration
        setProfile(DEMO_PROFILES.marcus);
        setUser({ id: DEMO_PROFILES.marcus.id, email: DEMO_PROFILES.marcus.email } as any);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ profile: DEMO_PROFILES.marcus })
        );
      }

      setIsLoading(false);
    }

    initAuth();

    // Listen to Supabase auth state changes if configured
    if (isLiveSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabaseBrowserClient.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const { data: profileData } = await supabaseBrowserClient
            .from("profiles")
            .select("*, companies(name)")
            .eq("id", newSession.user.id)
            .single();

          if (profileData) {
            const prof: UserProfile = {
              id: profileData.id,
              fullName: profileData.full_name,
              role: profileData.role,
              email: profileData.email || newSession.user.email || "",
              companyId: profileData.company_id,
              companyName: profileData.companies?.name || "ApexMed Healthcare",
              avatarInitials: profileData.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
            };
            setProfile(prof);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ profile: prof }));
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isLiveSupabaseConfigured]);

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    if (isLiveSupabaseConfigured) {
      const result = await supabaseBrowserClient.auth.signInWithPassword({
        email,
        password,
      });
      setIsLoading(false);
      return result;
    }

    // Mock authentication for preview / demo mode
    await new Promise((res) => setTimeout(res, 500));
    const demoUser = DEMO_PROFILES.marcus;
    const customProf: UserProfile = {
      ...demoUser,
      email,
      fullName: email.split("@")[0].replace(".", " "),
    };
    setProfile(customProf);
    setUser({ id: `usr-${Date.now()}`, email } as any);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ profile: customProf }));
    setIsLoading(false);
    return { error: null };
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    companyName: string
  ) => {
    setIsLoading(true);
    if (isLiveSupabaseConfigured) {
      const result = await supabaseBrowserClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      });
      setIsLoading(false);
      return result;
    }

    // Mock signup
    await new Promise((res) => setTimeout(res, 500));
    const newProf: UserProfile = {
      id: `usr-${Date.now()}`,
      fullName,
      role: "Commercial Bid Lead",
      email,
      companyId: `comp-${Date.now()}`,
      companyName,
      avatarInitials: fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
    setProfile(newProf);
    setUser({ id: newProf.id, email } as any);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ profile: newProf }));
    setIsLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    if (isLiveSupabaseConfigured) {
      try {
        await supabaseBrowserClient.auth.signOut();
      } catch {}
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const signInDemoUser = (userKey: "marcus" | "eleanor" = "marcus") => {
    const selected = DEMO_PROFILES[userKey] || DEMO_PROFILES.marcus;
    setProfile(selected);
    setUser({ id: selected.id, email: selected.email } as any);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ profile: selected }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isAuthenticated: Boolean(user && profile),
        isLiveSupabaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        signInDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
