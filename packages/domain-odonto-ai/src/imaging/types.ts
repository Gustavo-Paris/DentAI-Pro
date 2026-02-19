import type { BaseEntity, DentalImageType, ToothNumber } from '../shared';

export interface DentalImageInfo extends BaseEntity {
  url: string;
  thumbnailUrl?: string;
  type: DentalImageType;
  patientId: string;
  patientName: string;
  teeth?: ToothNumber[];
  capturedDate: string;
  capturedBy?: string;
  description?: string;
  annotations?: ImageAnnotationData[];
}

export interface ImageAnnotationData {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  color?: string;
  type: 'marker' | 'rectangle' | 'circle' | 'arrow';
}

export interface ImageComparisonPair {
  before: DentalImageInfo;
  after: DentalImageInfo;
  label?: string;
}

export interface ImageUploadState {
  file?: File;
  preview?: string;
  uploading: boolean;
  progress: number;
  error?: string;
}
