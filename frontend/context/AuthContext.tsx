"use client";

import React, { createContext, useContext, useState } from 'react';
import { Role, Permission, ROLE_PERMISSIONS } from '@/app/config/rbac';

export interface User {
  id?: number | string;
  email: string;
  name: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: Role | Role[]) => boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const savedUser = window.localStorage.getItem('asrs_user');
    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser) as User;
    } catch (err) {
      console.error('Failed to parse active user session:', err);
      return null;
    }
  });

  const handleSetUser = (userData: User | null) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      if (userData) {
        window.localStorage.setItem('asrs_user', JSON.stringify(userData));
      } else {
        window.localStorage.removeItem('asrs_user');
      }
    }
  };

  const logout = () => {
    handleSetUser(null);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.role) return false;
    
    // Normalize role string coming from DB to match enum (e.g., "INVENTORY_MANAGER")
    const userRoleKey = String(user.role).toUpperCase() as Role;
    const permissions = ROLE_PERMISSIONS[userRoleKey] || [];
    
    return permissions.includes(permission);
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user || !user.role) return false;
    const userRoleKey = String(user.role).toUpperCase() as Role;
    const targetRoles = Array.isArray(roles) ? roles : [roles];
    return targetRoles.includes(userRoleKey);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: handleSetUser, hasPermission, hasRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}