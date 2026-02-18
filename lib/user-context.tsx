"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ensureProfileForAuthUser } from "@/lib/profile-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";

export type ConnectionRole = "landlord" | "tenant";

export interface Connection {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: ConnectionRole; // Their role relative to you
  propertyId?: string;
  propertyName?: string;
  status: "pending" | "active";
  unreadMessages: number;
}

interface User {
  id: string; // Public app user ID (profiles.app_user_id)
  profileId?: string;
  authUserId?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
  profileReady: boolean;
  connections: Connection[];
  addConnection: (connection: Connection) => void;
  removeConnection: (id: string) => void;
  updateConnectionStatus: (id: string, status: "pending" | "active") => void;
}

const defaultUser: User = {
  id: "USRDEMO001",
  name: "User",
  email: "user@example.com",
  phone: "",
  avatar: undefined,
};

const defaultConnections: Connection[] = [];

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const [profileReady, setProfileReady] = useState(false);
  const [connections, setConnections] =
    useState<Connection[]>(defaultConnections);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();

    const syncProfile = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        if (error || !data.session?.user) {
          setUser(defaultUser);
          setProfileReady(true);
          return;
        }

        const profile = await ensureProfileForAuthUser(data.session.user);
        if (!active) return;

        setUser({
          id: profile.app_user_id || profile.id,
          profileId: profile.id,
          authUserId: profile.auth_user_id || undefined,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || undefined,
          avatar: profile.avatar_url || undefined,
        });
      } catch {
        if (!active) return;
      } finally {
        if (active) {
          setProfileReady(true);
        }
      }
    };

    void syncProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (!session?.user) {
        setUser(defaultUser);
        setProfileReady(true);
        return;
      }

      setProfileReady(false);
      void ensureProfileForAuthUser(session.user)
        .then((profile) => {
          if (!active) return;
          setUser({
            id: profile.app_user_id || profile.id,
            profileId: profile.id,
            authUserId: profile.auth_user_id || undefined,
            name: profile.name,
            email: profile.email,
            phone: profile.phone || undefined,
            avatar: profile.avatar_url || undefined,
          });
        })
        .finally(() => {
          if (active) {
            setProfileReady(true);
          }
        });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const addConnection = (connection: Connection) => {
    setConnections((prev) => [...prev, connection]);
  };

  const removeConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const updateConnectionStatus = (id: string, status: "pending" | "active") => {
    setConnections((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        profileReady,
        connections,
        addConnection,
        removeConnection,
        updateConnectionStatus,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
