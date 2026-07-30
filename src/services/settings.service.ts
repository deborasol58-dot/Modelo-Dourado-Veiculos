import { supabase } from '../lib/supabase';

export interface CompanySettings {
  id?: string;
  companyName: string;
  logo?: string;
  phone: string;
  whatsapp: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  address: string;
  city?: string;
  state?: string;
  hours: string;
  primaryColor: string;
  secondaryColor: string;
}

export const settingsService = {
  async getSettings(): Promise<CompanySettings> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching settings from Supabase:', error);
      throw error;
    }

    if (!data) {
      return {
        companyName: 'Dourado Veículos',
        phone: '(11) 99999-9999',
        whatsapp: '(11) 99999-9999',
        address: 'Av. Paulista, 1000 - São Paulo, SP',
        hours: 'Segunda a Sexta: 9h às 18h | Sábado: 9h às 13h',
        primaryColor: '#ef4444',
        secondaryColor: '#0f172a'
      };
    }

    return {
      id: data.id,
      companyName: data.company_name || 'Dourado Veículos',
      logo: data.logo_url || data.logo,
      phone: data.phone || '(11) 99999-9999',
      whatsapp: data.whatsapp || '(11) 99999-9999',
      email: data.email,
      instagram: data.instagram,
      facebook: data.facebook,
      website: data.website,
      address: data.address || 'Av. Paulista, 1000 - São Paulo, SP',
      city: data.city,
      state: data.state,
      hours: data.opening_hours || data.hours || 'Segunda a Sexta: 9h às 18h | Sábado: 9h às 13h',
      primaryColor: data.primary_color || '#ef4444',
      secondaryColor: data.secondary_color || '#0f172a'
    };
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const dbData: any = {};
    if (settings.companyName !== undefined) dbData.company_name = settings.companyName;
    if (settings.logo !== undefined) {
      dbData.logo_url = settings.logo;
    }
    if (settings.phone !== undefined) dbData.phone = settings.phone;
    if (settings.whatsapp !== undefined) dbData.whatsapp = settings.whatsapp;
    if (settings.email !== undefined) dbData.email = settings.email;
    if (settings.instagram !== undefined) dbData.instagram = settings.instagram;
    if (settings.facebook !== undefined) dbData.facebook = settings.facebook;
    if (settings.website !== undefined) dbData.website = settings.website;
    if (settings.address !== undefined) dbData.address = settings.address;
    if (settings.city !== undefined) dbData.city = settings.city;
    if (settings.state !== undefined) dbData.state = settings.state;
    if (settings.hours !== undefined) {
      dbData.opening_hours = settings.hours;
    }
    if (settings.primaryColor !== undefined) dbData.primary_color = settings.primaryColor;
    if (settings.secondaryColor !== undefined) dbData.secondary_color = settings.secondaryColor;
    dbData.updated_at = new Date().toISOString();

    // Fetch existing settings row to obtain UUID if present
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let query;
    if (existing?.id) {
      query = supabase
        .from('settings')
        .update(dbData)
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      query = supabase
        .from('settings')
        .insert(dbData)
        .select()
        .single();
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error updating settings in Supabase:', error);
      throw error;
    }

    return {
      id: data.id,
      companyName: data.company_name,
      logo: data.logo_url || data.logo,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      instagram: data.instagram,
      facebook: data.facebook,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      hours: data.opening_hours || data.hours,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color
    };
  }
};
