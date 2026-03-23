'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const resetToken = useMemo(() => searchParams.get('reset') || '', [searchParams]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isResetMode = Boolean(resetToken);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to sign in');
        return;
      }

      setSuccess('Login successful. Redirecting...');
      setTimeout(() => {
        window.location.href = '/account';
      }, 700);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to reset password');
        return;
      }
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 900);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-[#f7efe8] overflow-x-hidden overflow-y-auto"
    >
      <div className="relative min-h-screen">
        <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-24 w-64 h-64 rounded-full bg-stone-300/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full bg-white/40 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[1fr_460px] items-stretch">
            <section className="hidden lg:flex rounded-3xl border border-stone-200/80 bg-white/65 backdrop-blur-sm p-10 xl:p-12 shadow-sm flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Luxe Moon</p>
                <h1 className="mt-3 text-4xl xl:text-5xl font-serif text-stone-900 leading-tight">
                  Clean Rituals.
                  <br />
                  Premium Results.
                </h1>
                <p className="mt-5 text-stone-600 max-w-md">
                  Secure account access, faster checkout, and complete order visibility in one place.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl bg-stone-900 text-stone-100 px-4 py-3 text-sm">Personalized account dashboard</div>
                <div className="rounded-2xl bg-white border border-stone-200 px-4 py-3 text-sm text-stone-700">Track orders and manage profile securely</div>
              </div>
            </section>

            <section className="flex items-center justify-center">
              <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-stone-200/80">
                <div className="mb-7 text-center">
                  <Link href="/" className="inline-block">
                    <span className="font-serif text-2xl tracking-wide text-stone-900">LUXE MOON</span>
                  </Link>
                  <h2 className="mt-4 text-2xl font-semibold text-stone-900">
                    {isResetMode ? 'Set New Password' : 'Welcome Back'}
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {isResetMode ? 'Create a secure password to continue.' : 'Sign in to your account and continue shopping.'}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    >
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isResetMode ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-stone-700">Email</span>
                      <div className="w-full px-4 py-3 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-amber-400 flex items-center gap-3">
                        <Mail className="h-4 w-4 text-stone-400" />
                        <input
                          className="w-full bg-transparent text-sm outline-none"
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-stone-700">Password</span>
                      <div className="w-full px-4 py-3 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-amber-400 flex items-center gap-3">
                        <LockKeyhole className="h-4 w-4 text-stone-400" />
                        <input
                          className="w-full bg-transparent text-sm outline-none"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="text-stone-400 hover:text-stone-700"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>

                    <div className="flex items-center justify-between text-sm">
                      <Link href="/forgot-password" className="text-stone-500 hover:text-stone-800">
                        Forgot Password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Login <ArrowRight className="h-4 w-4" />
                    </button>

                    <p className="pt-1 text-center text-sm text-stone-600">
                      Don&apos;t have an account?{' '}
                      <Link href="/signup" className="font-semibold text-stone-900 hover:text-amber-700">
                        Sign up
                      </Link>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleReset} className="space-y-4">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-stone-700">New Password</span>
                      <div className="w-full px-4 py-3 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-amber-400 flex items-center gap-3">
                        <LockKeyhole className="h-4 w-4 text-stone-400" />
                        <input
                          className="w-full bg-transparent text-sm outline-none"
                          type={showNewPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((v) => !v)}
                          className="text-stone-400 hover:text-stone-700"
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-stone-700">Confirm Password</span>
                      <div className="w-full px-4 py-3 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-amber-400 flex items-center gap-3">
                        <LockKeyhole className="h-4 w-4 text-stone-400" />
                        <input
                          className="w-full bg-transparent text-sm outline-none"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="text-stone-400 hover:text-stone-700"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Reset Password <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </motion.main>
  );
}


