'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Unable to send reset link');
        return;
      }
      setSuccess('If this email exists, a reset link has been sent.');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[40px] shadow-[0_20px_50px_rgba(92,58,33,0.08)] p-8 md:p-12 border border-stone-100 relative overflow-hidden">
          {/* Subtle Background Accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-50 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10">
            <div className="mb-10 text-center">
              <Link href="/" className="inline-block mb-8 group">
                <div className="flex flex-col items-center">
                  <span className="font-serif text-3xl font-bold tracking-tighter text-stone-900 uppercase group-hover:text-amber-800 transition-colors">LUXE MOON</span>
                  <div className="h-px w-8 bg-amber-700 mt-1 transition-all group-hover:w-12" />
                </div>
              </Link>
              <h2 className="text-2xl font-bold text-stone-900">Recovery</h2>
              <p className="mt-2 text-sm text-stone-500 leading-relaxed">Enter your registered email and we&apos;ll send a link to reset your password.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50/50 px-5 py-4 text-xs font-bold text-rose-600 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 text-xs font-bold text-emerald-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="w-full px-5 py-4 rounded-2xl border border-stone-100 bg-stone-50/50 focus-within:ring-2 focus-within:ring-amber-200/50 focus-within:bg-white focus-within:border-amber-200 transition-all duration-300 flex items-center gap-4 group">
                  <Mail className="h-4 w-4 text-stone-400 group-focus-within:text-amber-700 transition-colors" />
                  <input
                    className="w-full bg-transparent text-sm font-medium outline-none text-stone-900 placeholder:text-stone-300"
                    type="email"
                    autoComplete="email"
                    placeholder="e.g. your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full rounded-full bg-stone-900 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-stone-800 shadow-xl shadow-stone-900/10 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? 'Sending Link...' : 'Send Reset Link'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="pt-4 text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-900 transition-colors"
                >
                  <ArrowRight className="h-3 w-3 rotate-180" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.main>
  );
}

