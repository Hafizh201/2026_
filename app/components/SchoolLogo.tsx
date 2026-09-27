'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Vote } from 'lucide-react';

const schoolLogoPath = '/osis.png';

export function SchoolLogo() {
  const [hasLogo, setHasLogo] = useState(true);

  return (
    <span className={`brand-symbol${hasLogo ? ' has-school-logo' : ''}`}>
      {hasLogo ? (
        <Image
          src={schoolLogoPath}
          alt="Logo SMPIT Abu Bakar Fullday School"
          width={76}
          height={76}
          className="brand-logo-image"
          onError={() => setHasLogo(false)}
        />
      ) : (
        <Vote size={20} strokeWidth={1.8} aria-hidden="true" />
      )}
    </span>
  );
}
