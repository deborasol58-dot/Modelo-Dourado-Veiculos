import { supabase } from '../lib/supabase';
import { Quote, Favorite, Schedule } from '../types';

export const quoteService = {
  // ==========================================
  // QUOTES OPERATIONS (Solicitações de Orçamento)
  // ==========================================
  async getQuotes(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, vehicles(brand, model)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      vehicleId: item.vehicle_id || '',
      vehicleTitle: item.vehicles ? `${item.vehicles.brand} ${item.vehicles.model}` : 'Veículo Removido',
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      city: item.city || '',
      createdAt: item.created_at,
      status: item.status || 'Pendente',
      userId: item.user_id
    }));
  },

  async getUserQuotes(userId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*, vehicles(brand, model)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      vehicleId: item.vehicle_id || '',
      vehicleTitle: item.vehicles ? `${item.vehicles.brand} ${item.vehicles.model}` : 'Veículo Removido',
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      city: item.city || '',
      createdAt: item.created_at,
      status: item.status || 'Pendente',
      userId: item.user_id
    }));
  },

  async createQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        vehicle_id: quote.vehicleId || null,
        name: quote.name,
        phone: quote.phone,
        email: quote.email || null,
        city: quote.city || null,
        status: 'Pendente',
        user_id: quote.userId || null
      })
      .select('*, vehicles(brand, model)')
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      vehicleId: data.vehicle_id || '',
      vehicleTitle: data.vehicles ? `${data.vehicles.brand} ${data.vehicles.model}` : quote.vehicleTitle,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      city: data.city || '',
      createdAt: data.created_at,
      status: data.status || 'Pendente',
      userId: data.user_id || undefined
    };
  },

  async updateQuoteStatus(id: string, status: Quote['status']): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async deleteQuote(id: string): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ==========================================
  // FAVORITES OPERATIONS
  // ==========================================
  async getFavorites(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('vehicle_id')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return (data || []).map((f: any) => f.vehicle_id);
  },

  async toggleFavorite(userId: string, vehicleId: string): Promise<string[]> {
    const currentFavs = await this.getFavorites(userId);
    const hasFav = currentFavs.includes(vehicleId);

    if (hasFav) {
      // Remove
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId);

      if (error) throw error;
      return currentFavs.filter(id => id !== vehicleId);
    } else {
      // Add
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, vehicle_id: vehicleId });

      if (error) throw error;
      return [...currentFavs, vehicleId];
    }
  },

  // ==========================================
  // SCHEDULES OPERATIONS (Agendamentos)
  // ==========================================
  async getSchedules(): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, vehicles(brand, model)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      vehicleId: item.vehicle_id || '',
      vehicleTitle: item.vehicles ? `${item.vehicles.brand} ${item.vehicles.model}` : 'Veículo Removido',
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      date: item.date,
      time: item.time,
      status: item.status || 'Pendente'
    }));
  },

  async getUserSchedules(userId: string): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*, vehicles(brand, model)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      vehicleId: item.vehicle_id || '',
      vehicleTitle: item.vehicles ? `${item.vehicles.brand} ${item.vehicles.model}` : 'Veículo Removido',
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      date: item.date,
      time: item.time,
      status: item.status || 'Pendente'
    }));
  },

  async createSchedule(schedule: Omit<Schedule, 'id' | 'status'>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        user_id: schedule.userId || null,
        vehicle_id: schedule.vehicleId,
        name: schedule.name,
        phone: schedule.phone,
        email: schedule.email || null,
        date: schedule.date,
        time: schedule.time,
        status: 'Pendente'
      })
      .select('*, vehicles(brand, model)')
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      vehicleId: data.vehicle_id,
      vehicleTitle: data.vehicles ? `${data.vehicles.brand} ${data.vehicles.model}` : schedule.vehicleTitle,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      date: data.date,
      time: data.time,
      status: data.status || 'Pendente'
    };
  },

  async updateScheduleStatus(id: string, status: Schedule['status']): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .update({ status })
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  }
};
