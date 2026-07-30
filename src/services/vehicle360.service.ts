import { supabase } from '../lib/supabase';
import { Vehicle360, DamageMarker } from '../types';
import { parseMarkerPositions, encodeMarkerDescription } from '../utils/markerUtils';

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

    // 1. Fetch project ID from vehicle_360_projects
    const { data: projData } = await supabase
      .from('vehicle_360_projects')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .maybeSingle();

    if (!projData?.id) {
      return null;
    }

    const projectId = projData.id;

    // 2. Fetch frames by project_id ordered by frame_number
    const { data: frameData, error } = await supabase
      .from('vehicle_360_frames')
      .select('*')
      .eq('project_id', projectId)
      .order('frame_number', { ascending: true });

    if (error) {
      console.error(`Error querying vehicle_360_frames for project ${projectId}:`, error);
      throw error;
    }

    if (!frameData || frameData.length === 0) {
      return null;
    }

    const images = frameData.map(d => d.image_url || d.frame_url || '');

    return {
      id: projectId,
      vehicleId,
      framesCount: images.length,
      images,
      status: (projData.status as Vehicle360['status']) || 'draft',
      createdAt: projData.created_at || frameData[0]?.created_at || new Date().toISOString(),
      updatedAt: projData.updated_at || frameData[frameData.length - 1]?.created_at || new Date().toISOString()
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

    // 1. Find or create project in vehicle_360_projects
    let projectId = project.vehicleId;
    const { data: existingProj } = await supabase
      .from('vehicle_360_projects')
      .select('id')
      .eq('vehicle_id', project.vehicleId)
      .maybeSingle();

    if (existingProj?.id) {
      projectId = existingProj.id;
      await supabase
        .from('vehicle_360_projects')
        .update({
          frame_count: project.images?.length || 0,
          status: project.status || 'draft'
        })
        .eq('id', projectId);
    } else {
      const { data: newProj, error: createErr } = await supabase
        .from('vehicle_360_projects')
        .insert({
          vehicle_id: project.vehicleId,
          frame_count: project.images?.length || 0,
          status: project.status || 'draft'
        })
        .select('id')
        .single();

      if (createErr || !newProj) {
        console.error('Error creating 360 project:', createErr);
        throw createErr || new Error('Failed to create 360 project');
      }
      projectId = newProj.id;
    }

    // 2. Delete old frames for this project
    await supabase
      .from('vehicle_360_frames')
      .delete()
      .eq('project_id', projectId);

    // 3. Insert new frames using project_id and frame_number
    const savedImages: string[] = [];
    if (project.images && project.images.length > 0) {
      const frameRecords = project.images.map((img, idx) => ({
        project_id: projectId,
        frame_number: idx,
        image_url: img,
        created_at: timestamp
      }));

      const { error: insErr } = await supabase
        .from('vehicle_360_frames')
        .insert(frameRecords);

      if (insErr) {
        console.error('Error inserting vehicle_360_frames:', insErr);
        throw insErr;
      }
      savedImages.push(...project.images);
    }

    return {
      id: projectId,
      vehicleId: project.vehicleId,
      framesCount: savedImages.length,
      images: savedImages,
      status: project.status || 'draft',
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

    // 1. Fetch project ID
    const { data: projData } = await supabase
      .from('vehicle_360_projects')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .maybeSingle();

    if (!projData?.id) {
      return [];
    }

    const projectId = projData.id;

    // 2. Fetch damage markers and associated damage images using project_id & marker_id
    const { data: markers, error: markerErr } = await supabase
      .from('vehicle_damage_markers')
      .select('*, vehicle_damage_images(*)')
      .eq('project_id', projectId);

    if (markerErr) {
      console.error(`Error querying vehicle_damage_markers for project ${projectId}:`, markerErr);
      return [];
    }

    if (!markers || markers.length === 0) {
      return [];
    }

    // Group individual keyframe rows by title into unified Hotspot entities for client UI
    const markerMap = new Map<string, DamageMarker>();

    for (const m of markers) {
      const frameIndex = Number(m.frame_number ?? 0);
      const posX = Number(m.pos_x ?? 0);
      const posY = Number(m.pos_y ?? 0);
      const title = m.title || 'Dano';
      const category = m.category || 'Outro';
      const description = m.description || '';
      const images = (m.vehicle_damage_images || []).map((img: any) => img.image_url || '').filter(Boolean);

      const groupKey = `${title.toLowerCase().trim()}_${category.toLowerCase().trim()}`;

      if (!markerMap.has(groupKey)) {
        markerMap.set(groupKey, {
          id: m.id,
          vehicleId,
          title,
          description,
          category,
          damageImages: [...images],
          frameIndex,
          posX,
          posY,
          framePositions: {
            [frameIndex]: { posX, posY }
          },
          createdAt: m.created_at || new Date().toISOString()
        });
      } else {
        const existing = markerMap.get(groupKey)!;
        existing.framePositions = {
          ...existing.framePositions,
          [frameIndex]: { posX, posY }
        };
        images.forEach((img: string) => {
          if (!existing.damageImages.includes(img)) {
            existing.damageImages.push(img);
          }
        });
      }
    }

    return Array.from(markerMap.values());
  },

  /**
   * Save marker using vehicle_damage_markers and vehicle_damage_images
   * Adheres strictly to allowed columns: project_id, frame_number, pos_x, pos_y, title, description, category
   */
  async saveMarker(marker: Omit<DamageMarker, 'id' | 'createdAt'> & { id?: string }): Promise<DamageMarker> {
    if (!isUuid(marker.vehicleId)) {
      throw new Error(`Invalid vehicle ID: ${marker.vehicleId}. Marker operations require valid UUIDs.`);
    }

    // 1. Ensure 360 project exists for this vehicle
    let projectId: string;
    const { data: projData } = await supabase
      .from('vehicle_360_projects')
      .select('id')
      .eq('vehicle_id', marker.vehicleId)
      .maybeSingle();

    if (projData?.id) {
      projectId = projData.id;
    } else {
      const { data: newProj, error: projErr } = await supabase
        .from('vehicle_360_projects')
        .insert({ vehicle_id: marker.vehicleId, status: 'draft' })
        .select('id')
        .single();

      if (projErr || !newProj) {
        throw projErr || new Error('Failed to create project for marker');
      }
      projectId = newProj.id;
    }

    // 2. Check if a keyframe row for this title and frameIndex already exists
    const { data: existingRow } = await supabase
      .from('vehicle_damage_markers')
      .select('id')
      .eq('project_id', projectId)
      .eq('title', marker.title)
      .eq('frame_number', marker.frameIndex)
      .maybeSingle();

    const markerPayload = {
      project_id: projectId,
      title: marker.title,
      description: marker.description || '',
      category: marker.category || 'Outro',
      frame_number: marker.frameIndex,
      pos_x: marker.posX,
      pos_y: marker.posY
    };

    let savedMarkerRow: any;
    const targetRowId = existingRow?.id || marker.id;

    if (targetRowId && isUuid(targetRowId)) {
      const { data: updated, error: updErr } = await supabase
        .from('vehicle_damage_markers')
        .update(markerPayload)
        .eq('id', targetRowId)
        .select()
        .single();

      if (updErr) {
        console.error('Error updating vehicle_damage_markers row:', updErr);
        throw updErr;
      }
      savedMarkerRow = updated;
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('vehicle_damage_markers')
        .insert(markerPayload)
        .select()
        .single();

      if (insErr) {
        console.error('Error inserting vehicle_damage_markers row:', insErr);
        throw insErr;
      }
      savedMarkerRow = inserted;
    }

    // Update metadata (title, category, description) for all other keyframe rows sharing this title
    await supabase
      .from('vehicle_damage_markers')
      .update({
        title: marker.title,
        description: marker.description || '',
        category: marker.category || 'Outro'
      })
      .eq('project_id', projectId)
      .eq('title', marker.title);

    // 3. Save images in vehicle_damage_images using saved row id
    const savedRowId = savedMarkerRow.id;
    let savedImages: string[] = marker.damageImages || [];

    if (savedRowId) {
      await supabase.from('vehicle_damage_images').delete().eq('marker_id', savedRowId);

      if (marker.damageImages && marker.damageImages.length > 0) {
        const imageRows = marker.damageImages.map(imgUrl => ({
          marker_id: savedRowId,
          image_url: imgUrl
        }));
        const { error: imgErr } = await supabase.from('vehicle_damage_images').insert(imageRows);
        if (imgErr) {
          console.error('Error inserting vehicle_damage_images:', imgErr);
        }
      }
    }

    console.log('Hotspot salvo com sucesso:', {
      id: savedRowId,
      frame_number: marker.frameIndex,
      pos_x: marker.posX,
      pos_y: marker.posY,
      title: marker.title
    });

    // Reconstruct updated framePositions dictionary from marker.framePositions
    const updatedFramePositions = {
      ...(marker.framePositions || {}),
      [marker.frameIndex]: { posX: marker.posX, posY: marker.posY }
    };

    return {
      id: savedRowId,
      vehicleId: marker.vehicleId,
      title: marker.title,
      description: marker.description || '',
      category: marker.category || 'Outro',
      damageImages: savedImages,
      frameIndex: marker.frameIndex,
      posX: marker.posX,
      posY: marker.posY,
      framePositions: updatedFramePositions,
      createdAt: savedMarkerRow.created_at || new Date().toISOString()
    };
  },

  /**
   * Delete marker
   */
  async deleteMarker(markerId: string, _vehicleId: string): Promise<void> {
    if (!isUuid(markerId)) {
      throw new Error(`Invalid marker ID: ${markerId}. Marker deletions require valid UUIDs.`);
    }

    // 1. Delete associated damage images
    await supabase.from('vehicle_damage_images').delete().eq('marker_id', markerId);

    // 2. Delete marker row
    const { error } = await supabase.from('vehicle_damage_markers').delete().eq('id', markerId);

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
      throw new Error(`Invalid vehicle ID: ${vehicleId}. Project deletions require valid UUIDs.`);
    }

    const { data: projData } = await supabase
      .from('vehicle_360_projects')
      .select('id')
      .eq('vehicle_id', vehicleId)
      .maybeSingle();

    if (!projData?.id) {
      return;
    }

    const projectId = projData.id;

    // 1. Find markers for this project to delete images
    const { data: markers } = await supabase
      .from('vehicle_damage_markers')
      .select('id')
      .eq('project_id', projectId);

    if (markers && markers.length > 0) {
      const markerIds = markers.map(m => m.id);
      await supabase.from('vehicle_damage_images').delete().in('marker_id', markerIds);
    }

    // 2. Delete damage markers for this project
    await supabase.from('vehicle_damage_markers').delete().eq('project_id', projectId);

    // 3. Delete frames for this project
    await supabase.from('vehicle_360_frames').delete().eq('project_id', projectId);

    // 4. Delete 360 project row
    await supabase.from('vehicle_360_projects').delete().eq('id', projectId);
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
