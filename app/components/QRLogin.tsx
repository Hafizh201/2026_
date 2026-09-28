'use client';

import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { SchoolLogo } from './SchoolLogo';
import { AlertCircle, CheckCircle2, QrCode, ShieldCheck } from 'lucide-react';

interface QRLoginProps {
  onLoginSuccess: () => Promise<void>;
}

interface ModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'permission' | null;
  message: string;
}

export const QRLogin: React.FC<QRLoginProps> = ({ onLoginSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnteringVote, setIsEnteringVote] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
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
    setIsCameraReady(false);
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
          message: 'QR terverifikasi. Surat suara sedang disiapkan.',
        });
        setIsEnteringVote(true);
        await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        await onLoginSuccess();
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          message: data.message || 'Token tidak valid.',
        });
      }
    } catch {
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
        await videoRef.current.play();
        setIsCameraReady(true);
        animationFrameId.current = requestAnimationFrame(tick);
      }
    } catch {
      setIsCameraReady(false);
      setModal({
        isOpen: true,
        type: 'permission',
        message: 'Izin kamera ditolak atau kamera tidak ditemukan. Harap izinkan akses kamera di browser Anda.',
      });
    }
  };

  useEffect(() => {
    // Jalankan kamera saat komponen dimuat dan tidak ada modal yang terbuka
    let startTimer: number | undefined;
    if (!modal.isOpen && !isProcessing) {
      startTimer = window.setTimeout(() => { void startCamera(); }, 0);
    }
    return () => {
      if (startTimer) window.clearTimeout(startTimer);
      stopCamera();
    };
    // Scanner lifecycle is intentionally restarted only when modal/processing state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal.isOpen, isProcessing]);

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
    // Kamera akan otomatis restart karena dependensi useEffect
  };

  return (
    <main className="qr-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand-lockup">
            <SchoolLogo />
            <span className="brand-copy"><span className="brand-name">Pilketos 2025</span><span className="brand-school">SMPIT Abu Bakar Fullday School</span></span>
          </div>
          <div className="session-indicator"><ShieldCheck size={15} /><span>AKSES PEMILIH</span></div>
        </div>
      </header>

      <div className="qr-layout qr-layout-simple">
        <section className="qr-copy qr-copy-simple">
          <p className="eyebrow">PILKETOS 2025 <span>·</span> GERBANG PEMILIHAN</p>
          <h1>Silakan pindai<br /><span>QR pemilih.</span></h1>
          <p>Gunakan kode QR yang diberikan panitia untuk membuka surat suara digital.</p>
        </section>

        <section className="qr-panel qr-panel-simple" aria-label="Pemindai kode QR">
          <div className="qr-scan-instructions">
            <span className="qr-scan-icon" aria-hidden="true"><QrCode size={30} strokeWidth={1.7} /></span>
            <h2>Siap memindai</h2>
            <p>Arahkan kode QR ke kamera perangkat.</p>
          </div>
          <video ref={videoRef} className="camera-video camera-video-hidden" muted playsInline aria-hidden="true" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="qr-panel-footer">
            <span className={`camera-status ${isProcessing ? 'is-processing' : ''}`} aria-live="polite"><span className="camera-status-dot" />{isProcessing ? 'Memverifikasi kode...' : isCameraReady ? 'Pemindai aktif' : 'Menyiapkan pemindai...'}</span>
            <span className="qr-encrypted"><ShieldCheck size={13} /> AKSES TERLINDUNGI</span>
          </div>
        </section>
      </div>

      <footer className="site-footer"><span>PILKETOS 2025</span><span>PEMILIHAN KETUA OSIS</span><span>AKSES AMAN</span></footer>

      {modal.isOpen && <div className={`auth-modal-backdrop ${modal.type === 'error' || isEnteringVote ? 'is-dialog' : ''}`}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title"><div className={`auth-modal-symbol ${modal.type === 'error' || modal.type === 'permission' ? 'is-error' : 'is-success'}`}>{modal.type === 'error' || modal.type === 'permission' ? <AlertCircle size={27} /> : <CheckCircle2 size={27} />}</div>{isEnteringVote && <span className="auth-modal-loading" role="status" aria-label="Memuat surat suara" />}<h2 id="auth-modal-title">{modal.type === 'success' ? 'Akses diberikan' : modal.type === 'permission' ? 'Kamera belum tersedia' : 'QR belum terverifikasi'}</h2><p>{modal.message}</p>{(modal.type === 'error' || modal.type === 'permission') && <button type="button" onClick={closeModal} className="confirm-button">Tutup dan coba lagi</button>}</section></div>}
    </main>
  );
};
