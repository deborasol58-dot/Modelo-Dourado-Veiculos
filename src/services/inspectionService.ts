import { supabase } from '../lib/supabase';
import { VehicleInspectionItem, TechnicalInspectionStatus, InspectionCategory } from '../types';

// Standard predefined checklist items
export const DEFAULT_INSPECTION_STRUCTURE: { category: InspectionCategory; items: string[] }[] = [
  {
    category: 'Exterior',
    items: [
      'Capô',
      'Para-choque dianteiro',
      'Farol esquerdo',
      'Farol direito',
      'Grade dianteira',
      'Para-lama esquerdo',
      'Para-lama direito',
      'Porta dianteira esquerda',
      'Porta traseira esquerda',
      'Porta dianteira direita',
      'Porta traseira direita',
      'Retrovisor esquerdo',
      'Retrovisor direito',
      'Teto',
      'Tampa traseira',
      'Para-choque traseiro',
      'Lanterna esquerda',
      'Lanterna direita',
      'Roda dianteira esquerda',
      'Roda traseira esquerda',
      'Roda dianteira direita',
      'Roda traseira direita'
    ]
  },
  {
    category: 'Interior',
    items: [
      'Painel',
      'Bancos',
      'Volante',
      'Central Multimídia',
      'Teto interno',
      'Porta-malas',
      'Carpete'
    ]
  }
];

const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const LOCAL_STORAGE_KEY_PREFIX = 'autoshopping_inspection_';

// Local storage fallback helpers
function getLocalInspection(projectId: string): VehicleInspectionItem[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setLocalInspection(projectId: string, items: VehicleInspectionItem[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify(items));
  } catch (e) {
    // Ignore quota errors
  }
}

// Generate an initial blank template for 29 items
function generateDefaultInspectionItems(projectId: string): VehicleInspectionItem[] {
  const result: VehicleInspectionItem[] = [];
  for (const group of DEFAULT_INSPECTION_STRUCTURE) {
    for (const itemName of group.items) {
      result.push({
        id: `local_${group.category}_${itemName.replace(/\s+/g, '_').toLowerCase()}`,
        projectId,
        category: group.category,
        itemName,
        status: 'Não avaliado',
        notes: '',
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
  return result;
}

export const inspectionService = {
  /**
   * Get all inspection items for a project (vehicle)
   */
  async getInspection(projectId: string): Promise<VehicleInspectionItem[]> {
    const defaultTemplate = generateDefaultInspectionItems(projectId);
    const localData = getLocalInspection(projectId);

    if (!isUuid(projectId)) {
      // If not UUID, return merged local storage or defaults
      return this.mergeWithDefaults(defaultTemplate, localData);
    }

    try {
      // Try querying Supabase
      const { data, error } = await supabase
        .from('vehicle_inspection_items')
        .select('*')
        .or(`project_id.eq.${projectId},vehicle_id.eq.${projectId}`);

      if (error) {
        console.warn('Supabase inspection fetch error, using local fallback:', error.message);
        return this.mergeWithDefaults(defaultTemplate, localData);
      }

      if (!data || data.length === 0) {
        // Return default template merged with any local cache
        return this.mergeWithDefaults(defaultTemplate, localData);
      }

      // Map Supabase rows (handling both schema naming variants)
      const mappedDbItems: VehicleInspectionItem[] = data.map((row: any) => {
        let rawPhotos: string[] = [];
        if (Array.isArray(row.photos)) {
          rawPhotos = row.photos;
        } else if (typeof row.photos === 'string') {
          try {
            rawPhotos = JSON.parse(row.photos);
          } catch {
            rawPhotos = [];
          }
        } else if (Array.isArray(row.images)) {
          rawPhotos = row.images;
        }

        return {
          id: row.id,
          projectId: row.project_id || row.vehicle_id || projectId,
          category: (row.category || row.group_name || 'Exterior') as InspectionCategory,
          itemName: row.item_name || row.name || '',
          status: (row.status || 'Não avaliado') as TechnicalInspectionStatus,
          notes: row.notes || row.description || '',
          photos: rawPhotos,
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString()
        };
      });

      const merged = this.mergeWithDefaults(defaultTemplate, mappedDbItems);
      setLocalInspection(projectId, merged);
      return merged;
    } catch (err) {
      console.warn('Error fetching inspection from Supabase:', err);
      return this.mergeWithDefaults(defaultTemplate, localData);
    }
  },

  /**
   * Helper to merge fetched items with default 29 items structure
   */
  mergeWithDefaults(defaultTemplate: VehicleInspectionItem[], fetchedItems: VehicleInspectionItem[]): VehicleInspectionItem[] {
    const itemMap = new Map<string, VehicleInspectionItem>();
    for (const it of fetchedItems) {
      const key = `${it.category}_${it.itemName}`.toLowerCase();
      itemMap.set(key, it);
    }

    return defaultTemplate.map(def => {
      const key = `${def.category}_${def.itemName}`.toLowerCase();
      const existing = itemMap.get(key);
      if (existing) {
        return {
          ...def,
          id: existing.id || def.id,
          status: existing.status || 'Não avaliado',
          notes: existing.notes || '',
          photos: existing.photos || [],
          updatedAt: existing.updatedAt || def.updatedAt
        };
      }
      return def;
    });
  },

  /**
   * Save or update an inspection item
   */
  async saveInspectionItem(item: Partial<VehicleInspectionItem> & { projectId: string; category: string; itemName: string }): Promise<VehicleInspectionItem> {
    const timestamp = new Date().toISOString();
    const itemId = item.id && !item.id.startsWith('local_') ? item.id : undefined;

    const fullItem: VehicleInspectionItem = {
      id: item.id || `local_${item.category}_${item.itemName.replace(/\s+/g, '_').toLowerCase()}`,
      projectId: item.projectId,
      category: item.category as InspectionCategory,
      itemName: item.itemName,
      status: (item.status || 'Não avaliado') as TechnicalInspectionStatus,
      notes: item.notes || '',
      photos: item.photos || [],
      updatedAt: timestamp
    };

    // Update local cache immediately
    const currentLocal = getLocalInspection(item.projectId);
    const updatedLocal = currentLocal.map(i => 
      (i.category === fullItem.category && i.itemName === fullItem.itemName) ? fullItem : i
    );
    if (!updatedLocal.some(i => i.category === fullItem.category && i.itemName === fullItem.itemName)) {
      updatedLocal.push(fullItem);
    }
    setLocalInspection(item.projectId, updatedLocal);

    if (!isUuid(item.projectId)) {
      return fullItem;
    }

    try {
      // Primary DB Payload
      const payload: any = {
        project_id: item.projectId,
        category: item.category,
        item_name: item.itemName,
        status: item.status || 'Não avaliado',
        notes: item.notes || '',
        photos: item.photos || [],
        updated_at: timestamp
      };

      let resultData: any = null;

      if (itemId && isUuid(itemId)) {
        const { data, error } = await supabase
          .from('vehicle_inspection_items')
          .update(payload)
          .eq('id', itemId)
          .select()
          .maybeSingle();

        if (!error && data) {
          resultData = data;
        }
      }

      if (!resultData) {
        // Upsert by checking if record exists for project + item_name + category
        const { data: existing } = await supabase
          .from('vehicle_inspection_items')
          .select('id')
          .or(`project_id.eq.${item.projectId},vehicle_id.eq.${item.projectId}`)
          .or(`item_name.eq.${item.itemName},name.eq.${item.itemName}`)
          .maybeSingle();

        if (existing?.id) {
          const { data, error } = await supabase
            .from('vehicle_inspection_items')
            .update(payload)
            .eq('id', existing.id)
            .select()
            .maybeSingle();
          if (!error && data) {
            resultData = data;
          }
        } else {
          const { data, error } = await supabase
            .from('vehicle_inspection_items')
            .insert({ ...payload, created_at: timestamp })
            .select()
            .maybeSingle();
          if (!error && data) {
            resultData = data;
          }
        }
      }

      if (resultData) {
        fullItem.id = resultData.id;
      }
    } catch (err) {
      console.warn('Error syncing inspection item to Supabase, local cache retained:', err);
    }

    return fullItem;
  },

  /**
   * Update an existing inspection item by ID
   */
  async updateInspectionItem(id: string, updates: Partial<VehicleInspectionItem>): Promise<VehicleInspectionItem> {
    const timestamp = new Date().toISOString();

    if (updates.projectId) {
      const currentLocal = getLocalInspection(updates.projectId);
      const idx = currentLocal.findIndex(i => i.id === id || (i.category === updates.category && i.itemName === updates.itemName));
      if (idx >= 0) {
        currentLocal[idx] = { ...currentLocal[idx], ...updates, updatedAt: timestamp };
        setLocalInspection(updates.projectId, currentLocal);
      }
    }

    if (isUuid(id)) {
      try {
        const payload: any = {
          updated_at: timestamp
        };
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        if (updates.photos !== undefined) payload.photos = updates.photos;

        await supabase
          .from('vehicle_inspection_items')
          .update(payload)
          .eq('id', id);
      } catch (err) {
        console.warn('Error updating inspection item in DB:', err);
      }
    }

    return {
      id,
      projectId: updates.projectId || '',
      category: updates.category || 'Exterior',
      itemName: updates.itemName || '',
      status: updates.status || 'Não avaliado',
      notes: updates.notes || '',
      photos: updates.photos || [],
      updatedAt: timestamp
    };
  },

  /**
   * Delete an inspection item
   */
  async deleteInspectionItem(id: string): Promise<void> {
    if (isUuid(id)) {
      try {
        await supabase
          .from('vehicle_inspection_items')
          .delete()
          .eq('id', id);
      } catch (err) {
        console.warn('Error deleting inspection item:', err);
      }
    }
  },

  /**
   * Upload multiple or single inspection photo
   */
  async uploadInspectionPhoto(projectId: string, file: File): Promise<string> {
    if (!isUuid(projectId)) {
      // Create local object URL for preview if not UUID
      return URL.createObjectURL(file);
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `inspec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${projectId}/inspection/${fileName}`;

    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Storage upload for inspection photo failed:', error);
      // Fallback to object URL if bucket error
      return URL.createObjectURL(file);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};
