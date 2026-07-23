/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Phone, Mail, MapPin, Award, Clock, ArrowUp, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface FooterProps {
  onAdminClick?: () => void;
}

export default function Footer({ onAdminClick }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-slate-950 text-slate-400 mt-auto">
      {/* Top Banner with high credibility chips */}
      <div className="border-b border-slate-900 bg-slate-900/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <Award className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <h4 className="text-white font-bold text-sm">Garantia e Procedência</h4>
              <p className="text-xs text-slate-400">Todos os carros com laudo cautelar aprovado.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <Clock className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <h4 className="text-white font-bold text-sm">Atendimento Ágil</h4>
              <p className="text-xs text-slate-400">Resposta via WhatsApp em menos de 10 minutos.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 justify-center sm:justify-start">
            <Phone className="w-8 h-8 text-red-500 shrink-0" />
            <div>
              <h4 className="text-white font-bold text-sm">Financiamento Facilitado</h4>
              <p className="text-xs text-slate-400">As melhores taxas com os principais bancos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
        
        {/* Col 1: Brand details */}
        <div className="md:col-span-5 space-y-6">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white p-2 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              Dourado <span className="text-red-600">Veículos</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
            Sua concessionária de confiança com mais de 20 anos de história entregando os melhores carros com transparência, qualidade e pós-venda especializado. Encontre o carro dos seus sonhos hoje.
          </p>
          <div className="pt-2 text-xs text-slate-500">
            CNPJ: 12.345.678/0001-90 | Dourado Automotive Ltda.
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">Menu</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <a href="#" className="hover:text-white transition-colors">Estoque Completo</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Financiamento Especial</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Sobre Nós</a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">Termos e Condições</a>
            </li>
            {onAdminClick && (
              <li className="pt-2 border-t border-slate-900 mt-2">
                <button
                  onClick={onAdminClick}
                  className="hover:text-red-500 text-slate-500 font-bold text-xs transition-colors cursor-pointer text-left w-full flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  <span>Acesso Restrito (ADM)</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Col 3: Contact */}
        <div className="md:col-span-4 space-y-4">
          <h4 className="text-white font-bold text-sm tracking-wider uppercase">Contato &amp; Localização</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>Av. Automobilismo, 1000 - Interlagos, São Paulo - SP</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-red-500 shrink-0" />
              <span>(11) 98765-4321 / (11) 3222-1111</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-red-500 shrink-0" />
              <span>contato@douradoveiculos.com.br</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 py-8 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            &copy; 2026 Dourado Veículos. Todos os direitos reservados.
          </p>
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            onClick={scrollToTop}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition-all cursor-pointer shadow-md"
            title="Voltar ao topo"
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
