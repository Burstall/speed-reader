'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-gray-950 border border-gray-800 rounded-xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-center mb-2">Speed Reader</h1>
          <p className="text-gray-500 text-center text-sm mb-8">
            Enter password to access
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-gray-500
                         transition-colors"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-white text-black font-medium rounded-lg
                       hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
            >
              {loading ? 'Checking...' : 'Access'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 mt-6 text-sm">
          Want access?{' '}
          <a href="mailto:stowerling@duck.com" className="text-gray-400 hover:text-white transition-colors">
            Contact me
          </a>
        </p>
      </div>
    </main>
  );
}
