'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, Clock3, RotateCw, ShieldCheck, UserRound, Vote, X } from 'lucide-react';
import { QRLogin } from './components/QRLogin';

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

const candidateTone = (id: number) => id === 1 ? 'candidate-tone-blue' : id === 2 ? 'candidate-tone-coral' : 'candidate-tone-green';

export default function Home() {
  const [step, setStep] = useState<'scan' | 'vote'>('scan');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);
  const [confirmingCandidate, setConfirmingCandidate] = useState<Candidate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [failedPhotoIds, setFailedPhotoIds] = useState<number[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(3 * 60);

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
      const data = await response.json() as { message?: string };
      if (!response.ok) throw new Error(data.message || 'Suara belum dapat disimpan.');
      setConfirmingCandidate(null);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Suara belum dapat disimpan.');
      setIsSubmitting(false);
    }
  };

  const handleLoginSuccess = async () => {
    await loadCandidates();
    setStep('vote');
  };

  if (isLoading) {
    return <main className="app-shell flex min-h-screen items-center justify-center"><div className="loading-mark" role="status" aria-label="Memuat aplikasi" /></main>;
  }

  if (step === 'scan') return <QRLogin onLoginSuccess={handleLoginSuccess} />;

  if (submitted) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-4 py-12">
        <section className="success-panel motion-enter w-full max-w-lg text-center">
          <div className="success-mark mx-auto mb-6"><Check size={30} strokeWidth={2.5} /></div>
          <p className="eyebrow mb-3">PILKETOS 2025 · SUARA TERCATAT</p>
          <h1 className="mb-3 text-3xl font-semibold text-ink sm:text-4xl">Terima kasih sudah memilih.</h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted">Pilihan Anda telah direkam dengan aman dan tidak dapat diubah kembali.</p>
          <div className="success-rule mt-8" />
        </section>
      </main>
    );
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <main className="app-shell min-h-screen">
      <header className="site-header">
        <div className="site-header-inner">
          <a className="brand-lockup" href="#top" aria-label="Pilketos 2025, beranda">
            <span className="brand-symbol"><Vote size={20} strokeWidth={1.8} /></span>
            <span className="brand-copy"><span className="brand-name">PEMILOS</span><span className="brand-school">SMPIT Abu Bakar Fullday School</span></span>
          </a>
          <div className="session-indicator"><span className="session-dot" /><ShieldCheck size={15} /><span>Sesi terverifikasi</span></div>
        </div>
      </header>

      <section className="election-intro" id="top">
        <div className="intro-copy">
          <p className="eyebrow">PEMILIHAN KETUA OSIS <span>·</span> 2025</p>
          <h1>Pilih dengan yakin.<br /><span>Pilih dengan bijak.</span></h1>
          <p className="intro-description">Kenali setiap pasangan calon dan gagasannya. Satu suara Anda ikut membentuk masa depan sekolah.</p>
        </div>
        <div className={`countdown-panel ${secondsRemaining === 0 ? 'countdown-ended' : ''}`} aria-live="polite">
          <div className="countdown-icon"><Clock3 size={19} /></div>
          <div className="countdown-copy"><span className="countdown-label">{secondsRemaining === 0 ? 'WAKTU PEMILIHAN BERAKHIR' : 'WAKTU TERSISA'}</span><span className="countdown-time">{String(minutes).padStart(2, '0')}<span>:</span>{String(seconds).padStart(2, '0')}</span></div>
          <span className="countdown-status">{secondsRemaining === 0 ? 'SELESAI' : 'BERLANGSUNG'}</span>
        </div>
      </section>

      <section className="ballot-section" aria-labelledby="ballot-heading">
        <div className="section-heading">
          <div><p className="eyebrow section-eyebrow">SURAT SUARA DIGITAL</p><h2 id="ballot-heading">Pasangan calon</h2></div>
          <span className="candidate-count">{String(candidates.length).padStart(2, '0')} PASLON</span>
        </div>

        {errorMessage && <div className="feedback-banner feedback-error" role="alert"><span>{errorMessage}</span>{candidates.length === 0 && <button type="button" onClick={() => void loadCandidates()} disabled={isLoadingCandidates} className="retry-button"><RotateCw size={15} className={isLoadingCandidates ? 'animate-spin' : ''} />{isLoadingCandidates ? 'Memuat...' : 'Coba lagi'}</button>}</div>}

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
                    {hasPhoto ? <Image src={candidate.photo} alt={`Foto ${candidate.nama}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" className="candidate-photo" onError={() => setFailedPhotoIds((ids) => [...ids, candidate.id])} /> : <div className="candidate-photo-fallback"><span className="fallback-number">{String(candidate.id).padStart(2, '0')}</span><span className="fallback-caption">PASANGAN CALON</span></div>}
                    <span className="candidate-number">PASLON {String(candidate.id).padStart(2, '0')}</span>
                  </div>
                  <div className="candidate-content">
                    <div className="candidate-title-row"><div><p className="candidate-kicker">PASANGAN CALON</p><h3>{candidate.nama}</h3></div><span className="candidate-index">{String(candidate.id).padStart(2, '0')}</span></div>
                    <div className="candidate-team"><div className="team-member"><span className="team-label">KETUA</span><span className="team-name"><UserRound size={15} />{candidate.ketua || '-'}</span></div><div className="team-divider" /><div className="team-member"><span className="team-label">WAKIL</span><span className="team-name"><UserRound size={15} />{candidate.wakil || '-'}</span></div></div>
                    <button type="button" disabled={isLocked} onClick={() => setConfirmingCandidate(candidate)} className="vote-button">{isLocked ? <><span>{secondsRemaining === 0 ? 'PEMILIHAN DITUTUP' : 'SUARA SEDANG DIPROSES'}</span><Check size={17} /></> : <><span>Pilih pasangan ini</span><span className="vote-button-icon"><Vote size={17} /></span></>}</button>
                    <button type="button" aria-expanded={isExpanded} aria-controls={`candidate-details-${candidate.id}`} onClick={() => setExpandedCandidate((value) => value === candidate.id ? null : candidate.id)} className="details-toggle"><span>Visi, misi & program kerja</span><ChevronDown size={17} className={isExpanded ? 'details-chevron is-open' : 'details-chevron'} /></button>
                    {isExpanded && <div id={`candidate-details-${candidate.id}`} className="candidate-details"><div className="detail-block"><h4>Visi</h4><p>{details.visi}</p></div><div className="detail-block"><h4>Misi</h4><ul>{details.misi.map((item) => <li key={item}>{item}</li>)}</ul></div><div className="detail-block"><h4>Program kerja</h4><ul>{details.proker.map((item) => <li key={item}>{item}</li>)}</ul></div></div>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {secondsRemaining === 0 && <div className="feedback-banner feedback-timeout" role="status"><Clock3 size={16} /><span>Waktu pemilihan telah berakhir. Tombol pilihan sudah dinonaktifkan.</span></div>}
      </section>

      <footer className="site-footer"><span>PILKETOS 2026</span><span>OSIS SMPIT Abu Bakar Fullday School</span><span>SUARA ANDA BERARTI</span></footer>

      {confirmingCandidate && <div className="dialog-backdrop" role="presentation"><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="dialog-topline"><span className="dialog-symbol"><Vote size={20} /></span><button type="button" aria-label="Tutup konfirmasi" disabled={isSubmitting} onClick={() => setConfirmingCandidate(null)} className="icon-button"><X size={18} /></button></div><p className="eyebrow dialog-eyebrow">KONFIRMASI SUARA</p><h2 id="confirm-title">Pastikan pilihan Anda.</h2><p className="dialog-description">Anda akan memilih <strong>{confirmingCandidate.nama}</strong>. Suara yang sudah dikirim tidak dapat diubah.</p><div className="dialog-actions"><button type="button" disabled={isSubmitting} onClick={() => setConfirmingCandidate(null)} className="secondary-button">Kembali</button><button type="button" disabled={isSubmitting} onClick={submitVote} className="confirm-button">{isSubmitting ? 'Menyimpan suara...' : 'Ya, kirim suara'}{!isSubmitting && <Check size={17} />}</button></div></section></div>}
    </main>
  );
}