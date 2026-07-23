import { supabase } from '../lib/supabase';
import { Vehicle360, DamageMarker } from '../types';

// Helper to check if a string is a UUID
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Self-healing database insert helper to dynamically handle potential schema column mismatches
async function safeInsertOrUpdate(table: string, id: string | undefined, data: any) {
  let currentData = { ...data };
  
  while (true) {
    try {
      let query;
      if (id && isUuid(id)) {
        query = supabase.from(table).update(currentData).eq('id', id);
      } else {
        query = supabase.from(table).insert(currentData);
      }
      
      const { data: resData, error } = await query.select().single();
      
      if (error) {
        if (error.code === '42703') {
          const match = error.message.match(/column "([^"]+)"/);
          if (match && match[1] && match[1] in currentData) {
            console.warn(`Column "${match[1]}" does not exist on table "${table}", filtering it out and retrying...`);
            delete currentData[match[1]];
            continue;
          }
        }
        throw error;
      }
      
      return resData;
    } catch (err: any) {
      if (err.code === '42703') {
        const match = err.message.match(/column "([^"]+)"/);
        if (match && match[1] && match[1] in currentData) {
          console.warn(`Column "${match[1]}" does not exist on table "${table}", filtering it out and retrying...`);
          delete currentData[match[1]];
          continue;
        }
      }
      throw err;
    }
  }
}

export const vehicle360Service = {
  /**
   * Fetch 360-degree project for a specific vehicle
   */
  async get360ByVehicleId(vehicleId: string): Promise<Vehicle360 | null> {
    if (!isUuid(vehicleId)) {
      return null;
    }

    const { data, error } = await supabase
      .from('vehicle_360_frames')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (error) {
      console.error(`Error querying vehicle_360_frames for vehicle ${vehicleId}:`, error);
      throw error;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Sort by frame/order index
    const sortedData = [...data].sort((a, b) => {
      const idxA = a.order_index ?? a.frame_index ?? a.display_order ?? 0;
      const idxB = b.order_index ?? b.frame_index ?? b.display_order ?? 0;
      return idxA - idxB;
    });

    const images = sortedData.map(d => d.image_url || d.frame_url || d.url || '');

    return {
      id: vehicleId,
      vehicleId,
      framesCount: images.length,
      images,
      status: 'Ativo',
      createdAt: sortedData[0]?.created_at || new Date().toISOString(),
      updatedAt: sortedData[sortedData.length - 1]?.updated_at || new Date().toISOString()
    };
  },

  /**
   * Save or update 360-degree project
   */
  async save360(project: Omit<Vehicle360, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Vehicle360> {
    if (!isUuid(project.vehicleId)) {
      throw new Error(`Invalid vehicle ID: ${project.vehicleId}. 360 operations require valid UUIDs.`);
    }

    const timestamp = new Date().toISOString();

    // 1. Delete old frames
    const { error: delError } = await supabase
      .from('vehicle_360_frames')
      .delete()
      .eq('vehicle_id', project.vehicleId);

    if (delError) {
      console.error('Error deleting old 360 frames from Supabase:', delError);
      throw delError;
    }

    // 2. Insert new frames
    const savedImages: string[] = [];
    if (project.images && project.images.length > 0) {
      for (let idx = 0; idx < project.images.length; idx++) {
        const img = project.images[idx];
        const payload = {
          vehicle_id: project.vehicleId,
          image_url: img,
          frame_url: img,
          url: img,
          frame_index: idx,
          order_index: idx,
          display_order: idx,
          created_at: timestamp,
          updated_at: timestamp
        };

        const res = await safeInsertOrUpdate('vehicle_360_frames', undefined, payload);
        const savedUrl = res.image_url || res.frame_url || res.url || img;
        savedImages.push(savedUrl);
      }
    }

    return {
      id: project.id || project.vehicleId,
      vehicleId: project.vehicleId,
      framesCount: savedImages.length,
      images: savedImages,
      status: project.status,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  },

  /**
   * Fetch all markers for a specific vehicle
   */
  async getMarkersByVehicleId(vehicleId: string): Promise<DamageMarker[]> {
    if (!isUuid(vehicleId)) {
      return [];
    }

    const { data, error } = await supabase
      .from('vehicle_damage_images')
      .select('*')
      .eq('vehicle_id', vehicleId);

    if (error) {
      console.error(`Error querying vehicle_damage_images for vehicle ${vehicleId}:`, error);
      throw error;
    }

    if (!data) return [];

    return data.map((d: any) => {
      let dmgImgs: string[] = [];
      if (d.damage_images) {
        dmgImgs = Array.isArray(d.damage_images) ? d.damage_images : [d.damage_images];
      } else if (d.image_url) {
        dmgImgs = [d.image_url];
      } else if (d.url) {
        dmgImgs = [d.url];
      }

      return {
        id: d.id,
        vehicleId: d.vehicle_id,
        title: d.title || 'Dano',
        description: d.description || '',
        category: d.category || 'Outro',
        damageImages: dmgImgs,
        frameIndex: Number(d.frame_index || 0),
        posX: Number(d.pos_x ?? d.pos_index ?? 0),
        posY: Number(d.pos_y ?? d.pos_index ?? 0),
        createdAt: d.created_at
      };
    });
  },

  /**
   * Save marker
   */
  async saveMarker(marker: Omit<DamageMarker, 'id' | 'createdAt'> & { id?: string }): Promise<DamageMarker> {
    if (!isUuid(marker.vehicleId)) {
      throw new Error(`Invalid vehicle ID: ${marker.vehicleId}. Marker operations require valid UUIDs.`);
    }

    const mainImageUrl = marker.damageImages && marker.damageImages.length > 0 ? marker.damageImages[0] : null;

    const dbRow: any = {
      vehicle_id: marker.vehicleId,
      title: marker.title,
      description: marker.description,
      category: marker.category,
      damage_images: marker.damageImages,
      image_url: mainImageUrl,
      url: mainImageUrl,
      frame_index: marker.frameIndex,
      pos_x: marker.posX,
      pos_y: marker.posY
    };

    const res = await safeInsertOrUpdate('vehicle_damage_images', marker.id, dbRow);

    let dmgImgs: string[] = [];
    if (res.damage_images) {
      dmgImgs = Array.isArray(res.damage_images) ? res.damage_images : [res.damage_images];
    } else if (res.image_url) {
      dmgImgs = [res.image_url];
    } else if (res.url) {
      dmgImgs = [res.url];
    }

    return {
      id: res.id,
      vehicleId: res.vehicle_id,
      title: res.title || 'Dano',
      description: res.description || '',
      category: res.category || 'Outro',
      damageImages: dmgImgs,
      frameIndex: Number(res.frame_index || 0),
      posX: Number(res.pos_x ?? 0),
      posY: Number(res.pos_y ?? 0),
      createdAt: res.created_at
    };
  },

  /**
   * Delete marker
   */
  async deleteMarker(markerId: string, _vehicleId: string): Promise<void> {
    if (!isUuid(markerId)) {
      throw new Error(`Invalid marker ID: ${markerId}. Marker deletions are only supported for valid UUIDs.`);
    }

    const { error } = await supabase
      .from('vehicle_damage_images')
      .delete()
      .eq('id', markerId);

    if (error) {
      console.error(`Error deleting marker ${markerId}:`, error);
      throw error;
    }
  },

  /**
   * Delete 360-degree project (DB entries)
   */
  async delete360Project(vehicleId: string): Promise<void> {
    if (!isUuid(vehicleId)) {
      throw new Error(`Invalid vehicle ID: ${vehicleId}. Project deletions are only supported for valid UUIDs.`);
    }

    // 1. Delete damages
    const { error: errDamages } = await supabase
      .from('vehicle_damage_images')
      .delete()
      .eq('vehicle_id', vehicleId);

    if (errDamages) {
      console.error(`Error deleting damage images for vehicle ${vehicleId}:`, errDamages);
      throw errDamages;
    }

    // 2. Delete frames from DB
    const { error: errFrames } = await supabase
      .from('vehicle_360_frames')
      .delete()
      .eq('vehicle_id', vehicleId);

    if (errFrames) {
      console.error(`Error deleting 360 frames for vehicle ${vehicleId}:`, errFrames);
      throw errFrames;
    }
  },

  /**
   * Upload individual 360 frame
   */
  async upload360Frame(vehicleId: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
    if (!isUuid(vehicleId)) {
      throw new Error(`Invalid vehicle ID: ${vehicleId}. Upload operations require a valid vehicle UUID.`);
    }

    const fileExt = file.name.split('.').pop() || 'webp';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `frame_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanFileName}.${fileExt}`;
    const filePath = `${vehicleId}/360/${fileName}`;

    if (onProgress) onProgress(10);

    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Storage upload for 360 frame failed:', error);
      throw error;
    }

    if (onProgress) onProgress(70);

    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(data.path);

    if (onProgress) onProgress(100);
    return publicUrl;
  },

  /**
   * Upload individual damage image
   */
  async uploadDamageImage(vehicleId: string, file: File): Promise<string> {
    if (!isUuid(vehicleId)) {
      throw new Error(`Invalid vehicle ID: ${vehicleId}. Upload operations require a valid vehicle UUID.`);
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `damage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${vehicleId}/damages/${fileName}`;

    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Storage upload for damage image failed:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};
