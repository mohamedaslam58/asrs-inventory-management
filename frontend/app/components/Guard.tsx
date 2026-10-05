"use client";

import React from 'react';
import { Permission, Role } from '@/app/config/rbac';
import { useAuth } from '@/context/AuthContext';

interface GuardProps {
  permission?: Permission;
  role?: Role | Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function Guard({ permission, role, children, fallback = null }: GuardProps) {
  const { hasPermission, hasRole } = useAuth();

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}