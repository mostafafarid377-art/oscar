import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  FileText,
  Image as ImageIcon,
  Search,
  Trash2,
  Upload,
  X,
  FileCheck2,
  Filter,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DemoBadge,
  EmptyState,
  Modal,
  Select,
  VerificationBadge,
} from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { UploadDocumentModal } from '@/features/documents/UploadDocumentModal';
import { useApp } from '@/lib/store';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate, formatFileSize } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { DocumentCategory, VehicleDocument } from '@/types';

const CATEGORIES: (DocumentCategory | 'all')[] = [
  'all',
  'invoice',
  'inspection',
  'insurance',
  'registration',
  'warranty',
  'other',
];

export default function DocumentsPage() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { documents, vehicles, deleteDocument } = useApp();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<VehicleDocument | null>(null);
  const [deleting, setDeleting] = useState<VehicleDocument | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      const matchCategory = category === 'all' || doc.category === category;
      const matchVehicle = vehicleFilter === 'all' || doc.vehicleId === vehicleFilter;
      const name = language === 'ar' ? `${doc.name} ${doc.nameAr ?? ''}` : doc.name;
      const matchQuery = !q || `${name} ${doc.issuedBy} ${doc.issuedByAr ?? ''}`.toLowerCase().includes(q);
      return matchCategory && matchVehicle && matchQuery;
    });
  }, [documents, category, vehicleFilter, query, language]);

  const counts = useMemo(
    () =>
      CATEGORIES.reduce<Record<string, number>>((acc, key) => {
        acc[key] = key === 'all' ? documents.length : documents.filter((d) => d.category === key).length;
        return acc;
      }, {}),
    [documents],
  );

  const vehicleName = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.make} ${v.model}` : '—';
  };

  const categoryOptions = CATEGORIES.filter((c) => c !== 'all').map((value) => ({
    value: value as string,
    label: t(`documents.categories.${value}`),
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('documents.title')}
        subtitle={t('documents.subtitle', { vehicle: vehicles.length === 1 ? vehicleName(vehicles[0].id) : t('documents.allVehicles') })}
        badge={<DemoBadge label={t('common.demoBadge')} />}
        actions={
          <Button onClick={() => setUploadOpen(true)} icon={<Upload className="h-4 w-4" aria-hidden="true" />}>
            {t('documents.upload')}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-text-secondary" aria-hidden="true" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('documents.searchPlaceholder')}
            aria-label={t('common.search')}
            className="field ps-9 pe-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('common.clear')}
              className="absolute inset-y-0 end-2 my-auto flex h-6 w-6 items-center justify-center rounded-md text-text-secondary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <Button
          variant="secondary"
          size="md"
          className="sm:hidden"
          onClick={() => setShowFilters((v) => !v)}
          icon={<Filter className="h-4 w-4" aria-hidden="true" />}
        >
          {t('common.filters')}
        </Button>
        <div className={cn('flex-1 gap-2 sm:flex', showFilters ? 'flex flex-col' : 'hidden sm:flex sm:flex-row')}>
          <Select
            id="doc-filter-vehicle"
            aria-label={t('documents.filterVehicle')}
            options={[
              { value: 'all', label: t('documents.allVehicles') },
              ...vehicles.map((v) => ({ value: v.id, label: `${v.make} ${v.model}` })),
            ]}
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="sm:max-w-[200px]"
          />
          <Select
            id="doc-filter-category"
            aria-label={t('documents.filterCategory')}
            options={[{ value: 'all', label: t('common.all') }, ...categoryOptions]}
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory | 'all')}
            className="sm:max-w-[190px]"
          />
        </div>
        <p className="text-[11px] text-text-secondary sm:ms-auto">
          {t('documents.results', { count: filtered.length })}
        </p>
      </div>

      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition',
              category === key
                ? 'border-lime bg-lime text-ink-950'
                : 'border-line bg-ink-800 text-text-secondary hover:border-white/20 hover:text-text-primary',
            )}
          >
            {key === 'all' ? t('common.all') : t(`documents.categories.${key}`)}
            <span className={cn('text-[10px]', category === key ? 'text-ink-950/60' : 'text-text-secondary/70')}>
              {counts[key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" aria-hidden="true" />}
          title={t('documents.emptyTitle')}
          body={t('documents.emptyBody')}
          action={
            <Button onClick={() => setUploadOpen(true)} icon={<Upload className="h-4 w-4" aria-hidden="true" />}>
              {t('documents.upload')}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('documents.noMatchTitle')} body={t('documents.noMatchBody')} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => (
            <li key={doc.id}>
              <Card padded={false} className="group h-full overflow-hidden transition hover:border-white/15">
                <div className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-ink-900 text-text-secondary">
                    {doc.fileType === 'pdf' ? (
                      <FileText className="h-4.5 w-4.5" aria-hidden="true" />
                    ) : (
                      <ImageIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-text-primary">
                      {language === 'ar' ? doc.nameAr ?? doc.name : doc.name}
                    </p>
                    <p className="mt-1 truncate text-[10.5px] text-text-secondary">
                      {language === 'ar' ? doc.issuedByAr ?? doc.issuedBy : doc.issuedBy}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
                  <Badge tone="neutral" className="uppercase">
                    {t(`documents.categories.${doc.category}`)}
                  </Badge>
                  {doc.localPreviewUrl ? <Badge tone="warning">{t('documents.uploadedLocally')}</Badge> : null}
                  <VerificationBadge level={doc.verification} />
                </div>
                <dl className="grid grid-cols-3 gap-px border-t border-line/70 bg-line/50 text-center">
                  <div className="bg-ink-800 px-2 py-2">
                    <dt className="text-[9px] uppercase tracking-wider text-text-secondary">{t('documents.fileSize')}</dt>
                    <dd className="mt-0.5 text-[10.5px] font-medium text-text-primary">{formatFileSize(doc.sizeKb)}</dd>
                  </div>
                  <div className="bg-ink-800 px-2 py-2">
                    <dt className="text-[9px] uppercase tracking-wider text-text-secondary">{t('common.date')}</dt>
                    <dd className="mt-0.5 text-[10.5px] font-medium text-text-primary">{formatDate(doc.date, language)}</dd>
                  </div>
                  <div className="bg-ink-800 px-2 py-2">
                    <dt className="text-[9px] uppercase tracking-wider text-text-secondary">{t('common.cost')}</dt>
                    <dd className="mt-0.5 text-[10.5px] font-medium text-text-primary">
                      {doc.amount ? formatCurrency(doc.amount, language) : '—'}
                    </dd>
                  </div>
                </dl>
                <div className="flex items-center justify-between border-t border-line/70 px-3 py-2">
                  <span className="truncate text-[10px] text-text-secondary">{vehicleName(doc.vehicleId)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreview(doc)}
                      aria-label={t('documents.preview')}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition hover:bg-white/5 hover:text-lime"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(doc)}
                      aria-label={t('common.delete')}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-line bg-ink-900/40 px-3.5 py-2.5 text-[10.5px] leading-relaxed text-text-secondary">
        <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-lime" aria-hidden="true" />
        {t('documents.storageNote')}
      </p>

      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} />

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={t('documents.previewTitle')}
        description={preview ? (language === 'ar' ? preview.nameAr ?? preview.name : preview.name) : undefined}
        footer={<Button variant="secondary" onClick={() => setPreview(null)}>{t('common.close')}</Button>}
      >
        {preview ? (
          <div className="space-y-4">
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-xl border border-line bg-ink-900/70 px-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-ink-800 text-text-secondary">
                {preview.fileType === 'pdf' ? <FileText className="h-5 w-5" aria-hidden="true" /> : <ImageIcon className="h-5 w-5" aria-hidden="true" />}
              </span>
              <p className="text-[11px] leading-relaxed text-text-secondary">{t('documents.previewUnavailable')}</p>
              <Badge tone="neutral" className="uppercase">
                {preview.fileType}
              </Badge>
            </div>
            <dl className="space-y-2 rounded-xl border border-line bg-ink-900/50 p-3.5">
              {[
                { label: t('documents.fileName'), value: preview.name },
                { label: t('documents.fileType'), value: preview.fileType.toUpperCase() },
                { label: t('documents.fileSize'), value: formatFileSize(preview.sizeKb) },
                { label: t('documents.uploadedOn'), value: formatDate(preview.date, language) },
                { label: t('documents.issuedBy'), value: language === 'ar' ? preview.issuedByAr ?? preview.issuedBy : preview.issuedBy },
                { label: t('documents.filterVehicle'), value: vehicleName(preview.vehicleId) },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 text-[11px]">
                  <dt className="text-text-secondary">{row.label}</dt>
                  <dd className="max-w-[60%] text-end font-medium text-text-primary">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-secondary">{t('documents.verification')}</span>
              <VerificationBadge level={preview.verification} />
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        size="sm"
        title={t('documents.deleteTitle')}
        description={t('documents.deleteBody', {
          name: deleting ? (language === 'ar' ? deleting.nameAr ?? deleting.name : deleting.name) : '',
        })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!deleting) return;
                deleteDocument(deleting.id);
                toast(t('documents.deleted'), 'warning');
                setDeleting(null);
              }}
            >
              {t('common.delete')}
            </Button>
          </>
        }
      />
    </div>
  );
}
