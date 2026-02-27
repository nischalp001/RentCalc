"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ensureProfileForAuthUser } from "@/lib/profile-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { fetchChatConnections, type ChatConnectionRecord } from "@/lib/rental-data";

export type ConnectionRole = "landlord" | "tenant";

export interface Connection {
  id: string;
  allConnectionIds: string[];
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: ConnectionRole; // Their role relative to you
  propertyId?: string;
  propertyName?: string;
  status: "pending" | "active";
  unreadMessages: number;
  lastMessage?: string;
  lastMessageAt?: string;
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
  connectionsLoading: boolean;
  refreshConnections: () => Promise<void>;
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

const UserContext = createContext<UserContextType | undefined>(undefined);

function toConnection(record: ChatConnectionRecord): Connection {
  return {
    id: record.id,
    allConnectionIds: record.allConnectionIds,
    name: record.name,
    email: record.email,
    phone: record.phone || undefined,
    avatar: record.avatar || undefined,
    role: record.role,
    propertyId: record.propertyId != null ? String(record.propertyId) : undefined,
    propertyName: record.propertyName || undefined,
    status: record.status,
    unreadMessages: record.unreadMessages,
    lastMessage: record.lastMessage || undefined,
    lastMessageAt: record.lastMessageAt || undefined,
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const [profileReady, setProfileReady] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true);
    try {
      const records = await fetchChatConnections();
      setConnections(records.map(toConnection));
    } catch {
      // Keep existing connections on error
    } finally {
      setConnectionsLoading(false);
    }
  }, []);

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
        setConnections([]);
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

  // Load connections once profile is ready (and has a profileId)
  useEffect(() => {
    if (profileReady && user.profileId) {
      void loadConnections();
    }
  }, [profileReady, user.profileId, loadConnections]);

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
        connectionsLoading,
        refreshConnections: loadConnections,
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
