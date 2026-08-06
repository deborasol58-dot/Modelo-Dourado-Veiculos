import { useState, useEffect, useCallback } from 'react';
import { Vehicle360, DamageMarker, InspectionItem, VehicleHotspot } from '../types';
import { vehicle360Service } from '../services/vehicle360.service';

export function useVehicle360(vehicleId: string | null, fallbackImages?: string[]) {
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Vehicle360 | null>(null);
  const [markers, setMarkers] = useState<DamageMarker[]>([]);
  const [hotspots, setHotspots] = useState<VehicleHotspot[]>([]);
  const [vehicleImages, setVehicleImages] = useState<{ id: string; url: string; title?: string }[]>([]);
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetch360Data = useCallback(async () => {
    if (!vehicleId) {
      setProject(null);
      setMarkers([]);
      setHotspots([]);
      setVehicleImages([]);
      setInspectionItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [projData, markersData, hotspotsData, imagesData, inspectionData] = await Promise.all([
        vehicle360Service.get360ByVehicleId(vehicleId),
        vehicle360Service.getMarkersByVehicleId(vehicleId),
        vehicle360Service.getHotspotsByVehicleId(vehicleId),
        vehicle360Service.getVehicleImages(vehicleId, fallbackImages),
        vehicle360Service.getInspectionItemsByVehicleId(vehicleId)
      ]);

      setProject(projData);
      setMarkers(markersData);
      setHotspots(hotspotsData);
      setVehicleImages(imagesData);
      setInspectionItems(inspectionData);
    } catch (err: any) {
      console.error('Error fetching vehicle 360 data:', err);
      setError(err.message || 'Erro ao carregar dados do 360°');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, fallbackImages?.length]);

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

  const saveHotspot = async (hotspotData: Omit<VehicleHotspot, 'id' | 'vehicleId' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    if (!vehicleId) return null;
    try {
      const saved = await vehicle360Service.saveHotspot({
        ...hotspotData,
        vehicleId
      });
      setHotspots(prev => {
        const filtered = prev.filter(h => h.id !== saved.id);
        return [...filtered, saved];
      });
      return saved;
    } catch (err: any) {
      console.error('Error saving vehicle hotspot:', err);
      throw err;
    }
  };

  const deleteHotspot = async (hotspotId: string) => {
    if (!vehicleId) return;
    try {
      await vehicle360Service.deleteHotspot(hotspotId, vehicleId);
      setHotspots(prev => prev.filter(h => h.id !== hotspotId));
    } catch (err: any) {
      console.error('Error deleting vehicle hotspot:', err);
      throw err;
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

  const saveInspectionItem = async (itemData: Omit<InspectionItem, 'id' | 'vehicleId' | 'createdAt'> & { id?: string }) => {
    if (!vehicleId) return null;
    try {
      const saved = await vehicle360Service.saveInspectionItem({
        ...itemData,
        vehicleId
      });
      setInspectionItems(prev => {
        const filtered = prev.filter(i => i.id !== saved.id);
        return [...filtered, saved];
      });
      return saved;
    } catch (err: any) {
      console.error('Error saving inspection item:', err);
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
      setHotspots([]);
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
    hotspots,
    vehicleImages,
    inspectionItems,
    error,
    refresh: fetch360Data,
    saveProject,
    saveHotspot,
    deleteHotspot,
    saveMarker,
    deleteMarker,
    saveInspectionItem,
    deleteProject
  };
}
