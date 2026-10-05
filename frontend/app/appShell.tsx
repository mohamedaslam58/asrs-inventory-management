'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Items', href: '/items' },
  { label: 'Categories', href: '/categories' },
  { label: 'Warehouses', href: '/warehouses' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Stock Transactions', href: '/inventory/transaction' },
  { label: 'Suppliers', href: '/suppliers' },
  { label: 'Purchase Orders', href: '/purchase-orders' },
  { label: 'Low Stock Alerts', href: '/low-stock' },
  { label: 'Asset Assignments', href: '/asset-assignments' },
  { label: 'Reports', href: '/reports' },
  { label: 'Audit Logs', href: '/audit-logs' },
  // { label: 'ASRS Operations', href: '/dashboard/operations' },
  // { label: 'System Logs', href: '/dashboard/logs' },
];

// Add routes that should NOT require authentication or show the sidebar
const PUBLIC_ROUTES = ['/', '/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(!PUBLIC_ROUTES.includes(pathname));
  const [loggingOut, setLoggingOut] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);

    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoggingOut(false);
      router.replace('/');
    }
  }, [router]);

  // Auth Guard Check
  useEffect(() => {
    // If visiting a public route, do not attempt auth check
    if (isPublicRoute) {
      return;
    }

    let isMounted = true;

    async function checkAuth() {
      try {
        await apiFetch('/auth/me');
        if (isMounted) setLoading(false);
      } catch (err) {
        if (isMounted) router.replace('/');
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, isPublicRoute, router]);

  // Render unauthenticated public pages clean without sidebar/header shell
  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-emerald-500 font-mono text-sm">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Verifying Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-48 border-r border-zinc-800 bg-zinc-900 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-center">
    <div className="flex h-10 w-full items-center justify-center rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-white/10">
      <img
        src="https://www.asrs.ae/wp-content/uploads/2025/01/main-logo.svg"
        alt="ASRS Control Logo"
        className="h-full w-full object-contain"
      />
    </div>
  </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && item.href !== '/inventory' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 font-mono">System Online</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 px-6 flex items-center justify-between backdrop-blur-sm">
          <span className="text-xs font-mono text-zinc-400">Authenticated Terminal</span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Sign out of application"
            className="cursor-pointer rounded-lg bg-red-600/10 px-3.5 py-1.5 text-xs font-semibold text-red-400 border border-red-500/20 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
          >
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}