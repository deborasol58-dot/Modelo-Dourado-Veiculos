import { supabase } from '../lib/supabase';

export interface CompanySettings {
  id?: string;
  companyName: string;
  logo?: string;
  phone: string;
  whatsapp: string;
  instagram?: string;
  facebook?: string;
  address: string;
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
      logo: data.logo,
      phone: data.phone || '(11) 99999-9999',
      whatsapp: data.whatsapp || '(11) 99999-9999',
      instagram: data.instagram,
      facebook: data.facebook,
      address: data.address || 'Av. Paulista, 1000 - São Paulo, SP',
      hours: data.hours || data.opening_hours || 'Segunda a Sexta: 9h às 18h | Sábado: 9h às 13h',
      primaryColor: data.primary_color || '#ef4444',
      secondaryColor: data.secondary_color || '#0f172a'
    };
  },

  async updateSettings(settings: Partial<CompanySettings>): Promise<CompanySettings> {
    const dbData: any = {};
    if (settings.companyName !== undefined) dbData.company_name = settings.companyName;
    if (settings.logo !== undefined) dbData.logo = settings.logo;
    if (settings.phone !== undefined) dbData.phone = settings.phone;
    if (settings.whatsapp !== undefined) dbData.whatsapp = settings.whatsapp;
    if (settings.instagram !== undefined) dbData.instagram = settings.instagram;
    if (settings.facebook !== undefined) dbData.facebook = settings.facebook;
    if (settings.address !== undefined) dbData.address = settings.address;
    if (settings.hours !== undefined) {
      dbData.hours = settings.hours;
    }
    if (settings.primaryColor !== undefined) dbData.primary_color = settings.primaryColor;
    if (settings.secondaryColor !== undefined) dbData.secondary_color = settings.secondaryColor;

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
      companyName: data.company_name,
      logo: data.logo,
      phone: data.phone,
      whatsapp: data.whatsapp,
      instagram: data.instagram,
      facebook: data.facebook,
      address: data.address,
      hours: data.hours,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color
    };
  }
};
