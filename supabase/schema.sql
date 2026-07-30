-- Dourado Veículos - Supabase Database Schema
-- Run this script in the SQL Editor of your Supabase Project.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create CATEGORIES Table
create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  icon text,
  color text,
  "order" integer default 0
);

-- 2. Create VEHICLES Table
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

-- 3. Create VEHICLE_IMAGES Table
create table if not exists vehicle_images (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  image_url text not null,
  image_type text default 'gallery', -- 'cover', 'gallery', '360'
  order_index integer default 0,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create VEHICLE_FEATURES Table
create table if not exists vehicle_features (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  feature text not null,
  unique (vehicle_id, feature)
);

-- 5. Create VEHICLE_HOTSPOTS Table (360º View Spots)
create table if not exists vehicle_hotspots (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  title text not null,
  description text,
  pos_x numeric not null, -- percentage position X (0-100)
  pos_y numeric not null, -- percentage position Y (0-100)
  icon text
);

-- 6. Create VEHICLE_360_FRAMES Table
create table if not exists vehicle_360_frames (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  image_url text,
  frame_url text,
  url text,
  frame_index integer default 0,
  order_index integer default 0,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Create VEHICLE_DAMAGE_IMAGES Table
create table if not exists vehicle_damage_images (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  title text not null,
  description text,
  category text default 'Outro',
  damage_images text[],
  image_url text,
  url text,
  frame_index integer default 0,
  pos_x numeric default 0,
  pos_y numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create VEHICLE_VIDEOS Table
create table if not exists vehicle_videos (
  id uuid default gen_random_uuid() primary key,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  video_url text not null,
  provider text default 'youtube', -- 'upload', 'youtube'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create LEADS Table
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

-- 9. Create QUOTES Table
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

-- 10. Create SCHEDULES Table
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

-- 11. Create FAVORITES Table
create table if not exists favorites (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid not null,
  vehicle_id uuid references vehicles(id) on delete cascade not null,
  unique (user_id, vehicle_id)
);

-- 12. Create ADMINS Table
create table if not exists admins (
  id uuid primary key, -- references auth.users.id
  name text not null,
  email text not null unique,
  role text default 'Vendedor', -- 'Administrador', 'Vendedor', 'Editor'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. Create SETTINGS Table
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

-- Insert default company settings if not exists
insert into settings (id, company_name, phone, whatsapp, address, hours, primary_color, secondary_color)
values ('default', 'Dourado Veículos', '(11) 99999-9999', '(11) 99999-9999', 'Av. Paulista, 1000 - São Paulo, SP', 'Segunda a Sexta: 9h às 18h | Sábado: 9h às 13h', '#ef4444', '#0f172a')
on conflict (id) do nothing;

-- Insert default categories
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

-- Enable Row Level Security on all tables
alter table categories enable row level security;
alter table vehicles enable row level security;
alter table vehicle_images enable row level security;
alter table vehicle_features enable row level security;
alter table vehicle_hotspots enable row level security;
alter table vehicle_360_frames enable row level security;
alter table vehicle_damage_images enable row level security;
alter table vehicle_videos enable row level security;
alter table leads enable row level security;
alter table quotes enable row level security;
alter table schedules enable row level security;
alter table favorites enable row level security;
alter table admins enable row level security;
alter table settings enable row level security;

-- Policies for public read-only tables
create policy "Allow public read access to categories" on categories for select using (true);
create policy "Allow public read access to vehicles" on vehicles for select using (true);
create policy "Allow public read access to vehicle_images" on vehicle_images for select using (true);
create policy "Allow public read access to vehicle_features" on vehicle_features for select using (true);
create policy "Allow public read access to vehicle_hotspots" on vehicle_hotspots for select using (true);
create policy "Allow public read access to vehicle_360_frames" on vehicle_360_frames for select using (true);
create policy "Allow public read access to vehicle_damage_images" on vehicle_damage_images for select using (true);
create policy "Allow public read access to vehicle_videos" on vehicle_videos for select using (true);
create policy "Allow public read access to settings" on settings for select using (true);

-- Allow public insert to leads, quotes, schedules, and favorites
create policy "Allow public insert leads" on leads for insert with check (true);
create policy "Allow public read leads" on leads for select using (true);
create policy "Allow public update leads" on leads for update using (true);
create policy "Allow public delete leads" on leads for delete using (true);

create policy "Allow public insert quotes" on quotes for insert with check (true);
create policy "Allow public read quotes" on quotes for select using (true);
create policy "Allow public update quotes" on quotes for update using (true);
create policy "Allow public delete quotes" on quotes for delete using (true);

create policy "Allow public insert schedules" on schedules for insert with check (true);
create policy "Allow public read schedules" on schedules for select using (true);
create policy "Allow public update schedules" on schedules for update using (true);
create policy "Allow public delete schedules" on schedules for delete using (true);

create policy "Allow public manage favorites" on favorites for all using (true);

-- Vehicle management policies (allow full access for setup/admin)
create policy "Allow public insert vehicles" on vehicles for insert with check (true);
create policy "Allow public update vehicles" on vehicles for update using (true);
create policy "Allow public delete vehicles" on vehicles for delete using (true);

create policy "Allow public insert vehicle_images" on vehicle_images for insert with check (true);
create policy "Allow public update vehicle_images" on vehicle_images for update using (true);
create policy "Allow public delete vehicle_images" on vehicle_images for delete using (true);

create policy "Allow public insert vehicle_features" on vehicle_features for insert with check (true);
create policy "Allow public update vehicle_features" on vehicle_features for update using (true);
create policy "Allow public delete vehicle_features" on vehicle_features for delete using (true);

create policy "Allow public insert vehicle_360_frames" on vehicle_360_frames for insert with check (true);
create policy "Allow public update vehicle_360_frames" on vehicle_360_frames for update using (true);
create policy "Allow public delete vehicle_360_frames" on vehicle_360_frames for delete using (true);

create policy "Allow public insert vehicle_damage_images" on vehicle_damage_images for insert with check (true);
create policy "Allow public update vehicle_damage_images" on vehicle_damage_images for update using (true);
create policy "Allow public delete vehicle_damage_images" on vehicle_damage_images for delete using (true);

create policy "Allow public insert vehicle_videos" on vehicle_videos for insert with check (true);
create policy "Allow public update vehicle_videos" on vehicle_videos for update using (true);
create policy "Allow public delete vehicle_videos" on vehicle_videos for delete using (true);

create policy "Allow public manage settings" on settings for all using (true);
create policy "Allow public manage admins" on admins for all using (true);

-- ========================================================================
-- STORAGE BUCKETS CONFIGURATION (Instructional)
-- ========================================================================
-- Please create a public bucket named 'vehicles' in your Supabase Storage dashboard.
-- Inside 'vehicles', create the following folders:
--  - cover/
--  - gallery/
--  - 360/
--  - videos/
--  - logos/
-- Set the bucket policy to "Allow public read access" and "Allow public upload access".
