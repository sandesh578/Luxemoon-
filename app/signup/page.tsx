'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Phone, User } from 'lucide-react';
import { useState } from 'react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to create account');
        return;
      }

      setSuccess('Account created. Redirecting...');
      setTimeout(() => {
        window.location.href = '/account';
      }, 700);
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
        <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
        <div className="absolute top-36 -left-24 w-64 h-64 rounded-full bg-stone-300/40 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-120px] left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full bg-white/40 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[1fr_460px] items-stretch">
            <section className="hidden lg:flex rounded-3xl border border-stone-200/80 bg-white/65 backdrop-blur-sm p-10 xl:p-12 shadow-sm flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-700">Luxe Moon</p>
                <h1 className="mt-3 text-4xl xl:text-5xl font-serif text-stone-900 leading-tight">
                  Join the
                  <br />
                  LuxeMoon Circle.
                </h1>
                <p className="mt-5 text-stone-600 max-w-md">
                  Create your account for faster checkout, order updates, and a seamless premium shopping flow.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl bg-stone-900 text-stone-100 px-4 py-3 text-sm">One-click reorder and tracking</div>
                <div className="rounded-2xl bg-white border border-stone-200 px-4 py-3 text-sm text-stone-700">Saved profile details for quick checkout</div>
              </div>
            </section>

            <section className="flex items-center justify-center">
              <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg p-8 border border-stone-200/80">
                <div className="mb-7 text-center">
                  <Link href="/" className="inline-block">
                    <span className="font-serif text-2xl tracking-wide text-stone-900">LUXE MOON</span>
                  </Link>
                  <h2 className="mt-4 text-2xl font-semibold text-stone-900">Create Account</h2>
                  <p className="mt-1 text-sm text-stone-500">Premium access, faster checkout, and order tracking.</p>
                </div>

                {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
                {success && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Field icon={<User className="h-4 w-4 text-stone-400" />} label="Name">
                    <input className="w-full bg-transparent text-sm outline-none" value={name} onChange={(e) => setName(e.target.value)} required />
                  </Field>

                  <Field icon={<Mail className="h-4 w-4 text-stone-400" />} label="Email">
                    <input className="w-full bg-transparent text-sm outline-none" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </Field>

                  <Field icon={<Phone className="h-4 w-4 text-stone-400" />} label="Phone">
                    <input className="w-full bg-transparent text-sm outline-none" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" />
                  </Field>

                  <Field icon={<LockKeyhole className="h-4 w-4 text-stone-400" />} label="Password" right={
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-stone-400 hover:text-stone-700">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }>
                    <input className="w-full bg-transparent text-sm outline-none" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                  </Field>

                  <Field icon={<LockKeyhole className="h-4 w-4 text-stone-400" />} label="Confirm Password" right={
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="text-stone-400 hover:text-stone-700">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }>
                    <input className="w-full bg-transparent text-sm outline-none" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
                  </Field>

                  <button type="submit" disabled={loading} className="w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Sign up <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="text-center text-sm text-stone-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-stone-900 hover:text-amber-700">Login</Link>
                  </p>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </motion.main>
  );
}

function Field({
  label,
  icon,
  right,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      <div className="w-full px-4 py-3 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-amber-400 flex items-center gap-3">
        {icon}
        {children}
        {right}
      </div>
    </label>
  );
}


