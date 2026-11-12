import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal, Select } from '@/components/ui';
import { useApp, fallbackImageForIndex } from '@/lib/store';
import { useToast } from '@/hooks/useToast';
import type { Vehicle } from '@/types';

const vehicleSchema = z.object({
  make: z.string().min(1, { message: 'garage.form.makeRequired' }),
  model: z.string().min(1, { message: 'garage.form.modelRequired' }),
  year: z.coerce.number().min(1950, { message: 'garage.form.yearInvalid' }).max(2027, { message: 'garage.form.yearInvalid' }),
  trim: z.string().optional(),
  plate: z.string().min(2, { message: 'garage.form.plateRequired' }),
  color: z.string().optional(),
  mileage: z.coerce.number().min(0, { message: 'garage.form.mileageInvalid' }).max(2_000_000, { message: 'garage.form.mileageInvalid' }),
  vin: z.string().optional(),
  fuelType: z.enum(['petrol', 'diesel', 'hybrid', 'electric']),
  transmission: z.enum(['automatic', 'manual', 'cvt']),
  drivetrain: z.enum(['fwd', 'rwd', 'awd']),
  category: z.enum(['sedan', 'suv', 'hatchback', 'pickup']),
});

type FormInput = z.input<typeof vehicleSchema>;
type FormOutput = z.output<typeof vehicleSchema>;

export function VehicleFormModal({
  open,
  onClose,
  vehicle,
}: {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle;
}) {
  const { t } = useTranslation();
  const { addVehicle, updateVehicle, vehicles } = useApp();
  const { toast } = useToast();
  const isEdit = Boolean(vehicle);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      trim: '',
      plate: '',
      color: '',
      mileage: 0,
      vin: '',
      fuelType: 'petrol',
      transmission: 'automatic',
      drivetrain: 'fwd',
      category: 'sedan',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      vehicle
        ? {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            trim: vehicle.trim ?? '',
            plate: vehicle.plate,
            color: vehicle.color,
            mileage: vehicle.mileage,
            vin: vehicle.vin,
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            drivetrain: vehicle.drivetrain,
            category: vehicle.category,
          }
        : {
            make: '',
            model: '',
            year: new Date().getFullYear(),
            trim: '',
            plate: '',
            color: '',
            mileage: 0,
            vin: '',
            fuelType: 'petrol',
            transmission: 'automatic',
            drivetrain: 'fwd',
            category: 'sedan',
          },
    );
  }, [open, vehicle, reset]);

  const onSubmit = async (values: FormOutput) => {
    await new Promise((r) => setTimeout(r, 300));
    if (vehicle) {
      updateVehicle(vehicle.id, {
        make: values.make,
        model: values.model,
        year: values.year,
        trim: values.trim || undefined,
        plate: values.plate,
        color: values.color || vehicle.color,
        mileage: values.mileage,
        vin: values.vin || vehicle.vin,
        fuelType: values.fuelType,
        transmission: values.transmission,
        drivetrain: values.drivetrain,
        category: values.category,
        isPrimary: vehicle.isPrimary,
      });
      toast(t('garage.updated'));
    } else {
      addVehicle({
        make: values.make,
        model: values.model,
        year: values.year,
        trim: values.trim || undefined,
        plate: values.plate,
        color: values.color || 'Not specified',
        vin: values.vin || '—',
        mileage: values.mileage,
        image: fallbackImageForIndex(vehicles.length),
        fuelType: values.fuelType,
        transmission: values.transmission,
        drivetrain: values.drivetrain,
        category: values.category,
        purchaseDate: new Date().toISOString().slice(0, 10),
        engine: { displacement: '—', cylinders: 4, power: '—', torque: '—', oilSpec: '—' },
      });
      toast(t('garage.added', { vehicle: `${values.make} ${values.model}` }));
    }
    onClose();
  };

  const fuelOptions = (['petrol', 'diesel', 'hybrid', 'electric'] as const).map((value) => ({
    value,
    label: t(`fuels.${value}`),
  }));
  const transmissionOptions = (['automatic', 'manual', 'cvt'] as const).map((value) => ({
    value,
    label: t(`transmissions.${value}`),
  }));
  const drivetrainOptions = (['fwd', 'rwd', 'awd'] as const).map((value) => ({
    value,
    label: t(`drivetrains.${value}`),
  }));
  const categoryOptions = (['sedan', 'suv', 'hatchback', 'pickup'] as const).map((value) => ({
    value,
    label: t(`categories.${value}`),
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? t('garage.form.editTitle') : t('garage.form.addTitle')}
      description={isEdit ? undefined : t('garage.form.addSubtitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="vehicle-form" loading={isSubmitting}>
            {isEdit ? t('garage.form.save') : t('garage.form.saveNew')}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="v-make"
            label={t('garage.form.make')}
            placeholder={t('garage.form.makePlaceholder')}
            required
            error={errors.make?.message ? t(errors.make.message) : undefined}
            {...register('make')}
          />
          <Input
            id="v-model"
            label={t('garage.form.model')}
            placeholder={t('garage.form.modelPlaceholder')}
            required
            error={errors.model?.message ? t(errors.model.message) : undefined}
            {...register('model')}
          />
          <Input
            id="v-year"
            label={t('garage.form.year')}
            type="number"
            inputMode="numeric"
            required
            error={errors.year?.message ? t(errors.year.message) : undefined}
            {...register('year')}
          />
          <Input id="v-trim" label={t('garage.form.trim')} placeholder="Smart Plus" {...register('trim')} />
          <Input
            id="v-plate"
            label={t('garage.form.plate')}
            placeholder={t('garage.form.platePlaceholder')}
            required
            error={errors.plate?.message ? t(errors.plate.message) : undefined}
            {...register('plate')}
          />
          <Input id="v-color" label={t('garage.form.color')} placeholder="Polar White" {...register('color')} />
          <Input
            id="v-mileage"
            label={t('garage.form.mileage')}
            type="number"
            inputMode="numeric"
            required
            error={errors.mileage?.message ? t(errors.mileage.message) : undefined}
            {...register('mileage')}
          />
          <Input id="v-vin" label={t('garage.form.vin')} placeholder="KMHD141CAGT204871" {...register('vin')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select id="v-fuel" label={t('garage.form.fuelType')} options={fuelOptions} {...register('fuelType')} />
          <Select
            id="v-transmission"
            label={t('garage.form.transmission')}
            options={transmissionOptions}
            {...register('transmission')}
          />
          <Select id="v-drivetrain" label={t('garage.form.drivetrain')} options={drivetrainOptions} {...register('drivetrain')} />
          <Select id="v-category" label={t('garage.form.category')} options={categoryOptions} {...register('category')} />
        </div>

        {!isEdit ? (
          <p className="rounded-xl border border-line bg-ink-900/60 px-3 py-2.5 text-[11px] leading-relaxed text-text-secondary">
            {t('garage.form.imageNote')}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
