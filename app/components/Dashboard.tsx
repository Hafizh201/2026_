'use client';

import React from 'react';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#121212] text-white p-8 font-[Poppins]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">Dashboard Utama</h1>
        <p className="text-zinc-400 mt-2">Akses berhasil diverifikasi via QR Code.</p>
      </div>
    </div>
  );
};