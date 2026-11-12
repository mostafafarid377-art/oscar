import { Link } from 'react-router-dom';
import { asset } from '@/utils/asset';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpenCheck,
  Camera,
  CarFront,
  Check,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Menu,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/layout/Logo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Button, SectionTitle, Badge, DemoBadge } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/utils/cn';

export default function LandingPage() {
  const { t } = useTranslation();
  const { vehicles, records, documents } = useApp();
  const { isRtl } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sections = [
    { href: '#carproof', label: t('landing.carproof.eyebrow') },
    { href: '#mechanic', label: t('landing.mechanic.eyebrow') },
    { href: '#how', label: t('landing.how.eyebrow') },
    { href: '#benefits', label: t('landing.benefits.eyebrow') },
  ];

  const Arrow = isRtl ? ArrowRight : ArrowRight;

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink-950">
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b transition duration-300',
          scrolled ? 'border-line/70 bg-ink-950/85 backdrop-blur-xl' : 'border-transparent bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="ms-6 hidden items-center gap-6 md:flex" aria-label={t('nav.mainNavigation')}>
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="text-[13px] font-medium text-text-secondary transition hover:text-text-primary"
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <LanguageSwitcher compact className="sm:hidden" />
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                {t('nav.login')}
              </Button>
            </Link>
            <Link to="/app" className="hidden sm:block">
              <Button size="sm" icon={<ArrowRight className="h-3.5 w-3.5 rtl-flip" aria-hidden="true" />}>
                {t('nav.getStarted')}
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-text-secondary md:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="animate-fade-up border-t border-line bg-ink-950/95 px-4 pb-4 pt-2 md:hidden">
            {sections.map((s) => (
              <a
                key={s.href}
                href={s.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-white/5 hover:text-text-primary"
              >
                {s.label}
              </a>
            ))}
            <div className="mt-3 flex gap-2">
              <Link to="/login" className="flex-1">
                <Button variant="secondary" size="sm" fullWidth>
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/app" className="flex-1">
                <Button size="sm" fullWidth>
                  {t('nav.getStarted')}
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        {/* HERO */}
        <section className="relative isolate overflow-hidden pt-28 sm:pt-32 lg:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-lime/[0.07] blur-[120px]" />
            <div className="absolute inset-x-0 top-0 h-[560px] grid-backdrop opacity-40" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-ink-800/60 px-3 py-1.5 text-[11px] font-medium text-text-secondary backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" aria-hidden="true" />
                {t('landing.hero.eyebrow')}
                <span className="text-line">|</span>
                <span className="text-lime">CarProof + Mechanic AI</span>
              </div>
              <h1 className="text-balance text-[34px] font-semibold leading-[1.08] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
                {t('landing.hero.title')}
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-text-secondary sm:text-base">
                {t('landing.hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                <Link to="/app" className="w-full sm:w-auto">
                  <Button size="lg" fullWidth icon={<ArrowRight className="h-4 w-4 rtl-flip" aria-hidden="true" />}>
                    {t('landing.hero.primaryCta')}
                  </Button>
                </Link>
                <Link to="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" fullWidth>
                    {t('landing.hero.secondaryCta')}
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-[11px] text-text-secondary">
                {t('landing.hero.trust')} · {t('common.demoMode')}
              </p>
            </div>

            {/* Hero image */}
            <div className="relative mx-auto mt-12 max-w-5xl sm:mt-16">
              <div className="absolute -inset-x-6 bottom-6 top-16 -z-10 rounded-[3rem] bg-lime/10 blur-3xl" aria-hidden="true" />
              <div className="overflow-hidden rounded-3xl border border-line bg-ink-900 shadow-card">
                <img
                  src={asset("/images/hero-car.jpg")}
                  alt={t('landing.hero.title')}
                  className="aspect-[16/9] w-full object-cover"
                  width={1376}
                  height={768}
                />
              </div>

              {/* Floating spec cards */}
              <div className="absolute -start-2 top-6 hidden animate-fade-up rounded-2xl border border-line bg-ink-800/90 p-3.5 shadow-card backdrop-blur-xl sm:block lg:-start-8">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/10 text-lime">
                    <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-secondary">{t('landing.carproof.eyebrow')}</p>
                    <p className="text-xs font-semibold text-text-primary">
                      {t('carproof.recordsTotal', { count: records.length })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -end-2 bottom-8 hidden animate-fade-up rounded-2xl border border-line bg-ink-800/90 p-3.5 shadow-card backdrop-blur-xl sm:block lg:-end-8">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/10 text-lime">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-secondary">{t('carproof.verification')}</p>
                    <p className="text-xs font-semibold text-text-primary">
                      {t('documents.count', { count: documents.length })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-3 border-t border-line/60 pt-8 sm:mt-14">
              {[t('landing.hero.stat1'), t('landing.hero.stat2'), t('landing.hero.stat3')].map((stat) => (
                <div key={stat} className="text-center">
                  <dd className="text-balance text-xs font-medium leading-snug text-text-secondary sm:text-[13px]">{stat}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CARPROOF */}
        <section id="carproof" className="relative border-t border-line/60 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <SectionTitle
                  eyebrow={t('landing.carproof.eyebrow')}
                  title={t('landing.carproof.title')}
                  subtitle={t('landing.carproof.body')}
                />
                <ul className="mt-7 space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="text-sm leading-relaxed text-text-secondary">
                        {t(`landing.carproof.bullet${n}`)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <p className="stat-label mb-3">{t('landing.carproof.levelTitle')}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="neutral" icon={<BadgeCheck className="h-3 w-3" aria-hidden="true" />}>
                      {t('carproof.ownerReported')}
                    </Badge>
                    <Badge tone="info" icon={<FileCheck2 className="h-3 w-3" aria-hidden="true" />}>
                      {t('carproof.documentSupported')}
                    </Badge>
                    <Badge tone="violet" icon={<ClipboardCheck className="h-3 w-3" aria-hidden="true" />}>
                      {t('carproof.mechanicConfirmed')}
                    </Badge>
                    <Badge tone="lime" icon={<ShieldCheck className="h-3 w-3" aria-hidden="true" />}>
                      {t('carproof.inspectionVerified')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-3xl border border-line bg-gradient-to-b from-ink-800 to-ink-900 p-5 shadow-card sm:p-7">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/10 text-lime">
                        <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{t('carproof.title')}</p>
                        <p className="text-[10px] text-text-secondary">Hyundai Elantra 2018</p>
                      </div>
                    </div>
                    <DemoBadge label={t('common.demoBadge')} />
                  </div>
                  <ol className="relative space-y-4 ps-6">
                    <span className="absolute inset-y-2 start-[7px] w-px bg-line" aria-hidden="true" />
                    {[
                      { title: 'Full synthetic oil & filter', meta: '124,800 km · Sep 2026', level: 'document_supported' },
                      { title: 'Front brake pads', meta: '122,300 km · Aug 2026', level: 'mechanic_confirmed' },
                      { title: 'AC compressor service', meta: '118,900 km · Jun 2026', level: 'document_supported' },
                      { title: 'Tyre rotation & alignment', meta: '115,400 km · May 2026', level: 'owner_reported' },
                    ].map((item, index) => (
                      <li key={item.title} className="relative">
                        <span
                          className={cn(
                            'absolute -start-6 top-1 h-3 w-3 rounded-full border-2 border-ink-900',
                            index === 0 ? 'bg-lime' : 'bg-ink-700',
                          )}
                          aria-hidden="true"
                        />
                        <p className="text-xs font-medium text-text-primary">{item.title}</p>
                        <p className="mt-0.5 text-[10.5px] text-text-secondary">{item.meta}</p>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5 flex items-center justify-between border-t border-line/70 pt-4">
                    <span className="text-[11px] text-text-secondary">{t('carproof.verifiedShare')}</span>
                    <span className="text-xs font-semibold text-lime">78%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MECHANIC AI */}
        <section id="mechanic" className="relative border-t border-line/60 py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-lime/[0.06] blur-[100px]" />
          </div>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                <div className="rounded-3xl border border-line bg-ink-800 p-5 shadow-card sm:p-6">
                  <div className="mb-4 flex items-center justify-between border-b border-line/70 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/10 text-lime">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{t('ai.title')}</p>
                        <p className="text-[10px] text-text-secondary">Toyota Corolla 2022 · 41,200 km</p>
                      </div>
                    </div>
                    <Badge tone="lime">{t('ai.demoBannerShort')}</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl rounded-ee-md bg-lime px-4 py-2.5 text-xs leading-relaxed text-ink-950">
                        {t('landing.mechanic.chatUser')}
                      </p>
                    </div>
                    <div className="flex justify-start">
                      <p className="max-w-[88%] rounded-2xl rounded-es-md border border-line bg-ink-900 px-4 py-2.5 text-xs leading-relaxed text-text-secondary">
                        {t('landing.mechanic.chatAssistant')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {[t('landing.mechanic.chip1'), t('landing.mechanic.chip2'), t('landing.mechanic.chip3')].map((chip) => (
                      <span key={chip} className="chip text-[10px]">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-ink-900 px-3 py-2.5">
                    <Camera className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                    <span className="flex-1 truncate text-[11px] text-text-secondary">{t('ai.inputPlaceholder')}</span>
                    <span className="rounded-md bg-lime/15 px-2 py-1 text-[10px] font-semibold text-lime">
                      {t('ai.send')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <SectionTitle
                  eyebrow={t('landing.mechanic.eyebrow')}
                  title={t('landing.mechanic.title')}
                  subtitle={t('landing.mechanic.body')}
                />
                <ul className="mt-7 space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <li key={n} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="text-sm leading-relaxed text-text-secondary">{t(`landing.mechanic.bullet${n}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="border-t border-line/60 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow={t('landing.how.eyebrow')}
              title={t('landing.how.title')}
              align="center"
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {[
                { icon: CarFront, title: t('landing.how.step1Title'), body: t('landing.how.step1Body') },
                { icon: ClipboardCheck, title: t('landing.how.step2Title'), body: t('landing.how.step2Body') },
                { icon: Sparkles, title: t('landing.how.step3Title'), body: t('landing.how.step3Body') },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="relative rounded-2xl border border-line bg-ink-800/60 p-6 transition hover:border-lime/25"
                  >
                    <span className="absolute end-5 top-5 text-3xl font-semibold text-white/[0.06]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-lime/20 bg-lime/10 text-lime">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-sm font-semibold text-text-primary">{step.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section id="benefits" className="border-t border-line/60 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle eyebrow={t('landing.benefits.eyebrow')} title={t('landing.benefits.title')} align="center" />
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: BadgeCheck, title: t('landing.benefits.resaleTitle'), body: t('landing.benefits.resaleBody') },
                { icon: Wallet, title: t('landing.benefits.costTitle'), body: t('landing.benefits.costBody') },
                { icon: BellRing, title: t('landing.benefits.remindTitle'), body: t('landing.benefits.remindBody') },
                { icon: ShieldCheck, title: t('landing.benefits.privacyTitle'), body: t('landing.benefits.privacyBody') },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="rounded-2xl border border-line bg-ink-800/40 p-5 transition hover:bg-ink-800/70">
                    <span className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-lime">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="text-[13px] font-semibold text-text-primary">{b.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{b.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-2 border-y border-line/60 py-8">
              {[
                { icon: BookOpenCheck, label: t('landing.categories.passport') },
                { icon: Sparkles, label: t('landing.categories.assistant') },
                { icon: CarFront, label: t('landing.categories.garage') },
                { icon: Gauge, label: t('landing.categories.reminders') },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <span key={item.label} className="chip">
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    {item.label}
                  </span>
                );
              })}
              <span className="chip">
                <CarFront className="h-3 w-3" aria-hidden="true" />
                {t('garage.results', { count: vehicles.length })}
              </span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-lime/20 bg-gradient-to-br from-lime/[0.13] via-ink-800 to-ink-900 p-8 sm:p-12">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-lime/20 blur-[90px]" aria-hidden="true" />
              <div className="relative max-w-xl">
                <h2 className="text-balance text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
                  {t('landing.cta.title')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{t('landing.cta.body')}</p>
                <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                  <Link to="/app">
                    <Button size="lg" icon={<Arrow className="h-4 w-4 rtl-flip" aria-hidden="true" />}>
                      {t('landing.cta.button')}
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="secondary">
                      {t('landing.cta.secondary')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60 bg-ink-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-text-secondary">{t('common.tagline')}</p>
            </div>
            <div>
              <p className="stat-label mb-3">{t('landing.footer.product')}</p>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><a href="#carproof" className="hover:text-text-primary">{t('landing.carproof.eyebrow')}</a></li>
                <li><a href="#mechanic" className="hover:text-text-primary">{t('landing.mechanic.eyebrow')}</a></li>
                <li><Link to="/app/garage" className="hover:text-text-primary">{t('nav.garage')}</Link></li>
                <li><Link to="/app/maintenance" className="hover:text-text-primary">{t('nav.maintenance')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="stat-label mb-3">{t('landing.footer.company')}</p>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><a href="#benefits" className="hover:text-text-primary">{t('landing.footer.about')}</a></li>
                <li><a href="#how" className="hover:text-text-primary">{t('landing.how.eyebrow')}</a></li>
                <li><span className="cursor-default">{t('landing.footer.contact')}</span></li>
              </ul>
            </div>
            <div>
              <p className="stat-label mb-3">{t('landing.footer.support')}</p>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><span className="cursor-default">{t('landing.footer.terms')}</span></li>
                <li><span className="cursor-default">{t('landing.footer.privacy')}</span></li>
                <li><Link to="/login" className="hover:text-text-primary">{t('nav.login')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-line/60 pt-6 text-[11px] text-text-secondary sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 CarOS. {t('landing.footer.rights')}</p>
            <p>{t('landing.footer.disclaimer')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
