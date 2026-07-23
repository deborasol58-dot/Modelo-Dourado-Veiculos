import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.warn('Error fetching categories from Supabase, returning fallbacks:', error);
      return [
        { id: 'cat-1', name: 'Hatch', icon: '🚗', color: 'bg-blue-500', order: 1 },
        { id: 'cat-2', name: 'SUV', icon: '🚙', color: 'bg-green-500', order: 2 },
        { id: 'cat-3', name: 'Sedan', icon: '🚘', color: 'bg-indigo-500', order: 3 },
        { id: 'cat-4', name: 'Picape', icon: '🛻', color: 'bg-amber-500', order: 4 },
        { id: 'cat-5', name: 'Utilitário', icon: '🚐', color: 'bg-purple-500', order: 5 },
        { id: 'cat-6', name: 'Popular', icon: '🏎️', color: 'bg-red-500', order: 6 },
      ] as Category[];
    }

    return data as Category[];
  }
};
