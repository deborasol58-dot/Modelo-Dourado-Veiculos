import React, { useState, useEffect } from 'react';
import { 
  User, Star, ClipboardList, CalendarDays, LogOut, Mail, Lock, 
  Phone, MapPin, Sparkles, CheckCircle2, ChevronRight, Plus, 
  Calendar as CalendarIcon, Clock, Trash, AlertCircle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Car, Quote, Schedule, UserProfile } from '../types';
import { authService } from '../services/auth.service';
import { quoteService } from '../services/quote.service';

interface ClientAreaProps {
  cars: Car[];
  userProfile: UserProfile | null;
  onLogin: (profile: UserProfile) => void;
  onLogout: () => void;
  onSelectCar: (car: Car) => void;
  onAdminToggle?: () => void;
}

export default function ClientArea({ cars, userProfile, onLogin, onLogout, onSelectCar, onAdminToggle }: ClientAreaProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'quotes' | 'schedules'>('profile');
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Client Data States
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // New Schedule form states
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Profile Edit states
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch client related data if user is logged in
  useEffect(() => {
    if (userProfile && userProfile.role === 'client') {
      fetchClientData();
    }
  }, [userProfile]);

  const fetchClientData = async () => {
    if (!userProfile) return;
    setLoadingData(true);
    try {
      const favIds = await quoteService.getFavorites(userProfile.id);
      const userQuotes = await quoteService.getUserQuotes(userProfile.id);
      const userSchedules = await quoteService.getUserSchedules(userProfile.id);

      setFavorites(favIds);
      setQuotes(userQuotes);
      setSchedules(userSchedules);
    } catch (err) {
      console.warn('Error fetching client data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        if (!name || !phone || !city) {
          throw new Error('Todos os campos são obrigatórios.');
        }
        const profile = await authService.signUp(email, password, { name, phone, city });
        onLogin(profile);
      } else {
        const profile = await authService.signIn(email, password);
        onLogin(profile);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setAuthError(err.message || 'Ocorreu um erro na autenticação. Verifique suas credenciais.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setProfileLoading(true);
    setProfileSuccess(false);

    try {
      // Update user metadata in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        data: { name, phone, city }
      });

      if (error) throw error;

      onLogin({
        ...userProfile,
        name,
        phone,
        city
      });

      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error('Profile update error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || !selectedVehicleId || !scheduleDate || !scheduleTime) return;

    setScheduleLoading(true);
    try {
      const selectedCarObj = cars.find(c => c.id === selectedVehicleId);
      const carTitle = selectedCarObj ? `${selectedCarObj.brand} ${selectedCarObj.model}` : 'Veículo';

      const newSchedule = await quoteService.createSchedule({
        userId: userProfile.id,
        vehicleId: selectedVehicleId,
        vehicleTitle: carTitle,
        name: userProfile.name || 'Cliente',
        phone: userProfile.phone || '',
        email: userProfile.email,
        date: scheduleDate,
        time: scheduleTime
      });

      setSchedules([newSchedule, ...schedules]);
      setScheduleSuccess(true);
      setSelectedVehicleId('');
      setScheduleDate('');
      setScheduleTime('');

      setTimeout(() => {
        setScheduleSuccess(false);
        setShowNewSchedule(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating schedule:', err);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleToggleFavorite = async (carId: string) => {
    if (!userProfile) return;
    try {
      const updated = await quoteService.toggleFavorite(userProfile.id, carId);
      setFavorites(updated);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Pre-fill profile editing fields when userProfile is loaded
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
      setCity(userProfile.city || '');
    }
  }, [userProfile]);

  // Auth Form Page
  if (!userProfile) {
    return (
      <div className="flex-1 max-w-md w-full mx-auto my-12 p-8 bg-white border border-slate-100 shadow-2xl rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="text-center space-y-2 mb-8">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSignUp ? 'Criar sua Conta' : 'Área do Cliente'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isSignUp 
              ? 'Cadastre-se para favoritar carros, agendar test drives e solicitar orçamentos.' 
              : 'Faça login para gerenciar seus agendamentos, favoritos e orçamentos.'
            }
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs flex items-start gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{authError}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: São Paulo - SP"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-slate-900 hover:bg-red-600 disabled:bg-slate-400 text-white rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer mt-4"
          >
            {authLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin block mx-auto" />
            ) : (
              <span>{isSignUp ? 'Cadastrar' : 'Entrar na Conta'}</span>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 font-semibold border-t border-slate-100 pt-5">
          {isSignUp ? (
            <p>
              Já possui uma conta?{' '}
              <button onClick={() => setIsSignUp(false)} className="text-red-600 hover:underline cursor-pointer">
                Faça login
              </button>
            </p>
          ) : (
            <div className="space-y-4">
              <p>
                Novo por aqui?{' '}
                <button onClick={() => setIsSignUp(true)} className="text-red-600 hover:underline cursor-pointer">
                  Crie sua conta gratuitamente
                </button>
              </p>
              {onAdminToggle && (
                <div className="pt-3 border-t border-slate-100 flex justify-center">
                  <button
                    onClick={onAdminToggle}
                    className="text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                    <span>Acesso restrito para Vendedores / Administradores</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Logged-in Customer Dashboard Layout
  const favoritedCars = cars.filter(car => favorites.includes(car.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Controls */}
      <div className="w-full md:w-1/4 space-y-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          
          {/* User profile Summary */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 bg-red-600 text-white font-extrabold rounded-2xl flex items-center justify-center shadow-md">
              {userProfile.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-base text-slate-900 truncate">{userProfile.name || 'Nome não definido'}</h4>
              <p className="text-xs text-slate-400 truncate">{userProfile.email}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-red-50 text-red-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Meu Perfil</span>
            </button>
            
            <button
              onClick={() => setActiveTab('favorites')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-red-50 text-red-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Favoritos ({favoritedCars.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('quotes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'quotes'
                  ? 'bg-red-50 text-red-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Minhas Solicitações ({quotes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('schedules')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'schedules'
                  ? 'bg-red-50 text-red-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Agendamentos ({schedules.length})</span>
            </button>
          </nav>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer border-t border-slate-100 pt-5 mt-4"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="w-full md:w-3/4">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm h-full min-h-[500px]">
          
          {loadingData ? (
            <div className="flex items-center justify-center h-[400px]">
              <span className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              
              {/* TAB 1: USER PROFILE EDITING */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Editar Perfil</h3>
                    <p className="text-xs text-slate-400 mt-1">Mantenha seus dados de contato atualizados para facilitar o agendamento de orçamentos e simulações.</p>
                  </div>

                  {profileSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Perfil atualizado com sucesso!</span>
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail (Não editável)</label>
                      <input
                        type="email"
                        disabled
                        value={userProfile.email}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Seu nome completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp / Celular</label>
                        <input
                          type="tel"
                          required
                          placeholder="(11) 99999-9999"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade / Estado</label>
                        <input
                          type="text"
                          required
                          placeholder="São Paulo - SP"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={profileLoading}
                      className="px-6 py-3 bg-slate-900 hover:bg-red-600 disabled:bg-slate-400 text-white rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer pt-2"
                    >
                      {profileLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* TAB 2: FAVORITE VEHICLES */}
              {activeTab === 'favorites' && (
                <motion.div
                  key="favorites-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Veículos Favoritados</h3>
                    <p className="text-xs text-slate-400 mt-1">Acompanhe e simule propostas para os seminovos que você mais gostou.</p>
                  </div>

                  {favoritedCars.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-3 border-2 border-dashed border-slate-100 rounded-2xl p-6">
                      <Star className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">Você não possui veículos favoritos.</p>
                      <p className="text-xs max-w-sm mx-auto">Explore o nosso estoque e toque na estrela de qualquer carro para adicioná-lo aqui.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favoritedCars.map((car) => (
                        <div key={car.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4 relative group">
                          <img
                            src={car.images[0]}
                            alt={car.model}
                            className="w-24 h-18 object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 overflow-hidden flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 truncate leading-tight">{car.brand} {car.model}</h4>
                              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{car.version}</p>
                              <span className="inline-block mt-1 text-[9px] bg-slate-200/60 font-bold px-1.5 py-0.5 rounded text-slate-600">
                                {car.year}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <button
                                onClick={() => onSelectCar(car)}
                                className="text-xs font-bold text-red-600 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <span>Ver Detalhes</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleFavorite(car.id)}
                            className="absolute top-3 right-3 text-red-500 hover:text-slate-300 p-1 rounded-lg bg-white/80"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 3: BUDGET REQUESTS (QUOTES) */}
              {activeTab === 'quotes' && (
                <motion.div
                  key="quotes-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Histórico de Orçamentos</h3>
                    <p className="text-xs text-slate-400 mt-1">Veja o status e acompanhe as solicitações de orçamento que você enviou.</p>
                  </div>

                  {quotes.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-3 border-2 border-dashed border-slate-100 rounded-2xl p-6">
                      <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">Nenhum orçamento solicitado.</p>
                      <p className="text-xs max-w-sm mx-auto">Ao clicar em "Solicitar Orçamento" em qualquer veículo de interesse, as propostas aparecerão compiladas aqui.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quotes.map((q) => (
                        <div key={q.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base">{q.vehicleTitle}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Cidade solicitada: {q.city}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              q.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                              q.status === 'Respondido' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-200 text-slate-700'
                            }`}>
                              {q.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB 4: APPOINTMENTS (SCHEDULES) */}
              {activeTab === 'schedules' && (
                <motion.div
                  key="schedules-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Agendamentos de Test Drive</h3>
                      <p className="text-xs text-slate-400 mt-1">Consulte ou agende uma nova visita/test-drive na concessionária para ver os veículos.</p>
                    </div>

                    {!showNewSchedule && (
                      <button
                        onClick={() => setShowNewSchedule(true)}
                        className="px-4 py-2 bg-slate-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo Agendamento</span>
                      </button>
                    )}
                  </div>

                  {/* Booking form */}
                  {showNewSchedule ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-slate-50 border border-slate-100 rounded-2xl p-5 sm:p-6"
                    >
                      <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                        <CalendarIcon className="w-4 h-4 text-red-500" />
                        <span>Marcar Visita</span>
                      </h4>

                      {scheduleSuccess ? (
                        <div className="text-center py-6 space-y-2">
                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                          <h5 className="font-bold text-sm text-slate-800">Agendamento Solicitado!</h5>
                          <p className="text-xs text-slate-400">Verifique seu histórico de agendamentos. Entraremos em contato para confirmar a data escolhida.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleAddSchedule} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selecione o Veículo</label>
                            <select
                              required
                              value={selectedVehicleId}
                              onChange={(e) => setSelectedVehicleId(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:border-red-600 font-medium"
                            >
                              <option value="">Selecione um carro do estoque...</option>
                              {cars.map(c => (
                                <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.year})</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                              <input
                                type="date"
                                required
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                              <input
                                type="time"
                                required
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 text-sm focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex gap-3 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => setShowNewSchedule(false)}
                              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={scheduleLoading}
                              className="px-5 py-2 bg-slate-900 hover:bg-red-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
                            >
                              {scheduleLoading ? 'Processando...' : 'Confirmar Agendamento'}
                            </button>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  ) : null}

                  {/* Listings */}
                  {schedules.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-3 border-2 border-dashed border-slate-100 rounded-2xl p-6">
                      <CalendarDays className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">Você não possui visitas agendadas.</p>
                      <p className="text-xs max-w-sm mx-auto">Agende uma data para visitar nosso showroom e fazer um test drive exclusivo.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {schedules.map((s) => (
                        <div key={s.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] bg-red-50 text-red-600 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                              Test Drive
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base pt-1">{s.vehicleTitle}</h4>
                            <div className="flex items-center gap-3 text-slate-500 text-xs mt-1">
                              <span className="flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> {new Date(s.date).toLocaleDateString('pt-BR')}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {s.time}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              s.status === 'Pendente' ? 'bg-amber-100 text-amber-700' :
                              s.status === 'Confirmado' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-rose-100 text-rose-700'
                            }`}>
                              {s.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          )}

        </div>
      </div>

    </div>
  );
}
