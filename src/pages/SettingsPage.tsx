import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Bell,
  CarFront,
  Download,
  Globe2,
  LogOut,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
  AlertTriangle,
  MonitorSmartphone,
} from 'lucide-react';
import { Avatar, Badge, Button, Card, CardHeader, DemoBadge, Input, Modal, Select, Toggle } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useApp } from '@/lib/store';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Language, ThemePreference } from '@/types';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'settings.nameRequired' }),
  email: z.string().email({ message: 'settings.emailInvalid' }),
  phone: z.string().optional(),
  city: z.string().optional(),
});

type ProfileInput = z.input<typeof profileSchema>;
type ProfileOutput = z.output<typeof profileSchema>;

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const {
    profile,
    updateProfile,
    settings,
    updateSettings,
    vehicles,
    primaryVehicleId,
    setPrimaryVehicle,
    signOut,
    resetDemoData,
    documents,
  } = useApp();
  const { toast } = useToast();
  const { profile: remoteProfile, updateProfile: updateRemoteProfile, backendConnected } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput, unknown, ProfileOutput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: remoteProfile?.full_name ?? profile.name,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
    },
  });

  const onSaveProfile = async (values: ProfileOutput) => {
    setProfileError(null);

    // Live session → persist the real profile row.
    if (backendConnected && remoteProfile) {
      const result = await updateRemoteProfile({ full_name: values.name });
      if (!result.ok) {
        setProfileError(result.errorKey ? t(result.errorKey) : t('common.error'));
        return;
      }
    }

    // Keep the local mirror in sync so the header updates immediately.
    updateProfile({ ...values, phone: values.phone ?? '', city: values.city ?? '' });
    toast(t('settings.profileSaved'));
  };

  const themeOptions: { value: ThemePreference; label: string; icon: typeof Moon }[] = [
    { value: 'dark', label: t('settings.themeDark'), icon: Moon },
    { value: 'light', label: t('settings.themeLight'), icon: Sun },
    { value: 'system', label: t('settings.themeSystem'), icon: MonitorSmartphone },
  ];

  const langOptions: { value: Language; label: string; note: string }[] = [
    { value: 'en', label: t('settings.english'), note: t('settings.englishNote') },
    { value: 'ar', label: t('settings.arabic'), note: t('settings.arabicNote') },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        badge={<DemoBadge label={t('common.demoBadge')} />}
        actions={<LanguageSwitcher />}
      />

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        {/* Profile */}
        <Card>
          <CardHeader title={t('settings.profile')} subtitle={t('settings.profileBody')} icon={<UserRound className="h-4 w-4" aria-hidden="true" />} />
          <div className="mb-4 flex items-center gap-3.5">
            <Avatar name={profile.name} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{profile.name}</p>
              <p className="truncate text-[11px] text-text-secondary">{profile.email}</p>
              <p className="mt-1 text-[10px] text-text-secondary">
                {t('settings.memberSince')}: {formatDate(profile.memberSince, language)}
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-3.5" noValidate>
            <Input
              id="s-name"
              label={t('settings.name')}
              error={errors.name?.message ? t(errors.name.message) : undefined}
              {...register('name')}
            />
            <Input
              id="s-email"
              label={t('settings.email')}
              type="email"
              error={errors.email?.message ? t(errors.email.message) : undefined}
              {...register('email')}
            />
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Input id="s-phone" label={t('settings.phone')} type="tel" {...register('phone')} />
              <Input id="s-city" label={t('settings.city')} {...register('city')} />
            </div>
            {profileError ? (
              <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-red-200">
                {profileError}
              </p>
            ) : null}
            <Button type="submit" size="md" loading={isSubmitting} icon={<Save className="h-4 w-4" aria-hidden="true" />}>
              {t('settings.saveProfile')}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {/* Language */}
          <Card>
            <CardHeader title={t('settings.language')} subtitle={t('settings.languageBody')} icon={<Globe2 className="h-4 w-4" aria-hidden="true" />} />
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('settings.language')}>
              {langOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={language === opt.value}
                  onClick={() => {
                    changeLanguage(opt.value);
                    // Mirror the preference into the profile row when signed in.
                    if (backendConnected && remoteProfile) {
                      void updateRemoteProfile({ preferred_language: opt.value });
                    }
                    toast(t('settings.saved'));
                  }}
                  className={cn(
                    'rounded-xl border p-3 text-start transition',
                    language === opt.value
                      ? 'border-lime/40 bg-lime/[0.08]'
                      : 'border-line bg-ink-900/40 hover:border-white/15',
                  )}
                >
                  <span
                    className={cn(
                      'block text-xs font-semibold',
                      language === opt.value ? 'text-lime' : 'text-text-primary',
                    )}
                  >
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-text-secondary">{opt.note}</span>
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-[10px] leading-relaxed text-text-secondary">
              {t('common.demoNotice')} <span className="text-text-primary">({i18n.language})</span>
            </p>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader title={t('settings.theme')} subtitle={t('settings.themeBody')} icon={<Palette className="h-4 w-4" aria-hidden="true" />} />
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('settings.theme')}>
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const active = settings.theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      updateSettings({ theme: opt.value });
                      toast(t('settings.saved'), 'info');
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border p-3 transition',
                      active ? 'border-lime/40 bg-lime/[0.08] text-lime' : 'border-line bg-ink-900/40 text-text-secondary hover:border-white/15',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[10.5px] font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-text-secondary">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" aria-hidden="true" />
              {t('settings.themeNote')}
            </p>
          </Card>

          {/* Vehicle preferences */}
          <Card>
            <CardHeader
              title={t('settings.vehiclePreferences')}
              subtitle={t('settings.vehiclePreferencesBody')}
              icon={<CarFront className="h-4 w-4" aria-hidden="true" />}
            />
            <div className="space-y-3">
              <Select
                id="s-primary"
                label={t('settings.primaryVehicle')}
                value={primaryVehicleId}
                onChange={(e) => {
                  setPrimaryVehicle(e.target.value);
                  toast(t('settings.saved'));
                }}
                options={vehicles.map((v) => ({ value: v.id, label: `${v.make} ${v.model} ${v.year}` }))}
              />
              <Select
                id="s-reminder"
                label={t('settings.defaultReminder')}
                hint={t('settings.defaultReminderBody')}
                value={String(settings.vehicles.defaultReminderKm)}
                onChange={(e) => updateSettings({ vehicles: { ...settings.vehicles, defaultReminderKm: Number(e.target.value) } })}
                options={[
                  { value: '250', label: `250 ${t('common.km')}` },
                  { value: '500', label: `500 ${t('common.km')}` },
                  { value: '1000', label: `1,000 ${t('common.km')}` },
                ]}
              />
              <div className="flex items-center justify-between rounded-xl border border-line bg-ink-900/40 px-3 py-2.5">
                <span className="text-[11px] text-text-secondary">{t('settings.mileageUnit')}</span>
                <Badge tone="neutral">km</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications prefs */}
        <Card>
          <CardHeader title={t('settings.notifications')} subtitle={t('settings.notificationsBody')} icon={<Bell className="h-4 w-4" aria-hidden="true" />} />
          <div className="divide-y divide-line/60">
            <Toggle
              label={t('settings.notifMaintenance')}
              description={t('settings.notifMaintenanceDesc')}
              checked={settings.notifications.maintenance}
              onChange={(v) => {
                updateSettings({ notifications: { ...settings.notifications, maintenance: v } });
                toast(t('settings.saved'), 'info');
              }}
            />
            <Toggle
              label={t('settings.notifDocuments')}
              description={t('settings.notifDocumentsDesc')}
              checked={settings.notifications.documents}
              onChange={(v) => updateSettings({ notifications: { ...settings.notifications, documents: v } })}
            />
            <Toggle
              label={t('settings.notifDiagnostics')}
              description={t('settings.notifDiagnosticsDesc')}
              checked={settings.notifications.diagnostics}
              onChange={(v) => updateSettings({ notifications: { ...settings.notifications, diagnostics: v } })}
            />
            <Toggle
              label={t('settings.notifProduct')}
              description={t('settings.notifProductDesc')}
              checked={settings.notifications.product}
              onChange={(v) => updateSettings({ notifications: { ...settings.notifications, product: v } })}
            />
          </div>
          <div className="mt-3 border-t border-line/70 pt-3">
            <p className="stat-label mb-2">{t('settings.channels')}</p>
            <div className="flex flex-wrap gap-1.5">
              {(['email', 'sms', 'push'] as const).map((channel) => {
                const active = settings.notifications.channels[channel];
                const label =
                  channel === 'email' ? t('settings.channelEmail') : channel === 'sms' ? t('settings.channelSms') : t('settings.channelPush');
                return (
                  <button
                    key={channel}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      updateSettings({
                        notifications: {
                          ...settings.notifications,
                          channels: { ...settings.notifications.channels, [channel]: !active },
                        },
                      })
                    }
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[10.5px] font-medium transition',
                      active ? 'border-lime/40 bg-lime/10 text-lime' : 'border-line bg-ink-900/50 text-text-secondary hover:text-text-primary',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Privacy & security */}
        <Card>
          <CardHeader title={t('settings.privacy')} subtitle={t('settings.privacyBody')} icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} />
          <div className="divide-y divide-line/60">
            <Toggle
              label={t('settings.shareWithMechanic')}
              description={t('settings.shareWithMechanicDesc')}
              checked={settings.privacy.shareWithMechanic}
              onChange={(v) => updateSettings({ privacy: { ...settings.privacy, shareWithMechanic: v } })}
            />
            <Toggle
              label={t('settings.analytics')}
              description={t('settings.analyticsDesc')}
              checked={settings.privacy.analytics}
              onChange={(v) => updateSettings({ privacy: { ...settings.privacy, analytics: v } })}
            />
            <Toggle
              label={t('settings.storeLocally')}
              description={t('settings.storeLocallyDesc')}
              checked={settings.privacy.storeDocumentsLocally}
              onChange={(v) => updateSettings({ privacy: { ...settings.privacy, storeDocumentsLocally: v } })}
            />
          </div>

          <div className="mt-3 space-y-2 border-t border-line/70 pt-3">
            <div className="rounded-xl border border-line bg-ink-900/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium text-text-primary">{t('settings.securityAccount')}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-text-secondary">{t('settings.securityAccountDesc')}</p>
                </div>
                <Badge tone="warning" className="shrink-0">
                  {t('settings.securitySoon')}
                </Badge>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toast(t('settings.exportUnavailable'), 'info')}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-ink-900/40 px-3 py-2.5 text-start transition hover:border-white/15"
            >
              <span className="flex items-center gap-2">
                <Download className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                <span className="text-[11px] text-text-primary">{t('settings.exportData')}</span>
              </span>
              <span className="text-[10px] text-text-secondary">{documents.length}</span>
            </button>
            <button
              type="button"
              onClick={() => toast(t('settings.deleteAccountUnavailable'), 'warning')}
              className="flex w-full items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-3 py-2.5 text-[11px] text-red-300 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t('settings.deleteAccount')}
            </button>
          </div>

          <p className="mt-3 rounded-xl border border-dashed border-line px-3 py-2 text-[10px] leading-relaxed text-text-secondary">
            {t('settings.demoStorageWarning')}
          </p>
        </Card>
      </div>

      {/* Danger zone / logout */}
      <Card className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-text-primary">{t('settings.logout')}</p>
            <p className="mt-0.5 text-[11px] text-text-secondary">{t('settings.logoutBody')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setResetOpen(true)}>
              {t('demo.reset')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLogoutOpen(true)} icon={<LogOut className="h-3.5 w-3.5 rtl-flip" aria-hidden="true" />}>
              {t('settings.logout')}
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        size="sm"
        title={t('settings.logoutConfirm')}
        description={t('settings.logoutBody')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLogoutOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                signOut();
                toast(t('settings.loggedOut'), 'info');
                navigate('/login');
              }}
            >
              {t('settings.logout')}
            </Button>
          </>
        }
      />

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        size="sm"
        title={t('demo.resetConfirm')}
        description={t('demo.resetBody')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemoData();
                setResetOpen(false);
                toast(t('demo.resetDone'), 'warning');
              }}
            >
              {t('demo.reset')}
            </Button>
          </>
        }
      />
    </div>
  );
}
