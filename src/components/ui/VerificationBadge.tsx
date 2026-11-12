import { BadgeCheck, ClipboardCheck, FileCheck2, UserCheck, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { VerificationLevel } from '@/types';

export const VERIFICATION_ORDER: VerificationLevel[] = [
  'owner_reported',
  'document_supported',
  'mechanic_confirmed',
  'inspection_verified',
];

export const VERIFICATION_ICON = {
  owner_reported: UserCheck,
  document_supported: FileCheck2,
  mechanic_confirmed: ClipboardCheck,
  inspection_verified: ShieldCheck,
} as const;

export function VerificationBadge({ level, compact }: { level: VerificationLevel; compact?: boolean }) {
  const { t } = useTranslation();
  const Icon = VERIFICATION_ICON[level] ?? BadgeCheck;
  const styles: Record<VerificationLevel, string> = {
    owner_reported: 'border-line bg-white/[0.04] text-text-secondary',
    document_supported: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    mechanic_confirmed: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
    inspection_verified: 'border-lime/30 bg-lime/10 text-lime',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none ${styles[level]}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {compact ? null : t(`carproof.${camel(level)}`)}
    </span>
  );
}

function camel(value: string): string {
  return value.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function verificationRank(level: VerificationLevel): number {
  return VERIFICATION_ORDER.indexOf(level);
}
