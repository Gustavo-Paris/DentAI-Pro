import type { BaseEntity, ProfessionalRole, MoneyAmount } from '../shared';

export interface ClinicProfile extends BaseEntity {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  registrationNumber: string;
}

export interface ProfessionalInfo extends BaseEntity {
  name: string;
  role: ProfessionalRole;
  specialization?: string;
  registrationNumber: string;
  photoUrl?: string;
  email: string;
  phone?: string;
  active: boolean;
}

export interface WorkingHours {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

export interface ProcedureCatalogItem extends BaseEntity {
  name: string;
  code: string;
  category: string;
  price: MoneyAmount;
  duration: number;
  active: boolean;
}

export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  channels: ('email' | 'sms' | 'whatsapp' | 'push')[];
}

export interface InsuranceProvider extends BaseEntity {
  name: string;
  code: string;
  contactPhone?: string;
  contactEmail?: string;
  active: boolean;
  plans?: string[];
}
