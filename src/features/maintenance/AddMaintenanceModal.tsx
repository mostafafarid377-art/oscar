import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal, Select, Textarea } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useToast } from '@/hooks/useToast';
import type { RecordKind } from '@/types';

const schema = z.object({
  title: z.string().min(3, { message: 'maintenance.titleRequired' }),
  kind: z.enum(['maintenance', 'repair', 'inspection']),
  status: z.enum(['completed', 'scheduled', 'overdue', 'in_progress']),
  date: z.string().min(1, { message: 'maintenance.mileageRequired' }),
  mileage: z.coerce.number().min(0, { message: 'maintenance.mileageRequired' }),
  cost: z.coerce.number().min(0, { message: 'maintenance.costInvalid' }),
  workshop: z.string().optional(),
  intervalKm: z.coerce.number().min(0).optional(),
  intervalMonths: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function AddMaintenanceModal({
  open,
  onClose,
  defaultMileage,
}: {
  open: boolean;
  onClose: () => void;
  defaultMileage: number;
}) {
  const { t } = useTranslation();
  const { addRecord, activeVehicle } = useApp();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      kind: 'maintenance',
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
      mileage: defaultMileage,
      cost: 0,
      workshop: '',
      intervalKm: 10000,
      intervalMonths: 6,
      notes: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: '',
      kind: 'maintenance',
      status: 'completed',
      date: new Date().toISOString().slice(0, 10),
      mileage: defaultMileage,
      cost: 0,
      workshop: '',
      intervalKm: 10000,
      intervalMonths: 6,
      notes: '',
    });
  }, [open, defaultMileage, reset]);

  const onSubmit = async (values: FormOutput) => {
    await new Promise((r) => setTimeout(r, 300));
    if (!activeVehicle) return;
    const isCompleted = values.status === 'completed';
    addRecord({
      vehicleId: activeVehicle.id,
      title: values.title,
      titleAr: values.title,
      kind: values.kind as RecordKind,
      status: values.status,
      date: values.date,
      mileage: values.mileage,
      nextDueDate: isCompleted && values.intervalMonths
        ? new Date(new Date(values.date).setMonth(new Date(values.date).getMonth() + values.intervalMonths))
            .toISOString()
            .slice(0, 10)
        : undefined,
      nextDueMileage: values.intervalKm ? values.mileage + values.intervalKm : undefined,
      intervalKm: values.intervalKm || undefined,
      intervalMonths: values.intervalMonths || undefined,
      cost: values.cost,
      workshop: values.workshop?.trim() || '—',
      workshopAr: values.workshop?.trim() || '—',
      notes: values.notes?.trim() || undefined,
      verification: 'owner_reported',
    });
    toast(t('maintenance.added'));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('maintenance.addTitle')}
      description={t('maintenance.addSubtitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="maintenance-form" loading={isSubmitting}>
            {t('maintenance.addButton')}
          </Button>
        </>
      }
    >
      <form id="maintenance-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="m-title"
            label={t('maintenance.eventTitle')}
            placeholder={t('maintenance.eventTitlePlaceholder')}
            required
            className="sm:col-span-2"
            error={errors.title?.message ? t(errors.title.message) : undefined}
            {...register('title')}
          />
          <Select
            id="m-kind"
            label={t('maintenance.kind')}
            options={[
              { value: 'maintenance', label: t('maintenance.kindMaintenance') },
              { value: 'repair', label: t('maintenance.kindRepair') },
              { value: 'inspection', label: t('maintenance.kindInspection') },
            ]}
            {...register('kind')}
          />
          <Select
            id="m-status"
            label={t('common.status')}
            options={[
              { value: 'completed', label: t('statuses.completed') },
              { value: 'scheduled', label: t('statuses.scheduled') },
              { value: 'overdue', label: t('statuses.overdue') },
            ]}
            {...register('status')}
          />
          <Input
            id="m-date"
            label={t('maintenance.date')}
            type="date"
            required
            error={errors.date?.message ? t(errors.date.message) : undefined}
            {...register('date')}
          />
          <Input
            id="m-mileage"
            label={t('maintenance.mileage')}
            type="number"
            inputMode="numeric"
            required
            error={errors.mileage?.message ? t(errors.mileage.message) : undefined}
            {...register('mileage')}
          />
          <Input
            id="m-cost"
            label={t('maintenance.cost')}
            type="number"
            inputMode="numeric"
            error={errors.cost?.message ? t(errors.cost.message) : undefined}
            {...register('cost')}
          />
          <Input
            id="m-workshop"
            label={t('maintenance.workshop')}
            placeholder={t('maintenance.workshopPlaceholder')}
            {...register('workshop')}
          />
          <Input id="m-interval-km" label={t('maintenance.intervalKm')} type="number" inputMode="numeric" {...register('intervalKm')} />
          <Input
            id="m-interval-months"
            label={t('maintenance.intervalMonths')}
            type="number"
            inputMode="numeric"
            {...register('intervalMonths')}
          />
        </div>
        <Textarea id="m-notes" label={t('maintenance.notes')} placeholder={t('common.optional')} {...register('notes')} />
        <p className="rounded-xl border border-line bg-ink-900/60 px-3 py-2.5 text-[10.5px] leading-relaxed text-text-secondary">
          {t('maintenance.addSubtitle')}
        </p>
      </form>
    </Modal>
  );
}
