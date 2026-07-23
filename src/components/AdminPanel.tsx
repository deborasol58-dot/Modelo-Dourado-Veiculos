/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Check, X, ShieldAlert,
  Car, Eye, Phone, TrendingUp, BarChart3, Settings, 
  MessageSquare, UserCheck, Calendar, Gauge, Fuel, SlidersHorizontal,
  DollarSign, Package, CheckCircle2, ChevronRight, RefreshCw, Upload, Image as ImageIcon,
  Users, FileSpreadsheet, ClipboardList, MapPin, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Car as CarType, LeadMessage, CarCategory, Quote, UserProfile } from '../types';
import { quoteService } from '../services/quote.service';
import { settingsService, CompanySettings } from '../services/settings.service';
import { supabase } from '../lib/supabase';
import Admin360Module from './Admin360Module';
import { vehicleMediaService } from '../services/vehicleMedia.service';


interface AdminPanelProps {
  cars: CarType[];
  messages: LeadMessage[];
  onAddCar: (car: CarType) => void;
  onEditCar: (car: CarType) => void;
  onDeleteCar: (id: string) => void;
  onUpdateMessageStatus: (id: string, status: LeadMessage['status']) => void;
  onDeleteMessage: (id: string) => void;
}

export default function AdminPanel({
  cars,
  messages,
  onAddCar,
  onEditCar,
  onDeleteCar,
  onUpdateMessageStatus,
  onDeleteMessage
}: AdminPanelProps) {
  // Navigation active tab
  const [activeSection, setActiveSection] = useState<'dashboard' | 'vehicles' | 'messages' | 'quotes' | 'users' | 'settings' | 'vehicle360'>('dashboard');

  // Search and filter inside tables
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [quoteSearch, setQuoteSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Quotes and users state loaded dynamically
  const [quotesList, setQuotesList] = useState<Quote[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  // Form states for Settings
  const [settingsName, setSettingsName] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsWhatsapp, setSettingsWhatsapp] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [settingsHours, setSettingsHours] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Modals visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarType | null>(null);

  // Modal active sub-tab for Edit dialog
  const [modalTab, setModalTab] = useState<'specs' | 'media'>('specs');
  const [newCarId, setNewCarId] = useState('');

  // Media management form states
  const [mediaCover, setMediaCover] = useState<string | null>(null);
  const [mediaGallery, setMediaGallery] = useState<string[]>([]);
  const [mediaVideoUrl, setMediaVideoUrl] = useState('');
  const [mediaVideoProvider, setMediaVideoProvider] = useState<'upload' | 'youtube'>('youtube');
  const [media360, setMedia360] = useState<string[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // Helper UUID generator for draft/new cars
  const generateUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Form states (Add/Edit car)
  const [formBrand, setFormBrand] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formYear, setFormYear] = useState('');
  const [formYearFabricacao, setFormYearFabricacao] = useState('2023');
  const [formYearModelo, setFormYearModelo] = useState('2023');
  const [formKm, setFormKm] = useState<number | ''>('');

  // Additional feature states
  const [viewingLead, setViewingLead] = useState<LeadMessage | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // User editing states
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserCity, setEditUserCity] = useState('');
  const [editUserRole, setEditUserRole] = useState<'admin' | 'client'>('client');
  const [editUserIsActive, setEditUserIsActive] = useState(true);
  const [formGearbox, setFormGearbox] = useState('Automático');
  const [formFuel, setFormFuel] = useState('Flex');
  const [formColor, setFormColor] = useState('');
  const [formPlateEnd, setFormPlateEnd] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<CarCategory>('SUV');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsPromo, setFormIsPromo] = useState(false);
  const [formIsSold, setFormIsSold] = useState(false);
  const [formImagesText, setFormImagesText] = useState(''); // Textarea with image URLs (one per line)
  const [formFeaturesText, setFormFeaturesText] = useState(''); // comma-separated features

  // Load new tabs data dynamically on navigation or load
  useEffect(() => {
    // Load Quotes
    quoteService.getQuotes().then(data => setQuotesList(data));

    // Compile distinct users/profiles
    const compileUsers = async () => {
      const userMap = new Map<string, UserProfile>();
      
      // Default initial staff users
      userMap.set('user-admin-1', {
        id: 'user-admin-1',
        email: 'admin@douradoveiculos.com.br',
        name: 'João Dourado (Diretor)',
        phone: '(11) 98765-4321',
        city: 'São Paulo - SP',
        role: 'admin'
      });
      userMap.set('user-admin-2', {
        id: 'user-admin-2',
        email: 'vendas@douradoveiculos.com.br',
        name: 'Cláudio Vendedor',
        phone: '(11) 97777-6666',
        city: 'São Paulo - SP',
        role: 'admin'
      });

      try {
        const allQuotes = await quoteService.getQuotes();
        allQuotes.forEach(q => {
          if (q.userId) {
            userMap.set(q.userId, {
              id: q.userId,
              email: q.email || `${q.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
              name: q.name,
              phone: q.phone,
              city: q.city,
              role: 'client'
            });
          } else {
            // Also add anonymous submitters as clients based on email
            const anonId = 'anon-' + q.email.replace(/[@.]/g, '-');
            userMap.set(anonId, {
              id: anonId,
              email: q.email,
              name: q.name,
              phone: q.phone,
              city: q.city,
              role: 'client'
            });
          }
        });
      } catch (err) {
        console.warn('Error fetching quotes for user list:', err);
      }

      setUsersList(Array.from(userMap.values()));
    };

    compileUsers();

    // Load Company Settings
    settingsService.getSettings().then(data => {
      setCompanySettings(data);
      setSettingsName(data.companyName);
      setSettingsPhone(data.phone);
      setSettingsWhatsapp(data.whatsapp);
      setSettingsAddress(data.address);
      setSettingsHours(data.hours);
    });
  }, [activeSection]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsSuccess(false);

    try {
      const updated = await settingsService.updateSettings({
        companyName: settingsName,
        phone: settingsPhone,
        whatsapp: settingsWhatsapp,
        address: settingsAddress,
        hours: settingsHours
      });
      setCompanySettings(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateQuoteStatus = async (quoteId: string, status: Quote['status']) => {
    try {
      await quoteService.updateQuoteStatus(quoteId, status);
      setQuotesList(prev => prev.map(q => q.id === quoteId ? { ...q, status } : q));
    } catch (err) {
      console.error('Error updating quote status:', err);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Deseja realmente remover esta solicitação de orçamento?')) return;
    try {
      await quoteService.deleteQuote(quoteId);
      setQuotesList(prev => prev.filter(q => q.id !== quoteId));
    } catch (err) {
      console.error('Error deleting quote:', err);
    }
  };


  const uploadFileToSupabase = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `cars/${fileName}`;

      // Upload exclusively to 'vehicles' bucket
      const { data, error } = await supabase.storage
        .from('vehicles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Supabase upload failed:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };


  // Reset form helper
  const resetForm = (carToEdit: CarType | null = null) => {
    setModalTab('specs');
    if (carToEdit) {
      setEditingCar(carToEdit);
      setFormBrand(carToEdit.brand);
      setFormModel(carToEdit.model);
      setFormVersion(carToEdit.version);
      setFormPrice(carToEdit.price || 0);
      setFormYear(carToEdit.year || '2023/2023');
      const parts = (carToEdit.year || '2023/2023').split('/');
      setFormYearFabricacao(parts[0] || '2023');
      setFormYearModelo(parts[1] || parts[0] || '2023');
      setFormKm(carToEdit.km);
      setFormGearbox(carToEdit.gearbox);
      setFormFuel(carToEdit.fuel);
      setFormColor(carToEdit.color);
      setFormPlateEnd(carToEdit.plateEnd);
      setFormDescription(carToEdit.description);
      setFormCategory(carToEdit.category);
      setFormIsFeatured(!!carToEdit.isFeatured);
      setFormIsPromo(!!carToEdit.isPromo);
      setFormIsSold(!!carToEdit.isSold);
      setFormImagesText(carToEdit.images.join('\n'));
      setFormFeaturesText(carToEdit.features.join(', '));

      // Load vehicle media asynchronously from Supabase
      setMediaLoading(true);
      setNewCarId('');
      vehicleMediaService.getMediaForVehicle(carToEdit.id)
        .then((media) => {
          setMediaCover(media.cover || (carToEdit.images && carToEdit.images[0]) || null);
          setMediaGallery(media.gallery && media.gallery.length > 0 ? media.gallery : (carToEdit.images ? carToEdit.images.slice(1) : []));
          setMediaVideoUrl(media.video?.video_url || '');
          setMediaVideoProvider(media.video?.provider || 'youtube');
          setMedia360(media.frames360 || []);
        })
        .catch((err) => {
          console.warn('Failed to load media for vehicle:', err);
          // Safe fallback
          setMediaCover((carToEdit.images && carToEdit.images[0]) || null);
          setMediaGallery(carToEdit.images ? carToEdit.images.slice(1) : []);
          setMediaVideoUrl('');
          setMediaVideoProvider('youtube');
          setMedia360([]);
        })
        .finally(() => {
          setMediaLoading(false);
        });
    } else {
      const generatedId = generateUUID();
      setNewCarId(generatedId);
      setEditingCar(null);
      setFormBrand('');
      setFormModel('');
      setFormVersion('');
      setFormPrice(0);
      setFormYear('2023/2023');
      setFormYearFabricacao('2023');
      setFormYearModelo('2023');
      setFormKm('');
      setFormGearbox('Automático');
      setFormFuel('Flex');
      setFormColor('');
      setFormPlateEnd('');
      setFormDescription('');
      setFormCategory('SUV');
      setFormIsFeatured(false);
      setFormIsPromo(false);
      setFormIsSold(false);
      setFormImagesText('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800');
      setFormFeaturesText('Direção Elétrica, Ar Condicionado, Vidros Elétricos, Alarme, Central Multimídia, Airbag, Freios ABS');
      
      // Initialize blank media states for new vehicle
      setMediaCover(null);
      setMediaGallery([]);
      setMediaVideoUrl('');
      setMediaVideoProvider('youtube');
      setMedia360([]);
    }
  };

  const handleOpenModal = (car: CarType | null = null) => {
    resetForm(car);
    setIsModalOpen(true);
  };

  const handleSaveCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand || !formModel || !formVersion || formKm === '') return;

    const targetId = editingCar ? editingCar.id : newCarId;

    // Use cover and gallery states if defined, otherwise fall back to textarea
    let images: string[] = [];
    if (mediaCover || mediaGallery.length > 0) {
      images = [mediaCover, ...mediaGallery].filter((url): url is string => !!url);
    } else {
      images = formImagesText
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0);
    }

    if (images.length === 0) {
      images.push('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800');
    }

    // Parse features list
    const features = formFeaturesText
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const combinedYear = `${formYearFabricacao}/${formYearModelo}`;

    const carData: CarType = {
      id: targetId,
      brand: formBrand,
      model: formModel,
      version: formVersion,
      price: 0, // No price displays anymore!
      year: combinedYear,
      km: Number(formKm),
      gearbox: formGearbox,
      fuel: formFuel,
      color: formColor || 'Cor Padrão',
      plateEnd: formPlateEnd || '9',
      description: formDescription || `Veículo ${formBrand} ${formModel} em perfeito estado de conservação, revisado e pronto para entrega.`,
      images: images,
      features: features,
      category: formCategory,
      isFeatured: formIsFeatured,
      isPromo: formIsPromo,
      isSold: formIsSold,
      views: editingCar ? editingCar.views : 1,
      whatsappClicks: editingCar ? editingCar.whatsappClicks : 0,
      createdAt: editingCar ? editingCar.createdAt : new Date().toISOString()
    };

    if (editingCar) {
      onEditCar(carData);
    } else {
      onAddCar(carData);
    }

    setIsModalOpen(false);
  };

  // Dynamic dashboard calculations based on current state!
  const stats = useMemo(() => {
    let totalCars = cars.length;
    let mostViewed = 0;
    let soldCarsCount = 0;
    let whatsappCount = 0;
    let totalStockValue = 0;

    cars.forEach(car => {
      if (car.views > mostViewed) mostViewed = car.views;
      if (car.isSold) soldCarsCount++;
      whatsappCount += car.whatsappClicks;
      if (!car.isSold) {
        totalStockValue += car.price;
      }
    });

    return {
      totalCars,
      totalStockValue,
      mostViewed,
      soldCount: soldCarsCount,
      whatsappCount,
      unreadLeads: messages.filter(m => m.status === 'Pendente').length
    };
  }, [cars, messages]);

  // Pie chart counts simulation based on actual database contents!
  const categoryChartStats = useMemo(() => {
    const counts: Record<CarCategory, number> = {
      SUV: 0,
      Sedan: 0,
      Hatch: 0,
      Picape: 0,
      Utilitário: 0,
      Popular: 0
    };

    cars.forEach(car => {
      if (counts[car.category] !== undefined) {
        counts[car.category]++;
      }
    });

    const total = cars.length || 1;
    return Object.keys(counts).map(cat => ({
      name: cat as CarCategory,
      count: counts[cat as CarCategory],
      percent: Math.round((counts[cat as CarCategory] / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [cars]);

  // Filters for vehicles list
  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const q = vehicleSearch.toLowerCase();
      return (
        car.brand.toLowerCase().includes(q) ||
        car.model.toLowerCase().includes(q) ||
        car.version.toLowerCase().includes(q) ||
        car.category.toLowerCase().includes(q)
      );
    });
  }, [cars, vehicleSearch]);

  // Filters for customer lead messages list
  const filteredMessages = useMemo(() => {
    return messages.filter(m => {
      const q = leadSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.carTitle.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q)
      );
    });
  }, [messages, leadSearch]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Sidebar navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white p-2 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight block">Dourado Admin</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gestão de Estoque</span>
            </div>
          </div>
        </div>

        <nav className="p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible no-scrollbar">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full ${
              activeSection === 'dashboard'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Painel Geral</span>
          </button>

          <button
            onClick={() => setActiveSection('vehicles')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full ${
              activeSection === 'vehicles'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Gerenciar Veículos ({cars.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('vehicle360')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full ${
              activeSection === 'vehicle360'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Veículo 360°</span>
          </button>

          <button
            onClick={() => setActiveSection('quotes')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full relative ${
              activeSection === 'quotes'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Orçamentos ({quotesList.length})</span>
            {quotesList.filter(q => q.status === 'Pendente').length > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {quotesList.filter(q => q.status === 'Pendente').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('messages')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full relative ${
              activeSection === 'messages'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Leads / Mensagens</span>
            {stats.unreadLeads > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {stats.unreadLeads}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('users')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full ${
              activeSection === 'users'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('settings')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap md:w-full ${
              activeSection === 'settings'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="hidden md:block mt-auto p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs">
              JD
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Administrador</p>
              <p className="text-[10px] text-slate-400 mt-1">Dourado Veículos</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main dashboard viewport */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8 overflow-x-hidden">
        
        {/* Top welcome banner */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <h2 className="font-extrabold text-3xl text-slate-900 tracking-tight">
              {activeSection === 'dashboard' && 'Visão Geral do Negócio'}
              {activeSection === 'vehicles' && 'Gerenciamento de Inventário'}
              {activeSection === 'quotes' && 'Solicitações de Orçamento'}
              {activeSection === 'messages' && 'Contatos e Leads Recentes'}
              {activeSection === 'users' && 'Gerenciamento de Usuários'}
              {activeSection === 'settings' && 'Configurações da Concessionária'}
              {activeSection === 'vehicle360' && 'Módulo Inspetor Veículo 360°'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeSection === 'dashboard' && 'Acompanhe as estatísticas de cliques, contatos e distribuição do seu estoque.'}
              {activeSection === 'vehicles' && 'Adicione novos carros, edite especificações e marque como vendido.'}
              {activeSection === 'quotes' && 'Revise e controle as solicitações de orçamento recebidas.'}
              {activeSection === 'messages' && 'Revise as solicitações de proposta recebidas do formulário de contato do site.'}
              {activeSection === 'users' && 'Visualize os clientes e administradores registrados na plataforma.'}
              {activeSection === 'settings' && 'Gerencie informações da loja, canais de atendimento e canais sociais.'}
              {activeSection === 'vehicle360' && 'Gerencie rotação de imagens 360° e marque os pontos de avarias para exibição pública.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeSection === 'vehicles' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleOpenModal(null)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Carro</span>
              </motion.button>
            )}
          </div>
        </header>

        {/* 1. SECTION: DASHBOARD VIEW */}
        {activeSection === 'dashboard' && (
          <div className="space-y-8">
            
            {/* KPI Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Total de Carros</span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalCars}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-50 text-emerald-600 p-3.5 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Carros Vendidos</span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    {stats.soldCount}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-blue-50 text-blue-600 p-3.5 rounded-xl">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Cliques WhatsApp</span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.whatsappCount}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="bg-amber-50 text-amber-600 p-3.5 rounded-xl">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Leads Pendentes</span>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.unreadLeads}</p>
                </div>
              </div>
            </div>

            {/* Dashboard Graphics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Side: Category bar stats */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-900">Estoque por Categoria</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Distribuição percentual dos veículos cadastrados.</p>
                  </div>
                  <Package className="w-5 h-5 text-slate-400" />
                </div>

                <div className="space-y-4 pt-2">
                  {categoryChartStats.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-700">{item.name} ({item.count})</span>
                        <span className="text-slate-900">{item.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percent}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className={`h-full rounded-full ${
                            idx === 0 ? 'bg-red-600' :
                            idx === 1 ? 'bg-slate-800' :
                            idx === 2 ? 'bg-slate-600' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Quick Action list */}
              <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-xl text-slate-900">Ações Administrativas Rápidas</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Utilize os botões abaixo para gerenciar instantaneamente seu inventário ou entrar no catálogo principal para ver as alterações.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5 pt-4">
                  <button
                    onClick={() => handleOpenModal(null)}
                    className="w-full p-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl flex items-center justify-between border border-red-100 transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="text-sm block">Cadastrar Novo Veículo</span>
                      <span className="text-[10px] text-red-500 font-medium">Adiciona imediatamente no estoque</span>
                    </div>
                    <Plus className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setActiveSection('vehicles')}
                    className="w-full p-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold rounded-2xl flex items-center justify-between border border-slate-100 transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="text-sm block">Editar Veículos Existentes</span>
                      <span className="text-[10px] text-slate-500 font-medium">Atualizar fotos, descrição e acessórios</span>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setActiveSection('messages')}
                    className="w-full p-4 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-2xl flex items-center justify-between shadow-sm transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <span className="text-sm block">Visualizar {stats.unreadLeads} Mensagens</span>
                      <span className="text-[10px] text-slate-300 font-medium">Contatar clientes interessados</span>
                    </div>
                    <MessageSquare className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SECTION: VEHICLES CRUD TABLE */}
        {activeSection === 'vehicles' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            
            {/* Table Header actions */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar veículo por marca, modelo, categoria..."
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Mostrando {filteredCars.length} de {cars.length} carros cadastrados
              </div>
            </div>

            {/* Main Vehicles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Veículo</th>
                    <th className="px-6 py-4">Ano/Quilometragem</th>
                    <th className="px-6 py-4">Categoria/Câmbio</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {filteredCars.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Nenhum veículo encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredCars.map((car) => (
                      <tr key={car.id} className="hover:bg-slate-50/50 transition-colors">
                        
                        {/* Img + Title */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={car.images[0]}
                              alt={car.model}
                              className="w-12 sm:w-16 aspect-video object-cover rounded-lg border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900">{car.brand} {car.model}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{car.version}</p>
                            </div>
                          </div>
                        </td>

                        {/* Year + KM */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{car.year}</span>
                            <span className="text-xs text-slate-400 mt-0.5">
                              {car.km === 0 ? 'Zero KM' : car.km.toLocaleString('pt-BR') + ' km'}
                            </span>
                          </div>
                        </td>

                        {/* Category + gearbox */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{car.category}</span>
                            <span className="text-xs text-slate-400 mt-0.5">{car.gearbox}</span>
                          </div>
                        </td>

                        {/* Sold or Available Status Toggle */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              onEditCar({ ...car, isSold: !car.isSold });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer transition-all ${
                              car.isSold
                                ? 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-slate-100 hover:text-slate-500'
                            }`}
                            title="Clique para alternar o status do veículo"
                          >
                            {car.isSold ? 'Vendido' : 'Disponível'}
                          </button>
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(car)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer"
                              title="Editar veículo"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Tem certeza que deseja remover o veículo ${car.brand} ${car.model}?`)) {
                                  if (confirm('Deseja excluir também o projeto de visualização 360° (imagens e marcadores) associado a este veículo?')) {
                                    try {
                                      const { vehicle360Service } = await import('../services/vehicle360.service');
                                      await vehicle360Service.delete360Project(car.id);
                                    } catch (err) {
                                      console.warn('Error deleting 360 project during vehicle deletion:', err);
                                    }
                                  }
                                  onDeleteCar(car.id);
                                }
                              }}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer"
                              title="Excluir veículo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. SECTION: LEADS / MESSAGES LIST */}
        {activeSection === 'messages' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar leads por nome, email, mensagem ou modelo..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 transition-all"
                />
              </div>

              <div className="text-xs text-slate-400 font-medium">
                {messages.length} leads recebidos
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredMessages.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  Nenhum lead ou mensagem recebida ainda. Envie propostas na página de detalhes de um veículo para ver as mensagens aparecerem aqui em tempo real.
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div key={msg.id} className="p-6 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3 max-w-3xl">
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">{msg.name}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-500">
                          Interessado no: <span className="text-red-600 font-bold">{msg.carTitle}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          {new Date(msg.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        "{msg.message}"
                      </p>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>WhatsApp: {msg.phone}</span>
                        </span>
                        {msg.email && (
                          <span className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                            <span>E-mail: {msg.email}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0">
                      
                      {/* Status select/dropdown badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Status:</span>
                        <select
                          value={msg.status}
                          onChange={(e) => onUpdateMessageStatus(msg.id, e.target.value as LeadMessage['status'])}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border-0 focus:ring-1 focus:ring-red-600 cursor-pointer ${
                            msg.status === 'Pendente' ? 'bg-amber-50 text-amber-700' :
                            msg.status === 'Respondido' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Respondido">Respondido</option>
                          <option value="Arquivado">Arquivado</option>
                        </select>
                      </div>

                      {/* Quick CTA to respond */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingLead(msg)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Visualizar detalhes completas do Lead"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                        <a
                          href={`https://wa.me/${msg.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${msg.name}, sou o consultor da Dourado Veículos. Vi que você deixou uma proposta no nosso site pelo ${msg.carTitle}. Vamos negociar?`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Phone className="w-3 h-3 fill-current" />
                          <span>WhatsApp</span>
                        </a>
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir permanentemente este contato?')) {
                              onDeleteMessage(msg.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Excluir mensagem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3.1. SECTION: QUOTES (SOLICITAÇÕES DE ORÇAMENTO) */}
        {activeSection === 'quotes' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar orçamentos por nome, e-mail, cidade ou modelo..."
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 transition-all"
                />
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {quotesList.length} orçamentos solicitados
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {quotesList.filter(q => {
                const term = quoteSearch.toLowerCase();
                return q.name.toLowerCase().includes(term) ||
                  q.email.toLowerCase().includes(term) ||
                  q.city.toLowerCase().includes(term) ||
                  q.vehicleTitle.toLowerCase().includes(term);
              }).length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  Nenhuma solicitação de orçamento encontrada.
                </div>
              ) : (
                quotesList.filter(q => {
                  const term = quoteSearch.toLowerCase();
                  return q.name.toLowerCase().includes(term) ||
                    q.email.toLowerCase().includes(term) ||
                    q.city.toLowerCase().includes(term) ||
                    q.vehicleTitle.toLowerCase().includes(term);
                }).map((q) => (
                  <div key={q.id} className="p-6 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">{q.name}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-500">
                          Carro de interesse: <span className="text-red-600 font-bold">{q.vehicleTitle}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          {new Date(q.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>WhatsApp: {q.phone}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>E-mail: {q.email}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>Cidade: {q.city}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Status:</span>
                        <select
                          value={q.status}
                          onChange={(e) => handleUpdateQuoteStatus(q.id, e.target.value as Quote['status'])}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border-0 focus:ring-1 focus:ring-red-600 cursor-pointer ${
                            q.status === 'Pendente' ? 'bg-amber-50 text-amber-700' :
                            q.status === 'Respondido' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Respondido">Respondido</option>
                          <option value="Arquivado">Arquivado</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${q.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${q.name}, sou o consultor da Dourado Veículos. Vi que você solicitou um orçamento pelo site para o veículo ${q.vehicleTitle}. Vamos conversar?`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Phone className="w-3 h-3 fill-current" />
                          <span>Atender WhatsApp</span>
                        </a>
                        <button
                          onClick={() => handleDeleteQuote(q.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Excluir orçamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3.2. SECTION: USERS (GERENCIAMENTO DE USUÁRIOS) */}
        {activeSection === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar usuários por nome, e-mail ou cidade..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-600 transition-all"
                />
              </div>
              <div className="text-xs text-slate-400 font-medium">
                {usersList.length} usuários cadastrados
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Contato</th>
                    <th className="px-6 py-4">Localização</th>
                    <th className="px-6 py-4">Perfil / Permissão</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {usersList.filter(u => {
                    const term = userSearch.toLowerCase();
                    return (u.name || '').toLowerCase().includes(term) ||
                      u.email.toLowerCase().includes(term) ||
                      (u.city || '').toLowerCase().includes(term);
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    usersList.filter(u => {
                      const term = userSearch.toLowerCase();
                      return (u.name || '').toLowerCase().includes(term) ||
                        u.email.toLowerCase().includes(term) ||
                        (u.city || '').toLowerCase().includes(term);
                    }).map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 font-bold flex items-center justify-center">
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{u.name || 'Usuário Anônimo'}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                          {u.phone || 'Nenhum WhatsApp informado'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                          {u.city || 'São Paulo - SP'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {u.role === 'admin' ? 'Administrador' : 'Cliente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                            u.isActive !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-red-50 text-red-700 border border-red-100'
                          }`}>
                            {u.isActive !== false ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setEditUserName(u.name || '');
                                setEditUserEmail(u.email);
                                setEditUserPhone(u.phone || '');
                                setEditUserCity(u.city || '');
                                setEditUserRole(u.role);
                                setEditUserIsActive(u.isActive !== false);
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                              title="Editar permissões do usuário"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja realmente remover o usuário ${u.name || u.email}?`)) {
                                  setUsersList(prev => prev.filter(item => item.id !== u.id));
                                }
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Remover usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3.3. SECTION: SETTINGS (CONFIGURAÇÕES DA CONCESSIONÁRIA) */}
        {activeSection === 'settings' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-extrabold text-xl text-slate-900">Configurações Gerais</h3>
              <p className="text-xs text-slate-400 mt-1">Gerencie as informações institucionais, telefones, redes sociais e endereço exibidos na página pública.</p>
            </div>

            {settingsSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Configurações atualizadas com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSettingsSave} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nome da Loja</label>
                <input
                  type="text"
                  required
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Telefone Fixo</label>
                  <input
                    type="text"
                    required
                    value={settingsPhone}
                    onChange={(e) => setSettingsPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">WhatsApp de Atendimento</label>
                  <input
                    type="text"
                    required
                    value={settingsWhatsapp}
                    onChange={(e) => setSettingsWhatsapp(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Endereço da Loja</label>
                <input
                  type="text"
                  required
                  value={settingsAddress}
                  onChange={(e) => setSettingsAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Horário de Funcionamento</label>
                <input
                  type="text"
                  required
                  value={settingsHours}
                  onChange={(e) => setSettingsHours(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-6 py-3 bg-slate-900 hover:bg-red-600 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {settingsLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3.4. SECTION: VEHICLE 360° */}
        {activeSection === 'vehicle360' && (
          <Admin360Module cars={cars} />
        )}

      </main>

      {/* 4. MODAL: CREATE / EDIT VEHICLE DIALOG */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-100"
            >
              
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-extrabold text-xl text-slate-900">
                    {editingCar ? 'Editar Especificações do Carro' : 'Cadastrar Novo Carro no Estoque'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Preencha as informações do formulário para disponibilizar o anúncio.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Sub-Tabs Navigation */}
              <div className="flex border-b border-slate-100 px-6 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setModalTab('specs')}
                  className={`px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    modalTab === 'specs' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ficha Técnica & Opcionais
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('media')}
                  className={`px-4 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    modalTab === 'media' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mídias do Veículo
                </button>
              </div>

              {/* Modal scrollable body form */}
              <form onSubmit={handleSaveCar} className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                
                {modalTab === 'specs' ? (
                  <>
                    {/* Visual Section: Brand details */}
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase font-extrabold text-red-600 tracking-wider border-b border-slate-100 pb-2">
                        Informações de Identificação
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Marca</label>
                          <input
                            type="text"
                            required
                            value={formBrand}
                            onChange={(e) => setFormBrand(e.target.value)}
                            placeholder="Ex: Chevrolet, Toyota, BMW"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Modelo</label>
                          <input
                            type="text"
                            required
                            value={formModel}
                            onChange={(e) => setFormModel(e.target.value)}
                            placeholder="Ex: Onix, Corolla, 320i"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Versão / Motor</label>
                          <input
                            type="text"
                            required
                            value={formVersion}
                            onChange={(e) => setFormVersion(e.target.value)}
                            placeholder="Ex: 1.0 Turbo Premier AT, 2.0 XEi CVT"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Technical Specifications */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs uppercase font-extrabold text-red-600 tracking-wider border-b border-slate-100 pb-2">
                        Ficha Técnica do Veículo
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Ano Fabricação</label>
                          <select
                            value={formYearFabricacao}
                            onChange={(e) => setFormYearFabricacao(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600 cursor-pointer"
                          >
                            {Array.from({ length: 20 }, (_, i) => 2010 + i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Ano Modelo</label>
                          <select
                            value={formYearModelo}
                            onChange={(e) => setFormYearModelo(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600 cursor-pointer"
                          >
                            {Array.from({ length: 20 }, (_, i) => 2010 + i).map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Quilometragem (KM)</label>
                          <input
                            type="number"
                            required
                            value={formKm}
                            onChange={(e) => setFormKm(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Ex: 12450 (use 0 se for novo)"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Categoria</label>
                          <select
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value as CarCategory)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          >
                            <option value="Hatch">Hatch</option>
                            <option value="SUV">SUV</option>
                            <option value="Sedan">Sedan</option>
                            <option value="Picape">Picape</option>
                            <option value="Utilitário">Utilitário</option>
                            <option value="Popular">Popular</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Câmbio</label>
                          <select
                            value={formGearbox}
                            onChange={(e) => setFormGearbox(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          >
                            <option value="Automático">Automático</option>
                            <option value="Manual">Manual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Combustível</label>
                          <select
                            value={formFuel}
                            onChange={(e) => setFormFuel(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          >
                            <option value="Flex">Flex</option>
                            <option value="Gasolina">Gasolina</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Híbrido">Híbrido</option>
                            <option value="Elétrico">Elétrico</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Cor</label>
                          <input
                            type="text"
                            value={formColor}
                            onChange={(e) => setFormColor(e.target.value)}
                            placeholder="Ex: Branco Summit, Prata"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Final da Placa</label>
                          <input
                            type="text"
                            maxLength={1}
                            value={formPlateEnd}
                            onChange={(e) => setFormPlateEnd(e.target.value)}
                            placeholder="Ex: 5"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description & Opcionais */}
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                          <span>Opcionais e Itens de Série</span>
                          <span className="text-[10px] text-slate-400">Clique para remover ou digite e pressione Enter para adicionar</span>
                        </label>
                        
                        {/* Tags container */}
                        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[50px]">
                          {formFeaturesText.split(',')
                            .map(f => f.trim())
                            .filter(f => f.length > 0)
                            .map((feature, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 transition-colors hover:bg-red-100 cursor-pointer"
                                onClick={() => {
                                  const remaining = formFeaturesText.split(',')
                                    .map(f => f.trim())
                                    .filter((_, i) => i !== idx);
                                  setFormFeaturesText(remaining.join(', '));
                                }}
                                title="Remover opcional"
                              >
                                <span>{feature}</span>
                                <X className="w-3 h-3 text-red-500 hover:text-red-700" />
                              </span>
                            ))}
                          {formFeaturesText.split(',').map(f => f.trim()).filter(f => f.length > 0).length === 0 && (
                            <span className="text-xs text-slate-400 italic">Nenhum opcional cadastrado ainda.</span>
                          )}
                        </div>

                        {/* Quick Add input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Ex: Teto Solar Elétrico (pressione Enter)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (val) {
                                  const current = formFeaturesText.split(',').map(f => f.trim()).filter(f => f.length > 0);
                                  if (!current.includes(val)) {
                                    setFormFeaturesText([...current, val].join(', '));
                                  }
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              const val = input.value.trim();
                              if (val) {
                                const current = formFeaturesText.split(',').map(f => f.trim()).filter(f => f.length > 0);
                                if (!current.includes(val)) {
                                  setFormFeaturesText([...current, val].join(', '));
                                }
                                input.value = '';
                              }
                            }}
                            className="px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                          >
                            + Adicionar
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Descrição Comercial</label>
                        <textarea
                          rows={3}
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="Descreva detalhes como: único dono, revisões em concessionária, histórico de sinistro ou retoques..."
                          className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-red-600 resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Promotion / Features Flags */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs uppercase font-extrabold text-red-600 tracking-wider border-b border-slate-100 pb-2">
                        Status e Visibilidade no Site
                      </h4>
                      <div className="flex flex-wrap gap-6 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium">
                          <input
                            type="checkbox"
                            checked={formIsFeatured}
                            onChange={(e) => setFormIsFeatured(e.target.checked)}
                            className="rounded text-red-600 focus:ring-red-600 border-slate-300 w-4.5 h-4.5"
                          />
                          <span>Destacar Veículo no Carrossel</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium">
                          <input
                            type="checkbox"
                            checked={formIsPromo}
                            onChange={(e) => setFormIsPromo(e.target.checked)}
                            className="rounded text-red-600 focus:ring-red-600 border-slate-300 w-4.5 h-4.5"
                          />
                          <span>Sinalizar Oferta Especial / Promoção</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-medium">
                          <input
                            type="checkbox"
                            checked={formIsSold}
                            onChange={(e) => setFormIsSold(e.target.checked)}
                            className="rounded text-red-600 focus:ring-red-600 border-slate-300 w-4.5 h-4.5"
                          />
                          <span>Marcar como Vendido / Reservado</span>
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  /* TAB: MÍDIAS DO VEÍCULO */
                  <div className="space-y-8">
                    
                    {/* Header Informational Alert */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                      <ImageIcon className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="text-sm font-bold text-slate-800">Sincronização Ativa</h5>
                        <p className="text-xs text-slate-500 mt-1">
                          Todas as alterações de mídias feitas nesta aba são enviadas ao Supabase Storage e salvas no banco imediatamente. As atualizações aparecem instantaneamente na página pública.
                        </p>
                      </div>
                    </div>

                    {mediaLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-red-600 animate-spin mb-3" />
                        <span className="text-xs font-bold text-slate-500">Sincronizando mídias com o Supabase...</span>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        
                        {/* 1. FOTO DE CAPA */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">1. Foto de Capa</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Utilizada nos cards, destaques e resultados de pesquisa.</p>
                            </div>
                            {mediaCover && (
                              <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-lg uppercase">Definido</span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-5 items-center">
                            {mediaCover ? (
                              <div className="relative w-full sm:w-64 aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                                <img src={mediaCover} alt="Capa" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <label className="p-2 bg-white/90 text-slate-800 hover:bg-white rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105">
                                    <Upload className="w-4 h-4" />
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden" 
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            const activeId = editingCar ? editingCar.id : newCarId;
                                            setMediaLoading(true);
                                            const url = await vehicleMediaService.uploadFile(activeId, file, 'cover');
                                            setMediaCover(url);
                                            await vehicleMediaService.saveCover(activeId, url);
                                            setFormImagesText(prev => {
                                              const list = prev.split('\n').filter(u => u.trim().length > 0);
                                              if (list.length > 0) {
                                                list[0] = url;
                                                return list.join('\n');
                                              }
                                              return url;
                                            });
                                          } catch (err) {
                                            console.error(err);
                                          } finally {
                                            setMediaLoading(false);
                                          }
                                        }
                                      }}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm('Deseja realmente remover a foto de capa?')) {
                                        const activeId = editingCar ? editingCar.id : newCarId;
                                        setMediaCover(null);
                                        await vehicleMediaService.saveCover(activeId, '');
                                      }
                                    }}
                                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="w-full sm:w-64 border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-red-600 transition-all bg-slate-50 hover:bg-red-50/10">
                                <Upload className="w-6 h-6 mb-1.5" />
                                <span className="text-xs font-bold">Enviar Foto de Capa</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const activeId = editingCar ? editingCar.id : newCarId;
                                        setMediaLoading(true);
                                        const url = await vehicleMediaService.uploadFile(activeId, file, 'cover');
                                        setMediaCover(url);
                                        await vehicleMediaService.saveCover(activeId, url);
                                        setFormImagesText(prev => {
                                          const list = prev.split('\n').filter(u => u.trim().length > 0);
                                          if (list.length > 0) {
                                            list[0] = url;
                                            return list.join('\n');
                                          }
                                          return url;
                                        });
                                      } catch (err) {
                                        console.error(err);
                                      } finally {
                                        setMediaLoading(false);
                                      }
                                    }
                                  }}
                                />
                              </label>
                            )}

                            <div className="flex-1 space-y-2 text-center sm:text-left">
                              <h5 className="font-bold text-xs text-slate-700 uppercase">Instruções da Capa</h5>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Formatos aceitos: JPG, PNG, WEBP. Recomendamos tamanho retangular (ex: 1200x675) com veículo centrado. Esta foto representa a identidade principal do anúncio.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 2. GALERIA DE FOTOS */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">2. Galeria de Fotos</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Arraste para reordenar, adicione múltiplas fotos ou mude o destaque.</p>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-lg">
                              {mediaGallery.length} Fotos
                            </span>
                          </div>

                          {/* Upload Area with Drag & Drop */}
                          <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async (e) => {
                              e.preventDefault();
                              const files = Array.from(e.dataTransfer.files || []) as File[];
                              if (files.length > 0) {
                                const activeId = editingCar ? editingCar.id : newCarId;
                                setMediaLoading(true);
                                const uploadedUrls: string[] = [];
                                for (const file of files) {
                                  if (file.type.startsWith('image/')) {
                                    const url = await vehicleMediaService.uploadFile(activeId, file, 'gallery');
                                    uploadedUrls.push(url);
                                  }
                                }
                                const updated = [...mediaGallery, ...uploadedUrls];
                                setMediaGallery(updated);
                                await vehicleMediaService.saveGallery(activeId, updated);
                                setFormImagesText(prev => {
                                  const list = prev.split('\n').filter(u => u.trim().length > 0);
                                  return [mediaCover || list[0] || '', ...updated].filter(Boolean).join('\n');
                                });
                                setMediaLoading(false);
                              }
                            }}
                            className="border-2 border-dashed border-slate-200 hover:border-red-500 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-sm font-bold text-slate-700">Arraste suas fotos aqui ou clique para selecionar</p>
                            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG ou WEBP (Upload Múltiplo suportado)</p>
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              className="hidden" 
                              id="gallery-input"
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []) as File[];
                                if (files.length > 0) {
                                  const activeId = editingCar ? editingCar.id : newCarId;
                                  setMediaLoading(true);
                                  const uploadedUrls: string[] = [];
                                  for (const file of files) {
                                    try {
                                      const url = await vehicleMediaService.uploadFile(activeId, file, 'gallery');
                                      uploadedUrls.push(url);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }
                                  const updated = [...mediaGallery, ...uploadedUrls];
                                  setMediaGallery(updated);
                                  await vehicleMediaService.saveGallery(activeId, updated);
                                  setFormImagesText(prev => {
                                    const list = prev.split('\n').filter(u => u.trim().length > 0);
                                    return [mediaCover || list[0] || '', ...updated].filter(Boolean).join('\n');
                                  });
                                }
                                setMediaLoading(false);
                              }}
                            />
                            <label htmlFor="gallery-input" className="mt-3 px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer">
                              Selecionar Arquivos
                            </label>
                          </div>

                          {/* Gallery Grid Reordering and Actions */}
                          {mediaGallery.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                              {mediaGallery.map((url, idx) => (
                                <div 
                                  key={idx}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', idx.toString());
                                  }}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={async (e) => {
                                    e.preventDefault();
                                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                                    if (!isNaN(fromIdx) && fromIdx !== idx) {
                                      const updated = [...mediaGallery];
                                      const [moved] = updated.splice(fromIdx, 1);
                                      updated.splice(idx, 0, moved);
                                      setMediaGallery(updated);
                                      const activeId = editingCar ? editingCar.id : newCarId;
                                      await vehicleMediaService.saveGallery(activeId, updated);
                                    }
                                  }}
                                  className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group shadow-xs cursor-grab active:cursor-grabbing"
                                >
                                  <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  
                                  {/* Order indicator */}
                                  <div className="absolute top-2 left-2 bg-slate-900/80 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                                    {idx + 1}
                                  </div>

                                  {/* Item Actions */}
                                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                    <div className="flex justify-between items-center">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const activeId = editingCar ? editingCar.id : newCarId;
                                          setMediaCover(url);
                                          await vehicleMediaService.saveCover(activeId, url);
                                        }}
                                        className="bg-white/95 text-slate-800 hover:bg-white text-[9px] font-black px-1.5 py-1 rounded-md shadow-xs flex items-center gap-0.5 cursor-pointer"
                                        title="Definir como foto de capa principal"
                                      >
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Destacar</span>
                                      </button>
                                      
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (confirm('Deseja remover esta imagem da galeria?')) {
                                            const activeId = editingCar ? editingCar.id : newCarId;
                                            const updated = mediaGallery.filter((_, i) => i !== idx);
                                            setMediaGallery(updated);
                                            await vehicleMediaService.saveGallery(activeId, updated);
                                          }
                                        }}
                                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Manual Shift buttons for easy mobile access */}
                                    <div className="flex justify-center gap-1.5">
                                      <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={async () => {
                                          if (idx > 0) {
                                            const activeId = editingCar ? editingCar.id : newCarId;
                                            const updated = [...mediaGallery];
                                            const temp = updated[idx];
                                            updated[idx] = updated[idx - 1];
                                            updated[idx - 1] = temp;
                                            setMediaGallery(updated);
                                            await vehicleMediaService.saveGallery(activeId, updated);
                                          }
                                        }}
                                        className="p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-md disabled:opacity-40 cursor-pointer text-[10px]"
                                      >
                                        ◀
                                      </button>
                                      <button
                                        type="button"
                                        disabled={idx === mediaGallery.length - 1}
                                        onClick={async () => {
                                          if (idx < mediaGallery.length - 1) {
                                            const activeId = editingCar ? editingCar.id : newCarId;
                                            const updated = [...mediaGallery];
                                            const temp = updated[idx];
                                            updated[idx] = updated[idx + 1];
                                            updated[idx + 1] = temp;
                                            setMediaGallery(updated);
                                            await vehicleMediaService.saveGallery(activeId, updated);
                                          }
                                        }}
                                        className="p-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-md disabled:opacity-40 cursor-pointer text-[10px]"
                                      >
                                        ▶
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 border border-slate-100 rounded-xl">
                              Nenhuma foto adicionada na galeria ainda.
                            </p>
                          )}
                        </div>

                        {/* 3. VÍDEOS */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">3. Vídeo do Veículo</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Faça upload de vídeo ou adicione um link direto do YouTube.</p>
                            </div>
                          </div>

                          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit mb-2">
                            <button
                              type="button"
                              onClick={() => setMediaVideoProvider('youtube')}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mediaVideoProvider === 'youtube' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              YouTube Link
                            </button>
                            <button
                              type="button"
                              onClick={() => setMediaVideoProvider('upload')}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                mediaVideoProvider === 'upload' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Fazer Upload (MP4)
                            </button>
                          </div>

                          {mediaVideoProvider === 'youtube' ? (
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">URL do Vídeo do YouTube</label>
                                <input 
                                  type="text"
                                  value={mediaVideoUrl}
                                  onChange={async (e) => {
                                    const url = e.target.value;
                                    setMediaVideoUrl(url);
                                    const activeId = editingCar ? editingCar.id : newCarId;
                                    await vehicleMediaService.saveVideo(activeId, url, 'youtube');
                                  }}
                                  placeholder="Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                                />
                              </div>
                              {mediaVideoUrl && (
                                <div className="aspect-video max-w-sm rounded-xl overflow-hidden border border-slate-200">
                                  <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${mediaVideoUrl.includes('v=') ? mediaVideoUrl.split('v=')[1]?.split('&')[0] : mediaVideoUrl.split('/').pop()}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  ></iframe>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3.5">
                              <div className="border-2 border-dashed border-slate-200 hover:border-red-500 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 transition-colors cursor-pointer">
                                <Upload className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
                                <p className="text-sm font-bold text-slate-700">Fazer upload de arquivo de vídeo</p>
                                <p className="text-[10px] text-slate-400 mt-1">MP4, WEBM ou OGG (Max 20MB)</p>
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  className="hidden" 
                                  id="video-upload-input"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const activeId = editingCar ? editingCar.id : newCarId;
                                        setMediaLoading(true);
                                        const url = await vehicleMediaService.uploadFile(activeId, file, 'videos');
                                        setMediaVideoUrl(url);
                                        await vehicleMediaService.saveVideo(activeId, url, 'upload');
                                      } catch (err) {
                                        console.error(err);
                                      } finally {
                                        setMediaLoading(false);
                                      }
                                    }
                                  }}
                                />
                                <label htmlFor="video-upload-input" className="mt-3 px-4 py-1.5 bg-slate-950 text-white hover:bg-slate-900 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer">
                                  Selecionar Vídeo
                                </label>
                              </div>

                              {mediaVideoUrl && mediaVideoUrl.startsWith('http') && (
                                <div className="space-y-2">
                                  <span className="text-xs font-bold text-slate-700 block">Vídeo Enviado:</span>
                                  <video controls className="aspect-video max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-black">
                                    <source src={mediaVideoUrl} type="video/mp4" />
                                    Seu navegador não suporta vídeos.
                                  </video>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const activeId = editingCar ? editingCar.id : newCarId;
                                      setMediaVideoUrl('');
                                      await vehicleMediaService.saveVideo(activeId, '', 'upload');
                                    }}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                                  >
                                    Excluir Vídeo
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 4. VISUALIZAÇÃO 360° */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">4. Visualização Interativa 360°</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">Adicione a sequência ordenada de imagens (ex: 36 fotos sequenciais).</p>
                            </div>
                            <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2.5 py-1 rounded-lg">
                              {media360.length} Frames
                            </span>
                          </div>

                          <div className="border-2 border-dashed border-slate-200 hover:border-red-500 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                            <p className="text-sm font-bold text-slate-700">Upload Múltiplo de Imagens 360°</p>
                            <p className="text-[10px] text-slate-400 mt-1">Envie arquivos ordenados como: 001.webp, 002.webp, 003.webp...</p>
                            <input 
                              type="file" 
                              multiple 
                              accept="image/*" 
                              className="hidden" 
                              id="360-upload-input"
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []) as File[];
                                if (files.length > 0) {
                                  const activeId = editingCar ? editingCar.id : newCarId;
                                  setMediaLoading(true);
                                  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
                                  const uploadedUrls: string[] = [];
                                  for (const file of files) {
                                    try {
                                      const url = await vehicleMediaService.uploadFile(activeId, file, '360');
                                      uploadedUrls.push(url);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }
                                  const updated = [...media360, ...uploadedUrls];
                                  setMedia360(updated);
                                  await vehicleMediaService.save360Frames(activeId, updated);
                                }
                                setMediaLoading(false);
                              }}
                            />
                            <label htmlFor="360-upload-input" className="mt-3 px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer">
                              Enviar Frames do 360°
                            </label>
                          </div>

                          {media360.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-700">Sequência do 360° Ativa</span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('Deseja realmente limpar toda a sequência 360° deste veículo?')) {
                                      const activeId = editingCar ? editingCar.id : newCarId;
                                      setMedia360([]);
                                      await vehicleMediaService.save360Frames(activeId, []);
                                    }
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700 font-bold cursor-pointer"
                                >
                                  Limpar Sequência
                                </button>
                              </div>

                              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                                {media360.map((url, idx) => (
                                  <div key={idx} className="relative w-16 aspect-video rounded-lg overflow-hidden border border-slate-200 shrink-0">
                                    <img src={url} alt={`Frame ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-black text-white text-center py-0.5">
                                      #{idx + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 border border-slate-100 rounded-xl">
                              Nenhum frame 360° enviado ainda para este veículo.
                            </p>
                          )}
                        </div>

                      </div>
                    )}

                  </div>
                )}

              </form>

              {/* Modal footer actions */}
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCar}
                  className="px-8 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  {editingCar ? 'Salvar Alterações' : 'Publicar Anúncio'}
                </button>
              </div>

            </motion.div>
          </div>
        )}

        {/* VIEW LEAD DETAILS MODAL */}
        {viewingLead && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg border border-slate-100 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-600 text-white">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  <h3 className="font-extrabold text-lg">Detalhes do Lead</h3>
                </div>
                <button
                  onClick={() => setViewingLead(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase">Cliente</span>
                  <span className="text-base font-black text-slate-900">{viewingLead.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase">Telefone</span>
                    <span className="text-sm font-bold text-slate-800">{viewingLead.phone}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-400 uppercase">E-mail</span>
                    <span className="text-sm font-bold text-slate-800">{viewingLead.email || 'Não informado'}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Interessado no veículo</span>
                  <div className="p-3 bg-red-50 text-red-900 font-extrabold text-sm rounded-xl border border-red-100/50">
                    {viewingLead.carTitle}
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Mensagem de Proposta</span>
                  <div className="p-4 bg-slate-50 text-slate-700 text-sm rounded-xl border border-slate-100 font-medium leading-relaxed">
                    "{viewingLead.message}"
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                  <span>Recebido em: {new Date(viewingLead.createdAt).toLocaleString('pt-BR')}</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${viewingLead.status === 'Pendente' ? 'bg-amber-500' : viewingLead.status === 'Respondido' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                    <span className="font-bold uppercase tracking-wider">{viewingLead.status}</span>
                  </span>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewingLead(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <a
                  href={`https://wa.me/${viewingLead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${viewingLead.name}, sou o consultor da Dourado Veículos. Vi que você deixou uma proposta no nosso site pelo ${viewingLead.carTitle}. Vamos conversar?`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>Responder no WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}

        {/* EDIT USER PROFILE MODAL */}
        {editingUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md border border-slate-100 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-red-600 text-white">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  <h3 className="font-extrabold text-lg">Editar Usuário</h3>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600 bg-slate-50"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cidade / Estado</label>
                  <input
                    type="text"
                    value={editUserCity}
                    onChange={(e) => setEditUserCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Permissão</label>
                    <select
                      value={editUserRole}
                      onChange={(e) => setEditUserRole(e.target.value as 'admin' | 'client')}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600 cursor-pointer"
                    >
                      <option value="client">Cliente Comum</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Status da Conta</label>
                    <select
                      value={editUserIsActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditUserIsActive(e.target.value === 'active')}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-600 cursor-pointer"
                    >
                      <option value="active">Ativo / Autorizado</option>
                      <option value="inactive">Inativo / Bloqueado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const updatedUser = {
                        ...editingUser,
                        name: editUserName,
                        phone: editUserPhone,
                        city: editUserCity,
                        role: editUserRole,
                        isActive: editUserIsActive,
                      };
                      // Save profile to Firestore/Supa
                      const { error } = await supabase
                        .from('profiles')
                        .update({
                          name: editUserName,
                          phone: editUserPhone,
                          city: editUserCity,
                          role: editUserRole,
                          is_active: editUserIsActive,
                        })
                        .eq('id', editingUser.id);

                      // Update local states
                      setUsersList(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
                      setEditingUser(null);
                    } catch (err) {
                      console.error('Error saving user profile:', err);
                      alert('Erro ao salvar as informações do usuário.');
                    }
                  }}
                  className="px-7 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
