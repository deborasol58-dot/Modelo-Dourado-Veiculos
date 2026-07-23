import { useState, useEffect, useCallback } from 'react';
import { vehicleService } from '../services/vehicle.service';
import { Car } from '../types';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (err: any) {
      console.error('useVehicles error:', err);
      setError(err.message || 'Erro ao carregar veículos do Supabase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const addVehicle = async (car: Omit<Car, 'id'>) => {
    try {
      const newCar = await vehicleService.createVehicle(car);
      setVehicles(prev => [newCar, ...prev]);
      return newCar;
    } catch (err: any) {
      console.error('Failed to add vehicle:', err);
      throw err;
    }
  };

  const updateVehicle = async (id: string, car: Partial<Car>) => {
    try {
      const updated = await vehicleService.updateVehicle(id, car);
      setVehicles(prev => prev.map(c => c.id === id ? updated : c));
      return updated;
    } catch (err: any) {
      console.error('Failed to update vehicle:', err);
      throw err;
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await vehicleService.deleteVehicle(id);
      setVehicles(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error('Failed to delete vehicle:', err);
      throw err;
    }
  };

  return {
    vehicles,
    loading,
    error,
    refresh: fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle
  };
}
