import i18n from '@/lib/i18n';

type PreviewType = 'analysis' | 'dsd' | 'protocol' | 'pdf';

const previews: Record<PreviewType, () => React.JSX.Element> = {
  analysis: () => (
    <svg viewBox="0 0 120 60" className="w-full h-auto" aria-hidden="true">
      {/* Camera viewfinder with scan line */}
      <rect x="10" y="5" width="100" height="50" rx="6" fill="none" stroke="currentColor" className="text-primary/20" strokeWidth="1.5" />
      {/* Corner brackets */}
      <path d="M15 10 L15 5 M15 5 L20 5" fill="none" stroke="currentColor" className="text-primary/50" strokeWidth="1.5" />
      <path d="M100 5 L105 5 M105 5 L105 10" fill="none" stroke="currentColor" className="text-primary/50" strokeWidth="1.5" />
      <path d="M105 50 L105 55 M105 55 L100 55" fill="none" stroke="currentColor" className="text-primary/50" strokeWidth="1.5" />
      <path d="M20 55 L15 55 M15 55 L15 50" fill="none" stroke="currentColor" className="text-primary/50" strokeWidth="1.5" />
      {/* Tooth silhouette */}
      <path d="M52 15c-5 0-9 4-9 9 0 4 1.5 7 3 11 1.5 4 3 9 6 12 3-3 4.5-8 6-12 1.5-4 3-7 3-11 0-5-4-9-9-9z" fill="currentColor" className="text-primary/10" stroke="currentColor" strokeWidth="1" />
      {/* Scan line */}
      <line x1="20" y1="30" x2="100" y2="30" stroke="currentColor" className="text-primary/40" strokeWidth="0.75" strokeDasharray="3 2">
        <animate attributeName="y1" values="12;48;12" dur="3s" repeatCount="indefinite" />
        <animate attributeName="y2" values="12;48;12" dur="3s" repeatCount="indefinite" />
      </line>
      {/* Detection dot */}
      <circle cx="60" cy="24" r="2" className="fill-primary/60">
        <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  ),

  dsd: () => (
    <svg viewBox="0 0 120 60" className="w-full h-auto" aria-hidden="true">
      {/* Face oval */}
      <ellipse cx="60" cy="32" rx="22" ry="26" fill="none" stroke="currentColor" className="text-primary/15" strokeWidth="1" />
      {/* Smile curve */}
      <path d="M42 38 Q51 50 60 50 Q69 50 78 38" fill="none" stroke="currentColor" className="text-primary/40" strokeWidth="1.5" />
      {/* Teeth row */}
      {[44, 49, 54, 59, 64, 69, 74].map((x) => (
        <rect key={x} x={x} y="38" width="4" height="5" rx="1" fill="currentColor" className="text-primary/20" />
      ))}
      {/* Proportion lines */}
      <line x1="60" y1="6" x2="60" y2="58" stroke="currentColor" className="text-primary/20" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="38" y1="32" x2="82" y2="32" stroke="currentColor" className="text-primary/20" strokeWidth="0.5" strokeDasharray="2 2" />
      {/* Golden ratio arc */}
      <path d="M45 20 Q60 10 75 20" fill="none" stroke="currentColor" className="text-amber-500/30" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  ),

  protocol: () => (
    <svg viewBox="0 0 120 60" className="w-full h-auto" aria-hidden="true">
      {/* Layered bars — stratification */}
      <rect x="20" y="8" width="80" height="10" rx="3" fill="currentColor" className="text-sky-400/30 dark:text-sky-400/20" />
      <text x="25" y="16" className="fill-sky-600/60 dark:fill-sky-400/50" fontSize="6" fontWeight="500">{i18n.t('components.landing.featurePreview.enamel')}</text>
      <rect x="20" y="22" width="80" height="10" rx="3" fill="currentColor" className="text-primary/30" />
      <text x="25" y="30" className="fill-primary/60" fontSize="6" fontWeight="500">{i18n.t('components.landing.featurePreview.body')}</text>
      <rect x="20" y="36" width="80" height="10" rx="3" fill="currentColor" className="text-amber-400/30 dark:text-amber-400/20" />
      <text x="25" y="44" className="fill-amber-600/60 dark:fill-amber-400/50" fontSize="6" fontWeight="500">{i18n.t('components.landing.featurePreview.dentin')}</text>
      {/* Arrow */}
      <path d="M106 15 L112 29 L106 43" fill="none" stroke="currentColor" className="text-primary/30" strokeWidth="1" />
      <circle cx="112" cy="29" r="2" className="fill-primary/40" />
    </svg>
  ),

  pdf: () => (
    <svg viewBox="0 0 120 60" className="w-full h-auto" aria-hidden="true">
      {/* Document */}
      <rect x="30" y="4" width="60" height="52" rx="4" fill="none" stroke="currentColor" className="text-primary/20" strokeWidth="1.5" />
      {/* Folded corner */}
      <path d="M75 4 L90 4 L90 16 L75 16 Z" fill="currentColor" className="text-primary/5" />
      <path d="M75 4 L75 16 L90 4" fill="currentColor" className="text-primary/10" />
      {/* Content lines */}
      <rect x="38" y="12" width="30" height="2" rx="1" fill="currentColor" className="text-primary/20" />
      <rect x="38" y="18" width="44" height="1.5" rx="0.75" fill="currentColor" className="text-primary/10" />
      <rect x="38" y="23" width="38" height="1.5" rx="0.75" fill="currentColor" className="text-primary/10" />
      <rect x="38" y="28" width="42" height="1.5" rx="0.75" fill="currentColor" className="text-primary/10" />
      {/* Logo placeholder */}
      <rect x="38" y="36" width="12" height="6" rx="1.5" fill="currentColor" className="text-primary/15" />
      {/* Signature line */}
      <line x1="38" y1="48" x2="68" y2="48" stroke="currentColor" className="text-primary/20" strokeWidth="0.75" />
    </svg>
  ),
};

interface FeaturePreviewProps {
  type: PreviewType;
}

export function FeaturePreview({ type }: FeaturePreviewProps) {
  const Preview = previews[type];
  return (
    <div className="mt-4 px-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
      <Preview />
    </div>
  );
}
