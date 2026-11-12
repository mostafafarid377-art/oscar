import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@/components/ui';
import { useApp } from '@/lib/store';
import { useToast } from '@/hooks/useToast';
import type { Vehicle } from '@/types';

export function DeleteVehicleModal({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { deleteVehicle } = useApp();
  const { toast } = useToast();

  return (
    <Modal
      open={Boolean(vehicle)}
      onClose={onClose}
      size="sm"
      title={t('garage.deleteTitle', { vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : '' })}
      description={t('garage.deleteBody')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (!vehicle) return;
              deleteVehicle(vehicle.id);
              toast(t('garage.deleted', { vehicle: `${vehicle.make} ${vehicle.model}` }), 'warning');
              onClose();
            }}
          >
            {t('common.delete')}
          </Button>
        </>
      }
    />
  );
}
