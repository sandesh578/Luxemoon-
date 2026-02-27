'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Use window.location for a full page navigation to ensure
        // the cookie is picked up by the server on the next request
        window.location.href = '/admin';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900 px-4">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md">
        <h1 className="font-serif text-2xl font-bold mb-6 text-center">Admin Login</h1>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full p-3 border rounded-xl"
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="w-full p-3 border rounded-xl"
            placeholder="Password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            disabled={loading}
            className="w-full p-3 bg-stone-900 text-white rounded-xl font-medium flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
}