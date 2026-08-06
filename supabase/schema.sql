-- ========================================================================
-- DOURADO VEÍCULOS - CANONICAL DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Clean, unified, single-source-of-truth schema
-- ========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CATEGORIES
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  icon text,
  color text,
  "order" integer default 0
);

-- 2. VEHICLES
create table if not exists vehicles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  brand text not null,
  model text not null,
  version text,
  year text not null,
  price numeric not null,
  mileage numeric not null default 0,
  fuel text,
  transmission text,
  color text,
  description text,
  city text default 'São Paulo',
  state text default 'SP',
  category text,
  status text default 'Disponível', -- 'Disponível', 'Vendido', 'Reservado'
  featured boolean default false,
  new_price numeric,
  sold boolean default false,
  whatsapp_clicks integer default 0,
  views integer default 0,
  cover_image text
);

-- 3. VEHICLE_IMAGES (Gallery and Technical Photos)
create table if not exists vehicle_images (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  image_url text not null,
  image_type text default 'gallery', -- 'cover', 'gallery', '360', 'technical'
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. VEHICLE_FEATURES
create table if not exists vehicle_features (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  feature text not null,
  unique (vehicle_id, feature)
);

-- 5. VEHICLE_360_PROJECTS (360 Project Per Vehicle)
create table if not exists vehicle_360_projects (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null unique,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed')),
  frame_count integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. VEHICLE_360_FRAMES (Ordered Sequence of 360 Frames)
create table if not exists vehicle_360_frames (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references vehicle_360_projects(id) on delete cascade not null,
  frame_number integer not null, -- 0-based frame index
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (project_id, frame_number)
);

-- 7. VEHICLE_HOTSPOTS (Points of Interest - POIs linked to technical photos)
create table if not exists vehicle_hotspots (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  title text not null,
  description text,
  pos_x numeric not null default 50, -- percentage 0-100
  pos_y numeric not null default 50, -- percentage 0-100
  frame_number integer not null default 0, -- 0-based frame index
  image_id uuid references vehicle_images(id) on delete set null,
  image_url text not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. VEHICLE_DAMAGE_MARKERS (Damage & Flaws Identified on 360)
create table if not exists vehicle_damage_markers (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  title text not null,
  description text,
  category text default 'Avaria',
  frame_index integer not null default 0,
  pos_x numeric not null default 0,
  pos_y numeric not null default 0,
  frame_positions jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. VEHICLE_DAMAGE_IMAGES (High-Resolution Evidence Photos per Damage Marker)
create table if not exists vehicle_damage_images (
  id uuid default gen_random_uuid() primary key,
  marker_id uuid references vehicle_damage_markers(id) on delete cascade not null,
  image_url text not null,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. VEHICLE_VIDEOS
create table if not exists vehicle_videos (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  video_url text not null,
  provider text default 'youtube', -- 'upload', 'youtube'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. LEADS
create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  vehicle_id uuid references vehicles(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  message text,
  status text default 'Pendente' -- 'Pendente', 'Respondido', 'Arquivado'
);

-- 12. QUOTES
create table if not exists quotes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  vehicle_id uuid references vehicles(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  city text,
  status text default 'Pendente',
  user_id uuid
);

-- 13. SCHEDULES
create table if not exists schedules (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  vehicle_id uuid references vehicles(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  date text not null,
  time text not null,
  status text default 'Pendente',
  user_id uuid
);

-- 14. FAVORITES
create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid not null,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  unique (user_id, vehicle_id)
);

-- 15. ADMINS
create table if not exists admins (
  id uuid primary key,
  name text not null,
  email text not null unique,
  role text default 'Vendedor',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. SETTINGS
create table if not exists settings (
  id text primary key default 'default',
  company_name text default 'Dourado Veículos',
  logo text,
  phone text default '(11) 99999-9999',
  whatsapp text default '(11) 99999-9999',
  instagram text,
  facebook text,
  address text default 'Av. Paulista, 1000 - São Paulo, SP',
  hours text default 'Segunda a Sexta: 9h às 18h | Sábado: 9h às 13h',
  primary_color text default '#ef4444',
  secondary_color text default '#0f172a'
);

-- 17. VEHICLE_INSPECTION_ITEMS (Technical Inspection Checklist)
create table if not exists vehicle_inspection_items (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references vehicles(id) on delete cascade not null,
  category text not null, -- 'Exterior' or 'Interior'
  item_name text not null,
  status text default 'Não avaliado', -- 'Não avaliado', 'OK', 'Atenção', 'Problema'
  notes text default '',
  photos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ========================================================================
-- SEED DEFAULTS
-- ========================================================================

insert into settings (id, company_name, phone, whatsapp, address, hours, primary_color, secondary_color)
values ('default', 'Dourado Veículos', '(11) 99999-9999', '(11) 99999-9999', 'Av. Paulista, 1000 - São Paulo, SP', 'Segunda a Sexta: 9h às 18h | Sábado: 9h às 13h', '#ef4444', '#0f172a')
on conflict (id) do nothing;

insert into categories (name, icon, color, "order") values
  ('Hatch', '🚗', 'bg-blue-500', 1),
  ('SUV', '🚙', 'bg-green-500', 2),
  ('Sedan', '🚘', 'bg-indigo-500', 3),
  ('Picape', '🛻', 'bg-amber-500', 4),
  ('Utilitário', '🚐', 'bg-purple-500', 5),
  ('Popular', '🏎️', 'bg-red-500', 6)
on conflict (name) do nothing;

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================================

alter table categories enable row level security;
alter table vehicles enable row level security;
alter table vehicle_images enable row level security;
alter table vehicle_features enable row level security;
alter table vehicle_360_projects enable row level security;
alter table vehicle_360_frames enable row level security;
alter table vehicle_hotspots enable row level security;
alter table vehicle_damage_markers enable row level security;
alter table vehicle_damage_images enable row level security;
alter table vehicle_videos enable row level security;
alter table leads enable row level security;
alter table quotes enable row level security;
alter table schedules enable row level security;
alter table favorites enable row level security;
alter table admins enable row level security;
alter table settings enable row level security;
alter table vehicle_inspection_items enable row level security;

-- Public read policies
create policy "Allow public read access to categories" on categories for select using (true);
create policy "Allow public read access to vehicles" on vehicles for select using (true);
create policy "Allow public read access to vehicle_images" on vehicle_images for select using (true);
create policy "Allow public read access to vehicle_features" on vehicle_features for select using (true);
create policy "Allow public read access to vehicle_360_projects" on vehicle_360_projects for select using (true);
create policy "Allow public read access to vehicle_360_frames" on vehicle_360_frames for select using (true);
create policy "Allow public read access to vehicle_hotspots" on vehicle_hotspots for select using (true);
create policy "Allow public read access to vehicle_damage_markers" on vehicle_damage_markers for select using (true);
create policy "Allow public read access to vehicle_damage_images" on vehicle_damage_images for select using (true);
create policy "Allow public read access to vehicle_videos" on vehicle_videos for select using (true);
create policy "Allow public read access to settings" on settings for select using (true);
create policy "Allow public read access to vehicle_inspection_items" on vehicle_inspection_items for select using (true);

-- Public write/manage policies for application operation
create policy "Allow public manage vehicles" on vehicles for all using (true);
create policy "Allow public manage vehicle_images" on vehicle_images for all using (true);
create policy "Allow public manage vehicle_features" on vehicle_features for all using (true);
create policy "Allow public manage vehicle_360_projects" on vehicle_360_projects for all using (true);
create policy "Allow public manage vehicle_360_frames" on vehicle_360_frames for all using (true);
create policy "Allow public manage vehicle_hotspots" on vehicle_hotspots for all using (true);
create policy "Allow public manage vehicle_damage_markers" on vehicle_damage_markers for all using (true);
create policy "Allow public manage vehicle_damage_images" on vehicle_damage_images for all using (true);
create policy "Allow public manage vehicle_videos" on vehicle_videos for all using (true);
create policy "Allow public manage leads" on leads for all using (true);
create policy "Allow public manage quotes" on quotes for all using (true);
create policy "Allow public manage schedules" on schedules for all using (true);
create policy "Allow public manage favorites" on favorites for all using (true);
create table if not exists admins (id uuid primary key);
create policy "Allow public manage admins" on admins for all using (true);
create policy "Allow public manage settings" on settings for all using (true);
create policy "Allow public manage vehicle_inspection_items" on vehicle_inspection_items for all using (true);
