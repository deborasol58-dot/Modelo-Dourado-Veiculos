import { supabase } from '../lib/supabase';

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  image_url: string;
  image_type: 'cover' | 'gallery' | '360';
  display_order: number;
  created_at?: string;
}

export interface VehicleVideo {
  id: string;
  vehicle_id: string;
  video_url: string;
  provider: 'upload' | 'youtube';
  created_at?: string;
}

export interface VehicleMediaData {
  cover: string | null;
  gallery: string[];
  video: VehicleVideo | null;
  frames360: string[];
}

export const vehicleMediaService = {
  /**
   * Fetch all media files for a specific vehicle.
   */
  async getMediaForVehicle(vehicleId: string): Promise<VehicleMediaData> {
    const result: VehicleMediaData = {
      cover: null,
      gallery: [],
      video: null,
      frames360: []
    };

    try {
      // 1. Fetch images from vehicle_images
      const { data: dbImages, error: imgError } = await supabase
        .from('vehicle_images')
        .select('*')
        .eq('vehicle_id', vehicleId);

      if (!imgError && dbImages && dbImages.length > 0) {
        // Check if database columns image_type and display_order are available
        const hasNewColumns = 'image_type' in dbImages[0];

        if (hasNewColumns) {
          // Sort by display_order
          const sorted = [...dbImages].sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
          
          const coverImg = sorted.find((img: any) => img.image_type === 'cover');
          if (coverImg) {
            result.cover = coverImg.image_url;
          }
          
          result.gallery = sorted
            .filter((img: any) => img.image_type === 'gallery')
            .map((img: any) => img.image_url);

          result.frames360 = sorted
            .filter((img: any) => img.image_type === '360')
            .map((img: any) => img.image_url);
        } else {
          // Fallback parsing (using the classic vehicle_images with order_index)
          // We can determine types by URL path prefix or assume they are all gallery
          const sorted = [...dbImages].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
          result.gallery = sorted.map((img: any) => img.image_url);
          
          // Fallback cover image from vehicles table
          const { data: vehicle } = await supabase
            .from('vehicles')
            .select('cover_image')
            .eq('id', vehicleId)
            .maybeSingle();
            
          if (vehicle?.cover_image) {
            result.cover = vehicle.cover_image;
          } else if (result.gallery.length > 0) {
            result.cover = result.gallery[0];
          }

          // Fallback 360 frames from vehicle_360 table
          const { data: v360 } = await supabase
            .from('vehicle_360')
            .select('images')
            .eq('vehicle_id', vehicleId)
            .maybeSingle();

          if (v360?.images) {
            try {
              result.frames360 = Array.isArray(v360.images) 
                ? v360.images 
                : JSON.parse(v360.images || '[]');
            } catch {
              result.frames360 = [];
            }
          }
        }
      } else {
        // If no images in vehicle_images, try fallback directly from vehicles and vehicle_360
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('cover_image')
          .eq('id', vehicleId)
          .maybeSingle();

        if (vehicle?.cover_image) {
          result.cover = vehicle.cover_image;
          result.gallery = [vehicle.cover_image];
        }
        
        const { data: v360 } = await supabase
          .from('vehicle_360')
          .select('images')
          .eq('vehicle_id', vehicleId)
          .maybeSingle();

        if (v360?.images) {
          try {
            result.frames360 = Array.isArray(v360.images) 
              ? v360.images 
              : JSON.parse(v360.images || '[]');
          } catch {
            result.frames360 = [];
          }
        }
      }

      // 2. Fetch video from vehicle_videos
      const { data: dbVideos, error: vidError } = await supabase
        .from('vehicle_videos')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .maybeSingle();

      if (!vidError && dbVideos) {
        result.video = {
          id: dbVideos.id,
          vehicle_id: dbVideos.vehicle_id,
          video_url: dbVideos.video_url,
          provider: dbVideos.provider || 'youtube'
        };
      }
    } catch (err) {
      console.error('Error reading vehicle media from Supabase:', err);
      throw err;
    }

    return result;
  },

  /**
   * Save Cover Photo
   */
  async saveCover(vehicleId: string, coverUrl: string): Promise<void> {
    try {
      // 1. Update the vehicles cover_image for sync compatibility
      await supabase
        .from('vehicles')
        .update({ cover_image: coverUrl })
        .eq('id', vehicleId);

      // 2. Check if we can save to vehicle_images with cover type
      const { error } = await supabase
        .from('vehicle_images')
        .delete()
        .eq('vehicle_id', vehicleId)
        .eq('image_type', 'cover');

      // Add to vehicle_images as cover
      await supabase
        .from('vehicle_images')
        .insert({
          vehicle_id: vehicleId,
          image_url: coverUrl,
          image_type: 'cover',
          display_order: 0
        });
    } catch {
      // Robust fallback if column/type fails: insert standard record
      try {
        await supabase
          .from('vehicle_images')
          .insert({
            vehicle_id: vehicleId,
            image_url: coverUrl,
            order_index: -1 // special index for cover photo fallback
          });
      } catch (err) {
        console.error('Failed cover save fallback:', err);
      }
    }
  },

  /**
   * Save Gallery Images
   */
  async saveGallery(vehicleId: string, imageUrls: string[]): Promise<void> {
    try {
      // Delete old gallery images
      try {
        await supabase
          .from('vehicle_images')
          .delete()
          .eq('vehicle_id', vehicleId)
          .eq('image_type', 'gallery');
      } catch {
        // Classic fallback: delete all, since we didn't have types
        await supabase
          .from('vehicle_images')
          .delete()
          .eq('vehicle_id', vehicleId);
      }

      if (imageUrls.length > 0) {
        // Try inserting with new columns
        const { error } = await supabase
          .from('vehicle_images')
          .insert(
            imageUrls.map((url, idx) => ({
              vehicle_id: vehicleId,
              image_url: url,
              image_type: 'gallery',
              display_order: idx
            }))
          );

        if (error) throw error;
      }
    } catch {
      // Fallback: save using classic order_index
      try {
        if (imageUrls.length > 0) {
          await supabase
            .from('vehicle_images')
            .insert(
              imageUrls.map((url, idx) => ({
                vehicle_id: vehicleId,
                image_url: url,
                order_index: idx
              }))
            );
        }
      } catch (err) {
        console.error('Failed gallery save fallback:', err);
      }
    }
  },

  /**
   * Save 360-degree interactive frames
   */
  async save360Frames(vehicleId: string, imageUrls: string[]): Promise<void> {
    try {
      // 1. Delete old 360 images from vehicle_images
      try {
        await supabase
          .from('vehicle_images')
          .delete()
          .eq('vehicle_id', vehicleId)
          .eq('image_type', '360');
      } catch {}

      if (imageUrls.length > 0) {
        // 2. Try inserting into vehicle_images with '360' type
        await supabase
          .from('vehicle_images')
          .insert(
            imageUrls.map((url, idx) => ({
              vehicle_id: vehicleId,
              image_url: url,
              image_type: '360',
              display_order: idx
            }))
          );
      }

      // 3. For backwards compatibility and the interactive module, also update the vehicle_360 table
      const { data: existing } = await supabase
        .from('vehicle_360')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .maybeSingle();

      const dbRow = {
        vehicle_id: vehicleId,
        frames_count: imageUrls.length,
        images: imageUrls,
        status: 'Ativo',
        updated_at: new Date().toISOString()
      };

      if (existing?.id) {
        await supabase
          .from('vehicle_360')
          .update(dbRow)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('vehicle_360')
          .insert({
            ...dbRow,
            created_at: new Date().toISOString()
          });
      }
    } catch (err) {
      console.warn('Error saving 360 frames to DB:', err);
    }
  },

  /**
   * Save video settings
   */
  async saveVideo(vehicleId: string, url: string, provider: 'upload' | 'youtube'): Promise<void> {
    const { error } = await supabase
      .from('vehicle_videos')
      .delete()
      .eq('vehicle_id', vehicleId);

    if (error) {
      console.error('Error deleting old video from Supabase:', error);
      throw error;
    }

    if (url.trim()) {
      const { error: insError } = await supabase
        .from('vehicle_videos')
        .insert({
          vehicle_id: vehicleId,
          video_url: url,
          provider: provider,
          created_at: new Date().toISOString()
        });
        
      if (insError) {
        console.error('Error inserting video to Supabase:', insError);
        throw insError;
      }
    }
  },

  /**
   * Upload media file to Supabase storage bucket
   */
  async uploadFile(vehicleId: string, file: File, folder: 'cover' | 'gallery' | '360' | 'videos', onProgress?: (pct: number) => void): Promise<string> {
    const fileExt = file.name.split('.').pop() || 'webp';
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}.${fileExt}`;
    const filePath = `${vehicleId}/${folder}/${fileName}`;

    if (onProgress) onProgress(10);

    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Storage upload failed:', error);
      throw error;
    }

    if (onProgress) onProgress(70);

    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(data.path);

    if (onProgress) onProgress(100);
    return publicUrl;
  }
};
