import type { Language, MaintenanceItem, Vehicle } from '@/types';
import { daysUntil } from './format';

export function vehicleLabel(vehicle: Vehicle): string {
  return `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
}

export function recordTitle(record: MaintenanceItem, language: Language): string {
  return language === 'ar' ? record.titleAr : record.title;
}

export function workshopName(record: MaintenanceItem, language: Language): string {
  return language === 'ar' ? record.workshopAr : record.workshop;
}

export interface MaintenanceHealth {
  level: 'healthy' | 'attention' | 'critical';
  overdueCount: number;
  upcomingCount: number;
}

export function maintenanceHealth(records: MaintenanceItem[]): MaintenanceHealth {
  const overdueCount = records.filter((r) => r.status === 'overdue').length;
  const upcoming = records.filter(
    (r) => r.status === 'scheduled' && daysUntil(r.date) <= 120,
  ).length;
  const level: MaintenanceHealth['level'] =
    overdueCount > 1 ? 'critical' : overdueCount === 1 ? 'attention' : 'healthy';
  return { level, overdueCount, upcomingCount: upcoming };
}

export function upcomingRecords(records: MaintenanceItem[], limit = 4): MaintenanceItem[] {
  return records
    .filter((r) => r.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

export function isNewerMileage(a: number, b: number): boolean {
  return a > b;
}
