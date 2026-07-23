import { supabase } from '../lib/supabase';
import { Car, CarCategory } from '../types';

// Helper to map DB vehicle format to frontend Car format
export function mapDbToCar(v: any): Car {
  let images: string[] = [];
  if (v.vehicle_images && v.vehicle_images.length > 0) {
    images = [...v.vehicle_images]
      .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      .map((img: any) => img.image_url);
  } else if (v.cover_image) {
    images = [v.cover_image];
  }

  return {
    id: v.id,
    brand: v.brand,
    model: v.model,
    version: v.version || '',
    price: Number(v.price),
    year: v.year,
    km: Number(v.mileage || 0),
    gearbox: v.transmission || 'Manual',
    fuel: v.fuel || 'Flex',
    color: v.color || 'Branco',
    plateEnd: '9',
    description: v.description || '',
    images: images,
    features: v.vehicle_features ? v.vehicle_features.map((f: any) => f.feature) : [],
    category: (v.category as CarCategory) || 'SUV',
    isFeatured: !!v.featured,
    isPromo: !!v.new_price,
    isSold: !!v.sold || v.status === 'Vendido',
    views: Number(v.views || 0),
    whatsappClicks: Number(v.whatsapp_clicks || 0),
    createdAt: v.created_at || new Date().toISOString()
  };
}

export function parseSupabaseError(error: any, context: string): Error {
  if (!error) return new Error('Erro desconhecido no banco de dados');
  
  const code = error.code || '';
  const message = error.message || '';
  const hint = error.hint || '';
  
  console.error(`[Supabase Error] Context: ${context}`, { code, message, hint, error });
  
  if (code === '42501') {
    return new Error(
      `Erro de Permissão (Código 42501) ao ${context}: Permissão negada para acessar o banco de dados. \n\n` +
      `Isso ocorre porque o seu projeto Supabase possui políticas de segurança (RLS) habilitadas, mas as regras públicas para leitura de dados não foram configuradas. \n\n` +
      `Para corrigir imediatamente este erro, siga estas instruções:\n` +
      `1. Acesse o painel do seu projeto no site da Supabase (https://supabase.com).\n` +
      `2. No menu lateral esquerdo, clique em "SQL Editor" (ícone de folha de código) e crie uma nova query ("New Query").\n` +
      `3. Abra o arquivo "/supabase/schema.sql" que está no seu projeto atual, copie todo o seu código SQL.\n` +
      `4. Cole o código SQL copiado no Editor SQL do Supabase e clique no botão verde "Run" no canto superior direito para executar.\n\n` +
      `Esse script criará todas as tabelas necessárias, ativará a leitura pública via políticas RLS e garantirá o funcionamento do seu catálogo e do seu painel.`
    );
  }
  
  if (code === '42P01') {
    return new Error(
      `Tabela não encontrada (Código 42P01) ao ${context}: A tabela solicitada não existe no banco de dados do seu Supabase.\n\n` +
      `Para corrigir:\n` +
      `1. Acesse o painel do seu Supabase.\n` +
      `2. Abra o "SQL Editor" e crie uma "New Query".\n` +
      `3. Copie o conteúdo completo do arquivo "/supabase/schema.sql" e execute-o clicando em "Run".\n\n` +
      `Isso criará a estrutura completa das tabelas do projeto.`
    );
  }
  
  return new Error(`Erro ao ${context}: ${message} (Código ${code || 'sem código'}). ${hint ? 'Dica: ' + hint : ''}`);
}

export const vehicleService = {
  async getVehicles(): Promise<Car[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_images(*), vehicle_features(*)');

    if (error) {
      throw parseSupabaseError(error, 'carregar a lista de veículos');
    }

    return (data || []).map(mapDbToCar);
  },

  async getVehicleById(id: string): Promise<Car | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return null;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .select('*, vehicle_images(*), vehicle_features(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw parseSupabaseError(error, `buscar o veículo com ID ${id}`);
    }

    if (!data) return null;

    return mapDbToCar(data);
  },

  async createVehicle(car: Omit<Car, 'id'>): Promise<Car> {
    // 1. Insert vehicle row
    const { data: vehicle, error: vError } = await supabase
      .from('vehicles')
      .insert({
        brand: car.brand,
        model: car.model,
        version: car.version,
        year: car.year,
        price: car.price,
        mileage: car.km,
        fuel: car.fuel,
        transmission: car.gearbox,
        color: car.color,
        description: car.description,
        category: car.category,
        featured: !!car.isFeatured,
        new_price: car.isPromo ? car.price : null,
        sold: !!car.isSold,
        status: car.isSold ? 'Vendido' : 'Disponível',
        views: car.views || 0,
        whatsapp_clicks: car.whatsappClicks || 0,
        cover_image: car.images && car.images.length > 0 ? car.images[0] : null
      })
      .select()
      .single();

    if (vError) {
      throw parseSupabaseError(vError, 'criar veículo');
    }

    const vehicleId = vehicle.id;

    // 2. Insert image URLs associated
    if (car.images && car.images.length > 0) {
      const imageRecords = car.images.map((url, idx) => ({
        vehicle_id: vehicleId,
        image_url: url,
        order_index: idx
      }));
      const { error: imgErr } = await supabase.from('vehicle_images').insert(imageRecords);
      if (imgErr) {
        console.error('Error inserting vehicle_images:', imgErr);
      }
    }

    // 3. Insert features associated
    if (car.features && car.features.length > 0) {
      const featureRecords = car.features.map(f => ({
        vehicle_id: vehicleId,
        feature: f
      }));
      const { error: featErr } = await supabase.from('vehicle_features').insert(featureRecords);
      if (featErr) {
        console.error('Error inserting vehicle_features:', featErr);
      }
    }

    // Re-fetch full structured object from Supabase
    const created = await this.getVehicleById(vehicleId);
    if (!created) {
      return mapDbToCar(vehicle);
    }
    return created;
  },

  async updateVehicle(id: string, car: Partial<Car>): Promise<Car> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      throw new Error(`ID de veículo inválido: ${id}. Somente UUIDs do Supabase são suportados.`);
    }

    const dbData: any = {};
    if (car.brand !== undefined) dbData.brand = car.brand;
    if (car.model !== undefined) dbData.model = car.model;
    if (car.version !== undefined) dbData.version = car.version;
    if (car.year !== undefined) dbData.year = car.year;
    if (car.price !== undefined) dbData.price = car.price;
    if (car.km !== undefined) dbData.mileage = car.km;
    if (car.fuel !== undefined) dbData.fuel = car.fuel;
    if (car.gearbox !== undefined) dbData.transmission = car.gearbox;
    if (car.color !== undefined) dbData.color = car.color;
    if (car.description !== undefined) dbData.description = car.description;
    if (car.category !== undefined) dbData.category = car.category;
    if (car.isFeatured !== undefined) dbData.featured = car.isFeatured;
    if (car.isPromo !== undefined) dbData.new_price = car.isPromo ? (car.price || 50000) : null;
    if (car.isSold !== undefined) {
      dbData.sold = car.isSold;
      dbData.status = car.isSold ? 'Vendido' : 'Disponível';
    }
    if (car.images && car.images.length > 0) {
      dbData.cover_image = car.images[0];
    }

    dbData.updated_at = new Date().toISOString();

    // 1. Update vehicle row
    const { error: vError } = await supabase
      .from('vehicles')
      .update(dbData)
      .eq('id', id);

    if (vError) {
      throw parseSupabaseError(vError, `atualizar o veículo ${id}`);
    }

    // 2. Refresh images if provided
    if (car.images !== undefined) {
      await supabase.from('vehicle_images').delete().eq('vehicle_id', id);
      if (car.images.length > 0) {
        const imageRecords = car.images.map((url, idx) => ({
          vehicle_id: id,
          image_url: url,
          order_index: idx
        }));
        await supabase.from('vehicle_images').insert(imageRecords);
      }
    }

    // 3. Refresh features if provided
    if (car.features !== undefined) {
      await supabase.from('vehicle_features').delete().eq('vehicle_id', id);
      if (car.features.length > 0) {
        const featureRecords = car.features.map(f => ({
          vehicle_id: id,
          feature: f
        }));
        await supabase.from('vehicle_features').insert(featureRecords);
      }
    }

    const updated = await this.getVehicleById(id);
    if (!updated) {
      throw new Error(`Erro ao obter o veículo atualizado do Supabase.`);
    }
    return updated;
  },

  async deleteVehicle(id: string): Promise<void> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      throw new Error(`ID de veículo inválido: ${id}. Somente UUIDs do Supabase são suportados.`);
    }

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      throw parseSupabaseError(error, `excluir o veículo ${id}`);
    }
  },

  async incrementViews(id: string): Promise<void> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return;

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('views')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const currentViews = Number(data.views || 0);
        await supabase
          .from('vehicles')
          .update({ views: currentViews + 1 })
          .eq('id', id);
      }
    } catch (e) {
      console.warn('Failed to increment views in Supabase:', e);
    }
  },

  async incrementWhatsappClicks(id: string): Promise<void> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return;

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('whatsapp_clicks')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const currentClicks = Number(data.whatsapp_clicks || 0);
        await supabase
          .from('vehicles')
          .update({ whatsapp_clicks: currentClicks + 1 })
          .eq('id', id);
      }
    } catch (e) {
      console.warn('Failed to increment WhatsApp clicks in Supabase:', e);
    }
  },

  // Storage bucket helper to upload media directly to Supabase Storage
  async uploadMedia(file: File, folder: 'cover' | 'gallery' | '360' | 'logos'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('vehicles')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Storage upload failed:', error);
      throw parseSupabaseError(error, 'fazer upload de mídia para o Supabase Storage');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('vehicles')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};
