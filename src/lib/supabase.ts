import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://nzvwlyxbbnsillmylwtj.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2hfSOtqKozb3Mi9n4Lg14w_7eJnsz8s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

