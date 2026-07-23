import { supabase } from '../lib/supabase';
import { LeadMessage } from '../types';

export const leadService = {
  async getLeads(): Promise<LeadMessage[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('*, vehicles(brand, model)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads from Supabase:', error);
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      carId: item.vehicle_id || '',
      carTitle: item.vehicles ? `${item.vehicles.brand} ${item.vehicles.model}` : 'Veículo Removido',
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      message: item.message || '',
      createdAt: item.created_at,
      status: item.status || 'Pendente'
    }));
  },

  async createLead(lead: Omit<LeadMessage, 'id' | 'createdAt' | 'status'>): Promise<LeadMessage> {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        vehicle_id: lead.carId || null,
        name: lead.name,
        phone: lead.phone,
        email: lead.email || null,
        message: lead.message || null,
        status: 'Pendente'
      })
      .select('*, vehicles(brand, model)')
      .single();

    if (error) {
      console.error('Error creating lead in Supabase:', error);
      throw error;
    }

    return {
      id: data.id,
      carId: data.vehicle_id || '',
      carTitle: data.vehicles ? `${data.vehicles.brand} ${data.vehicles.model}` : lead.carTitle,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      message: data.message || '',
      createdAt: data.created_at,
      status: data.status || 'Pendente'
    };
  },

  async updateLeadStatus(id: string, status: LeadMessage['status']): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating lead status in Supabase:', error);
      throw error;
    }
  },

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting lead from Supabase:', error);
      throw error;
    }
  }
};
