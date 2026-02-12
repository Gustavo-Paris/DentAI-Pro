import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ComponentSkeletonProps {
  height?: string;
  width?: string;
  className?: string;
}

export function ComponentSkeleton({ height = '200px', width = '100%', className }: ComponentSkeletonProps) {
  return <Skeleton className={cn('rounded-lg', className)} style={{ height, width }} />;
}
