'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, Clock3, RotateCw, UserRound, Vote, X } from 'lucide-react';
import { QRLogin } from './components/QRLogin';
import { SchoolLogo } from './components/SchoolLogo';

type Candidate = { id: number; nama: string; photo: string; ketua: string; wakil: string };
type CandidateDetails = { visi: string; misi: string[]; proker: string[] };

const candidateDetails: Record<number, CandidateDetails> = {
  1: {
    visi: 'Menjadikan OSIS SMPIT Abu Bakar Fullday School sebagai sarana dakwah dan wadah aspirasi siswa dalam mengasah jiwa kepemimpinan yang berakhlak mulia, berprestasi, berbudaya, dan unggul dalam teknologi.',
    misi: ['Menumbuhkan akhlak mulia melalui kegiatan berbagi kepada lingkungan sekitar.', 'Mengembangkan jiwa kepemimpinan yang tangguh, disiplin, dan tanggung jawab melalui program Leadership Day.', 'Mendorong siswa untuk berprestasi dalam bidang akademik maupun non-akademik dengan CoC ala ABY.', 'Mengembangkan minat dan bakat siswa di bidang teknologi melalui kegiatan Digital Corner atau mading digital.'],
    proker: ['Tangan Harapan: aksi berbagi makanan kepada lingkungan sekitar sebagai wujud kepedulian dan solidaritas.', 'COC ala ABY: kompetisi antarkelas untuk menunjukkan bakat, kemampuan, dan sportivitas.', 'Leadership Day: pelatihan kepemimpinan untuk public speaking, manajemen organisasi, dan teamwork.', 'Digital Corner: media OSIS untuk menambah wawasan digital siswa secara santai, kreatif, dan mudah diakses.'],
  },
  2: {
    visi: 'Mewujudkan OSIS SMPIT Abu Bakar Fullday School sebagai tempat berproses siswa yang kreatif, inovatif, dan berwawasan global melalui teknologi dan bahasa Inggris, serta menghadirkan kegiatan positif dan inspiratif bagi sekolah.',
    misi: ['Mengembangkan kreativitas, inovasi, dan kemampuan adaptif siswa melalui pemanfaatan Teknologi Informatika sebagai sarana belajar, berkarya, dan meraih prestasi.', 'Menjadikan OSIS sebagai wadah kolaborasi untuk pengembangan minat dan bakat siswa dalam berbahasa Inggris melalui kegiatan yang bermanfaat, menyenangkan, dan berdampak positif.', 'Menciptakan lingkungan organisasi yang terbuka dan suportif untuk menumbuhkan ide-ide baru, memperkuat ukhuwah, membangun karakter, serta meningkatkan prestasi siswa.'],
    proker: ['Pentas seni berbahasa Inggris setiap enam bulan.', 'Global Chat bersama organisasi English 1 atau American Field Service Intercultural Program.', 'Digital Creativity: pelatihan desain grafis, editing foto/video, pembuatan game, animasi, poster, dan website sederhana.', 'E-Library: mading online yang diunggah ke web sekolah setiap dua bulan.'],
  },
  3: {
    visi: 'Mewujudkan OSIS sebagai ruang tumbuh yang berkarakter, aktif, dan mampu menyatukan seluruh siswa dalam kegiatan sekolah yang bermanfaat.',
    misi: ['Membangun budaya sekolah yang ramah, disiplin, dan saling menghargai.', 'Mendorong partisipasi siswa dalam kegiatan kreatif, sosial, dan olahraga.', 'Membuka ruang aspirasi siswa melalui komunikasi yang terbuka dan bertanggung jawab.'],
    proker: ['Student Voice: wadah aspirasi siswa yang rutin dan terbuka.', 'Class Collaboration: kegiatan kolaborasi antarkelas dalam bidang seni dan olahraga.', 'School Care: gerakan kepedulian untuk menjaga kebersihan dan kenyamanan sekolah.'],
  },
};

const candidateTone = (id: number) => id === 1 ? 'candidate-tone-blue' : id === 2 ? 'candidate-tone-coral' : 'candidate-tone-slate';

const idleSlides = ['/images/slide-1.jpg', '/images/slide-2.jpg', '/images/slide-3.jpg'];
const timeoutSoundPath = '/sounds/pemilihan-berakhir.mp3';

function IdleSlideshow({ onWake }: { onWake: () => void }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const currentSlide = idleSlides[slideIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlideIndex((index) => (index + 1) % idleSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onWake, { passive: true });
    window.addEventListener('pointerdown', onWake, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onWake);
      window.removeEventListener('pointerdown', onWake);
    };
  }, [onWake]);

  return (
    <main className="idle-shell" aria-label="Tampilan siaga pemilihan">
      {failedImage !== currentSlide ? (
        <Image
          key={currentSlide}
          src={currentSlide}
          alt=""
          fill
          sizes="100vw"
          unoptimized
          className="idle-image"
          onError={() => setFailedImage(currentSlide)}
        />
      ) : <div className="idle-image-fallback" aria-hidden="true" />}
      <div className="idle-scrim" aria-hidden="true" />
      <header className="idle-brand">
        <span className="brand-symbol"><Vote size={20} strokeWidth={1.8} /></span>
        <span className="brand-copy"><span className="brand-name">PEMILOS</span><span className="brand-school">SMPIT Abu Bakar Fullday School</span></span>
      </header>
      <section className="idle-prompt" aria-live="polite">
        <p className="eyebrow">PILKETOS 2025 · LAYAR SIAGA</p>
        <h1>Suara Anda<br /><span>menentukan masa depan.</span></h1>
        <p>Sentuh layar atau gerakkan mouse untuk memulai.</p>
        <div className="idle-slide-status">
          <span>{String(slideIndex + 1).padStart(2, '0')} / {String(idleSlides.length).padStart(2, '0')}</span>
          <span className="idle-progress"><span key={slideIndex} className="idle-progress-fill" /></span>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  const [step, setStep] = useState<'scan' | 'vote'>('scan');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tokenNumber, setTokenNumber] = useState('—');
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);
  const [confirmingCandidate, setConfirmingCandidate] = useState<Candidate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [voteWasAlreadyRecorded, setVoteWasAlreadyRecorded] = useState(false);
  const [showIdle, setShowIdle] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [failedPhotoIds, setFailedPhotoIds] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(3 * 60);
  const [showTimeoutNotice, setShowTimeoutNotice] = useState(false);
  const [hasSeenCountdown, setHasSeenCountdown] = useState(false);
  const [isCountdownFloating, setIsCountdownFloating] = useState(false);
  const [floatingCountdownPosition, setFloatingCountdownPosition] = useState({ top: 116, left: 0 });
  const timeoutSoundPlayed = useRef(false);
  const countdownAnchorRef = useRef<HTMLDivElement | null>(null);
  const countdownRef = useRef<HTMLElement | null>(null);

  const loadCandidates = async () => {
    setIsLoadingCandidates(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/candidates', { cache: 'no-store' });
      const data = await response.json() as { candidates?: Candidate[]; message?: string };
      if (!response.ok) throw new Error(data.message || 'Data paslon belum dapat dimuat.');
      setCandidates(data.candidates ?? []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Data paslon belum dapat dimuat.');
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (response.ok && isMounted) {
          const session = await response.json() as { tokenNumber?: string };
          if (isMounted) setTokenNumber(session.tokenNumber || '—');
          await loadCandidates();
          if (isMounted) setStep('vote');
        }
      } catch (error) {
        console.error('Failed to check session', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void checkSession();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (step !== 'vote' || secondsRemaining <= 0 || submitted) return;
    const timer = window.setInterval(() => setSecondsRemaining((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsRemaining, submitted]);

  useEffect(() => {
    if (step !== 'vote' || submitted || isSubmitting) return;

    const updateCountdownPosition = () => {
      const anchor = countdownAnchorRef.current;
      const countdown = countdownRef.current;
      if (!anchor || !countdown) return;

      const anchorBounds = anchor.getBoundingClientRect();
      const isInView = anchorBounds.bottom > 0 && anchorBounds.top < window.innerHeight;

      if (isInView) {
        setHasSeenCountdown(true);
        setIsCountdownFloating(false);
        return;
      }

      if (!hasSeenCountdown) return;

      const panelWidth = 132;
      const panelHeight = 330;
      const margin = 24;
      const clearance = 10;
      const maxTop = Math.max(margin, window.innerHeight - panelHeight - margin);
      const candidateLeft = Math.max(margin, window.innerWidth - panelWidth - margin);
      const candidateTops: number[] = [];

      for (let top = maxTop; top >= margin; top -= 20) candidateTops.push(top);
      if (candidateTops.length === 0 || candidateTops[candidateTops.length - 1] > margin) candidateTops.push(margin);

      const cardButtons = Array.from(document.querySelectorAll<HTMLElement>('.candidate-card button'))
        .map((button) => button.getBoundingClientRect())
        .filter((bounds) => bounds.width > 0 && bounds.height > 0);

      let safePosition: { top: number; left: number } | undefined;
      for (const top of candidateTops) {
        const overlapsCardButton = cardButtons.some((button) =>
          candidateLeft < button.right + clearance && candidateLeft + panelWidth > button.left - clearance &&
          top < button.bottom + clearance && top + panelHeight > button.top - clearance
        );
        if (!overlapsCardButton) {
          safePosition = { top, left: candidateLeft };
          break;
        }
      }

      const nextPosition = safePosition;
      if (nextPosition) {
        setFloatingCountdownPosition((current) =>
          current.top === nextPosition.top && current.left === nextPosition.left ? current : nextPosition
        );
        setIsCountdownFloating(true);
      } else {
        setIsCountdownFloating(false);
      }
    };

    window.addEventListener('scroll', updateCountdownPosition, { passive: true });
    window.addEventListener('resize', updateCountdownPosition);
    updateCountdownPosition();
    return () => {
      window.removeEventListener('scroll', updateCountdownPosition);
      window.removeEventListener('resize', updateCountdownPosition);
    };
  }, [step, submitted, isSubmitting, hasSeenCountdown]);

  useEffect(() => {
    if (secondsRemaining !== 0 || timeoutSoundPlayed.current) return;

    timeoutSoundPlayed.current = true;
    setShowTimeoutNotice(true);
    const alertSound = new Audio(timeoutSoundPath);
    void alertSound.play().catch(() => undefined);
    const timer = window.setTimeout(() => setShowTimeoutNotice(false), 8000);
    return () => window.clearTimeout(timer);
  }, [secondsRemaining]);

  useEffect(() => {
    if (!submitted) return;
    const timer = window.setTimeout(() => setShowIdle(true), 8000);
    return () => window.clearTimeout(timer);
  }, [submitted]);

  const submitVote = async () => {
    if (!confirmingCandidate || isSubmitting || submitted || secondsRemaining === 0) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: confirmingCandidate.id }),
      });
      const data = await response.json() as { message?: string; alreadyRecorded?: boolean };
      if (response.status === 409 && data.alreadyRecorded) {
        setConfirmingCandidate(null);
        setVoteWasAlreadyRecorded(true);
        setIsSubmitting(false);
        setSubmitted(true);
        return;
      }
      if (!response.ok) throw new Error(data.message || 'Suara belum dapat disimpan.');
      setConfirmingCandidate(null);
      setVoteWasAlreadyRecorded(false);
      setIsSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Suara belum dapat disimpan.');
      setIsSubmitting(false);
    }
  };

  const handleLoginSuccess = async () => {
    const [session] = await Promise.all([
      fetch('/api/auth/me', { cache: 'no-store' })
        .then(async (response) => response.ok ? await response.json() as { tokenNumber?: string } : null)
        .catch(() => null),
      loadCandidates(),
    ]);
    setTokenNumber(session?.tokenNumber || '—');
    setSecondsRemaining(3 * 60);
    setShowTimeoutNotice(false);
    setHasSeenCountdown(false);
    setIsCountdownFloating(false);
    timeoutSoundPlayed.current = false;
    window.scrollTo(0, 0);
    setIsSubmitting(false);
    setErrorMessage('');
    setExpandedCandidate(null);
    setConfirmingCandidate(null);
    setSubmitted(false);
    setVoteWasAlreadyRecorded(false);
    setShowIdle(false);
    setStep('vote');
  };

  const logoutSession = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Sesi belum dapat dihapus. Silakan coba lagi.');

      setTokenNumber('—');
      setSecondsRemaining(3 * 60);
      setHasSeenCountdown(false);
      setIsCountdownFloating(false);
      timeoutSoundPlayed.current = false;
      setExpandedCandidate(null);
      setConfirmingCandidate(null);
      setSubmitted(false);
      setVoteWasAlreadyRecorded(false);
      setShowIdle(false);
      setStep('scan');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sesi belum dapat dihapus. Silakan coba lagi.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const wakeForNextVoter = () => {
    setShowIdle(false);
    setSubmitted(false);
    setIsSubmitting(false);
    setStep('scan');
  };

  if (isLoading) {
    return <main className="app-shell flex min-h-screen items-center justify-center"><div className="loading-mark" role="status" aria-label="Memuat aplikasi" /></main>;
  }

  if (isSubmitting) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-5 py-12">
        <section className="pending-panel motion-enter" role="status" aria-live="polite">
          <span className="pending-spinner" aria-hidden="true" />
          <p className="eyebrow">PENCATATAN SUARA</p>
          <h1>Suara sedang disimpan.</h1>
          <p>Mohon tetap di bilik pemilihan. Kami akan menampilkan konfirmasi setelah server memastikan suara tercatat.</p>
        </section>
      </main>
    );
  }

  if (showIdle) return <IdleSlideshow onWake={wakeForNextVoter} />;

  if (step === 'scan') return <QRLogin onLoginSuccess={handleLoginSuccess} />;

  if (submitted) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-12">
        <section className="success-panel motion-enter w-full max-w-lg text-center">
          <div className="success-mark mx-auto mb-6"><Check size={30} strokeWidth={2.5} /></div>
          <p className="eyebrow mb-3">PILKETOS 2025 · SUARA TERCATAT</p>
          <h1 className="mb-3 text-3xl font-semibold text-ink sm:text-4xl">{voteWasAlreadyRecorded ? 'Suara sudah tercatat.' : 'Terima kasih sudah memilih.'}</h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted">{voteWasAlreadyRecorded ? 'Token ini telah memiliki suara tercatat sebelumnya. Pilihan tidak dapat diubah.' : 'Pilihan Anda telah direkam dengan aman dan tidak dapat diubah kembali.'}</p>
          <p className="success-exit-note">Silakan meninggalkan bilik pemilihan untuk memberi kesempatan kepada pemilih berikutnya.</p>
          <div className="success-rule mt-8" />
        </section>
      </main>
    );
  }

  const seconds = secondsRemaining % 60;
  const days = Math.floor(secondsRemaining / 86400);
  const detailedHours = Math.floor((secondsRemaining % 86400) / 3600);
  const detailedMinutes = Math.floor((secondsRemaining % 3600) / 60);
  const noticeMessage = errorMessage && showTimeoutNotice
    ? `${errorMessage} Waktu pemilihan juga telah berakhir.`
    : errorMessage || (showTimeoutNotice ? 'Waktu pemilihan telah berakhir. Pilihan baru tidak dapat dikirim.' : '');
  const noticeIsTimeout = !errorMessage && showTimeoutNotice;

  return (
    <main className="app-shell min-h-screen">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand-lockup">
            <button type="button" className="brand-logo-button" onClick={() => void logoutSession()} disabled={isLoggingOut} aria-label="Hapus sesi dan kembali ke pemindai QR" title="Klik logo untuk menghapus sesi">
              <SchoolLogo />
            </button>
            <span className="brand-copy"><span className="brand-name">Pilketos 2025</span><span className="brand-school">SMPIT Abu Bakar Fullday School</span></span>
          </div>
          <div className="session-indicator"><span className="session-dot" /><span className="session-label">NOMOR TOKEN</span><strong className="session-token">{tokenNumber}</strong></div>
        </div>
      </header>

      {noticeMessage && <div className={`app-notice ${noticeIsTimeout ? 'is-warning' : 'is-error'}`} role={errorMessage ? 'alert' : 'status'} aria-live={errorMessage ? 'assertive' : 'polite'}>
        <span className="app-notice-icon" aria-hidden="true">{noticeIsTimeout ? <Clock3 size={18} /> : <ShieldCheck size={18} />}</span>
        <span className="app-notice-copy"><strong>{noticeIsTimeout ? 'PEMILIHAN BERAKHIR' : 'PERLU PERHATIAN'}</strong><span>{noticeMessage}</span></span>
        {errorMessage && candidates.length === 0 && <button type="button" onClick={() => void loadCandidates()} disabled={isLoadingCandidates} className="app-notice-action"><RotateCw size={15} className={isLoadingCandidates ? 'animate-spin' : ''} />{isLoadingCandidates ? 'Memuat...' : 'Coba lagi'}</button>}
      </div>}

      <section className="election-intro" id="top">
        <div className="intro-copy">
          <p className="eyebrow">PEMILIHAN OSIS · 2025</p>
          <h1>PEMILIHAN KETUA OSIS</h1>
          <p className="intro-description">Satu suara ikut menentukan arah organisasi sekolah. Kenali setiap pasangan calon, lalu pilih dengan bijak.</p>
        </div>
      </section>

      <section className="ballot-section" aria-label="Surat suara digital">
        <div className="section-heading">
          <div><p className="eyebrow section-eyebrow">SURAT SUARA DIGITAL</p><p className="section-description">Silakan membaca visi, misi, dan proker terlebih dahulu secara saksama sebelum memilih.</p></div>
          <span className="candidate-count">{String(candidates.length).padStart(2, '0')} PASLON</span>
        </div>

        {isLoadingCandidates ? <div className="candidate-loading" role="status"><span className="loading-mark" /><span>Memuat data pasangan calon...</span></div> : candidates.length === 0 ? (
          <div className="empty-state"><span className="empty-symbol"><Vote size={22} /></span><h3>Data paslon belum tersedia</h3><p>Silakan coba muat ulang dalam beberapa saat.</p><button type="button" onClick={() => void loadCandidates()} className="secondary-button"><RotateCw size={15} /> Muat ulang</button></div>
        ) : (
          <div className="candidate-grid">
            {candidates.map((candidate, index) => {
              const details = candidateDetails[candidate.id] ?? { visi: 'Belum tersedia', misi: [], proker: [] };
              const isLocked = isSubmitting || submitted || secondsRemaining === 0;
              const hasPhoto = Boolean(candidate.photo) && !failedPhotoIds.includes(candidate.id);
              const isExpanded = expandedCandidate === candidate.id;
              return (
                <article key={candidate.id} className={`candidate-card ${candidateTone(candidate.id)} motion-enter`} style={{ animationDelay: `${index * 90}ms` }}>
                  <div className="candidate-photo-wrap">
                    {hasPhoto ? <Image src={candidate.photo} alt={`Foto ${candidate.nama}, Paslon ${String(candidate.id).padStart(2, '0')}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" loading={index === 0 ? 'eager' : 'lazy'} className="candidate-photo" onError={() => setFailedPhotoIds((ids) => [...ids, candidate.id])} /> : <div className={`candidate-photo-fallback ${candidateTone(candidate.id)}`}><span className="fallback-number">{String(candidate.id).padStart(2, '0')}</span><span className="fallback-caption">{candidate.nama}</span></div>}
                    {hasPhoto && <div className="candidate-photo-overlay" aria-hidden="true">
                      <span className="candidate-number">{String(candidate.id).padStart(2, '0')}</span>
                      <span className="candidate-photo-caption">{candidate.nama}</span>
                    </div>}
                  </div>
                  <div className="candidate-content">
                    <div className="candidate-title-row"><div><p className="candidate-kicker">PASANGAN CALON</p><h3>{candidate.nama}</h3></div><span className="candidate-index">{String(candidate.id).padStart(2, '0')}</span></div>
                    <div className="candidate-team"><div className="team-member"><span className="team-label">KETUA</span><span className="team-name"><UserRound size={15} />{candidate.ketua || '-'}</span></div><div className="team-divider" /><div className="team-member"><span className="team-label">WAKIL</span><span className="team-name"><UserRound size={15} />{candidate.wakil || '-'}</span></div></div>
                    <button type="button" disabled={isLocked} onClick={() => { setErrorMessage(''); setConfirmingCandidate(candidate); }} className="vote-button">{isLocked ? secondsRemaining === 0 ? 'Pemilihan ditutup' : 'Pilihan sedang diproses' : `Pilih Kandidat ${candidate.id}`}</button>
                    <button type="button" aria-expanded={isExpanded} aria-controls={`candidate-details-${candidate.id}`} onClick={() => setExpandedCandidate((value) => value === candidate.id ? null : candidate.id)} className="details-toggle"><span>{isExpanded ? 'Sembunyikan visi, misi, dan proker' : 'Lihat visi, misi, dan proker'}</span><ChevronDown size={17} className={isExpanded ? 'details-chevron is-open' : 'details-chevron'} /></button>
                    {isExpanded && <div id={`candidate-details-${candidate.id}`} className="candidate-details"><div className="detail-block"><h4>Visi</h4><p>{details.visi}</p></div><div className="detail-block"><h4>Misi</h4><ul>{details.misi.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="detail-block"><h4>Program kerja</h4><ul>{details.proker.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="countdown-anchor" ref={countdownAnchorRef}>
        <section
          ref={countdownRef}
          className={`countdown-detail${isCountdownFloating ? ' is-floating' : ''}`}
          style={isCountdownFloating ? floatingCountdownPosition : undefined}
          aria-label="Sisa waktu pemilihan"
        >
          <div className="countdown-detail-inner">
            <div className="countdown-detail-heading">
              <span className="eyebrow section-eyebrow">BATAS WAKTU SESI</span>
              <h2>Waktu Tersisa Untuk Memilih</h2>
            </div>
            <div className="countdown-tiles" aria-live="polite">
              <div className="countdown-tile"><strong>{String(days).padStart(2, '0')}</strong><span>Hari</span></div>
              <div className="countdown-tile"><strong>{String(detailedHours).padStart(2, '0')}</strong><span>Jam</span></div>
              <div className="countdown-tile"><strong>{String(detailedMinutes).padStart(2, '0')}</strong><span>Menit</span></div>
              <div className="countdown-tile"><strong>{String(seconds).padStart(2, '0')}</strong><span>Detik</span></div>
            </div>
          </div>
        </section>
      </div>

      <footer className="site-footer"><span>PILKETOS 2025</span><span>OSIS SMPIT Abu Bakar Fullday School</span><span>SUARA ANDA BERARTI</span></footer>

      {confirmingCandidate && <div className="dialog-backdrop" role="presentation"><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="dialog-topline"><span className="dialog-symbol"><Vote size={20} /></span><button type="button" aria-label="Tutup konfirmasi" disabled={isSubmitting} onClick={() => setConfirmingCandidate(null)} className="icon-button"><X size={18} /></button></div><p className="eyebrow dialog-eyebrow">KONFIRMASI SUARA</p><h2 id="confirm-title">Pastikan pilihan Anda.</h2><p className="dialog-description">Anda akan memilih <strong>{confirmingCandidate.nama}</strong>. Suara yang sudah dikirim tidak dapat diubah.</p><div className="dialog-actions"><button type="button" disabled={isSubmitting} onClick={() => setConfirmingCandidate(null)} className="secondary-button">Kembali</button><button type="button" disabled={isSubmitting || secondsRemaining === 0} onClick={submitVote} className="confirm-button">{isSubmitting ? 'Menyimpan suara...' : secondsRemaining === 0 ? 'Waktu berakhir' : 'Ya, kirim suara'}{!isSubmitting && secondsRemaining > 0 && <Check size={17} />}</button></div></section></div>}
    </main>
  );
}
