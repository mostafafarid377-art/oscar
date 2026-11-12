import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CarFront, Plus, Search, X } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { useApp } from '@/lib/store';
import { VehicleCard } from '@/features/vehicles/VehicleCard';
import { VehicleFormModal } from '@/features/vehicles/VehicleFormModal';
import { DeleteVehicleModal } from '@/features/vehicles/DeleteVehicleModal';
import type { Vehicle } from '@/types';

export default function GaragePage() {
  const { t } = useTranslation();
  const { vehicles, primaryVehicleId, records } = useApp();
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | undefined>();
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v) =>
      [v.make, v.model, v.plate, String(v.year), v.trim ?? '', v.color]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [vehicles, query]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('garage.title')}
        subtitle={t('garage.subtitle')}
        actions={
          <Button
            size="md"
            icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            {t('garage.addVehicle')}
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-text-secondary" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('garage.searchPlaceholder')}
            aria-label={t('common.search')}
            className="field ps-9 pe-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('garage.clearSearch')}
              className="absolute inset-y-0 end-2 my-auto flex h-6 w-6 items-center justify-center rounded-md text-text-secondary hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <p className="text-[11px] text-text-secondary">
          {query
            ? t('garage.results', { count: filtered.length })
            : t('garage.results', { count: vehicles.length })}
        </p>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={<CarFront className="h-5 w-5" aria-hidden="true" />}
          title={t('garage.emptyTitle')}
          body={t('garage.emptyBody')}
          action={
            <Button
              onClick={() => {
                setEditing(undefined);
                setFormOpen(true);
              }}
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
            >
              {t('garage.emptyCta')}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t('garage.noMatchTitle', { query })}
          body={t('garage.noMatchBody')}
          action={
            <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
              {t('garage.clearSearch')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isPrimary={vehicle.id === primaryVehicleId}
                recordCount={records.filter((r) => r.vehicleId === vehicle.id).length}
                onEdit={() => {
                  setEditing(vehicle);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleting(vehicle)}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-ink-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <CarFront className="h-4 w-4 text-lime" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-text-secondary">{t('common.demoNotice')}</p>
            </div>
            <Link to="/app/carproof" className="shrink-0 text-[11px] font-medium text-lime hover:underline">
              {t('nav.carproof')}
            </Link>
          </div>
        </>
      )}

      <VehicleFormModal open={formOpen} onClose={() => setFormOpen(false)} vehicle={editing} />
      <DeleteVehicleModal vehicle={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
