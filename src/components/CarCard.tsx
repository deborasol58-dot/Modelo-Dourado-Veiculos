/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Gauge, Fuel, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Car } from '../types';

interface CarCardProps {
  car: Car;
  onSelect: (car: Car) => void;
}

export default function CarCard({ car, onSelect }: CarCardProps) {
  // Format KM helper
  const formatKm = (value: number) => {
    if (value === 0) return '0 KM (Novo)';
    return value.toLocaleString('pt-BR') + ' km';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => onSelect(car)}
      className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group cursor-pointer"
    >
      {/* Image Gallery container with Badges */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        <img
          src={car.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />

        {/* Badges Overlays */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          {car.isSold ? (
            <span className="bg-slate-900 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Vendido
            </span>
          ) : (
            <>
              {car.isFeatured && (
                <span className="bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                  Destaque
                </span>
              )}
              {car.km === 0 && (
                <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                  Zero KM
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Car specifications & Details */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            {car.brand}
          </span>
          <h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-red-600 transition-colors">
            {car.brand} {car.model}
          </h3>
          <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
            {car.version}
          </p>
        </div>

        {/* Technical spec mini chips */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2.5 rounded-xl text-slate-600 text-xs mb-5 font-medium">
          <div className="flex flex-col items-center justify-center text-center">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mb-1" />
            <span className="text-[10px] text-slate-500">{car.year}</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-x border-slate-200">
            <Gauge className="w-3.5 h-3.5 text-slate-400 mb-1" />
            <span className="text-[10px] text-slate-500 truncate max-w-full px-1">
              {formatKm(car.km)}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <Fuel className="w-3.5 h-3.5 text-slate-400 mb-1" />
            <span className="text-[10px] text-slate-500">{car.fuel}</span>
          </div>
        </div>

        {/* Action button aligned to bottom */}
        <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {car.isSold ? 'Indisponível' : 'Sob Consulta'}
          </span>
          
          <span className="px-3.5 py-2 bg-slate-900 group-hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all duration-300">
            Solicitar Orçamento
          </span>
        </div>
      </div>
    </motion.div>
  );
}
