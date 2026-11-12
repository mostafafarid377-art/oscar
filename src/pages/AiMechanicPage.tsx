import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  ImagePlus,
  MessageSquarePlus,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
  AlertTriangle,
  History,
  ChevronDown,
} from 'lucide-react';
import { Badge, Button, DemoBadge, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { ChatBubble } from '@/features/ai/ChatBubble';
import { buildDiagnostic, detectIntent, isDiagnosticIntent } from '@/features/ai/demoEngine';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/useToast';
import { formatNumber, relativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { ChatMessage } from '@/types';

const SUGGESTION_KEYS = ['brakeSqueal', 'oilInterval', 'acWeak', 'warningLight', 'tyreWear', 'noise'] as const;

export default function AiMechanicPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const {
    chats,
    activeVehicle,
    createChatThread,
    appendChatMessage,
    clearChatThread,
    recordsForVehicle,
    vehicles,
  } = useApp();

  const vehicleChats = useMemo(
    () =>
      activeVehicle
        ? chats
            .filter((c) => c.vehicleId === activeVehicle.id)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        : [],
    [chats, activeVehicle],
  );

  const [threadId, setThreadId] = useState<string | null>(vehicleChats[0]?.id ?? null);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!threadId && vehicleChats.length > 0) setThreadId(vehicleChats[0].id);
  }, [threadId, vehicleChats]);

  useEffect(() => {
    setThreadId(vehicleChats[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVehicle?.id]);

  const thread = chats.find((c) => c.id === threadId);
  const messages = thread?.messages ?? [];
  const records = activeVehicle ? recordsForVehicle(activeVehicle.id) : [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, thinking]);

  const ensureThread = (): string => {
    if (threadId && chats.some((c) => c.id === threadId)) return threadId;
    if (!activeVehicle) return '';
    const created = createChatThread(activeVehicle.id);
    setThreadId(created.id);
    return created.id;
  };

  const reply = (message: string, targetThreadId: string) => {
    const intent = detectIntent(message);
    setThinking(true);

    window.setTimeout(() => {
      const vehicle = activeVehicle;
      const remaining = Math.max(
        0,
        (records.find((r) => r.title.toLowerCase().includes('oil'))?.nextDueMileage ?? vehicle?.mileage ?? 0) -
          (vehicle?.mileage ?? 0),
      );

      const englishText =
        intent === 'cost'
          ? t('ai.costReply', { lng: 'en' })
          : intent === 'urgent'
            ? t('ai.urgentReply', { lng: 'en' })
            : intent === 'thanks'
              ? t('ai.replies.thanks', { lng: 'en', name: 'Omar' })
              : t(`ai.replies.${isDiagnosticIntent(intent) ? intent : 'default'}`, {
                  lng: 'en',
                  name: 'Omar',
                  vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : '',
                  mileage: vehicle ? formatNumber(vehicle.mileage, 'en') : '',
                  remaining: formatNumber(remaining, 'en'),
                  count: records.length,
                });

      const arabicText =
        intent === 'cost'
          ? t('ai.costReply', { lng: 'ar' })
          : intent === 'urgent'
            ? t('ai.urgentReply', { lng: 'ar' })
            : intent === 'thanks'
              ? t('ai.replies.thanks', { lng: 'ar', name: 'عمر' })
              : t(`ai.replies.${isDiagnosticIntent(intent) ? intent : 'default'}`, {
                  lng: 'ar',
                  name: 'عمر',
                  vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : '',
                  mileage: vehicle ? formatNumber(vehicle.mileage, 'ar') : '',
                  remaining: formatNumber(remaining, 'ar'),
                  count: records.length,
                });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        text: englishText,
        textAr: arabicText,
        createdAt: new Date().toISOString(),
        diagnostic: buildDiagnostic(intent),
      };

      appendChatMessage(targetThreadId, assistantMessage);
      setThinking(false);
      toast(t('ai.responseReady'), 'info');
    }, 1100);
  };

  const send = (raw?: string) => {
    const message = (raw ?? input).trim();
    if (!message && !attachment) return;
    if (!activeVehicle) return;
    const targetThreadId = ensureThread();
    if (!targetThreadId) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      text: message || t('ai.attachAdded'),
      textAr: message,
      createdAt: new Date().toISOString(),
      attachment: attachment ? { name: attachment, kind: 'image' } : undefined,
    };
    appendChatMessage(targetThreadId, userMessage);
    setInput('');
    setAttachment(null);
    reply(message, targetThreadId);
  };

  const newThread = () => {
    if (!activeVehicle) return;
    const created = createChatThread(activeVehicle.id);
    setThreadId(created.id);
    setHistoryOpen(false);
  };

  if (!activeVehicle) {
    return (
      <EmptyState title={t('garage.emptyTitle')} body={t('garage.emptyBody')} />
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('ai.title')}
        subtitle={t('ai.subtitle')}
        badge={
          <>
            <DemoBadge label={t('common.demoBadge')} />
            <Badge tone="lime">{t('ai.demoBannerShort')}</Badge>
          </>
        }
        actions={
          <Button size="md" variant="secondary" onClick={newThread} icon={<MessageSquarePlus className="h-4 w-4" aria-hidden="true" />}>
            {t('ai.newChat')}
          </Button>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-3.5 py-2.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-amber-100/90">{t('ai.demoBanner')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_310px]">
        {/* Chat panel */}
        <div className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-line bg-ink-800">
          {/* Vehicle context header */}
          <div className="flex items-center gap-3 border-b border-line/80 bg-ink-900/50 px-4 py-3">
            <img src={activeVehicle.image} alt="" className="h-9 w-12 rounded-md border border-line object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-text-primary">
                {activeVehicle.make} {activeVehicle.model} {activeVehicle.year}
              </p>
              <p className="truncate text-[10.5px] text-text-secondary">
                {formatNumber(activeVehicle.mileage, language)} {t('common.km')} ·{' '}
                {t('ai.recordsInContext', { count: records.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[10px] font-medium text-text-secondary transition hover:text-text-primary lg:hidden"
            >
              <History className="h-3 w-3" aria-hidden="true" />
              {t('ai.history')}
              <ChevronDown className={cn('h-3 w-3 transition', historyOpen && 'rotate-180')} aria-hidden="true" />
            </button>
            <Badge tone="lime" className="hidden shrink-0 sm:inline-flex">
              <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
              {t('ai.demoLabel')}
            </Badge>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 scrollbar-thin">
            {messages.length === 0 && !thinking ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-lime/25 bg-lime/10 text-lime">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="text-sm font-semibold text-text-primary">{t('ai.emptyTitle')}</h3>
                <p className="max-w-xs text-[11.5px] leading-relaxed text-text-secondary">{t('ai.emptyBody')}</p>
                <div className="mt-2 flex max-w-md flex-wrap justify-center gap-1.5">
                  {SUGGESTION_KEYS.slice(0, 4).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => send(t(`ai.suggestionsList.${key}`))}
                      className="rounded-full border border-line bg-ink-900 px-2.5 py-1.5 text-[10.5px] text-text-secondary transition hover:border-lime/40 hover:text-lime"
                    >
                      {t(`ai.suggestionsList.${key}`)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => <ChatBubble key={message.id} message={message} />)
            )}

            {thinking ? (
              <div className="flex items-center gap-2.5" role="status" aria-live="polite">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse-soft" aria-hidden="true" />
                </span>
                <div className="rounded-2xl rounded-es-md border border-line bg-ink-900 px-3.5 py-2.5">
                  <span className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-text-secondary"
                        style={{ animationDelay: `${i * 180}ms` }}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ms-1.5 text-[10.5px] text-text-secondary">{t('ai.thinking')}</span>
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Composer */}
          <div className="border-t border-line/80 bg-ink-900/50 p-3">
            {attachment ? (
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-ink-800 px-2.5 py-1.5">
                <ImagePlus className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
                <span className="flex-1 truncate text-[10.5px] text-text-primary">{attachment}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label={t('common.clear')}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ) : null}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAttachment(file.name);
                    toast(t('ai.attachAdded'), 'info');
                  }
                  e.target.value = '';
                }}
                aria-label={t('ai.attach')}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label={t('ai.attach')}
                title={t('ai.attachNote')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line text-text-secondary transition hover:border-lime/40 hover:text-lime"
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
              </button>
              <label htmlFor="ai-input" className="sr-only">
                {t('ai.inputPlaceholder')}
              </label>
              <textarea
                id="ai-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={t('ai.inputPlaceholder')}
                className="field max-h-28 min-h-[40px] flex-1 resize-none py-2.5 leading-relaxed"
              />
              <Button
                type="submit"
                size="md"
                aria-label={t('ai.send')}
                disabled={!input.trim() && !attachment}
                className="h-10 w-10 shrink-0 px-0"
                icon={<Send className="h-4 w-4 rtl-flip" aria-hidden="true" />}
              />
            </form>
            <p className="mt-2 text-[9.5px] leading-relaxed text-text-secondary">{t('ai.disclaimer')}</p>
          </div>
        </div>

        {/* Side panel */}
        <div className={cn('min-w-0 space-y-4', historyOpen ? 'block' : 'hidden lg:block')}>
          <div className="rounded-2xl border border-line bg-ink-800 p-4">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-text-primary">
              <Sparkles className="h-3.5 w-3.5 text-lime" aria-hidden="true" />
              {t('ai.suggestions')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTION_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => send(t(`ai.suggestionsList.${key}`))}
                  className="rounded-full border border-line bg-ink-900 px-2.5 py-1.5 text-start text-[10.5px] leading-snug text-text-secondary transition hover:border-lime/40 hover:text-lime"
                >
                  {t(`ai.suggestionsList.${key}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-ink-800 p-4">
            <p className="mb-1.5 text-[11px] font-semibold text-text-primary">{t('ai.contextTitle')}</p>
            <p className="mb-2.5 text-[10.5px] leading-relaxed text-text-secondary">{t('ai.contextBody')}</p>
            <ul className="space-y-1.5">
              {records.slice(0, 5).map((record) => (
                <li key={record.id} className="flex items-center justify-between gap-2 text-[10.5px]">
                  <span className="truncate text-text-secondary">
                    {language === 'ar' ? record.titleAr : record.title}
                  </span>
                  <span className="shrink-0 font-medium text-text-primary">
                    {formatNumber(record.mileage, language)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 border-t border-line/70 pt-2 text-[9.5px] text-text-secondary">
              {t('ai.recordsInContext', { count: records.length })} · {vehicles.length} {t('nav.garage')}
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-ink-800 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold text-text-primary">
                <History className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                {t('ai.history')}
              </p>
              <button
                type="button"
                onClick={newThread}
                aria-label={t('ai.newChat')}
                className="flex h-6 w-6 items-center justify-center rounded-md border border-line text-text-secondary transition hover:text-lime"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
            {vehicleChats.length === 0 ? (
              <p className="text-[10.5px] text-text-secondary">{t('ai.untitled')}</p>
            ) : (
              <ul className="space-y-1">
                {vehicleChats.map((chat) => (
                  <li key={chat.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setThreadId(chat.id);
                        setHistoryOpen(false);
                      }}
                      className={cn(
                        'w-full rounded-lg px-2.5 py-2 text-start transition',
                        chat.id === threadId ? 'bg-lime/10' : 'hover:bg-white/5',
                      )}
                    >
                      <span
                        className={cn(
                          'block truncate text-[10.5px] font-medium',
                          chat.id === threadId ? 'text-lime' : 'text-text-primary',
                        )}
                      >
                        {language === 'ar' ? chat.titleAr : chat.title}
                      </span>
                      <span className="mt-0.5 block text-[9.5px] text-text-secondary">
                        {chat.messages.length} · {relativeTime(chat.updatedAt, language)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {thread && thread.messages.length > 0 ? (
            <button
              type="button"
              onClick={() => clearChatThread(thread.id)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-[10.5px] font-medium text-text-secondary transition hover:border-red-500/30 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
              {t('ai.clearChat')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
