import { useState, useEffect, useCallback } from 'react';
import { Vehicle360, DamageMarker } from '../types';
import { vehicle360Service } from '../services/vehicle360.service';

export function useVehicle360(vehicleId: string | null) {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Vehicle360 | null>(null);
  const [markers, setMarkers] = useState<DamageMarker[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetch360Data = useCallback(async () => {
    if (!vehicleId) {
      setProject(null);
      setMarkers([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [projData, markersData] = await Promise.all([
        vehicle360Service.get360ByVehicleId(vehicleId),
        vehicle360Service.getMarkersByVehicleId(vehicleId)
      ]);

      setProject(projData);
      setMarkers(markersData);
    } catch (err: any) {
      console.error('Error fetching vehicle 360 data:', err);
      setError(err.message || 'Erro ao carregar dados do 360°');
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetch360Data();
  }, [fetch360Data]);

  const saveProject = async (framesCount: number, images: string[], status: Vehicle360['status']) => {
    if (!vehicleId) return null;
    setLoading(true);
    try {
      const saved = await vehicle360Service.save360({
        id: project?.id,
        vehicleId,
        framesCount,
        images,
        status
      });
      setProject(saved);
      return saved;
    } catch (err: any) {
      console.error('Error saving 360 project:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveMarker = async (markerData: Omit<DamageMarker, 'id' | 'vehicleId' | 'createdAt'> & { id?: string }) => {
    if (!vehicleId) return null;
    try {
      const saved = await vehicle360Service.saveMarker({
        ...markerData,
        vehicleId
      });
      // Update local state
      setMarkers(prev => {
        const filtered = prev.filter(m => m.id !== saved.id);
        return [...filtered, saved];
      });
      return saved;
    } catch (err: any) {
      console.error('Error saving damage marker:', err);
      throw err;
    }
  };

  const deleteMarker = async (markerId: string) => {
    if (!vehicleId) return;
    try {
      await vehicle360Service.deleteMarker(markerId, vehicleId);
      setMarkers(prev => prev.filter(m => m.id !== markerId));
    } catch (err: any) {
      console.error('Error deleting damage marker:', err);
      throw err;
    }
  };

  const deleteProject = async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      await vehicle360Service.delete360Project(vehicleId);
      setProject(null);
      setMarkers([]);
    } catch (err: any) {
      console.error('Error deleting 360 project:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    project,
    markers,
    error,
    refresh: fetch360Data,
    saveProject,
    saveMarker,
    deleteMarker,
    deleteProject
  };
}
