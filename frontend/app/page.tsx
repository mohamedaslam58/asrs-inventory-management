'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Authenticate against your backend API
      const res = await apiFetch<{ message: string; user: { id: string | number; name: string; email: string; role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!res?.user) {
        throw new Error('Invalid authentication response from server.');
      }

      // 2. Destructure user directly from the response and update AuthContext
      const { id, name, email: userEmail, role } = res.user;

      setUser({
        id,
        name,
        email: userEmail,
        role: role as any, // Maps DB role directly to Role enum
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-24 h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(2,6,23,0.65)_100%)]" />
      </div>

      <div className="relative w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-10">
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-full max-w-xs items-center justify-center rounded-xl bg-white px-5 py-3 shadow-lg shadow-black/20">
            <img
              src="https://www.asrs.ae/wp-content/uploads/2025/01/main-logo.svg"
              alt="ASRS company logo"
              className="h-full max-w-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
              Inventory Management
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ASRS Inventory System
            </h1>
            <p className="text-sm leading-6 text-slate-400">
              Sign in to securely access your inventory workspace.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}