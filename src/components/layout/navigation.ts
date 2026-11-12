import {
  CarFront,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  Wrench,
  BookOpenCheck,
  Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
  mobilePrimary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/app', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true, mobilePrimary: true },
  { to: '/app/garage', labelKey: 'nav.garage', icon: CarFront, mobilePrimary: true },
  { to: '/app/carproof', labelKey: 'nav.carproof', icon: BookOpenCheck },
  { to: '/app/maintenance', labelKey: 'nav.maintenance', icon: Wrench, mobilePrimary: true },
  { to: '/app/documents', labelKey: 'nav.documents', icon: FileText, mobilePrimary: true },
  { to: '/app/ai-mechanic', labelKey: 'nav.aiMechanic', icon: Sparkles, mobilePrimary: true },
  { to: '/app/notifications', labelKey: 'nav.notifications', icon: Bell },
  { to: '/app/settings', labelKey: 'nav.settings', icon: Settings },
];

export const MOBILE_PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.mobilePrimary);
