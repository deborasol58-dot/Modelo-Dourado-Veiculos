import { useState, useEffect, useCallback } from 'react';
import { vehicleService } from '../services/vehicle.service';
import { Car } from '../types';

export function useVehicle(id: string | null) {
  const [vehicle, setVehicle] = useState<Car | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicle = useCallback(async () => {
    if (!id) {
      setVehicle(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getVehicleById(id);
      setVehicle(data);
    } catch (err: any) {
      console.error('useVehicle error:', err);
      setError(err.message || 'Erro ao carregar detalhes do veículo');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const incrementViews = useCallback(async () => {
    if (!id) return;
    try {
      await vehicleService.incrementViews(id);
      setVehicle(prev => prev ? { ...prev, views: prev.views + 1 } : null);
    } catch (err) {
      console.warn('Failed to increment views in hook:', err);
    }
  }, [id]);

  const incrementWhatsappClicks = useCallback(async () => {
    if (!id) return;
    try {
      await vehicleService.incrementWhatsappClicks(id);
      setVehicle(prev => prev ? { ...prev, whatsappClicks: prev.whatsappClicks + 1 } : null);
    } catch (err) {
      console.warn('Failed to increment WhatsApp clicks in hook:', err);
    }
  }, [id]);

  return {
    vehicle,
    loading,
    error,
    refetch: fetchVehicle,
    incrementViews,
    incrementWhatsappClicks
  };
}
