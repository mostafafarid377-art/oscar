import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, UploadCloud, X } from 'lucide-react';
import { Button, Input, Modal, Select } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useToast } from '@/hooks/useToast';
import { useLanguage } from '@/hooks/useLanguage';
import { formatFileSize } from '@/utils/format';
import type { DocumentCategory } from '@/types';

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png'];
const CATEGORIES: DocumentCategory[] = ['invoice', 'inspection', 'insurance', 'registration', 'warranty', 'other'];

export function UploadDocumentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { addDocument, activeVehicle } = useApp();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('invoice');
  const [issuedBy, setIssuedBy] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<{ name?: string; file?: string }>({});
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setName('');
    setCategory('invoice');
    setIssuedBy('');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setErrors({});
  }, [open]);

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    if (!ACCEPTED.includes(selected.type)) {
      setErrors((e) => ({ ...e, file: t('documents.fileTypeInvalid') }));
      return;
    }
    if (selected.size > MAX_SIZE) {
      setErrors((e) => ({ ...e, file: t('documents.fileTooLarge') }));
      return;
    }
    setFile(selected);
    setErrors((e) => ({ ...e, file: undefined }));
    if (!name) setName(selected.name.replace(/\.[^.]+$/, ''));
  };

  const submit = () => {
    const nextErrors: { name?: string; file?: string } = {};
    if (!name.trim()) nextErrors.name = t('documents.nameRequired');
    if (!file) nextErrors.file = t('documents.fileRequired');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !activeVehicle) return;

    const fileType = file!.name.toLowerCase().endsWith('.pdf') ? 'pdf' : file!.name.toLowerCase().endsWith('.png') ? 'png' : 'jpg';

    addDocument({
      vehicleId: activeVehicle.id,
      name: name.trim(),
      category,
      issuedBy: issuedBy.trim() || '—',
      date,
      fileType,
      sizeKb: Math.round(file!.size / 1024),
      amount: amount ? Number(amount) : undefined,
      verification: 'owner_reported',
      localPreviewUrl: true,
      note: t('documents.localOnly'),
    });
    toast(t('documents.added'));
    onClose();
  };

  const categoryOptions = CATEGORIES.map((value) => ({ value, label: t(`documents.categories.${value}`) }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('documents.uploadTitle')}
      description={t('documents.uploadBody')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={submit}>{t('documents.addButton')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className={`rounded-2xl border-2 border-dashed px-5 py-9 text-center transition ${
            dragging ? 'border-lime bg-lime/5' : 'border-line bg-ink-900/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            aria-label={t('documents.dropzone')}
          />
          <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-ink-800 text-lime">
              <UploadCloud className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium text-text-primary">{t('documents.dropzone')}</span>
            <span className="text-[10.5px] text-text-secondary">{t('documents.dropzoneHint')}</span>
          </button>
        </div>

        {errors.file ? (
          <p role="alert" className="text-[11px] font-medium text-red-400">
            {errors.file}
          </p>
        ) : null}

        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-900/60 px-3 py-2.5">
            <FileUp className="h-4 w-4 shrink-0 text-lime" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-text-primary">{file.name}</p>
              <p className="text-[10px] text-text-secondary">
                {formatFileSize(Math.round(file.size / 1024))} · {t('documents.localOnly')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label={t('common.clear')}
              className="rounded-md p-1 text-text-secondary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="doc-name"
            label={t('documents.name')}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <Select
            id="doc-category"
            label={t('documents.category')}
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          />
          <Input
            id="doc-issued"
            label={t('documents.issuedBy')}
            placeholder={language === 'ar' ? 'مركز الشريف للسيارات' : 'El-Sherif Auto Center'}
            value={issuedBy}
            onChange={(e) => setIssuedBy(e.target.value)}
          />
          <Input
            id="doc-amount"
            label={t('documents.amount')}
            type="number"
            inputMode="numeric"
            placeholder="1850"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            id="doc-date"
            label={t('documents.uploadedOn')}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <p className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2.5 text-[10.5px] leading-relaxed text-amber-200/90">
          {t('documents.storageNote')}
        </p>
      </div>
    </Modal>
  );
}
