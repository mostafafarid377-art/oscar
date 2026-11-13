import { Link, useNavigate } from 'react-router-dom';
import { asset } from '@/utils/asset';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Info, Mail, Lock, UserRound } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Button, Input, Badge } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/utils/cn';
import type { TFunction } from 'i18next';

type Mode = 'login' | 'register';

function buildSchema(mode: Mode, t: TFunction) {
  const base = z.object({
    name: z.string().optional(),
    email: z.string().min(1, t('auth.emailInvalid')).email(t('auth.emailInvalid')),
    password: z.string().min(8, t('auth.passwordShort')),
    confirmPassword: z.string().optional(),
  });

  if (mode === 'register') {
    return base
      .extend({
        name: z.string().min(2, t('auth.nameShort')),
        confirmPassword: z.string().min(8, t('auth.passwordShort')),
      })
      .refine((data) => data.password === data.confirmPassword, {
        path: ['confirmPassword'],
        message: t('auth.passwordMismatch'),
      });
  }
  return base;
}

type FormValues = {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
};

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn } = useApp();
  const { toast } = useToast();
  const { isRtl } = useLanguage();
  const {
    status,
    backendConnected,
    signInWithPassword,
    signUpWithPassword,
    requestPasswordReset,
    updatePassword,
    resendVerificationEmail,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Real-auth UI state
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryDone, setRecoveryDone] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // A Supabase recovery link lands on /login?mode=recovery with a session.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'recovery' && status === 'signed_in') {
      setRecoveryMode(true);
    }
  }, [status]);

  // Already authenticated? Go straight into the app.
  useEffect(() => {
    if (status === 'signed_in' && !recoveryMode) {
      navigate('/app', { replace: true });
    }
  }, [status, recoveryMode, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(mode, t)),
    mode: 'onBlur',
    defaultValues: { email: 'omar.hassan@example.com', password: '', name: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setAuthError(null);

    // ---- Demo mode: no credentials configured, keep Phase 0 behaviour ----
    if (!backendConnected) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      signIn();
      toast(mode === 'login' ? t('auth.successLogin') : t('auth.successRegister'));
      navigate('/app');
      return;
    }

    // ---- Real authentication ----
    if (mode === 'login') {
      const result = await signInWithPassword(values.email, values.password);
      if (!result.ok) {
        setAuthError(result.errorKey ?? 'auth.errors.generic');
        return;
      }
      toast(t('auth.successLogin'));
      navigate('/app');
      return;
    }

    const result = await signUpWithPassword(values.email, values.password, values.name ?? '');
    if (!result.ok) {
      setAuthError(result.errorKey ?? 'auth.errors.generic');
      return;
    }
    if (result.needsEmailConfirmation) {
      setPendingEmail(values.email);
      return;
    }
    // Confirmation disabled on the project → straight in.
    toast(t('auth.successRegister'));
    navigate('/app');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setShowForgot(false);
    setForgotSent(false);
    reset({ email: 'omar.hassan@example.com', password: '', name: '' });
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-[700px] -translate-x-1/2 rounded-full bg-lime/[0.07] blur-[110px]" />
        <div className="absolute inset-0 grid-backdrop opacity-30" />
      </div>

      <header className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <h1 className="sr-only">{t('auth.welcomeBack')} · {t('common.appName')}</h1>
        <Logo to="/" />
        <nav className="flex items-center gap-2" aria-label={t('nav.mainNavigation')}>
          <LanguageSwitcher compact className="sm:hidden" />
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link
            to="/"
            aria-label={t('auth.backHome')}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-text-secondary transition hover:text-text-primary"
          >
            <BackIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t('auth.backHome')}</span>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-8 lg:pt-10">
        {/* Marketing side */}
        <section className="order-2 hidden lg:order-1 lg:block">
          <div className="max-w-lg">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-lime">
              {t('landing.hero.eyebrow')}
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-text-primary">
              {t('common.tagline')}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary">{t('landing.hero.subtitle')}</p>

            <ul className="mt-8 space-y-3">
              {[t('auth.feature1'), t('auth.feature2'), t('auth.feature3')].map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-ink-900">
              <img
                src={asset("/images/hero-car.jpg")}
                alt=""
                className="aspect-[16/9] w-full object-cover opacity-90"
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* Form side */}
        <section className="order-1 mx-auto w-full max-w-md lg:order-2">
          <div className="rounded-3xl border border-line bg-ink-800/80 p-6 shadow-card backdrop-blur-xl sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                {showForgot ? t('auth.forgotTitle') : mode === 'login' ? t('auth.welcomeBack') : t('auth.createTitle')}
              </h2>
              <Badge tone={backendConnected ? 'info' : 'lime'}>
                {backendConnected ? t('auth.realAuthTitle') : t('common.demoMode')}
              </Badge>
            </div>

            <div className="mb-5 flex items-start gap-2 rounded-xl border border-sky-400/20 bg-sky-400/[0.06] px-3 py-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-sky-100/80">
                <span className="font-semibold text-sky-200">
                  {backendConnected ? t('auth.realAuthTitle') : t('auth.demoTitle')} —{' '}
                </span>
                {backendConnected ? t('auth.realAuthBody') : t('auth.demoBody')}
              </p>
            </div>

            {showForgot ? (
              <div>
                <p className="prose-muted">{t('auth.forgotBody')}</p>
                {forgotSent ? (
                  <div className="mt-5 rounded-xl border border-lime/25 bg-lime/[0.06] px-4 py-3 text-xs text-lime">
                    {backendConnected ? t('auth.resetLinkSent') : t('auth.forgotSent')}
                  </div>
                ) : null}
                <div className="mt-5 space-y-3">
                  <Input
                    id="forgot-email"
                    label={t('auth.email')}
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    leading={<Mail className="h-4 w-4" aria-hidden="true" />}
                  />
                  <Button
                    fullWidth
                    type="button"
                    onClick={async () => {
                      if (!backendConnected) {
                        setForgotSent(true);
                        return;
                      }
                      const result = await requestPasswordReset(forgotEmail);
                      setForgotSent(result.ok);
                      if (!result.ok) setAuthError(result.errorKey ?? 'auth.errors.generic');
                    }}
                  >
                    {t('auth.sendReset')}
                  </Button>
                  <Button
                    fullWidth
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setShowForgot(false);
                      setForgotSent(false);
                    }}
                  >
                    {t('common.back')}
                  </Button>
                </div>
              </div>
            ) : recoveryMode ? (
              /* ---------- Password recovery (Supabase link landed here) ---------- */
              <div className="space-y-4">
                {recoveryDone ? (
                  <div className="rounded-xl border border-lime/25 bg-lime/[0.06] px-4 py-3 text-xs text-lime">
                    {t('auth.passwordUpdated')}
                  </div>
                ) : null}
                <Input
                  id="new-password"
                  label={t('auth.newPassword')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  leading={<Lock className="h-4 w-4" aria-hidden="true" />}
                />
                <Button
                  fullWidth
                  type="button"
                  onClick={async () => {
                    setAuthError(null);
                    if (newPassword.length < 8) {
                      setAuthError('auth.passwordShort');
                      return;
                    }
                    const result = await updatePassword(newPassword);
                    if (!result.ok) {
                      setAuthError(result.errorKey ?? 'auth.errors.generic');
                      return;
                    }
                    setRecoveryDone(true);
                    setRecoveryMode(false);
                    setNewPassword('');
                  }}
                >
                  {t('auth.setNewPassword')}
                </Button>
              </div>
            ) : pendingEmail ? (
              /* ---------- Awaiting email confirmation ---------- */
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-lime/25 bg-lime/[0.06] px-3.5 py-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold text-lime">{t('auth.checkEmailTitle')}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                      {t('auth.checkEmailBody', { email: pendingEmail })}
                    </p>
                  </div>
                </div>
                <Button
                  fullWidth
                  variant="secondary"
                  type="button"
                  onClick={async () => {
                    const result = await resendVerificationEmail(pendingEmail);
                    if (result.ok) toast(t('auth.checkEmailResent'));
                  }}
                >
                  {t('auth.checkEmailResend')}
                </Button>
                <Button
                  fullWidth
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setPendingEmail(null);
                    switchMode('login');
                  }}
                >
                  {t('auth.backToLogin')}
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-line bg-ink-900/70 p-1" role="tablist">
                  {(['login', 'register'] as const).map((m) => (
                    <button
                      key={m}
                      role="tab"
                      type="button"
                      aria-selected={mode === m}
                      onClick={() => switchMode(m)}
                      className={cn(
                        'rounded-lg px-3 py-2 text-xs font-semibold transition',
                        mode === m ? 'bg-lime text-ink-950' : 'text-text-secondary hover:text-text-primary',
                      )}
                    >
                      {m === 'login' ? t('auth.loginTab') : t('auth.registerTab')}
                    </button>
                  ))}
                </div>

                <p className="mb-5 text-xs leading-relaxed text-text-secondary">
                  {mode === 'login' ? t('auth.loginSubtitle') : t('auth.createSubtitle')}
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  {mode === 'register' ? (
                    <Input
                      id="name"
                      label={t('auth.name')}
                      placeholder={t('auth.namePlaceholder')}
                      autoComplete="name"
                      leading={<UserRound className="h-4 w-4" aria-hidden="true" />}
                      error={errors.name?.message}
                      {...register('name')}
                    />
                  ) : null}

                  <Input
                    id="email"
                    label={t('auth.email')}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={t('auth.emailPlaceholder')}
                    leading={<Mail className="h-4 w-4" aria-hidden="true" />}
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <Input
                    id="password"
                    label={t('auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder={t('auth.passwordPlaceholder')}
                    leading={<Lock className="h-4 w-4" aria-hidden="true" />}
                    error={errors.password?.message}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                        className="rounded-md p-1.5 text-text-secondary transition hover:text-text-primary"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    }
                    {...register('password')}
                  />

                  {mode === 'register' ? (
                    <Input
                      id="confirmPassword"
                      label={t('auth.confirmPassword')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t('auth.passwordPlaceholder')}
                      leading={<Lock className="h-4 w-4" aria-hidden="true" />}
                      error={errors.confirmPassword?.message}
                      {...register('confirmPassword')}
                    />
                  ) : null}

                  {mode === 'login' ? (
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-[11px] text-text-secondary">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-3.5 w-3.5 rounded border-line bg-ink-900 accent-lime"
                        />
                        {t('auth.rememberMe')}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgot(true)}
                        className="text-[11px] font-medium text-lime hover:underline"
                      >
                        {t('auth.forgot')}
                      </button>
                    </div>
                  ) : null}

                  {authError ? (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/[0.07] px-3 py-2.5 text-[11px] leading-relaxed text-red-200"
                    >
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{t(authError)}</span>
                    </div>
                  ) : null}

                  <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
                    {mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
                  </Button>
                </form>

                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary">{t('auth.orContinue')}</span>
                  <span className="h-px flex-1 bg-line" aria-hidden="true" />
                </div>

                <button
                  type="button"
                  onClick={() => toast(t('auth.googleNote'), 'info')}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-white/[0.03] px-4 py-3 text-xs font-semibold text-text-primary transition hover:border-white/20 hover:bg-white/[0.06]"
                  title={t('auth.googleNote')}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.2-5.5 4.2A6.1 6.1 0 0 1 12 5.8c1.7 0 3 .7 3.8 1.4l2.6-2.5A9.6 9.6 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.3-.2-2.1H12Z" />
                  </svg>
                  {t('auth.google')}
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-text-secondary">
                    {t('common.demo')}
                  </span>
                </button>

                <p className="mt-5 text-center text-[11px] leading-relaxed text-text-secondary">{t('auth.terms')}</p>

                <div className="mt-4 text-center text-xs">
                  <span className="text-text-secondary">
                    {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="font-semibold text-lime hover:underline"
                  >
                    {mode === 'login' ? t('auth.switchRegister') : t('auth.switchLogin')}
                  </button>
                </div>
              </>
            )}

            <div className="mt-6 border-t border-line/70 pt-4">
              {backendConnected ? (
                // Signed-out visitors can still explore the prototype, but the
                // entry point is explicit so demo data never looks real.
                <button
                  type="button"
                  onClick={() => {
                    signIn();
                    navigate('/app');
                  }}
                  className="block w-full text-center text-[11px] font-medium text-text-secondary underline-offset-2 hover:text-lime hover:underline"
                >
                  {t('auth.demoModeEntry')}
                </button>
              ) : (
                <Link
                  to="/app"
                  className="block text-center text-[11px] font-medium text-text-secondary underline-offset-2 hover:text-lime hover:underline"
                >
                  {t('landing.hero.secondaryCta')}
                </Link>
              )}
              {backendConnected ? (
                <p className="mt-2 text-center text-[10px] leading-relaxed text-text-secondary/70">
                  {t('auth.demoModeNote')}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
