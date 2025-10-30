'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface EnvironmentInfo {
  environment: {
    type: 'production' | 'preview' | 'development';
    name: string;
    pr_number: string | null;
  };
  deployment: {
    timestamp: string;
    api_url: string;
    frontend_url: string;
  };
  database: {
    host: string;
    name: string;
  };
  test_change: string;
}

export default function Home() {
  const [apiUrl, setApiUrl] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo | null>(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    setApiUrl(baseUrl);

    // Check backend health
    fetch(`${baseUrl}/health`)
      .then(res => res.json())
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));

    // Fetch environment info
    fetch(`${baseUrl}/api/environment`)
      .then(res => res.json())
      .then(data => setEnvInfo(data))
      .catch(err => console.error('Failed to fetch environment info:', err));
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

        {/* Environment Info Banner */}
        {envInfo && (
          <div className={`mb-8 p-6 rounded-lg border-2 ${
            envInfo.environment.type === 'preview'
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
              : envInfo.environment.type === 'production'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {envInfo.environment.type === 'preview' ? '🚀' :
                   envInfo.environment.type === 'production' ? '🏭' : '🔧'}
                </span>
                <div>
                  <h2 className="text-2xl font-bold">
                    {envInfo.environment.name} Environment
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {envInfo.environment.type === 'preview'
                      ? 'This is a PR preview deployment - changes are isolated!'
                      : envInfo.environment.type === 'production'
                      ? 'Production deployment'
                      : 'Local development environment'}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full font-semibold ${
                envInfo.environment.type === 'preview'
                  ? 'bg-purple-500 text-white'
                  : envInfo.environment.type === 'production'
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}>
                {envInfo.environment.type.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-white dark:bg-gray-800 rounded">
                <span className="font-semibold">API URL:</span>
                <p className="text-gray-600 dark:text-gray-400 break-all">
                  {envInfo.deployment.api_url}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded">
                <span className="font-semibold">Database:</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {envInfo.database.host} / {envInfo.database.name}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-green-500">
              <p className="font-semibold text-green-600 dark:text-green-400">✓ Test Change Detected</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{envInfo.test_change}</p>
            </div>
          </div>
        )}

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
