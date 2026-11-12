import type { DiagnosticSummary } from '@/types';

export type DemoIntent =
  | 'brakeSqueal'
  | 'oilInterval'
  | 'acWeak'
  | 'warningLight'
  | 'tyreWear'
  | 'noise'
  | 'thanks'
  | 'cost'
  | 'urgent'
  | 'default';

const MATCHERS: { intent: DemoIntent; patterns: RegExp[] }[] = [
  { intent: 'brakeSqueal', patterns: [/brak/i, /squeal/i, /فرامل/i, /فرملة/i, /صفير/i] },
  { intent: 'oilInterval', patterns: [/oil/i, /زيت/i, /service interval/i, /صيانة.*زيت/i] },
  { intent: 'acWeak', patterns: [/a\/?c\b/i, /air ?cond/i, /cool/i, /تكييف/i, /تبريد/i, /فريون/i] },
  { intent: 'warningLight', patterns: [/check engine/i, /warning light/i, /engine light/i, /لمبة/i, /تحذير/i] },
  { intent: 'tyreWear', patterns: [/tyre/i, /tire/i, /wheel wear/i, /إطار/i, /كاوتش/i, /تآكل/i] },
  { intent: 'noise', patterns: [/click/i, /noise/i, /sound/i, /rattle/i, /صوت/i, /طقطقة/i, /كتكوتة/i] },
  { intent: 'thanks', patterns: [/thank/i, /thanks/i, /شكر/i, /تمام/i, /ماشي/i] },
  { intent: 'cost', patterns: [/cost/i, /price/i, /how much/i, /تكلفة/i, /سعر/i, /بكام/i, /هيكلف/i] },
  { intent: 'urgent', patterns: [/stop driving/i, /safe to drive/i, /urgent/i, /أوقف/i, /خطر/i, /آمن/i] },
];

export function detectIntent(message: string): DemoIntent {
  for (const matcher of MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(message))) return matcher.intent;
  }
  return 'default';
}

const URGENCY: Record<DemoIntent, DiagnosticSummary['urgency']> = {
  brakeSqueal: 'low',
  oilInterval: 'medium',
  acWeak: 'low',
  warningLight: 'high',
  tyreWear: 'medium',
  noise: 'medium',
  thanks: 'low',
  cost: 'low',
  urgent: 'high',
  default: 'medium',
};

export function buildDiagnostic(intent: DemoIntent): DiagnosticSummary | undefined {
  if (intent === 'thanks' || intent === 'cost' || intent === 'urgent') return undefined;
  const key = intent === 'default' ? 'default' : intent;
  return {
    topicKey: `ai.diagnostic.${key}.topic`,
    topicAr: '',
    urgency: URGENCY[intent],
    summaryKey: `ai.diagnostic.${key}.summary`,
    summaryAr: '',
    actions: [
      { key: `ai.diagnostic.${key}.action1`, ar: '' },
      { key: `ai.diagnostic.${key}.action2`, ar: '' },
      { key: `ai.diagnostic.${key}.action3`, ar: '' },
    ],
    demo: true,
  };
}

export function isDiagnosticIntent(intent: DemoIntent): boolean {
  return intent !== 'thanks' && intent !== 'cost' && intent !== 'urgent';
}
