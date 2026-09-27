'use client';

import React, { useState, useEffect } from 'react';
import { QRLogin } from './components/QRLogin';
import { Dashboard } from './components/Dashboard';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Failed to check session', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main>
      {!isAuthenticated ? (
        <QRLogin onLoginSuccess={() => setIsAuthenticated(true)} />
      ) : (
        <Dashboard />
      )}
    </main>
  );
}