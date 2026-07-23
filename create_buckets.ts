import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nzvwlyxbbnsillmylwtj.supabase.co';
const supabaseAnonKey = 'sb_publishable_2hfSOtqKozb3Mi9n4Lg14w_7eJnsz8s';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBuckets() {
  console.log('--- Creating Supabase Storage Buckets ---');
  
  const buckets = ['vehicles', 'vehicle-360'];
  for (const b of buckets) {
    try {
      console.log(`Attempting to create public bucket "${b}"...`);
      const { data, error } = await supabase.storage.createBucket(b, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
        fileSizeLimit: 10485760 // 10MB
      });
      if (error) {
        console.error(`Error creating bucket "${b}":`, error.message, error);
      } else {
        console.log(`Successfully created bucket "${b}":`, data);
      }
    } catch (err: any) {
      console.error(`Exception creating bucket "${b}":`, err.message);
    }
  }
}

createBuckets();
