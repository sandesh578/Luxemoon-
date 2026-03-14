'use client';

import React, { useMemo, useState } from 'react';
import { Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

type LoginFeedback = {
  tone: 'error' | 'warning' | 'success';
  message: string;
};

function getLoginFeedback(status: number, error?: string): LoginFeedback {
  if (status === 401) {
    return {
      tone: 'error',
      message: 'Incorrect admin email or password. Check your credentials and try again.',
    };
  }

  if (status === 429) {
    return {
      tone: 'warning',
      message: error || 'Too many failed attempts. Wait a minute before trying again.',
    };
  }

  if (status >= 500) {
    return {
      tone: 'error',
      message: 'Admin login is temporarily unavailable. Please try again shortly.',
    };
  }

  return {
    tone: 'error',
    message: error || 'Login failed. Please try again.',
  };
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<LoginFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  const feedbackClasses = useMemo(() => {
    if (!feedback) {
      return '';
    }

    if (feedback.tone === 'warning') {
      return 'border-amber-200 bg-amber-50 text-amber-900';
    }

    if (feedback.tone === 'success') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    }

    return 'border-rose-200 bg-rose-50 text-rose-900';
  }, [feedback]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setFeedback({
          tone: 'success',
          message: 'Login successful. Redirecting to the admin dashboard...',
        });
        window.location.href = '/admin';
        return;
      }

      setFeedback(getLoginFeedback(res.status, data.error));
    } catch {
      setFeedback({
        tone: 'error',
        message: 'Network error while contacting the login service. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(160deg,#120f0c_0%,#1d1712_48%,#0c0a09_100%)] px-3 py-4 text-stone-100 sm:px-4 sm:py-10">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/8 shadow-[0_32px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] sm:rounded-[32px]">
          <section className="hidden flex-col justify-between bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))] p-10 lg:flex">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-stone-200">
                <ShieldCheck className="h-4 w-4" />
                Luxe Moon Console
              </div>
              <div className="space-y-4">
                <p className="font-serif text-5xl leading-tight text-white">
                  Secure access for orders, products, and brand controls.
                </p>
                <p className="max-w-md text-sm leading-7 text-stone-300">
                  Review activity, manage catalog updates, and keep storefront operations moving from one protected workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-400">Operational Focus</p>
                <p className="mt-3 text-lg text-white">Faster catalog edits, controlled access, and cleaner recovery when login issues occur.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                  <p className="text-3xl font-semibold text-white">24h</p>
                  <p className="mt-2 text-sm text-stone-300">Secure admin session duration</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                  <p className="text-3xl font-semibold text-white">1 min</p>
                  <p className="mt-2 text-sm text-stone-300">Cooldown after repeated failures</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-[#f7f1e8] p-5 sm:p-10">
            <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center">
              <div className="mb-8">
                <div className="mb-5 rounded-[28px] bg-stone-950 px-5 py-5 text-stone-100 shadow-[0_18px_40px_rgba(0,0,0,0.16)] lg:hidden">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Luxe Moon Console
                  </div>
                  <p className="mt-4 font-serif text-2xl leading-tight text-white">
                    Protected admin access built for fast order and catalog control.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-stone-300">
                    Sign in to manage storefront operations, product updates, and customer activity from one place.
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">Admin Access</p>
                <h1 className="mt-3 font-serif text-3xl text-stone-950 sm:text-4xl">Sign in to continue</h1>
                <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-[15px]">
                  Use the configured admin credentials to access orders, products, settings, and customer operations.
                </p>
              </div>

              {feedback && (
                <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${feedbackClasses}`}>
                  {feedback.message}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">Admin email</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 py-3 shadow-sm transition focus-within:border-stone-950">
                    <Mail className="h-4 w-4 text-stone-400" />
                    <input
                      className="w-full bg-transparent text-sm text-stone-950 outline-none placeholder:text-stone-400"
                      placeholder="admin@example.com"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-stone-700">Password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-stone-300 bg-white px-4 py-3 shadow-sm transition focus-within:border-stone-950">
                    <LockKeyhole className="h-4 w-4 text-stone-400" />
                    <input
                      className="w-full bg-transparent text-sm text-stone-950 outline-none placeholder:text-stone-400"
                      placeholder="Enter your password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in
                    </>
                  ) : (
                    'Enter Admin'
                  )}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
