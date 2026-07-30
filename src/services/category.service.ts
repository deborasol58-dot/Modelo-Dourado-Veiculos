import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  display_order?: number;
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      throw error;
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || '🚗',
      color: c.color || 'bg-blue-500',
      order: Number(c.display_order ?? 0),
      display_order: Number(c.display_order ?? 0)
    }));
  }
};
