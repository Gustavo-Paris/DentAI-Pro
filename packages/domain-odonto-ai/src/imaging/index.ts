/**
 * Imaging subdomain
 *
 * Dental X-rays, panoramic images, intraoral photos, and image comparison.
 *
 * @example
 * ```tsx
 * import { PageDentalImage, PageImageGallery } from '@parisgroup-ai/domain-odonto-ai/imaging';
 * ```
 */

// Types
export type {
  DentalImageInfo,
  ImageAnnotationData,
  ImageComparisonPair,
  ImageUploadState,
} from './types';

// Components
export { PageDentalImage } from './PageDentalImage';
export type { PageDentalImageProps } from './PageDentalImage';

export { PageImageCompare } from './PageImageCompare';
export type { PageImageCompareProps } from './PageImageCompare';

export { PageImageGallery } from './PageImageGallery';
export type { PageImageGalleryProps } from './PageImageGallery';

export { PageImageUpload } from './PageImageUpload';
export type { PageImageUploadProps } from './PageImageUpload';

export { PageImagingTimeline } from './PageImagingTimeline';
export type { PageImagingTimelineProps } from './PageImagingTimeline';

export { PageImageAnnotation } from './PageImageAnnotation';
export type { PageImageAnnotationProps } from './PageImageAnnotation';
