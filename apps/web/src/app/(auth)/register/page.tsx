'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { apiPost } from '@/lib/api';
import type { AuthResponse } from '@adspy/types';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiPost<{ success: boolean; data: AuthResponse }>(
        '/api/auth/register',
        { name, email, password }
      );

      setAuth(res.data.user, res.data.tokens);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-2xl font-black gradient-text">AdSpy</span>
            </Link>
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-muted-foreground text-sm mt-1">Start with 10 free searches/day</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', value: name, setter: setName, type: 'text', placeholder: 'John Doe' },
              { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '8+ characters' },
            ].map(({ label, value, setter, type, placeholder }) => (
              <div key={label}>
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  required
                  className="mt-1 w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            ))}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-4">
            By registering, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms</a> and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>

          <p className="text-center text-muted-foreground text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
