'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, AlertCircle, CheckCircle } from 'lucide-react';

interface QRLoginProps {
  onLoginSuccess: () => void;
}

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | null;
  message: string;
}

export const QRLogin: React.FC<QRLoginProps> = ({ onLoginSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null, message: '' });

  const processToken = async (token: string) => {
    setIsProcessing(true);
    setModal({ isOpen: false, type: null, message: '' });

    try {
      // Simulasi verifikasi API
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (token === 'TOKEN_VALID') {
        setModal({
          isOpen: true,
          type: 'success',
          message: 'Akses Diberikan. Memuat sistem...',
        });

        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          message: 'Token tidak ditemukan atau sudah digunakan.',
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        message: 'Terjadi kesalahan sistem saat memverifikasi.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let currentScannedCode = '';
    let timeoutId: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter') {
        if (currentScannedCode.length > 0 && !isProcessing && !modal.isOpen) {
          processToken(currentScannedCode);
          currentScannedCode = '';
        }
      } else if (e.key.length === 1) {
        currentScannedCode += e.key;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          currentScannedCode = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [isProcessing, modal.isOpen]);

  const closeModal = () => setModal({ ...modal, isOpen: false });

  return (
    <div className="min-h-screen bg-[#121212] font-[Poppins] flex items-center justify-center p-4 text-white">
      <div className="relative w-full max-w-md bg-[#1A1A1A] border border-zinc-800 rounded-3xl p-10 flex flex-col items-center shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="mb-8 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-inner">
          <QrCode
            size={64}
            className={`text-zinc-400 ${isProcessing ? 'animate-pulse text-indigo-400' : ''}`}
            strokeWidth={1.5}
          />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-center">
          Otentikasi Sistem
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed">
          Arahkan kode QR Anda ke mesin pemindai untuk masuk ke dalam portal.
        </p>

        <div className="flex items-center space-x-3 bg-zinc-900/50 px-5 py-3 rounded-full border border-zinc-800 w-full justify-center transition-colors">
          {isProcessing ? (
            <>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span className="text-sm text-indigo-400 ml-2 font-medium">Memverifikasi Data...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-sm text-zinc-400 font-medium tracking-wide">Menunggu Pemindaian</span>
            </>
          )}
        </div>
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              {modal.type === 'error' ? (
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
              )}

              <h3 className="text-xl font-semibold mb-2">
                {modal.type === 'error' ? 'Akses Ditolak' : 'Akses Diberikan'}
              </h3>

              <p className="text-sm text-zinc-400 mb-6">{modal.message}</p>

              {modal.type === 'error' && (
                <button
                  onClick={closeModal}
                  className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};