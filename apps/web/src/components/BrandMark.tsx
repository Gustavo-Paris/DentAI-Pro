import { BRAND_NAME } from '@/lib/branding';
import { ToSmileLogo } from '@/components/ToSmileLogo';
import { cn } from '@/lib/utils';

type BrandSize = 'xs' | 'sm' | 'md' | 'lg';

interface BrandMarkProps {
  size?: BrandSize;
  className?: string;
}

const sizeMap: Record<BrandSize, { icon: string; text: string; gap: string }> = {
  xs: { icon: 'h-3.5 w-3.5', text: 'text-xs', gap: 'gap-1' },
  sm: { icon: 'h-5 w-5 sm:h-6 sm:w-6', text: 'text-base sm:text-lg', gap: 'gap-1.5' },
  md: { icon: 'h-7 w-7 sm:h-8 sm:w-8', text: 'text-lg sm:text-xl', gap: 'gap-2' },
  lg: { icon: 'h-9 w-9', text: 'text-2xl', gap: 'gap-2.5' },
};

export function BrandMark({ size = 'md', className }: BrandMarkProps) {
  const s = sizeMap[size];
  return (
    <span className={cn('inline-flex items-center font-semibold tracking-[0.2em] font-display', s.gap, s.text, className)}>
      <ToSmileLogo className={s.icon} />
      <span className="text-gradient-brand">{BRAND_NAME}</span>
    </span>
  );
}
