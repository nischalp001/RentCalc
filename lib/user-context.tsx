"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
  connections: Connection[];
  addConnection: (connection: Connection) => void;
  removeConnection: (id: string) => void;
  updateConnectionStatus: (id: string, status: "pending" | "active") => void;
}

const defaultUser: User = {
  id: "user_001",
  name: "Alex Johnson",
  email: "alex@example.com",
  phone: "+1 (555) 123-4567",
  avatar: undefined,
};

// Mock connections data
const defaultConnections: Connection[] = [
  {
    id: "conn_001",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 (555) 234-5678",
    role: "tenant",
    propertyId: "prop_001",
    propertyName: "Sunset Apartments - Unit 3B",
    status: "active",
    unreadMessages: 2,
  },
  {
    id: "conn_002",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1 (555) 345-6789",
    role: "tenant",
    propertyId: "prop_002",
    propertyName: "Oak Street House",
    status: "active",
    unreadMessages: 0,
  },
  {
    id: "conn_003",
    name: "Property Management Inc.",
    email: "support@propmanagement.com",
    phone: "+1 (555) 456-7890",
    role: "landlord",
    propertyId: "prop_003",
    propertyName: "Marina View Apartments - Unit 4B",
    status: "active",
    unreadMessages: 1,
  },
  {
    id: "conn_004",
    name: "Robert Wilson",
    email: "robert@example.com",
    role: "tenant",
    status: "pending",
    unreadMessages: 0,
  },
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(defaultUser);
  const [connections, setConnections] =
    useState<Connection[]>(defaultConnections);

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
