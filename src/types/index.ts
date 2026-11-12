export type Language = 'en' | 'ar';
export type ThemePreference = 'dark' | 'light' | 'system';

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric';
export type Transmission = 'automatic' | 'manual' | 'cvt';
export type Drivetrain = 'fwd' | 'rwd' | 'awd';
export type VehicleCategory = 'sedan' | 'suv' | 'hatchback' | 'pickup';

export type VerificationLevel =
  | 'owner_reported'
  | 'document_supported'
  | 'mechanic_confirmed'
  | 'inspection_verified';

export type RecordStatus = 'completed' | 'scheduled' | 'overdue' | 'in_progress';
export type RecordKind = 'maintenance' | 'repair' | 'inspection';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  plate: string;
  color: string;
  vin: string;
  mileage: number;
  image: string;
  fuelType: FuelType;
  transmission: Transmission;
  drivetrain: Drivetrain;
  category: VehicleCategory;
  engine: {
    displacement: string;
    cylinders: number;
    power: string;
    torque: string;
    oilSpec: string;
  };
  purchaseDate: string;
  isPrimary: boolean;
  verification: VerificationLevel;
  averageMonthlyKm: number;
}

export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  title: string;
  titleAr: string;
  kind: RecordKind;
  status: RecordStatus;
  date: string;
  mileage: number;
  nextDueDate?: string;
  nextDueMileage?: number;
  intervalKm?: number;
  intervalMonths?: number;
  cost: number;
  workshop: string;
  workshopAr: string;
  notes?: string;
  notesAr?: string;
  verification: VerificationLevel;
  partsReplaced?: string[];
  checklist?: { id: string; labelKey: string; done: boolean }[];
}

export type DocumentCategory = 'invoice' | 'inspection' | 'insurance' | 'registration' | 'warranty' | 'other';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  name: string;
  nameAr?: string;
  category: DocumentCategory;
  issuedBy: string;
  issuedByAr?: string;
  date: string;
  fileType: 'pdf' | 'jpg' | 'png';
  sizeKb: number;
  amount?: number;
  verification: VerificationLevel;
  /** Object URL created locally in the browser — never persisted. */
  localPreviewUrl?: boolean;
  note?: string;
}

export type NotificationKind = 'maintenance' | 'document' | 'diagnostic' | 'system';

export interface AppNotification {
  id: string;
  vehicleId?: string;
  kind: NotificationKind;
  titleKey: string;
  titleAr: string;
  bodyKey: string;
  bodyAr: string;
  date: string;
  read: boolean;
  href?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface MileageEntry {
  id: string;
  vehicleId: string;
  date: string;
  mileage: number;
  source: 'service' | 'manual' | 'inspection';
}

export interface ExpenseCategoryTotal {
  key: 'maintenance' | 'repairs' | 'insurance' | 'fuel' | 'other';
  amount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  textAr?: string;
  createdAt: string;
  attachment?: { name: string; kind: 'image' };
  diagnostic?: DiagnosticSummary;
}

export interface DiagnosticSummary {
  topicKey: string;
  topicAr: string;
  urgency: 'low' | 'medium' | 'high';
  summaryKey: string;
  summaryAr: string;
  actions: { key: string; ar: string }[];
  demo: true;
}

export interface ChatThread {
  id: string;
  vehicleId: string;
  title: string;
  titleAr: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  memberSince: string;
}

export interface NotificationPreferences {
  maintenance: boolean;
  documents: boolean;
  diagnostics: boolean;
  product: boolean;
  channels: { email: boolean; sms: boolean; push: boolean };
}

export interface AppSettings {
  language: Language;
  theme: ThemePreference;
  notifications: NotificationPreferences;
  privacy: { shareWithMechanic: boolean; analytics: boolean; storeDocumentsLocally: boolean };
  vehicles: { defaultReminderKm: number; mileageUnit: 'km' };
}
