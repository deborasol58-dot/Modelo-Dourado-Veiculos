import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, MessageSquare, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, UserProfile } from '../types';
import { quoteService } from '../services/quote.service';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  userProfile: UserProfile | null;
}

export default function QuoteModal({ isOpen, onClose, car, userProfile }: QuoteModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
      setEmail(userProfile.email || '');
      setCity(userProfile.city || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCity('');
    }
    setSuccess(false);
  }, [userProfile, car, isOpen]);

  if (!car) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !city) return;

    setLoading(true);
    try {
      // Save quote in Supabase quotes table
      const createdQuote = await quoteService.createQuote({
        vehicleId: car.id,
        vehicleTitle: `${car.brand} ${car.model}`,
        name,
        phone,
        email,
        city,
        userId: userProfile?.id
      });

      setSuccess(true);
      setLoading(false);

      // Create WhatsApp personalized message text
      const messageText = `Olá Dourado Veículos! Acabei de enviar uma solicitação de orçamento pelo site para o veículo:
*${car.brand} ${car.model}* (${car.year})
*Cor:* ${car.color}

*Meus Dados:*
- *Nome:* ${name}
- *Telefone:* ${phone}
- *E-mail:* ${email}
- *Cidade:* ${city}

Gostaria de consultar as condições de financiamento e entrega!`;

      const encodedMessage = encodeURIComponent(messageText);
      const whatsappUrl = `https://wa.me/5511999999999?text=${encodedMessage}`;

      // Redirect to WhatsApp after 2 seconds
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error submitting quote request:', error);
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 z-10 flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex gap-4 items-center">
                <img
                  src={car.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'}
                  alt={car.model}
                  className="w-16 h-12 object-cover rounded-lg border border-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Solicitar Orçamento</span>
                  <h3 className="font-extrabold text-lg text-white mt-0.5">{car.brand} {car.model}</h3>
                  <p className="text-xs text-slate-400">{car.version} ({car.year})</p>
                </div>
              </div>
            </div>

            {/* Content / Form */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Solicitação Enviada!</h4>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                      Seu orçamento foi registrado. Estamos te redirecionando para o nosso WhatsApp para atendimento prioritário...
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ana Maria Souza"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp / Celular</label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex: (11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        placeholder="Ex: ana@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade / Estado</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: São Paulo - SP"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3 text-amber-800 text-xs mt-2">
                    <MessageSquare className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                    <p className="leading-relaxed font-medium">
                      Após o envio dos dados, você será redirecionado para o WhatsApp da concessionária para receber as fotos, vídeos e simulação detalhada.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer mt-4"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Solicitar Orçamento &amp; Ir para WhatsApp</span>
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
