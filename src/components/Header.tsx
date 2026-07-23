/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Car, LayoutDashboard, ShieldCheck, UserCheck, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentView: 'catalog' | 'admin' | 'client';
  setView: (view: 'catalog' | 'admin' | 'client') => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export default function Header({ currentView, setView, userProfile, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setView('catalog')}
        >
          <div className="bg-red-600 text-white p-2.5 rounded-xl shadow-md flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900 leading-tight">
              Dourado <span className="text-red-600">Veículos</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-0.5">
              Seminovos &amp; Premium
            </span>
          </div>
        </div>

        {/* Navigation Links (Public view only, or neutral links) */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => setView('catalog')}
            className={`font-medium text-sm transition-all pb-1 border-b-2 cursor-pointer ${
              currentView === 'catalog'
                ? 'text-red-600 border-red-600'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Estoque
          </button>
          <a
            href="#financiamento"
            onClick={(e) => {
              e.preventDefault();
              setView('catalog');
              setTimeout(() => {
                document.getElementById('finance-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors"
          >
            Financiamento
          </a>
          <a
            href="#vantagens"
            onClick={(e) => {
              e.preventDefault();
              setView('catalog');
              setTimeout(() => {
                document.getElementById('advantages-section')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors"
          >
            Vantagens
          </a>
        </nav>

        {/* View Toggle / Call to Action */}
        <div className="flex items-center gap-3">
          {userProfile && userProfile.role === 'admin' && (
            <button
              onClick={() => setView('admin')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-red-600 text-white border-red-600 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span>Painel ADM</span>
            </button>
          )}

          {userProfile ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('client')}
                className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-sm hover:bg-slate-200 cursor-pointer"
                title={`Logado como: ${userProfile.name || userProfile.email}`}
              >
                {(userProfile.name || 'U').charAt(0).toUpperCase()}
              </button>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                title="Sair da Conta"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('client')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-red-500" />
              <span>Área do Cliente</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
