/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CarCategory = 'Hatch' | 'SUV' | 'Sedan' | 'Picape' | 'Utilitário' | 'Popular';

export interface Car {
  id: string;
  brand: string;
  model: string;
  version: string;
  price: number;
  year: string; // e.g. "2022/2023"
  km: number;
  gearbox: 'Automático' | 'Manual' | string;
  fuel: 'Flex' | 'Gasolina' | 'Álcool' | 'Diesel' | 'Híbrido' | 'Elétrico' | string;
  color: string;
  plateEnd: string;
  description: string;
  images: string[];
  features: string[];
  category: CarCategory | string;
  categoryId?: string;
  isFeatured?: boolean;
  isPromo?: boolean;
  isSold?: boolean;
  views: number;
  whatsappClicks: number;
  createdAt: string;
}

export interface LeadMessage {
  id: string;
  carId: string;
  carTitle: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
  status: 'Pendente' | 'Respondido' | 'Arquivado';
}

export interface DashboardStats {
  totalCars: number;
  mostViewed: number;
  mostSold: number;
  whatsappClicks: number;
}

export interface Quote {
  id: string;
  vehicleId: string;
  vehicleTitle: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  createdAt: string;
  status: 'Pendente' | 'Respondido' | 'Arquivado';
  userId?: string;
}

export interface Favorite {
  id: string;
  userId: string;
  vehicleId: string;
}

export interface Schedule {
  id: string;
  userId?: string;
  vehicleId: string;
  vehicleTitle: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  city?: string;
  role: 'admin' | 'client';
  isActive?: boolean;
}

export interface Vehicle360 {
  id: string;
  vehicleId: string;
  framesCount: number; // 24, 36, 48, 72, 96
  images: string[];
  status: 'draft' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export type DamageCategory = 
  | 'Arranhão'
  | 'Amassado'
  | 'Parachoque'
  | 'Farol'
  | 'Lanterna'
  | 'Pneu'
  | 'Roda'
  | 'Retrovisor'
  | 'Capô'
  | 'Teto'
  | 'Vidro'
  | 'Outro';

export type TechnicalInspectionStatus = 'Não avaliado' | 'OK' | 'Atenção' | 'Problema';
export type InspectionCategory = 'Exterior' | 'Interior';

export interface VehicleInspectionItem {
  id: string;
  projectId: string;
  category: InspectionCategory | string;
  itemName: string;
  status: TechnicalInspectionStatus;
  notes: string;
  photos: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type InspectionStatus = 'OK' | 'Atenção' | 'Avaria' | 'Não Inspecionado';

export interface InspectionItem {
  id: string;
  vehicleId: string;
  groupName: string;
  name: string;
  description: string;
  status: InspectionStatus;
  images: string[];
  frameIndex?: number;
  posX?: number;
  posY?: number;
}

export interface DamageMarker {
  id: string;
  vehicleId: string;
  title: string;
  description: string;
  category: DamageCategory;
  damageImages: string[];
  frameIndex: number;
  posX: number; // percentage 0-100
  posY: number; // percentage 0-100
  framePositions?: Record<number, { posX: number; posY: number }>;
  createdAt: string;
}

