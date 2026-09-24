'use client';

import React, { useState } from 'react';
import { QRLogin } from './components/QRLogin';
import { Dashboard } from './components/Dashboard';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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