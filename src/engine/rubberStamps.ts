/**
 * Dynamic Rubber Stamp & Seal SVG Generator Engine
 * Generates realistic vintage, distressed, double-bordered and badge stamps.
 */

export interface RubberStampConfig {
  id: string;
  title: string;
  subtitle?: string;
  dateText?: string;
  color: string;
  style: 'boxed' | 'circular' | 'double-rect' | 'badge' | 'stars';
  rotationDeg: number;
  distressed?: boolean;
}

export interface PresetRubberStamp {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  color: string;
  style: 'boxed' | 'circular' | 'double-rect' | 'badge' | 'stars';
  rotationDeg: number;
  category: 'damga';
}

export const PRESET_RUBBER_STAMPS: PresetRubberStamp[] = [
  {
    id: 'stamp_approved',
    name: 'ONAYLANDI (Approved)',
    title: 'ONAYLANDI',
    subtitle: 'KONTROL EDİLDİ',
    color: '#059669', // Emerald
    style: 'double-rect',
    rotationDeg: -12,
    category: 'damga',
  },
  {
    id: 'stamp_urgent',
    name: 'ÖNEMLİ (Urgent)',
    title: 'ÖNEMLİ!',
    subtitle: 'ÖNCELİKLİ KONU',
    color: '#dc2626', // Crimson red
    style: 'boxed',
    rotationDeg: 8,
    category: 'damga',
  },
  {
    id: 'stamp_solved',
    name: 'ÇÖZÜLDÜ (Solved)',
    title: 'ÇÖZÜLDÜ',
    subtitle: 'TAMAMLANDI ✓',
    color: '#4f46e5', // Indigo
    style: 'circular',
    rotationDeg: -6,
    category: 'damga',
  },
  {
    id: 'stamp_draft',
    name: 'TASLAK (Draft)',
    title: 'TASLAK',
    subtitle: 'REVİZYON BEKLİYOR',
    color: '#d97706', // Amber
    style: 'double-rect',
    rotationDeg: 14,
    category: 'damga',
  },
  {
    id: 'stamp_confidential',
    name: 'GİZLİ (Confidential)',
    title: 'GİZLİDİR',
    subtitle: 'ÖZEL DERS NOTU',
    color: '#991b1b', // Dark red
    style: 'boxed',
    rotationDeg: -10,
    category: 'damga',
  },
  {
    id: 'stamp_reviewed',
    name: 'İNCELENDİ (Reviewed)',
    title: 'İNCELENDİ',
    subtitle: 'DERS NOTLARI',
    color: '#0284c7', // Sky Blue
    style: 'circular',
    rotationDeg: 5,
    category: 'damga',
  },
  {
    id: 'stamp_excellent',
    name: 'AFERİN ★★★★★',
    title: 'AFERİN!',
    subtitle: 'MÜKEMMEL ÇALIŞMA',
    color: '#ea580c', // Orange
    style: 'stars',
    rotationDeg: -8,
    category: 'damga',
  },
  {
    id: 'stamp_warning',
    name: 'DİKKAT (Exam Warning)',
    title: 'SINAVDA ÇIKAR!',
    subtitle: 'YILDIZLI SORU ★',
    color: '#e11d48', // Rose
    style: 'badge',
    rotationDeg: 11,
    category: 'damga',
  },
];

/**
 * Generate full SVG markup for a customized rubber stamp
 */
export function generateRubberStampSVG(config: RubberStampConfig): string {
  const { title, subtitle, dateText, color, style, rotationDeg, distressed = true } = config;
  const stampWidth = 240;
  const stampHeight = 110;

  // Mask / Grunge filter definition for realistic stamp ink bleed and texture
  const grungeFilter = distressed
    ? `
    <filter id="grunge_${config.id}" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
    </filter>`
    : '';

  const filterAttr = distressed ? `filter="url(#grunge_${config.id})"` : '';

  let innerContent = '';

  if (style === 'circular') {
    const size = 150;
    const center = size / 2;
    const radius = 64;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="transform: rotate(${rotationDeg}deg); transform-origin: center; display: block; overflow: visible;">
        <defs>${grungeFilter}</defs>
        <g ${filterAttr} stroke="${color}" fill="none">
          <!-- Outer circle -->
          <circle cx="${center}" cy="${center}" r="${radius}" stroke-width="4.5" stroke-dasharray="140 2" />
          <!-- Inner circle -->
          <circle cx="${center}" cy="${center}" r="${radius - 8}" stroke-width="2" />
          <!-- Center divider lines -->
          <line x1="${center - 50}" y1="${center - 15}" x2="${center + 50}" y2="${center - 15}" stroke-width="1.8" />
          <line x1="${center - 50}" y1="${center + 15}" x2="${center + 50}" y2="${center + 15}" stroke-width="1.8" />
        </g>
        <!-- Center Title -->
        <text x="${center}" y="${center + 4}" fill="${color}" font-family="'Impact', 'Arial Black', sans-serif" font-size="16" font-weight="900" text-anchor="middle" letter-spacing="2" ${filterAttr}>
          ${escapeXml(title)}
        </text>
        ${
          subtitle
            ? `<text x="${center}" y="${center - 25}" fill="${color}" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle" letter-spacing="1.5" ${filterAttr}>
                ★ ${escapeXml(subtitle)} ★
               </text>`
            : ''
        }
        ${
          dateText
            ? `<text x="${center}" y="${center + 32}" fill="${color}" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle" ${filterAttr}>
                ${escapeXml(dateText)}
               </text>`
            : ''
        }
      </svg>
    `.trim();
  } else if (style === 'double-rect') {
    innerContent = `
      <!-- Double rounded border -->
      <rect x="6" y="6" width="${stampWidth - 12}" height="${stampHeight - 12}" rx="14" fill="none" stroke="${color}" stroke-width="4" stroke-opacity="0.9" />
      <rect x="12" y="12" width="${stampWidth - 24}" height="${stampHeight - 24}" rx="9" fill="none" stroke="${color}" stroke-width="1.8" stroke-opacity="0.9" />
      
      <!-- Stamp Main Text -->
      <text x="${stampWidth / 2}" y="${subtitle ? 52 : 62}" fill="${color}" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-weight="900" text-anchor="middle" letter-spacing="3" text-transform="uppercase">
        ${escapeXml(title)}
      </text>

      ${
        subtitle
          ? `<text x="${stampWidth / 2}" y="78" fill="${color}" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle" letter-spacing="2">
              ★ ${escapeXml(subtitle)} ★
             </text>`
          : ''
      }

      ${
        dateText
          ? `<text x="${stampWidth / 2}" y="95" fill="${color}" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle">
              ${escapeXml(dateText)}
             </text>`
          : ''
      }
    `;
  } else if (style === 'badge') {
    innerContent = `
      <!-- Heavy polygon badge border -->
      <rect x="6" y="6" width="${stampWidth - 12}" height="${stampHeight - 12}" rx="6" fill="none" stroke="${color}" stroke-width="4.5" stroke-dasharray="32 3 8 3" />
      <line x1="16" y1="20" x2="${stampWidth - 16}" y2="20" stroke="${color}" stroke-width="1.5" />
      <line x1="16" y1="${stampHeight - 20}" x2="${stampWidth - 16}" y2="${stampHeight - 20}" stroke="${color}" stroke-width="1.5" />

      <text x="${stampWidth / 2}" y="${subtitle ? 54 : 64}" fill="${color}" font-family="'Impact', 'Arial Black', sans-serif" font-size="26" font-weight="900" text-anchor="middle" letter-spacing="2.5">
        ${escapeXml(title)}
      </text>

      ${
        subtitle
          ? `<text x="${stampWidth / 2}" y="78" fill="${color}" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">
              ${escapeXml(subtitle)}
             </text>`
          : ''
      }
    `;
  } else if (style === 'stars') {
    innerContent = `
      <!-- Rounded capsule stamp with 5 stars -->
      <rect x="6" y="6" width="${stampWidth - 12}" height="${stampHeight - 12}" rx="24" fill="none" stroke="${color}" stroke-width="3.5" />
      
      <text x="${stampWidth / 2}" y="32" fill="${color}" font-size="12" text-anchor="middle" letter-spacing="4">
        ★★★★★
      </text>

      <text x="${stampWidth / 2}" y="64" fill="${color}" font-family="'Impact', 'Arial Black', sans-serif" font-size="28" font-weight="900" text-anchor="middle" letter-spacing="3">
        ${escapeXml(title)}
      </text>

      ${
        subtitle
          ? `<text x="${stampWidth / 2}" y="86" fill="${color}" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="1.5">
              ${escapeXml(subtitle)}
             </text>`
          : ''
      }
    `;
  } else {
    // Standard Boxed
    innerContent = `
      <rect x="6" y="6" width="${stampWidth - 12}" height="${stampHeight - 12}" rx="4" fill="none" stroke="${color}" stroke-width="5" stroke-opacity="0.9" />
      
      <text x="${stampWidth / 2}" y="${subtitle ? 56 : 64}" fill="${color}" font-family="'Impact', 'Arial Black', sans-serif" font-size="30" font-weight="900" text-anchor="middle" letter-spacing="3" text-transform="uppercase">
        ${escapeXml(title)}
      </text>

      ${
        subtitle
          ? `<text x="${stampWidth / 2}" y="82" fill="${color}" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle" letter-spacing="2">
              [ ${escapeXml(subtitle)} ]
             </text>`
          : ''
      }

      ${
        dateText
          ? `<text x="${stampWidth - 16}" y="98" fill="${color}" font-family="monospace" font-size="8" font-weight="bold" text-anchor="end">
              ${escapeXml(dateText)}
             </text>`
          : ''
      }
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${stampWidth} ${stampHeight}" width="${stampWidth}" height="${stampHeight}" style="transform: rotate(${rotationDeg}deg); transform-origin: center; display: block; overflow: visible;">
      <defs>${grungeFilter}</defs>
      <g ${filterAttr}>
        ${innerContent}
      </g>
    </svg>
  `.trim();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
