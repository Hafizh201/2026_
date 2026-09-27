'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

// SVG Inline (Pengganti lucide-react jika belum diinstal)
const QrCode = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
  </svg>
);
const AlertCircle = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);
const CheckCircle = ({ className, size = 24 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

interface QRLoginProps {
  onLoginSuccess: () => void;
}

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'permission' | null;
  message: string;
}

export const QRLogin: React.FC<QRLoginProps> = ({ onLoginSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, type: null, message: '' });
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fungsi untuk menghentikan akses kamera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  const processToken = async (token: string) => {
    stopCamera(); // Hentikan pemindaian saat memproses
    setIsProcessing(true);
    setModal({ isOpen: false, type: null, message: '' });

    try {
      const response = await fetch('/api/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();

      if (response.ok && data.success) {
        setModal({
          isOpen: true,
          type: 'success',
          message: data.message || 'Akses Diberikan. Memuat sistem...',
        });

        setTimeout(() => {
          onLoginSuccess();
        }, 1200);
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          message: data.message || 'Token tidak valid.',
        });
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        message: 'Gagal terhubung ke server verifikasi.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Logika Pemindaian Kamera Tersembunyi
  const tick = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Membaca gambar menggunakan jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          console.log('[CLIENT LOG] QR Code berhasil dibaca:', code.data);
          processToken(code.data);
          return; // Hentikan loop tick saat menemukan QR
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        animationFrameId.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      setModal({
        isOpen: true,
        type: 'permission',
        message: 'Izin kamera ditolak atau kamera tidak ditemukan. Harap izinkan akses kamera di browser Anda.',
      });
    }
  };

  useEffect(() => {
    // Jalankan kamera saat komponen dimuat dan tidak ada modal yang terbuka
    if (!modal.isOpen && !isProcessing) {
      startCamera();
    }
    return () => stopCamera();
  }, [modal.isOpen, isProcessing]);

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
    // Kamera akan otomatis restart karena dependensi useEffect
  };

  return (
    <div className="min-h-screen bg-[#121212] font-[Poppins] flex items-center justify-center p-4 text-white">
      
      {/* Elemen Video & Canvas Disembunyikan Sempurna */}
      <video ref={videoRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-md bg-[#1A1A1A] border border-zinc-800 rounded-3xl p-10 flex flex-col items-center shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="mb-8 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-inner">
          <QrCode
            size={64}
            className={`text-zinc-400 ${isProcessing ? 'animate-pulse text-indigo-400' : ''}`}
          />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight mb-2 text-center">
          Otentikasi Sistem
        </h1>
        <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed">
          Sistem siap. Arahkan kode QR Anda tepat di depan kamera perangkat ini.
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
              <span className="text-sm text-zinc-400 font-medium tracking-wide">Kamera Aktif & Memindai...</span>
            </>
          )}
        </div>
      </div>

      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm bg-[#1A1A1A] border border-zinc-800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              
              {modal.type === 'error' || modal.type === 'permission' ? (
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
              )}

              <h3 className="text-xl font-semibold mb-2">
                {modal.type === 'success' ? 'Akses Diberikan' : modal.type === 'permission' ? 'Akses Kamera Ditolak' : 'Akses Ditolak'}
              </h3>

              <p className="text-sm text-zinc-400 mb-6">{modal.message}</p>

              {(modal.type === 'error' || modal.type === 'permission') && (
                <button
                  onClick={closeModal}
                  className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Tutup & Coba Lagi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};