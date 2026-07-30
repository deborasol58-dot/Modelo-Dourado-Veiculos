/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  SlidersHorizontal, Search, Phone, ShieldCheck, Mail, MapPin, 
  HelpCircle, Sparkles, Star, DollarSign, Calculator, RotateCcw,
  CheckCircle, ArrowRight, Car as CarIcon, Gauge, Calendar, Fuel
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car, LeadMessage, CarCategory, UserProfile } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import CarCard from './components/CarCard';
import CarDetails from './components/CarDetails';
import AdminPanel from './components/AdminPanel';
import ClientArea from './components/ClientArea';

// Supabase services and hooks
import { useVehicles } from './hooks/useVehicles';
import { useLeads } from './hooks/useLeads';
import { useCategories } from './hooks/useCategories';
import { vehicleService } from './services/vehicle.service';
import { authService } from './services/auth.service';

export default function App() {
  // Navigation states
  const [currentView, setView] = useState<'catalog' | 'admin' | 'client'>('catalog');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // Auth states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Admin Login specific states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Check auth session on mount
  useEffect(() => {
    authService.getProfile().then(profile => {
      setUserProfile(profile);
      setAuthChecking(false);
    });
  }, []);

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    if (profile.role === 'admin') {
      setView('admin');
    } else {
      setView('catalog');
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUserProfile(null);
      setView('catalog');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminLoading(true);

    // Dynamic bypass for local test / preview envs using demo credentials
    const isDemoBypass = adminEmail.toLowerCase() === 'admin@douradoveiculos.com.br' && 
      (adminPassword === 'admin' || adminPassword === 'admin123' || adminPassword === 'dourado123' || adminPassword === '12345678');

    if (isDemoBypass) {
      setTimeout(() => {
        const demoProfile: UserProfile = {
          id: 'user-admin-1',
          email: 'admin@douradoveiculos.com.br',
          name: 'João Dourado (Diretor)',
          phone: '(11) 98765-4321',
          city: 'São Paulo - SP',
          role: 'admin'
        };
        setUserProfile(demoProfile);
        setView('admin');
        setAdminLoading(false);
      }, 600);
      return;
    }

    try {
      const profile = await authService.signIn(adminEmail, adminPassword);
      if (profile.role !== 'admin') {
        throw new Error('Esta conta não possui permissões administrativas.');
      }
      setUserProfile(profile);
      setView('admin');
    } catch (err: any) {
      setAdminError(err.message || 'Credenciais inválidas.');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDemoAdminAccess = () => {
    setAdminEmail('admin@douradoveiculos.com.br');
    setAdminPassword('dourado123');
    setAdminLoading(true);
    setTimeout(() => {
      const demoProfile: UserProfile = {
        id: 'user-admin-1',
        email: 'admin@douradoveiculos.com.br',
        name: 'João Dourado (Diretor - Demonstração)',
        phone: '(11) 98765-4321',
        city: 'São Paulo - SP',
        role: 'admin'
      };
      setUserProfile(demoProfile);
      setView('admin');
      setAdminLoading(false);
    }, 600);
  };

  // Core Data persistent States using Supabase custom hooks
  const { 
    vehicles: cars, 
    loading: carsLoading,
    error: carsError,
    addVehicle, 
    updateVehicle, 
    deleteVehicle 
  } = useVehicles();

  const { 
    leads: messages, 
    addLead, 
    updateLeadStatus, 
    deleteLead 
  } = useLeads();

  const { categories: dbCategories } = useCategories();

  // Public Catalog Filter parameters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CarCategory | 'Todos'>('Todos');
  const [selectedBrand, setSelectedBrand] = useState<string>('Todos');

  // Featured car carousel slider
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const activeFeaturedCars = useMemo(() => {
    const list = cars.filter(c => c.isFeatured && !c.isSold);
    if (list.length > 0) return list;
    return cars.filter(c => !c.isSold).slice(0, 4);
  }, [cars]);

  useEffect(() => {
    if (activeFeaturedCars.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % activeFeaturedCars.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeFeaturedCars]);

  // Financial Quote request states
  const [simCarId, setSimCarId] = useState<string>('');
  const [finName, setFinName] = useState('');
  const [finPhone, setFinPhone] = useState('');
  const [finEmail, setFinEmail] = useState('');
  const [finMessage, setFinMessage] = useState('');
  const [finSuccess, setFinSuccess] = useState(false);
  const [finLoading, setFinLoading] = useState(false);

  // Set initial car ID when cars are loaded
  useEffect(() => {
    if (cars.length > 0 && !simCarId) {
      setSimCarId(cars[0].id);
    }
  }, [cars]);

  // Unique list of brands currently available in inventory
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    cars.forEach(car => brands.add(car.brand));
    return ['Todos', ...Array.from(brands)];
  }, [cars]);

  // Public filtered catalog computed query
  const filteredCatalog = useMemo(() => {
    return cars.filter(car => {
      const matchSearch = 
        car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        car.version.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = selectedCategory === 'Todos' || car.category === selectedCategory;
      const matchBrand = selectedBrand === 'Todos' || car.brand === selectedBrand;

      return matchSearch && matchCategory && matchBrand;
    });
  }, [cars, searchQuery, selectedCategory, selectedBrand]);

  // Categories lists with helper icons and description meta
  const categoriesList = useMemo(() => {
    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map(cat => ({
        name: cat.name as CarCategory,
        icon: cat.icon || '🚗',
        count: cars.filter(c => c.category === cat.name || c.categoryId === cat.id).length
      }));
    }
    return [
      { name: 'Hatch' as CarCategory, icon: '🚗', count: cars.filter(c => c.category === 'Hatch').length },
      { name: 'SUV' as CarCategory, icon: '🚙', count: cars.filter(c => c.category === 'SUV').length },
      { name: 'Sedan' as CarCategory, icon: '🚘', count: cars.filter(c => c.category === 'Sedan').length },
      { name: 'Picape' as CarCategory, icon: '🛻', count: cars.filter(c => c.category === 'Picape').length },
      { name: 'Utilitário' as CarCategory, icon: '🚐', count: cars.filter(c => c.category === 'Utilitário').length },
      { name: 'Popular' as CarCategory, icon: '🏎️', count: cars.filter(c => c.category === 'Popular').length },
    ];
  }, [dbCategories, cars]);

  // Action methods: adding, editing and deleting
  const handleAddCar = async (newCar: Car) => {
    try {
      await addVehicle(newCar);
    } catch (err) {
      console.error('Error adding vehicle:', err);
    }
  };

  const handleEditCar = async (updatedCar: Car) => {
    try {
      const updated = await updateVehicle(updatedCar.id, updatedCar);
      if (selectedCar && selectedCar.id === updatedCar.id) {
        setSelectedCar(updated);
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
    }
  };

  const handleDeleteCar = async (id: string) => {
    try {
      await deleteVehicle(id);
      if (selectedCar && selectedCar.id === id) {
        setSelectedCar(null);
      }
    } catch (err) {
      console.error('Error deleting vehicle:', err);
    }
  };

  const handleUpdateMessageStatus = async (id: string, status: LeadMessage['status']) => {
    try {
      await updateLeadStatus(id, status);
    } catch (err) {
      console.error('Error updating message status:', err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await deleteLead(id);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleSubmitLead = async (leadData: Omit<LeadMessage, 'id' | 'createdAt' | 'status'>) => {
    try {
      await addLead(leadData);
      if (leadData.carId) {
        await vehicleService.incrementWhatsappClicks(leadData.carId);
      }
    } catch (err) {
      console.error('Error submitting lead:', err);
    }
  };

  const handleFinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finName || !finPhone || !simCarId) {
      alert('Por favor, preencha o nome, telefone e escolha um veículo de interesse.');
      return;
    }
    setFinLoading(true);
    try {
      const selectedCarObj = cars.find(c => c.id === simCarId);
      const carTitle = selectedCarObj ? `${selectedCarObj.brand} ${selectedCarObj.model}` : 'Veículo';
      await handleSubmitLead({
        carId: simCarId,
        carTitle,
        name: finName,
        phone: finPhone,
        email: finEmail,
        message: `[Solicitação de Financiamento] ${finMessage || 'Olá, gostaria de solicitar uma análise de crédito para este veículo.'}`
      });
      setFinSuccess(true);
      setFinName('');
      setFinPhone('');
      setFinEmail('');
      setFinMessage('');
      setTimeout(() => {
        setFinSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting financing lead:', err);
    } finally {
      setFinLoading(false);
    }
  };

  const handleSelectCarDetails = (car: Car) => {
    // Increment views statistics asynchronously in background
    vehicleService.incrementViews(car.id);
    setSelectedCar({ ...car, views: car.views + 1 });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSelectedBrand('Todos');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Universal header navigation */}
      <Header 
        currentView={currentView} 
        setView={(v) => { setView(v); setSelectedCar(null); }} 
        userProfile={userProfile}
        onLogout={handleLogout}
      />

      {/* CORE LAYOUT SWITCH: ADMIN PANEL VS CLIENT AREA VS PUBLIC CUSTOMER VIEW */}
      {currentView === 'admin' ? (
        userProfile && userProfile.role === 'admin' ? (
          <AdminPanel
            cars={cars}
            messages={messages}
            onAddCar={handleAddCar}
            onEditCar={handleEditCar}
            onDeleteCar={handleDeleteCar}
            onUpdateMessageStatus={handleUpdateMessageStatus}
            onDeleteMessage={handleDeleteMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-900 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-slate-950 p-8 sm:p-10 rounded-3xl border border-slate-850 shadow-2xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-red-500/10 text-red-500 mb-4 border border-red-500/10">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Painel Administrativo</h2>
                <p className="mt-2 text-xs text-slate-400">Área restrita para consultores e diretores da Dourado Veículos.</p>
              </div>

              {adminError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-semibold">
                  {adminError}
                  <div className="mt-2 text-[11px] text-slate-400">
                    Dica: Digite <span className="text-white font-mono">admin@douradoveiculos.com.br</span> com a senha <span className="text-white font-mono">dourado123</span> ou use o botão de acesso rápido abaixo!
                  </div>
                </div>
              )}

              <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">E-mail</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    placeholder="exemplo@douradoveiculos.com.br"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Senha</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    placeholder="••••••••"
                  />
                </div>

                <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-1">
                  <p className="font-bold text-slate-300">Credenciais para Demonstração:</p>
                  <p>E-mail: <span className="text-red-400 font-mono select-all">admin@douradoveiculos.com.br</span></p>
                  <p>Senha: <span className="text-red-400 font-mono select-all">dourado123</span></p>
                </div>

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center"
                >
                  {adminLoading ? 'Autenticando...' : 'Entrar no Sistema'}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">Ou</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleDemoAdminAccess}
                disabled={adminLoading}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Entrar como Administrador de Testes</span>
              </button>
            </div>
          </div>
        )
      ) : currentView === 'client' ? (
        <ClientArea
          cars={cars}
          userProfile={userProfile}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onSelectCar={(car) => {
            setSelectedCar(car);
            setView('catalog');
          }}
          onAdminToggle={() => setView('admin')}
        />
      ) : (
        <div className="flex-1 flex flex-col">
          
          {/* Subview checking: Car details page vs Main Catalog view */}
          {selectedCar ? (
            <CarDetails
              car={selectedCar}
              onBack={() => setSelectedCar(null)}
              onSubmitLead={handleSubmitLead}
            />
          ) : (
            <div className="space-y-16">
                    {/* Premium Hero promotional showcase section */}
              <section className="relative w-full overflow-hidden bg-slate-950 text-white min-h-[480px] flex items-center justify-center">
                {/* Visual grid decor circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 left-0 w-80 h-80 bg-red-700/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10 w-full animate-fadeIn">
                  {activeFeaturedCars.length > 0 ? (
                    <div className="relative">
                      {activeFeaturedCars.map((car, idx) => {
                        const isActive = idx === activeSlideIndex;
                        if (!isActive) return null;

                        return (
                          <motion.div
                            key={car.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5 }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
                          >
                            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white font-bold text-xs rounded-lg uppercase tracking-wider">
                                <Star className="w-3 h-3 fill-current" />
                                <span>VEÍCULO EM DESTAQUE</span>
                              </span>
                              <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-white">
                                {car.brand} <span className="text-red-500">{car.model}</span>
                              </h1>
                              <p className="text-slate-300 font-bold text-base sm:text-lg">
                                {car.version} • {car.year}
                              </p>
                              <p className="text-slate-400 font-medium text-sm sm:text-base max-w-xl leading-relaxed line-clamp-3">
                                {car.description || "Aproveite esta oferta exclusiva. Agende seu test-drive e conheça de perto a qualidade incomparável deste modelo premium."}
                              </p>
                              
                              {/* Quick Spec Pills */}
                              <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2 text-xs font-bold text-slate-300">
                                <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">{car.gearbox}</span>
                                <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">{car.fuel}</span>
                                <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">{car.km === 0 ? "Zero KM" : `${car.km.toLocaleString('pt-BR')} km`}</span>
                                <span className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">{car.color}</span>
                              </div>

                              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                                <button
                                  onClick={() => handleSelectCarDetails(car)}
                                  className="px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
                                >
                                  <span>Ver Detalhes</span>
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                                <a
                                  href="#finance-simulator"
                                  onClick={() => setSimCarId(car.id)}
                                  className="px-6 py-3.5 border-2 border-slate-700 hover:border-slate-500 text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                                >
                                  Análise de Crédito
                                </a>
                              </div>
                            </div>

                            <div className="lg:col-span-6">
                              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 flex items-center justify-center group cursor-pointer" onClick={() => handleSelectCarDetails(car)}>
                                <img
                                  src={car.images[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'}
                                  alt={`${car.brand} ${car.model}`}
                                  className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 border border-slate-800">
                                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                  <span>Laudo Cautelar Aprovado</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {/* Slider controls indicators (dots) */}
                      {activeFeaturedCars.length > 1 && (
                        <div className="flex justify-center items-center gap-2.5 mt-8 relative z-20">
                          {activeFeaturedCars.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveSlideIndex(i)}
                              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                                i === activeSlideIndex ? 'w-8 bg-red-600' : 'w-2.5 bg-slate-800 hover:bg-slate-600'
                              }`}
                              title={`Ir para o slide ${i + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 font-bold">
                      Nenhum veículo em destaque disponível.
                    </div>
                  )}
                </div>
              </section>

              {/* Instant Search and filters Section */}
              <section id="estoque-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24 space-y-10">
                
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-end relative -mt-24 z-20">
                  
                  {/* Query search */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Busca Livre</label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Ex: Chevrolet Onix Turbo, SUV, Automático..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Brand select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Marca</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:border-red-600 transition-all font-medium font-bold cursor-pointer"
                    >
                      {availableBrands.map((b) => (
                        <option key={b} value={b}>{b === 'Todos' ? 'Todas as Marcas' : b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Tags: Horizontal lists of categories */}
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xl text-slate-900">Categorias Populares</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scroll-hide">
                    <button
                      onClick={() => setSelectedCategory('Todos')}
                      className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap transition-all border ${
                        selectedCategory === 'Todos'
                          ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span>🚗</span>
                      <span>Ver Todos ({cars.length})</span>
                    </button>

                    {categoriesList.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap transition-all border ${
                          selectedCategory === cat.name
                            ? 'bg-red-600 border-red-600 text-white shadow-md'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name} ({cat.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic catalogue grid list */}
                <div className="space-y-6 pt-4">
                  {carsError && (
                    <div className="bg-red-50/90 border border-red-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 rounded-2xl text-red-600 shrink-0">
                          <HelpCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-lg text-slate-900">Erro de Conexão com o Supabase</h4>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            Não foi possível carregar os veículos do seu banco de dados Supabase. Certifique-se de ter executado o script de inicialização do banco de dados para criar as tabelas e liberar as permissões (RLS).
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-950 text-slate-100 p-5 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-800 shadow-inner">
                        <p className="text-red-400 font-bold mb-2">// Detalhes do erro retornado pelo Supabase:</p>
                        <p className="text-slate-300">{carsError}</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-3">
                        <h5 className="font-bold text-sm text-slate-900">Como resolver em menos de 1 minuto:</h5>
                        <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 font-medium">
                          <li>Acesse o painel do seu projeto no site da <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-red-600 font-bold hover:underline">Supabase</a>.</li>
                          <li>No menu lateral esquerdo, clique no ícone <span className="font-bold text-slate-800">SQL Editor</span>.</li>
                          <li>Clique em <span className="font-bold text-slate-800">"New query"</span> para abrir uma nova aba de consulta.</li>
                          <li>Abra o arquivo <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">/supabase/schema.sql</span> em seu projeto, copie o código completo.</li>
                          <li>Cole no editor de SQL do Supabase e clique no botão verde <span className="font-bold text-slate-800">"Run"</span> para executar.</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-2xl text-slate-900">Estoque Disponível</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Encontre veículos seminovos inspecionados com as melhores taxas.</p>
                    </div>

                    {(searchQuery || selectedCategory !== 'Todos' || selectedBrand !== 'Todos') && (
                      <button
                        onClick={resetFilters}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer bg-red-50 px-3.5 py-1.5 rounded-xl transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Limpar Filtros</span>
                      </button>
                    )}
                  </div>

                  {filteredCatalog.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-100 shadow-sm space-y-3">
                      <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700 text-sm">Nenhum carro atende aos critérios.</p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">Tente ajustar o preço máximo, remover os filtros de categorias ou limpar o termo de busca para visualizar o catálogo completo.</p>
                      <button
                        onClick={resetFilters}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold text-xs mt-4 cursor-pointer"
                      >
                        Restaurar Estoque Completo
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredCatalog.map((car) => (
                        <div key={car.id}>
                          <CarCard
                            car={car}
                            onSelect={handleSelectCarDetails}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Why Buy with us (Advantages / Vantagens) */}
              <section id="advantages-section" className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="max-w-7xl mx-auto text-center space-y-12 relative z-10">
                  <div className="space-y-4 max-w-2xl mx-auto">
                    <h2 className="font-extrabold text-3xl sm:text-4xl tracking-tight">Vantagens Dourado Veículos</h2>
                    <p className="text-slate-400 font-medium text-sm sm:text-base">
                      Comprar um carro conosco é ter a certeza de um processo transparente, do primeiro contato ao pós-venda. Veja por que somos a escolha número um em São Paulo.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
                    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-red-600/50 transition-all">
                      <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <CheckCircle className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-lg">Inspecionados</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Todos os nossos veículos passam por uma rigorosa auditoria em mais de 100 itens mecânicos e eletrônicos.
                      </p>
                    </div>

                    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-red-600/50 transition-all">
                      <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <SlidersHorizontal className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-lg">Laudo Cautelar</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Entregamos laudo cautelar de vistoria 100% aprovado para certificar a integridade do chassi, motor e pintura.
                      </p>
                    </div>

                    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-red-600/50 transition-all">
                      <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <DollarSign className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-lg">Financiamento</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Parceria direta com os maiores bancos (Santander, Itaú, Bradesco) para aprovação rápida de crédito com taxas imperdíveis.
                      </p>
                    </div>

                    <div className="bg-slate-800/40 p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-red-600/50 transition-all">
                      <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Phone className="w-7 h-7" />
                      </div>
                      <h4 className="font-bold text-lg">Atendimento Premium</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Um time de consultores prontos para tirar fotos, gravar vídeos e esclarecer dúvidas diretamente no WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Financial Quote Request Section */}
              <section id="finance-simulator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                  
                  {/* Left Side: Submit Credit Request form */}
                  <form onSubmit={handleFinSubmit} className="lg:col-span-7 p-6 sm:p-10 space-y-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 font-bold text-xs rounded-lg uppercase tracking-wider mb-2.5">
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Financiamento Dourado</span>
                      </span>
                      <h3 className="font-extrabold text-3xl text-slate-900 tracking-tight">Solicite uma análise de crédito</h3>
                      <p className="text-sm text-slate-500 mt-1">Preencha o formulário abaixo e receba propostas personalizadas para a compra do seu veículo premium sem complicação.</p>
                    </div>

                    {finSuccess && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Solicitação de financiamento enviada com sucesso! Nossos consultores retornarão em breve.</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Select Vehicle Dropdown */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Carro de Interesse</label>
                        <select
                          value={simCarId}
                          onChange={(e) => setSimCarId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:border-red-600 font-bold cursor-pointer"
                          required
                        >
                          <option value="" disabled>Escolha um veículo de interesse...</option>
                          {cars.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.brand} {c.model} {c.version} ({c.year})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nome Completo</label>
                          <input
                            type="text"
                            required
                            placeholder="Seu nome"
                            value={finName}
                            onChange={(e) => setFinName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-red-600 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">WhatsApp / Celular</label>
                          <input
                            type="tel"
                            required
                            placeholder="(11) 99999-9999"
                            value={finPhone}
                            onChange={(e) => setFinPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-red-600 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">E-mail (Opcional)</label>
                        <input
                          type="email"
                          placeholder="seu.email@exemplo.com"
                          value={finEmail}
                          onChange={(e) => setFinEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-red-600 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Observações ou valor de entrada pretendido (Opcional)</label>
                        <textarea
                          placeholder="Ex: Gostaria de dar meu carro atual como entrada, ou dar R$ 20.000 de entrada e financiar o restante."
                          value={finMessage}
                          onChange={(e) => setFinMessage(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-red-600 font-medium resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={finLoading}
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:bg-slate-300"
                      >
                        <span>{finLoading ? 'Enviando Proposta...' : 'Enviar Solicitação de Análise'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>

                  {/* Right Side: Visual Partnership Banner */}
                  <div className="lg:col-span-5 bg-slate-900 text-white p-6 sm:p-10 flex flex-col justify-between relative">
                    {/* Visual glowing layout decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-6 relative z-10">
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-widest block border-b border-slate-800 pb-2">
                        Vantagens de Financiar Conosco
                      </span>

                      <div className="space-y-5">
                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">Parceria com Grandes Bancos</h4>
                            <p className="text-xs text-slate-400 mt-1">Conexão direta com Itaú, Bradesco, Santander e BV para as melhores taxas de aprovação.</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">Taxas Especiais Seminovos</h4>
                            <p className="text-xs text-slate-400 mt-1">Planos de parcelas flexíveis sob medida para veículos de procedência certificada.</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                            <span className="w-2 h-2 bg-red-500 rounded-full" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white">Aprovação Sem Complicação</h4>
                            <p className="text-xs text-slate-400 mt-1">Análise de crédito descomplicada, rápida e transparente realizada em até 24h.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Seus dados pessoais estão protegidos e serão utilizados exclusivamente para análise de crédito bancária.</span>
                    </div>
                  </div>

                </div>
              </section>

            </div>
          )}

          {/* Universal footer */}
          <Footer onAdminClick={() => setView('admin')} />

        </div>
      )}

    </div>
  );
}
