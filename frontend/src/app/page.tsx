'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [apiUrl, setApiUrl] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    setApiUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

    // Check backend health
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then(res => res.json())
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  return (
    <main className="min-h-screen p-8 pb-20 sm:p-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Coolify Test App
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Testing PR preview environments with Coolify
          </p>
        </div>

        {/* Backend Status */}
        <div className="mb-8 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Backend Status</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">API URL: {apiUrl}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${
                backendStatus === 'checking' ? 'bg-yellow-500' :
                backendStatus === 'online' ? 'bg-green-500' :
                'bg-red-500'
              }`} />
              <span className="text-sm font-medium">
                {backendStatus === 'checking' ? 'Checking...' :
                 backendStatus === 'online' ? 'Online' :
                 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition">
            <h2 className="text-xl font-semibold mb-2">🔐 Authentication</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Test user registration and login with JWT tokens
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                Register
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-500 transition">
            <h2 className="text-xl font-semibold mb-2">✅ Todo Management</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create, update, and manage your todos
            </p>
            <Link
              href="/todos"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              View Todos
            </Link>
          </div>
        </div>

        {/* Testing Info */}
        <div className="p-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold mb-3">🧪 What This Tests</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span><strong>Service Communication:</strong> Frontend → Backend → Database</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span><strong>Container Naming:</strong> Does Coolify break service resolution?</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span><strong>Authentication Flow:</strong> JWT token validation across services</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span><strong>Database Isolation:</strong> PR-specific database instances</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">✓</span>
              <span><strong>Preview Deployments:</strong> Automatic creation and cleanup</span>
            </li>
          </ul>
        </div>

        {/* Test Accounts */}
        <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h4 className="font-semibold mb-2 text-sm">Test Accounts (after seeding):</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li><code>test@example.com</code> / <code>password123</code></li>
            <li><code>admin@example.com</code> / <code>admin123</code></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
