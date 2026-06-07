import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { playCoinSound, playSuccessSound, playLevelUpSound, playBuzzerSound } from '../utils/sound';
import confetti from 'canvas-confetti';
import { io } from 'socket.io-client';
import { 
  Award, Flame, Sparkles, LogOut, Store, Bell, CheckCircle2, 
  AlertCircle, Trophy, Target, ClipboardList, PiggyBank, 
  Coins, ArrowRight, BookOpen, Home, Activity, Heart, Shield,
  ChevronRight, ChevronLeft, Calendar, ShoppingBag, Plus, Lock, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SofiaDashboard() {
  const { user, logout, refreshUser } = { ...useAuth() };

  // Helpers de Data para Agenda
  const getSundayOfCurrentWeek = (date = new Date()) => {
    const today = new Date(date);
    const day = today.getDay(); // 0: Dom, 1: Seg, etc.
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - day);
    return sunday;
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const getMonthName = (date) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} de ${date.getFullYear()}`;
  };

  const getWeekdayName = (date) => {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return weekdays[date.getDay()];
  };

  // Agenda / Calendário States
  const [taskViewMode, setTaskViewMode] = useState('weekly'); // 'weekly', 'monthly', 'all'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getSundayOfCurrentWeek());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonthDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonthDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonthDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonthDate(newDate);
  };

  const getDayStatusDots = (day) => {
    const dayFiltered = tasks.filter(task => {
      if (task.isDaily) {
        return (task.status === 'APPROVED' && isSameDay(task.approvedAt, day)) ||
               (task.status !== 'APPROVED' && isSameDay(selectedDate, day));
      }
      if (task.deadline) {
        return isSameDay(task.deadline, day);
      }
      return isSameDay(task.createdAt, day);
    });
    
    const hasApproved = dayFiltered.some(t => t.status === 'APPROVED');
    const hasCompleted = dayFiltered.some(t => t.status === 'COMPLETED');
    const hasRejected = dayFiltered.some(t => t.status === 'REJECTED');
    const hasPending = dayFiltered.some(t => t.status === 'PENDING');
    
    return { hasApproved, hasCompleted, hasRejected, hasPending };
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
    setSelectedDate(newDate);
  };

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Bottom Navigation tabs: 'tasks', 'goals', 'shop', 'medals'
  const [activeTab, setActiveTab] = useState('tasks');
  
  // App states
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [shopItems, setShopItems] = useState([]);
  const [activeShopCategory, setActiveShopCategory] = useState('ALL');
  
  // Animations and modals
  const [piggyShaking, setPiggyShaking] = useState(false);
  const [depositGoal, setDepositGoal] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Create Goal States for child
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState('REAL_MONEY');
  const [goalTargetCoins, setGoalTargetCoins] = useState(100);
  const [goalTargetReal, setGoalTargetReal] = useState(50.00);

  // Load dashboard and shop data
  const loadData = async () => {
    try {
      const tasksRes = await api.get('/tasks');
      setTasks(tasksRes.data);
      
      const goalsRes = await api.get('/goals');
      setGoals(goalsRes.data);

      const notifRes = await api.get('/notifications');
      setNotifications(notifRes.data);

      const shopRes = await api.get('/shop');
      setShopItems(shopRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  useEffect(() => {
    loadData();
    refreshUser();
  }, []);

  // WebSockets Connection
  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api', '') 
      : 'http://localhost:5001';
    const socket = io(socketUrl);

    socket.emit('register', user.id);

    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      loadData();
    });

    socket.on('task_approved', () => {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      playCoinSound();
      setPiggyShaking(true);
      setTimeout(() => setPiggyShaking(false), 800);
      loadData();
      refreshUser();
    });

    socket.on('level_up', (data) => {
      playLevelUpSound();
      setLevelUpModal(data);
      const end = Date.now() + (3 * 1000);
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        confetti({
          startVelocity: 30,
          spread: 360,
          origin: { x: Math.random(), y: Math.random() - 0.2 }
        });
      }, 200);
      refreshUser();
    });

    socket.on('achievement_unlocked', () => {
      playLevelUpSound();
      confetti({ particleCount: 80, spread: 60 });
      refreshUser();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Actions: Complete Task
  const handleCompleteTask = async (taskId) => {
    // Optimistic UI Update: immediately mark task as completed locally for sub-10ms response time
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'COMPLETED', completedAt: new Date().toISOString() } : t));
    
    // Play sound and throw confetti instantly for maximum gamified excitement!
    playSuccessSound();
    confetti({ particleCount: 40, spread: 40, origin: { y: 0.8 } });

    try {
      await api.post(`/tasks/${taskId}/complete`);
      loadData();
    } catch (err) {
      playBuzzerSound();
      setTasks(originalTasks);
      console.error(err);
    }
  };

  // Actions: Deposit Savings
  const handleDepositToGoal = async (e) => {
    e.preventDefault();
    if (!depositGoal || !depositAmount || parseFloat(depositAmount) <= 0) return;

    try {
      setLoading(true);
      await api.post(`/goals/${depositGoal.id}/deposit`, { amount: depositAmount });
      playCoinSound();
      confetti({ particleCount: 50, spread: 50 });
      setPiggyShaking(true);
      setTimeout(() => setPiggyShaking(false), 800);
      
      setDepositGoal(null);
      setDepositAmount('');
      loadData();
      refreshUser();
    } catch (err) {
      playBuzzerSound();
      alert(err.response?.data?.error || 'Erro ao depositar.');
    } finally {
      setLoading(false);
    }
  };

  // Actions: Create Goal
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await api.post('/goals', {
        title: goalTitle,
        type: goalType,
        targetCoins: goalType === 'COINS' ? goalTargetCoins : 0,
        targetReal: goalType === 'REAL_MONEY' ? goalTargetReal : 0,
      });

      setSuccessMsg('Novo sonho cadastrado com sucesso!');
      setGoalTitle('');
      setShowCreateGoal(false);
      loadData();
    } catch (err) {
      playBuzzerSound();
      setErrorMsg(err.response?.data?.error || 'Erro ao criar meta.');
    } finally {
      setLoading(false);
    }
  };

  // Actions: Shop Purchase
  const handlePurchaseItem = async (item) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/shop/purchase/${item.id}`);
      playCoinSound();
      confetti({ particleCount: 60, spread: 50 });
      setSuccessMsg(res.data.message);
      
      // Auto-equip purchased item
      await handleEquipItem(item.category, item.assetKey);
      loadData();
    } catch (err) {
      playBuzzerSound();
      setErrorMsg(err.response?.data?.error || 'Erro ao comprar item.');
    }
  };

  // Actions: Equip Shop Item
  const handleEquipItem = async (category, assetKey) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post('/shop/equip', { category, assetKey });
      playSuccessSound();
      await refreshUser();
    } catch (err) {
      playBuzzerSound();
      setErrorMsg(err.response?.data?.error || 'Erro ao equipar item.');
    }
  };

  const handleMarkRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Category Icon Resolver (No Emojis!)
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Organização':
      case 'Tarefas domésticas':
        return <Home className="w-5 h-5 text-[#fca570]" />;
      case 'Estudos':
        return <ClipboardList className="w-5 h-5 text-[#7bc3db]" />;
      case 'Leitura':
        return <BookOpen className="w-5 h-5 text-[#a48cb3]" />;
      case 'Higiene':
        return <Heart className="w-5 h-5 text-[#f3aba2]" />;
      case 'Atividades físicas':
        return <Activity className="w-5 h-5 text-[#76c043]" />;
      case 'Responsabilidade':
      default:
        return <Shield className="w-5 h-5 text-[#25cca7]" />;
    }
  };

  // Custom Avatar configuration parsed
  let avatar = {
    equipped: { hair: 'default', clothes: 'default', accessory: 'none', mascot: 'none' },
    inventory: { hair: ['default'], clothes: ['default'], accessory: ['none'], mascot: ['none'] }
  };
  if (user?.avatarConfig) {
    try {
      const parsed = JSON.parse(user.avatarConfig);
      if (parsed) {
        if (parsed.equipped) {
          avatar.equipped = { ...avatar.equipped, ...parsed.equipped };
        } else if (parsed.hair || parsed.clothes || parsed.accessory || parsed.mascot) {
          // If flat structure, merge into equipped directly
          avatar.equipped = { ...avatar.equipped, ...parsed };
        }
        
        if (parsed.inventory) {
          avatar.inventory = { 
            hair: parsed.inventory.hair || ['default'],
            clothes: parsed.inventory.clothes || ['default'],
            accessory: parsed.inventory.accessory || ['none'],
            mascot: parsed.inventory.mascot || ['none']
          };
        }
      }
    } catch (e) {}
  }
  const equipped = avatar.equipped;

  // Levels statistics calculations
  const xp = user?.xp || 0;
  const levelLimits = [
    { lvl: 1, min: 0, max: 100, title: 'Aprendiz' },
    { lvl: 2, min: 100, max: 250, title: 'Exploradora' },
    { lvl: 3, min: 250, max: 500, title: 'Heroína das Tarefas' },
    { lvl: 4, min: 500, max: 1000, title: 'Guardiã das Responsabilidades' },
    { lvl: 5, min: 1000, max: 5000, title: 'Mestre da Educação Financeira' }
  ];
  const currentLvlInfo = levelLimits.find(l => xp >= l.min && xp < l.max) || levelLimits[0];
  const nextLvlInfo = levelLimits.find(l => l.lvl === currentLvlInfo.lvl + 1) || null;
  const xpInLvl = xp - currentLvlInfo.min;
  const xpNeeded = nextLvlInfo ? nextLvlInfo.min - currentLvlInfo.min : 100;
  const progressPercent = Math.min(100, Math.floor((xpInLvl / xpNeeded) * 100));

  const unreadCount = notifications.filter(n => !n.read).length;

  // Render Category names inside Shop
  const shopCategories = {
    ALL: 'Tudo',
    HAIR: 'Cabelos',
    CLOTHES: 'Vestimentas',
    ACCESSORY: 'Acessórios',
    MASCOT: 'Mascotes'
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center font-medium">
      
      {/* Mobile App Container shell */}
      <div className="w-full max-w-md bg-slate-900 border-x border-slate-800 h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col justify-between relative overflow-hidden">
        
        {/* Top Header navbar bar */}
        <nav className="bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-black text-white tracking-wider uppercase">Sofia EduCoins</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            <div className="relative">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) handleMarkRead();
                }}
                className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors relative"
              >
                <Bell className="w-4 h-4 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl p-3 z-50 max-h-60 overflow-y-auto">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-2">Avisos</h4>
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-4">Tudo limpo por aqui.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {notifications.map((n) => (
                        <div key={n.id} className={`p-2 rounded-lg text-[10px] leading-tight transition-colors ${n.read ? 'bg-slate-900/40 text-slate-400' : 'bg-slate-800 text-indigo-200'}`}>
                          {n.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout button */}
            <button 
              onClick={logout}
              className="bg-red-950/40 hover:bg-red-900/40 text-red-400 p-2 rounded-xl transition-colors"
              title="Sair do App"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Scrollable Contents Body */}
        <main className="flex-1 p-4 pb-28 space-y-5 overflow-y-auto">

          {/* Child Profile summary panel (Always visible at the top of Home view) */}
          {activeTab === 'tasks' && (
            <section className="bg-slate-950 border border-slate-800/80 rounded-3xl p-4 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-lg"></div>
              
              <div className="relative shrink-0">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5">
                  <AvatarRenderer config={user?.avatarConfig} size="sm" />
                </div>
                <div className="absolute -bottom-1.5 -right-1 bg-[#a48cb3] text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-[#a48cb3] shadow-xs flex items-center gap-0.5">
                  <Award className="w-2.5 h-2.5" />
                  <span>Lvl {user?.level}</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div>
                    <h2 className="text-lg font-black text-white truncate">{user?.name}</h2>
                    <p className="text-[10px] text-[#a48cb3] font-bold tracking-wide mt-0.5 truncate uppercase">
                      {currentLvlInfo.title}
                    </p>
                  </div>
                  {/* Streak */}
                  <div className="flex items-center gap-1 bg-[#fca570]/10 text-[#fca570] border border-[#fca570]/20 px-2 py-1 rounded-lg text-[10px] font-bold">
                    <Flame className="w-3.5 h-3.5 text-[#fca570] fill-[#fca570]" />
                    <span>{user?.streak || 0} Dias</span>
                  </div>
                </div>

                {/* Level progress bar */}
                <div className="mt-2.5">
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-1">
                    <span>XP Recente</span>
                    <span>{xpInLvl}/{xpNeeded} XP</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-[#a48cb3] to-[#25cca7] h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Child Wallet quick preview */}
          {activeTab === 'tasks' && (
            <section className="bg-slate-950 border border-slate-800/80 rounded-3xl p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <PiggyBank className="w-4 h-4 text-[#25cca7]" />
                  Carteira EduCoins
                </span>
                <span className="text-[9px] font-bold text-[#25cca7] bg-[#25cca7]/10 px-2 py-0.5 rounded-md">
                  Minhas economias
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#fef01e]/10 flex items-center justify-center">
                    <Coins className="w-4.5 h-4.5 text-[#fef01e]" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">EduCoins</div>
                    <div className="text-base font-black text-[#fef01e]">{user?.wallet?.balanceCoins || 0}</div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#25cca7]/10 flex items-center justify-center">
                    <DollarSign className="w-4.5 h-4.5 text-[#25cca7]" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Dinheiro Real</div>
                    <div className="text-base font-black text-[#25cca7]">R$ {parseFloat(user?.wallet?.balanceReal || 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </section>
          )}
          {/* TAB CONTENT: 1. TASKS CHECKLIST */}
          {activeTab === 'tasks' && (() => {
            const filteredTasks = tasks.filter((task) => {
              if (taskViewMode === 'all') {
                return !(task.isDaily && task.status === 'APPROVED');
              }
              if (task.isDaily) {
                return !(task.status === 'APPROVED' && !isSameDay(task.approvedAt, selectedDate));
              }
              if (task.deadline) {
                return isSameDay(task.deadline, selectedDate);
              }
              return isSameDay(task.createdAt, selectedDate);
            });

            // Group tasks by title for repeating instances
            const groupedTasks = [];
            const dailyGroups = {};

            filteredTasks.forEach(task => {
              if (task.isDaily) {
                const key = task.title + '-' + task.category;
                if (!dailyGroups[key]) {
                  dailyGroups[key] = {
                    title: task.title,
                    description: task.description,
                    category: task.category,
                    difficulty: task.difficulty,
                    isDaily: true,
                    rewardType: task.rewardType,
                    rewardCoins: task.rewardCoins,
                    rewardReal: task.rewardReal,
                    xpReward: task.xpReward,
                    instances: [task]
                  };
                } else {
                  dailyGroups[key].instances.push(task);
                }
              } else {
                groupedTasks.push({
                  ...task,
                  instances: [task]
                });
              }
            });

            Object.values(dailyGroups).forEach(group => {
              groupedTasks.push(group);
            });

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider pl-1">
                    Minhas Tarefas
                  </h3>
                </div>

                {/* Alternador de Visualização: Semana, Mês ou Ver Tudo */}
                <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-850">
                  {[
                    { mode: 'weekly', label: 'Agenda Semanal' },
                    { mode: 'monthly', label: 'Calendário Mensal' },
                    { mode: 'all', label: 'Ver Tudo' }
                  ].map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => setTaskViewMode(item.mode)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all active:scale-98 ${
                        taskViewMode === item.mode 
                          ? 'bg-slate-900 text-white shadow-xs border border-slate-800' 
                          : 'text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Weekly Calendar navigation */}
                {taskViewMode === 'weekly' && (
                  <div className="bg-slate-950 border border-slate-855 rounded-3xl p-4.5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={handlePrevWeek}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-90"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        {getMonthName(currentWeekStart)}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextWeek}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-90"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {getWeekDays(currentWeekStart).map((day, index) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isSameDay(day, new Date());
                        const dayNumber = String(day.getDate()).padStart(2, '0');
                        const weekday = getWeekdayName(day);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedDate(day)}
                            className={`flex-1 py-3.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                              isSelected 
                                ? 'bg-amber-500 border-amber-500 text-slate-955 font-black shadow-[0_0_15px_rgba(245,158,11,0.35)]' 
                                : isTodayDate
                                  ? 'bg-slate-900 border-amber-500/50 text-amber-400 font-bold'
                                  : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-[9px] font-bold uppercase tracking-wider">{weekday}</span>
                            <span className="text-sm font-black mt-1.5">{dayNumber}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Monthly Calendar Navigation */}
                {taskViewMode === 'monthly' && (
                  <div className="bg-slate-950 border border-slate-850 rounded-3xl p-4.5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-90"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        {getMonthName(currentMonthDate)}
                      </span>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors active:scale-90"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((wd, idx) => (
                        <span key={idx} className="text-[9px] font-black text-slate-500 uppercase">{wd}</span>
                      ))}

                      {getMonthDays(currentMonthDate).map((dayObj, index) => {
                        const day = dayObj.date;
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isSameDay(day, new Date());
                        const dayNumber = day.getDate();
                        const { hasApproved, hasCompleted, hasRejected, hasPending } = getDayStatusDots(day);

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setSelectedDate(day);
                              setCurrentWeekStart(getSundayOfCurrentWeek(day));
                            }}
                            className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all border relative ${
                              isSelected 
                                ? 'bg-amber-500 border-amber-500 text-slate-955 font-black' 
                                : isTodayDate
                                  ? 'bg-slate-900 border-amber-500/50 text-amber-400'
                                  : dayObj.isCurrentMonth
                                    ? 'bg-slate-900/20 border-slate-855/50 text-slate-300 hover:border-slate-700'
                                    : 'bg-transparent border-transparent text-slate-600 hover:border-slate-855'
                            }`}
                          >
                            <span className="text-xs font-black">{dayNumber}</span>
                            
                            {/* Tiny status indicator dots */}
                            <div className="flex gap-0.5 mt-0.5 justify-center min-h-[4px]">
                              {hasApproved && <span className="w-1 h-1 rounded-full bg-[#76c043]" />}
                              {hasCompleted && <span className="w-1 h-1 rounded-full bg-[#fef01e]" />}
                              {hasRejected && <span className="w-1 h-1 rounded-full bg-red-500" />}
                              {hasPending && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {groupedTasks.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800/60 rounded-3xl p-8 text-center shadow-inner">
                    <CheckCircle2 className="w-8 h-8 text-[#25cca7] mx-auto mb-2.5" />
                    <h4 className="text-sm font-bold text-white">
                      Tudo limpo por aqui!
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Oba! Nenhum dever encontrado para este dia.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupedTasks.map((task, gIdx) => {
                      const hasMultiple = task.instances.length > 1 || task.isDaily;

                      return (
                        <div 
                          key={gIdx}
                          className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-start gap-3 justify-between">
                            <div className="flex items-start gap-2.5 min-w-0">
                              {/* Category Icon */}
                              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                                {getCategoryIcon(task.category)}
                              </div>
                              
                              <div className="min-w-0">
                                <span className="text-[8px] font-bold tracking-widest text-slate-500 uppercase">
                                  {task.category}
                                </span>
                                
                                <h4 className="text-sm font-bold text-white truncate mt-0.5">{task.title}</h4>
                                {task.description && <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">{task.description}</p>}
                                
                                {/* Repetitions progress status pill row */}
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  {task.instances.map((inst, idx) => (
                                    <span key={inst.id || idx} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${
                                      inst.status === 'APPROVED' ? 'bg-[#76c043]/10 text-[#76c043] border border-[#76c043]/20' :
                                      inst.status === 'COMPLETED' ? 'bg-[#fef01e]/10 text-[#fef01e] border border-[#fef01e]/20 animate-pulse' :
                                      inst.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-900 text-slate-500 border border-slate-800'
                                    }`}>
                                      {inst.status === 'APPROVED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                      {inst.status === 'COMPLETED' && <AlertCircle className="w-2.5 h-2.5" />}
                                      {inst.status === 'REJECTED' && <AlertCircle className="w-2.5 h-2.5" />}
                                      {hasMultiple ? 'Repetição #' + (idx + 1) : 'Tarefa'}
                                    </span>
                                  ))}
                                </div>

                                {/* Rewards summary */}
                                <div className="flex items-center gap-1.5 mt-2">
                                  {task.rewardCoins > 0 && (
                                    <span className="inline-flex items-center gap-0.5 bg-[#fef01e]/10 text-[#fef01e] px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                      <Coins className="w-3 h-3" />+{task.rewardCoins}
                                    </span>
                                  )}
                                  {parseFloat(task.rewardReal) > 0 && (
                                    <span className="inline-flex items-center gap-0.5 bg-[#25cca7]/10 text-[#25cca7] px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                      <DollarSign className="w-3 h-3" />+R$ {parseFloat(task.rewardReal).toFixed(2)}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-0.5 bg-[#a48cb3]/10 text-[#a48cb3] px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                    <Sparkles className="w-3 h-3" />+{task.xpReward} XP
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex flex-col gap-1.5 justify-center items-end">
                              {/* PENDING → Fiz! button */}
                              {task.instances.some(inst => inst.status === 'PENDING') && (
                                <button
                                  disabled={loading}
                                  onClick={() => handleCompleteTask(task.instances.find(inst => inst.status === 'PENDING').id)}
                                  className="bg-[#25cca7] hover:bg-[#1fb393] text-slate-955 font-black px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider shadow-sm transition-transform active:scale-95 cursor-pointer"
                                >
                                  Fiz!
                                </button>
                              )}

                              {/* isDaily + COMPLETED: show "Fiz de novo!" for another submission */}
                              {task.isDaily && task.instances.some(inst => inst.status === 'COMPLETED') && !task.instances.some(inst => inst.status === 'PENDING') && (
                                <button
                                  disabled={loading}
                                  onClick={() => handleCompleteTask(task.instances.find(inst => inst.status === 'COMPLETED').id)}
                                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-600/30 font-black px-2.5 py-1.5 rounded-xl text-[9px] uppercase tracking-wider transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                                >
                                  ↻ Fiz de novo!
                                </button>
                              )}

                              {/* REJECTED → Refazer! */}
                              {task.instances.some(inst => inst.status === 'REJECTED') && !task.instances.some(inst => inst.status === 'PENDING') && (
                                <button
                                  disabled={loading}
                                  onClick={() => handleCompleteTask(task.instances.find(inst => inst.status === 'REJECTED').id)}
                                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-black px-2.5 py-1.5 rounded-xl text-[9px] uppercase tracking-wider transition-transform active:scale-95 cursor-pointer"
                                >
                                  Refazer!
                                </button>
                              )}

                              {/* COMPLETED + not isDaily: waiting badge */}
                              {!task.isDaily && task.instances.some(inst => inst.status === 'COMPLETED') && !task.instances.some(inst => inst.status === 'PENDING' || inst.status === 'REJECTED') && (
                                <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-500 px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase">
                                  <AlertCircle className="w-3 h-3 text-slate-500" />
                                  Aguardando
                                </span>
                              )}

                              {/* isDaily COMPLETED: show how many sent today */}
                              {task.isDaily && task.instances.some(inst => inst.status === 'COMPLETED') && (
                                <span className="text-[8px] text-indigo-400/70 font-bold">
                                  {task.instances.filter(i => i.status === 'COMPLETED').length}x enviado
                                </span>
                              )}

                              {/* All approved badge */}
                              {task.instances.every(inst => inst.status === 'APPROVED') && (
                                <span className="inline-flex items-center gap-1 bg-[#76c043]/10 border border-[#76c043]/20 text-[#76c043] px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase">
                                  <CheckCircle2 className="w-3 h-3" /> OK
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* TAB CONTENT: 2. GOALS (SONHOS SAVINGS) */}
          {activeTab === 'goals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Meus Objetivos de Economia
                </h3>
                <button
                  onClick={() => setShowCreateGoal(true)}
                  className="bg-[#25cca7] hover:bg-[#1fb393] text-slate-950 font-black py-1.5 px-3 rounded-xl text-[10px] flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" /> Novo sonho
                </button>
              </div>

              {goals.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800/60 rounded-3xl p-6 text-center">
                  <Target className="w-8 h-8 text-[#25cca7] mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">Nenhum sonho cadastrado</h4>
                  <p className="text-xs text-slate-500 mt-1">Crie o seu primeiro sonho clicando no botão acima!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {goals.map((goal) => {
                    const isCoins = goal.type === 'COINS';
                    const target = isCoins ? goal.targetCoins : parseFloat(goal.targetReal);
                    const current = isCoins ? goal.currentCoins : parseFloat(goal.currentReal);
                    const percent = Math.min(100, Math.floor((current / target) * 100));

                    return (
                      <div key={goal.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden">
                        {goal.completed && (
                          <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Alcançado!
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                              <Target className="w-4.5 h-4.5 text-[#25cca7]" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white leading-snug">{goal.title}</h4>
                              <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">Meta Familiar</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold mt-4 mb-1">
                            <span className="text-slate-500 text-[10px]">Guardado:</span>
                            <span className="text-slate-200 text-[11px]">
                              {isCoins ? `🪙 ${current} / ${target} Moedas` : `R$ ${current.toFixed(2)} / R$ ${target.toFixed(2)}`}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${goal.completed ? 'bg-[#76c043]' : 'bg-[#25cca7]'}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>

                        {!goal.completed && (
                          <button
                            onClick={() => setDepositGoal(goal)}
                            className="mt-4 w-full bg-[#25cca7]/10 hover:bg-[#25cca7]/20 text-[#25cca7] font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider border border-[#25cca7]/20 transition-colors"
                          >
                            Depositar economias
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: 3. AVATAR SHOP & WARDROBE (INTEGRATED VIEW!) */}
          {activeTab === 'shop' && (
            <div className="space-y-4">
              
              {/* Provador Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-inner shrink-0">
                    <AvatarRenderer config={user?.avatarConfig} size="sm" />
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-[#a48cb3] bg-[#a48cb3]/10 px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#a48cb3]/10">
                      Provador Virtual
                    </span>
                    <h2 className="text-sm font-black text-white mt-1">Guarda-Roupa</h2>
                    <p className="text-[10px] text-slate-500">Mude seu visual quando quiser.</p>
                  </div>
                </div>

                {/* Sub Coins Display */}
                <div className="bg-[#fef01e]/5 border border-[#fef01e]/20 rounded-xl p-2 text-center min-w-16">
                  <div className="text-[8px] text-[#fef01e] font-bold uppercase">Saldo</div>
                  <div className="text-sm font-black text-[#fef01e] flex items-center justify-center gap-0.5 mt-0.5">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{user?.wallet?.balanceCoins || 0}</span>
                  </div>
                </div>
              </div>

              {/* Status Feedbacks */}
              {successMsg && (
                <div className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 p-2 rounded-xl text-[10px] font-bold text-center">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="bg-red-950/40 text-red-400 border border-red-900/30 p-2 rounded-xl text-[10px] font-bold text-center">
                  {errorMsg}
                </div>
              )}

              {/* Categories selectors */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {Object.entries(shopCategories).map(([cat, label]) => (
                  <button
                    key={cat}
                    onClick={() => setActiveShopCategory(cat)}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all ${
                      activeShopCategory === cat 
                        ? 'bg-[#fca570] border-[#fca570] text-slate-950' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Grid Items */}
              <div className="grid grid-cols-2 gap-3">
                {shopItems
                  .filter(item => activeShopCategory === 'ALL' || item.category === activeShopCategory)
                  .map((item) => {
                    const categoryKey = item.category.toLowerCase();
                    const ownsItem = avatar.inventory?.[categoryKey]?.includes(item.assetKey) || false;
                    const isEquipped = equipped?.[categoryKey] === item.assetKey;

                    return (
                      <div 
                        key={item.id}
                        className={`bg-slate-950 rounded-2xl p-3 border flex flex-col justify-between transition-all ${
                          isEquipped ? 'border-indigo-600 bg-indigo-500/5' : 'border-slate-850'
                        }`}
                      >
                        <div>
                          {/* Mini item preview */}
                          <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-xl mx-auto flex items-center justify-center p-0.5 relative overflow-hidden">
                            <AvatarRenderer config={{ [categoryKey]: item.assetKey }} size="sm" />
                          </div>
                          <h4 className="text-xs font-bold text-white text-center mt-2 truncate">{item.name}</h4>
                          <p className="text-[8px] text-slate-500 text-center uppercase mt-0.5 tracking-wider font-bold">
                            {shopCategories[item.category]}
                          </p>
                        </div>

                        <div className="mt-3">
                          {isEquipped ? (
                            <button disabled className="w-full bg-[#a48cb3] text-slate-950 font-bold py-1.5 rounded-lg text-[9px] flex items-center justify-center gap-1">
                              Equipado
                            </button>
                          ) : ownsItem ? (
                            <button
                              onClick={() => handleEquipItem(item.category, item.assetKey)}
                              className="w-full bg-slate-900 hover:bg-slate-850 text-[#a48cb3] font-bold py-1.5 rounded-lg text-[9px] border border-slate-800"
                            >
                              Equipar
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePurchaseItem(item)}
                              className="w-full bg-[#fef01e] hover:bg-[#ebd21c] text-slate-950 font-black py-1.5 rounded-lg text-[9px] flex items-center justify-center gap-0.5"
                            >
                              <Coins className="w-3 h-3" /> {item.price}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. TROPHIES AND MEDALS */}
          {activeTab === 'medals' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#fef01e]" />
                Minhas Medalhas Conquistadas
              </h3>

              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { badgeKey: 'first_task', name: 'Primeira Tarefa', desc: 'Completou a primeira tarefa' },
                    { badgeKey: 'ten_tasks', name: 'Super Ajudante', desc: 'Completou 10 tarefas' },
                    { badgeKey: 'fifty_tasks', name: 'Campeã', desc: 'Completou 50 tarefas' },
                    { badgeKey: 'saved_100', name: 'Rico Poupador', desc: 'Acumulou R$ 100 reais' },
                    { badgeKey: 'weekly_reader', name: 'Super Leitora', desc: 'Leu 3 vezes na semana' },
                    { badgeKey: 'organization_master', name: 'Quarto Limpo', desc: '5 tarefas de organização' },
                  ].map((medal) => {
                    const isUnlocked = user?.achievements?.some(
                      (ua) => ua.achievement.badgeKey === medal.badgeKey
                    );

                    return (
                      <div 
                        key={medal.badgeKey}
                        className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                          isUnlocked 
                            ? 'bg-[#fef01e]/5 border-[#fef01e]/30' 
                            : 'bg-slate-900/40 border-slate-850 opacity-40'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md mb-2 relative ${
                          isUnlocked 
                            ? 'bg-[#fef01e]/10 border border-[#fef01e]/20 text-[#fef01e]' 
                            : 'bg-slate-900 border border-slate-800 text-slate-600'
                        }`}>
                          {!isUnlocked && (
                            <div className="absolute top-0 right-0 bg-slate-950 text-slate-500 p-0.5 rounded-full border border-slate-800">
                              <Lock className="w-2.5 h-2.5" />
                            </div>
                          )}
                          <Trophy className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-white">{medal.name}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{medal.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Dynamic Piggy Shaking animation trigger */}
        {piggyShaking && (
          <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none z-50 animate-shake"></div>
        )}

        {/* Sticky iOS/Android Style Bottom Navigation Bar */}
        <footer className="absolute bottom-5 left-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl py-2.5 shadow-2xl flex justify-around z-30 select-none">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 ${
              activeTab === 'tasks' 
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner' 
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider px-1">Tarefas</span>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 ${
              activeTab === 'goals' 
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner' 
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Target className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider px-1">Sonhos</span>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 ${
              activeTab === 'shop' 
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner' 
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Store className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider px-1">Loja</span>
          </button>

          <button
            onClick={() => setActiveTab('medals')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 ${
              activeTab === 'medals' 
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner' 
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider px-1">Conquistas</span>
          </button>
        </footer>

      </div>

      {/* Goal Deposit Modal (Styled for mobile bottom sheet) */}
      {depositGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-float">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Guardar no Cofrinho</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Insira o valor que deseja depositar no sonho: <strong className="text-white">"{depositGoal.title}"</strong>.
            </p>

            <form onSubmit={handleDepositToGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Valor a Guardar
                </label>
                <div className="relative mt-1">
                  <div className="absolute left-3 top-3 text-xs font-bold text-slate-500">
                    {depositGoal.type === 'COINS' ? 'Moedas' : 'R$'}
                  </div>
                  <input
                    type="number"
                    step={depositGoal.type === 'COINS' ? '1' : '0.10'}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Ex: 5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-14 pr-4 text-sm text-white focus:outline-hidden focus:border-indigo-500 transition-colors"
                    required
                    autoFocus
                  />
                </div>
                <div className="text-[10px] text-[#25cca7] mt-1.5 font-bold">
                  Disponível na carteira: {depositGoal.type === 'COINS' ? `${user?.wallet?.balanceCoins || 0} Moedas` : `R$ ${parseFloat(user?.wallet?.balanceReal || 0).toFixed(2)}`}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDepositGoal(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 transition-colors shadow-lg"
                >
                  Depositar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Level Up celebration popup */}
      {levelUpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
            
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mx-auto flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
              <Award className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-black text-white">Nível UP!</h2>
            <p className="text-xs text-slate-400 mt-1">Parabéns! Seu nível aumentou para:</p>
            
            <div className="my-4 inline-flex bg-indigo-600 text-white font-extrabold px-4 py-2 rounded-xl text-sm border border-indigo-400">
              Nível {levelUpModal.level}
            </div>

            <h3 className="text-base font-bold text-indigo-300">"{levelUpModal.title}"</h3>
            <p className="text-[11px] text-slate-500 mt-2">Você está se saindo muito bem nas suas tarefas diárias!</p>

            <button
              onClick={() => setLevelUpModal(null)}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Continuar 🚀
            </button>
          </div>
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-5 h-5 text-[#25cca7]" />
              <h3 className="text-base font-bold text-white">Adicionar Novo Sonho</h3>
            </div>
            <p className="text-[11px] text-slate-500">Defina uma meta para economizar e realizar.</p>

            <form onSubmit={handleCreateGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome do Sonho</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Ex: Comprar um boneco"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-xs mt-1 text-white focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Meta</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { type: 'COINS', label: 'Moedas (EduCoins)' },
                    { type: 'REAL_MONEY', label: 'Dinheiro Real (R$)' }
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setGoalType(item.type)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                        goalType === item.type 
                          ? 'border-[#25cca7] bg-[#25cca7]/10 text-[#25cca7]' 
                          : 'border-slate-800 text-slate-500 bg-slate-950'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                {goalType === 'COINS' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantidade de EduCoins</label>
                    <input
                      type="number"
                      value={goalTargetCoins}
                      onChange={(e) => setGoalTargetCoins(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor em R$</label>
                    <input
                      type="number"
                      step="0.50"
                      value={goalTargetReal}
                      onChange={(e) => setGoalTargetReal(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGoal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-[#25cca7] hover:bg-[#1fb393] transition-colors shadow-lg"
                >
                  Salvar Sonho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
