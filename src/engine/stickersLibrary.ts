import { StickerItem } from '../types/notebook';

export const PRESET_STICKERS: StickerItem[] = [
  // Sticky Notes
  {
    id: 'stk_sticky_yellow',
    name: 'Sarı Yapışkan Not',
    category: 'sticky',
    width: 140,
    height: 140,
    content: `<svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="0" y="0" width="140" height="140" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="5" stdDeviation="4" flood-opacity="0.18"/>
        </filter>
      </defs>
      <rect x="8" y="8" width="124" height="124" rx="4" fill="#fef08a" filter="url(#shadow)"/>
      <path d="M 8 16 L 132 16" stroke="#fde047" stroke-width="3"/>
      <rect x="18" y="26" width="60" height="8" rx="2" fill="#ca8a04" opacity="0.3"/>
      <rect x="18" y="44" width="95" height="4" rx="2" fill="#ca8a04" opacity="0.2"/>
      <rect x="18" y="56" width="85" height="4" rx="2" fill="#ca8a04" opacity="0.2"/>
      <rect x="18" y="68" width="75" height="4" rx="2" fill="#ca8a04" opacity="0.2"/>
    </svg>`,
  },
  {
    id: 'stk_sticky_pink',
    name: 'Pembe Yapışkan Not',
    category: 'sticky',
    width: 140,
    height: 140,
    content: `<svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow2" x="0" y="0" width="140" height="140" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="5" stdDeviation="4" flood-opacity="0.18"/>
        </filter>
      </defs>
      <rect x="8" y="8" width="124" height="124" rx="4" fill="#fbcfe8" filter="url(#shadow2)"/>
      <path d="M 8 16 L 132 16" stroke="#f472b6" stroke-width="3"/>
      <rect x="18" y="26" width="60" height="8" rx="2" fill="#db2777" opacity="0.3"/>
      <rect x="18" y="44" width="95" height="4" rx="2" fill="#db2777" opacity="0.2"/>
      <rect x="18" y="56" width="85" height="4" rx="2" fill="#db2777" opacity="0.2"/>
    </svg>`,
  },
  {
    id: 'stk_sticky_cyan',
    name: 'Mavi Pastel Not',
    category: 'sticky',
    width: 140,
    height: 140,
    content: `<svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow3" x="0" y="0" width="140" height="140" filterUnits="userSpaceOnUse">
          <feDropShadow dx="2" dy="5" stdDeviation="4" flood-opacity="0.18"/>
        </filter>
      </defs>
      <rect x="8" y="8" width="124" height="124" rx="4" fill="#bae6fd" filter="url(#shadow3)"/>
      <path d="M 8 16 L 132 16" stroke="#38bdf8" stroke-width="3"/>
      <rect x="18" y="26" width="60" height="8" rx="2" fill="#0284c7" opacity="0.3"/>
      <rect x="18" y="44" width="95" height="4" rx="2" fill="#0284c7" opacity="0.2"/>
      <rect x="18" y="56" width="85" height="4" rx="2" fill="#0284c7" opacity="0.2"/>
    </svg>`,
  },

  // Washi Tapes
  {
    id: 'stk_tape_stripes',
    name: 'Çizgili Washi Bant',
    category: 'tape',
    width: 180,
    height: 40,
    content: `<svg viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="172" height="28" rx="2" fill="#fed7aa" opacity="0.9"/>
      <path d="M10 6L30 34M35 6L55 34M60 6L80 34M85 6L105 34M110 6L130 34M135 6L155 34M160 6L175 27" stroke="#fb923c" stroke-width="3"/>
    </svg>`,
  },
  {
    id: 'stk_tape_mint',
    name: 'Mint Pastel Bant',
    category: 'tape',
    width: 180,
    height: 40,
    content: `<svg viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="172" height="28" rx="2" fill="#a7f3d0" opacity="0.88"/>
      <circle cx="25" cy="20" r="4" fill="#059669" opacity="0.5"/>
      <circle cx="55" cy="20" r="4" fill="#059669" opacity="0.5"/>
      <circle cx="85" cy="20" r="4" fill="#059669" opacity="0.5"/>
      <circle cx="115" cy="20" r="4" fill="#059669" opacity="0.5"/>
      <circle cx="145" cy="20" r="4" fill="#059669" opacity="0.5"/>
    </svg>`,
  },

  // Badges & Study Icons
  {
    id: 'stk_badge_urgent',
    name: 'Önemli / Sınav Rozeti',
    category: 'icon',
    width: 120,
    height: 45,
    content: `<svg viewBox="0 0 120 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="112" height="32" rx="16" fill="#ef4444"/>
      <text x="60" y="26" fill="white" font-family="Inter, sans-serif" font-weight="700" font-size="12" text-anchor="middle">⚠️ ÖNEMLİ !</text>
    </svg>`,
  },
  {
    id: 'stk_badge_todo',
    name: 'To-Do Kontrol',
    category: 'icon',
    width: 120,
    height: 45,
    content: `<svg viewBox="0 0 120 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="112" height="32" rx="16" fill="#10b981"/>
      <text x="60" y="26" fill="white" font-family="Inter, sans-serif" font-weight="700" font-size="12" text-anchor="middle">✓ BİTTİ</text>
    </svg>`,
  },
  {
    id: 'stk_badge_formula',
    name: 'Formül Rozeti',
    category: 'icon',
    width: 120,
    height: 45,
    content: `<svg viewBox="0 0 120 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="6" width="112" height="32" rx="16" fill="#8b5cf6"/>
      <text x="60" y="26" fill="white" font-family="Inter, sans-serif" font-weight="700" font-size="12" text-anchor="middle">∑ FORMÜL</text>
    </svg>`,
  },
];
