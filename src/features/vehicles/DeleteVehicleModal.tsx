import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useToast } from '@/hooks/useToast';
import type { Vehicle } from '@/types';

export function DeleteVehicleModal({
  vehicle,
  onClose,
}: {
  vehicle: Vehicle | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { deleteVehicle } = useApp();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = vehicle ? `${vehicle.make} ${vehicle.model}` : '';

  const handleDelete = async () => {
    if (!vehicle) return;
    setBusy(true);
    setError(null);
    try {
      await deleteVehicle(vehicle.id);
      toast(t('garage.deleted', { vehicle: label }), 'warning');
      onClose();
    } catch (e) {
      // Surfaced rather than swallowed: a failed RLS delete must be visible.
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(vehicle)}
      onClose={onClose}
      size="sm"
      title={t('garage.deleteTitle', { vehicle: label })}
      description={t('garage.deleteBody')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={busy}>
            {t('common.delete')}
          </Button>
        </>
      }
    >
      {error ? (
        <p role="alert" className="text-[11px] leading-relaxed text-red-300">
          {error}
        </p>
      ) : (
        <p className="text-[11px] leading-relaxed text-text-secondary">
          {t('garage.deleteIrreversible')}
        </p>
      )}
    </Modal>
  );
}
