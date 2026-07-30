import { supabase } from '../lib/supabase';

export interface DashboardStats {
  totalCars: number;
  availableCount: number;
  soldCount: number;
  reservedCount: number;
  totalLeads: number;
  unreadLeads: number;
  whatsappCount: number;
  featuredCount: number;
  totalStockValue: number;
  mostViewed: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data: vehicles, error: vError } = await supabase
      .from('vehicles')
      .select('price, sold, status, featured, whatsapp_clicks, views');

    const { data: leads, error: lError } = await supabase
      .from('leads')
      .select('status');

    if (vError || lError) {
      console.error('Dashboard service query encountered an error:', vError || lError);
      throw vError || lError;
    }

    const totalCars = vehicles?.length || 0;
    let availableCount = 0;
    let soldCount = 0;
    let reservedCount = 0;
    let whatsappCount = 0;
    let featuredCount = 0;
    let totalStockValue = 0;
    let mostViewed = 0;

    vehicles?.forEach((v: any) => {
      const isSold = !!v.sold || v.status === 'Vendido';
      if (isSold) {
        soldCount++;
      } else if (v.status === 'Reservado') {
        reservedCount++;
      } else {
        availableCount++;
      }

      whatsappCount += Number(v.whatsapp_clicks || 0);
      if (v.featured) featuredCount++;
      
      // Count available/unsold inventory value
      if (!isSold) {
        totalStockValue += Number(v.price || 0);
      }

      const views = Number(v.views || 0);
      if (views > mostViewed) {
        mostViewed = views;
      }
    });

    const totalLeads = leads?.length || 0;
    const unreadLeads = leads?.filter((l: any) => l.status === 'Pendente').length || 0;

    return {
      totalCars,
      availableCount,
      soldCount,
      reservedCount,
      totalLeads,
      unreadLeads,
      whatsappCount,
      featuredCount,
      totalStockValue,
      mostViewed
    };
  }
};
