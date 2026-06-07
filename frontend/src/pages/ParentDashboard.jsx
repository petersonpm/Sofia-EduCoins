import React, { useState, useEffect } from 'react';
import {
  useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Shield,
  Users,
  PlusCircle,
  Check,
  X,
  Award,
  Flame,
  Wallet,
  Sparkles,
  TrendingUp,
  BookOpen,
  Trash2,
  Edit3,
  UserPlus,
  Mail,
  Key,
  User,
  Plus,
  DollarSign,
  ListTodo,
  BarChart3,
  PiggyBank,
  Bell,
  AlertCircle,
  Coins,
  Trophy,
  ClipboardList,
  Home,
  Activity,
  ShoppingBag,
  Target,
  Heart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import AvatarRenderer from '../components/AvatarRenderer';

export default function ParentDashboard() {
  const { user, logout, refreshUser } = useAuth();
  // Agenda / Calendário States & Helpers
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

  const getWeekDays = (weekStart) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthDays = (date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Dom, 1: Seg, etc.

    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    return days;
  };

  const [taskViewMode, setTaskViewMode] = useState('weekly'); // 'weekly', 'monthly', 'all'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getSundayOfCurrentWeek());
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

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
    const dayTasks = tasks.filter(t => t.assignedToId === selectedChildId);
    const dayFiltered = dayTasks.filter(task => {
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

  // Navigation: 'summary', 'approvals', 'tasks', 'family'
  const [activeTab, setActiveTab] = useState('summary');

  // States
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [expenseRequests, setExpenseRequests] = useState([]);

  // Modals
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editTaskData, setEditTaskData] = useState(null);

  // Edit task form fields
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDescription, setEditTaskDescription] = useState('');
  const [editTaskCategory, setEditTaskCategory] = useState('Organização');
  const [editTaskDifficulty, setEditTaskDifficulty] = useState('Fácil');
  const [editTaskRewardType, setEditTaskRewardType] = useState('COINS');
  const [editTaskRewardCoins, setEditTaskRewardCoins] = useState(10);
  const [editTaskRewardReal, setEditTaskRewardReal] = useState(2.00);
  const [editTaskXpReward, setEditTaskXpReward] = useState(15);
  const [editTaskDeadline, setEditTaskDeadline] = useState('');
  const [editTaskIsDaily, setEditTaskIsDaily] = useState(true);

  // Task form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState('Organização');
  const [taskDifficulty, setTaskDifficulty] = useState('Fácil');
  const [taskRewardType, setTaskRewardType] = useState('COINS');
  const [taskRewardCoins, setTaskRewardCoins] = useState(10);
  const [taskRewardReal, setTaskRewardReal] = useState(2.00);
  const [taskXpReward, setTaskXpReward] = useState(15);
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskIsDaily, setTaskIsDaily] = useState(true);

  // Goal form fields
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState('REAL_MONEY');
  const [goalTargetCoins, setGoalTargetCoins] = useState(100);
  const [goalTargetReal, setGoalTargetReal] = useState(50.00);

  // Child/Member form fields
  const [childName, setChildName] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [memberType, setMemberType] = useState('CHILD'); // 'CHILD' or 'PARENT'

  // Edit child modal
  const [showEditChild, setShowEditChild] = useState(false);
  const [editChildData, setEditChildData] = useState(null); // {id, name, email}
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load parent data
  const loadData = async () => {
    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser && refreshedUser.children) {
        setChildren(refreshedUser.children);
        
        if (!selectedChildId && refreshedUser.children.length > 0) {
          setSelectedChildId(refreshedUser.children[0].id);
        }
      }

      const tasksRes = await api.get('/tasks');
      setTasks(tasksRes.data);

      const expensesRes = await api.get('/expenses/requests');
      setExpenseRequests(expensesRes.data);
    } catch (err) {
      console.error('Erro ao buscar dados do painel:', err);
    }
  };

  const loadChildGoals = async () => {
    if (!selectedChildId) return;
    try {
      const goalsRes = await api.get(`/goals?childId=${selectedChildId}`);
      setGoals(goalsRes.data);
    } catch (err) {
      console.error('Erro ao buscar sonhos:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadChildGoals();
  }, [selectedChildId]);

  const handleAddChild = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = memberType === 'PARENT' ? '/auth/register-co-parent' : '/auth/register-child';
      await api.post(endpoint, {
        name: childName,
        email: childEmail,
        password: childPassword,
      });

      setSuccess(`${memberType === 'PARENT' ? 'Responsável' : 'Dependente'} "${childName}" cadastrado com sucesso!`);
      setChildName('');
      setChildEmail('');
      setChildPassword('');
      setShowAddChild(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || `Erro ao cadastrar ${memberType === 'PARENT' ? 'responsável' : 'filho'}.`);
    } finally {
      setLoading(false);
    }
  };

  const openEditChild = (child) => {
    setEditChildData(child);
    setEditName(child.name);
    setEditEmail(child.email);
    setEditPassword('');
    setError('');
    setShowEditChild(true);
  };

  const handleEditChild = async (e) => {
    e.preventDefault();
    if (!editChildData) return;
    setError('');
    setLoading(true);
    try {
      const payload = {};
      if (editName && editName !== editChildData.name) payload.name = editName;
      if (editEmail && editEmail !== editChildData.email) payload.email = editEmail;
      if (editPassword) payload.password = editPassword;

      await api.put(`/auth/child/${editChildData.id}`, payload);
      setSuccess(`Dados de "${editName}" atualizados com sucesso!`);
      setShowEditChild(false);
      setEditChildData(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChild = async (child) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${child.name}"?\n\nEsta ação é irreversível e removerá todas as tarefas e dados da conta.`)) return;
    try {
      await api.delete(`/auth/child/${child.id}`);
      setSuccess(`Conta de "${child.name}" excluída com sucesso.`);
      if (selectedChildId === child.id) setSelectedChildId('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao excluir membro.');
    }
  };

  const openEditTask = (task) => {
    setEditTaskData(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || '');
    setEditTaskCategory(task.category);
    setEditTaskDifficulty(task.difficulty);
    setEditTaskRewardType(task.rewardType);
    setEditTaskRewardCoins(task.rewardCoins);
    setEditTaskRewardReal(parseFloat(task.rewardReal));
    setEditTaskXpReward(task.xpReward);
    setEditTaskDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : '');
    setEditTaskIsDaily(task.isDaily ?? true);
    setError('');
    setShowEditTask(true);
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!editTaskData) return;
    setError('');
    setLoading(true);
    try {
      await api.put(`/tasks/${editTaskData.id}`, {
        title: editTaskTitle,
        description: editTaskDescription,
        category: editTaskCategory,
        difficulty: editTaskDifficulty,
        rewardType: editTaskRewardType,
        rewardCoins: editTaskRewardType === 'REAL_MONEY' ? 0 : editTaskRewardCoins,
        rewardReal: editTaskRewardType === 'COINS' ? 0 : editTaskRewardReal,
        xpReward: editTaskXpReward,
        deadline: editTaskDeadline || null,
        isDaily: editTaskIsDaily,
      });
      setSuccess(`Dever "${editTaskTitle}" atualizado com sucesso!`);
      setShowEditTask(false);
      setEditTaskData(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar dever.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedChildId) {
      alert('Selecione ou cadastre um filho primeiro.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await api.post('/tasks', {
        title: taskTitle,
        description: taskDescription,
        category: taskCategory,
        difficulty: taskDifficulty,
        rewardType: taskRewardType,
        rewardCoins: taskRewardType === 'REAL_MONEY' ? 0 : taskRewardCoins,
        rewardReal: taskRewardType === 'COINS' ? 0 : taskRewardReal,
        xpReward: taskXpReward,
        assignedToId: selectedChildId,
        deadline: taskDeadline || null,
        isDaily: taskIsDaily,
      });

      setSuccess('Nova tarefa criada com sucesso!');
      setTaskTitle('');
      setTaskDescription('');
      setShowCreateTask(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar tarefa.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!selectedChildId) return;

    setError('');
    setLoading(true);

    try {
      await api.post('/goals', {
        title: goalTitle,
        type: goalType,
        targetCoins: goalType === 'COINS' ? goalTargetCoins : 0,
        targetReal: goalType === 'REAL_MONEY' ? goalTargetReal : 0,
        childId: selectedChildId,
      });

      setSuccess('Novo sonho cadastrado com sucesso!');
      setGoalTitle('');
      setShowCreateGoal(false);
      loadChildGoals();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar meta.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/approve`);
      loadData();
    } catch (err) {
      alert('Erro ao aprovar tarefa.');
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/reject`);
      loadData();
    } catch (err) {
      alert('Erro ao recusar tarefa.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Excluir esta tarefa definitivamente?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      loadData();
    } catch (err) {
      alert('Erro ao deletar tarefa.');
    }
  };

  const handleApproveExpense = async (expenseId) => {
    try {
      await api.post(`/expenses/${expenseId}/approve`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao aprovar compra.');
    }
  };

  const handleRejectExpense = async (expenseId) => {
    try {
      await api.post(`/expenses/${expenseId}/reject`);
      loadData();
    } catch (err) {
      alert('Erro ao rejeitar compra.');
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  const pendingApprovalsCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const approvedTasksCount = tasks.filter(t => t.status === 'APPROVED').length;
  const totalPaidReal = children.reduce((acc, c) => acc + parseFloat(c.wallet?.totalEarnedReal || 0), 0);
  const totalPaidCoins = children.reduce((acc, c) => acc + (c.wallet?.totalEarnedCoins || 0), 0);
  
  const pendingExpenses = expenseRequests.filter(e => e.status === 'PENDING');
  const totalApprovalsCount = pendingApprovalsCount + pendingExpenses.length;

  const categoryCounts = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});
  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Organização':
      case 'Tarefas domésticas':
        return <Home className="w-4 h-4 text-[#fca570]" />;
      case 'Estudos':
        return <ClipboardList className="w-4 h-4 text-[#7bc3db]" />;
      case 'Leitura':
        return <BookOpen className="w-4 h-4 text-[#a48cb3]" />;
      case 'Higiene':
        return <Heart className="w-4 h-4 text-[#f3aba2]" />;
      case 'Atividades físicas':
        return <Activity className="w-4 h-4 text-[#76c043]" />;
      case 'Responsabilidade':
      default:
        return <Shield className="w-4 h-4 text-[#25cca7]" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center font-medium">
      
      {/* Mobile viewport container shell */}
      <div className="w-full max-w-md bg-slate-900 border-x border-slate-800 h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col justify-between relative overflow-hidden">
        
        {/* Top Navbar */}
        <nav className="bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black tracking-wider uppercase text-white">Painel Familiar</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Show selected child indicator */}
            {selectedChild && (
              <button
                onClick={() => setActiveTab('family')}
                className="flex items-center gap-1.5 bg-[#a48cb3]/10 border border-[#a48cb3]/30 px-2 py-1 rounded-xl hover:bg-[#a48cb3]/20 transition-all"
                title="Criança selecionada"
              >
                <div className="w-4 h-4 rounded-full bg-[#a48cb3]/30 flex items-center justify-center">
                  <User className="w-2.5 h-2.5 text-[#a48cb3]" />
                </div>
                <span className="text-[9px] font-black text-[#a48cb3] max-w-16 truncate">{selectedChild.name}</span>
              </button>
            )}
            <span className="text-[9px] font-bold bg-[#7bc3db]/10 text-[#7bc3db] border border-[#7bc3db]/20 px-2 py-0.5 rounded-lg uppercase">
              Pais
            </span>
            <button 
              onClick={logout}
              className="bg-red-950/40 hover:bg-red-900/40 text-red-400 p-2 rounded-xl transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Scrollable Main body */}
        <main className="flex-1 p-4 pb-28 space-y-4 overflow-y-auto">
          
          {/* Notification Alerts */}
          {success && (
            <div className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 p-3 rounded-2xl text-[11px] font-bold text-center">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-950/40 text-red-400 border border-red-900/30 p-3 rounded-2xl text-[11px] font-bold text-center">
              {error}
            </div>
          )}

          {/* TAB 1: SUMMARY DETAILS */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              
              {/* Quick statistics widgets grid */}
              <section className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#e6728a]/10 flex items-center justify-center shrink-0">
                    <ClipboardList className="w-4 h-4 text-[#e6728a]" />
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase">Aprovações</div>
                    <div className="text-sm font-black text-white">{pendingApprovalsCount}</div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#76c043]/10 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-[#76c043]" />
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase">Feito</div>
                    <div className="text-sm font-black text-white">{approvedTasksCount}</div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#25cca7]/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-[#25cca7]" />
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase">Dinheiro Pago</div>
                    <div className="text-xs font-black text-white">R$ {totalPaidReal.toFixed(2)}</div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#fef01e]/10 flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4 text-[#fef01e]" />
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 font-bold uppercase">Moedas Pagas</div>
                    <div className="text-xs font-black text-white">{totalPaidCoins}</div>
                  </div>
                </div>
              </section>

              {/* Category charts statistics */}
              <section className="bg-slate-950 border border-slate-800 rounded-3xl p-4">
                <h3 className="text-xs font-black uppercase text-slate-400 border-b border-slate-850 pb-2 mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#7bc3db]" />
                  Tarefas por Categoria
                </h3>
                
                {Object.keys(categoryCounts).length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4">Nenhuma tarefa criada.</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(categoryCounts).map(([cat, count]) => {
                      const widthPercent = (count / maxCategoryCount) * 100;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                            <span className="flex items-center gap-1">
                              {getCategoryIcon(cat)}
                              {cat}
                            </span>
                            <span>{count}</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className="bg-[#7bc3db] h-full rounded-full"
                              style={{ width: `${widthPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* TAB 2: APPROVALS LIST */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              
              {/* Task Approvals */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Validação de Tarefas
                </h3>

                {tasks.filter(t => t.status === 'COMPLETED').length === 0 ? (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-slate-500">Nenhuma tarefa aguardando aprovação.</p>
                  </div>
                ) : (
                  tasks.filter(t => t.status === 'COMPLETED').map((task) => (
                    <div key={task.id} className="p-3.5 rounded-2xl border border-slate-850 bg-slate-950 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[8px] font-bold text-[#e6728a] bg-[#e6728a]/10 px-2 py-0.5 rounded-md">
                            {task.category} • {task.assignedTo?.name}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.isDaily && (
                              <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                                ↻ Múltipl
                              </span>
                            )}
                            {task.completedAt && (
                              <span className="text-[8px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-md">
                                ⏰ {new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1.5">{task.title}</h4>
                        <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>Recompensa:</span>
                          <span className="text-[#fef01e] font-bold">🪙 {task.rewardCoins}</span>
                          <span>|</span>
                          <span className="text-[#25cca7] font-bold">R$ {parseFloat(task.rewardReal).toFixed(2)}</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectTask(task.id)}
                          className="flex-1 bg-red-950/20 hover:bg-red-900/20 border border-red-900/30 text-red-400 py-1.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" /> Rejeitar
                        </button>
                        <button
                          onClick={() => handleApproveTask(task.id)}
                          className="flex-1 bg-[#76c043] hover:bg-[#609d34] text-slate-950 py-1.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-0.5 shadow-sm transition-colors"
                        >
                          <Check className="w-3 h-3" /> Aprovar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </section>

              {/* Shopping Requests */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                  Resgates e Compras Reais
                </h3>

                {pendingExpenses.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-center">
                    <p className="text-[11px] text-slate-500">Nenhum pedido de compra pendente.</p>
                  </div>
                ) : (
                  pendingExpenses.map((expense) => (
                    <div key={expense.id} className="p-3.5 rounded-2xl border border-slate-850 bg-slate-950 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[8px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                          Resgate • {expense.child?.name}
                        </span>
                        <h4 className="text-xs font-bold text-white mt-1.5">{expense.description}</h4>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">
                          Custo: {expense.type === 'COINS' ? `🪙 ${expense.valueCoins} Moedas` : `R$ ${parseFloat(expense.valueReal).toFixed(2)}`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectExpense(expense.id)}
                          className="flex-1 bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 py-1.5 rounded-xl text-[9px] font-bold transition-colors"
                        >
                          Recusar
                        </button>
                        <button
                          onClick={() => handleApproveExpense(expense.id)}
                          className="flex-1 bg-[#25cca7] hover:bg-[#1fb393] text-slate-950 py-1.5 rounded-xl text-[9px] font-black shadow-sm transition-colors"
                        >
                          Aprovar Compra
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </section>
            </div>
          )}

          {/* TAB 3: CHORES MANAGEMENT */}
          {activeTab === 'tasks' && (() => {
            const childTasks = tasks.filter(t => t.assignedToId === selectedChildId);
            const filteredTasks = childTasks.filter((task) => {
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
                const key = `${task.title}-${task.category}`;
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
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Gerenciamento de Tarefas
                  </h3>
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="bg-[#25cca7] hover:bg-[#1fb393] text-slate-955 font-black py-1.5 px-3 rounded-xl text-[10px] flex items-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" /> Criar dever
                  </button>
                </div>

                {/* Calendar switch selectors */}
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
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all active:scale-98 ${
                        taskViewMode === item.mode 
                          ? 'bg-slate-900 text-white shadow-xs border border-slate-800' 
                          : 'text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Weekly Agenda Navigation */}
                {taskViewMode === 'weekly' && (
                  <div className="bg-slate-950 border border-slate-850 rounded-3xl p-4.5 space-y-4 shadow-inner">
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
                                ? 'bg-indigo-600 border-indigo-600 text-white font-black shadow-[0_0_15px_rgba(79,70,229,0.35)]' 
                                : isTodayDate
                                  ? 'bg-slate-900 border-indigo-500/50 text-indigo-400 font-bold'
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
                                ? 'bg-indigo-600 border-indigo-600 text-white font-black' 
                                : isTodayDate
                                  ? 'bg-slate-900 border-indigo-500/50 text-indigo-400'
                                  : dayObj.isCurrentMonth
                                    ? 'bg-slate-900/20 border-slate-850/50 text-slate-300 hover:border-slate-700'
                                    : 'bg-transparent border-transparent text-slate-600 hover:border-slate-850'
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
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 text-center">
                    <p className="text-xs text-slate-500">Nenhum dever encontrado para este dia.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groupedTasks.map((task, gIdx) => {
                      const hasMultiple = task.instances.length > 1 || task.isDaily;

                      if (!hasMultiple) {
                        // Single chore rendering (Non-repeating)
                        const inst = task.instances[0];
                        return (
                          <div key={inst.id} className="bg-slate-950 border border-slate-855 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm hover:border-slate-800 transition-colors">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md ${
                                  inst.status === 'APPROVED' ? 'bg-[#76c043]/10 text-[#76c043] border border-[#76c043]/20' :
                                  inst.status === 'COMPLETED' ? 'bg-[#fef01e]/10 text-[#fef01e] border border-[#fef01e]/20 animate-pulse' :
                                  inst.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-900 text-slate-500'
                                }`}>
                                  {inst.status === 'APPROVED' ? 'OK' :
                                   inst.status === 'COMPLETED' ? 'PENDENTE' :
                                   inst.status === 'REJECTED' ? 'CORRIGIR' : 'ATIVO'}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase">{inst.category}</span>
                              </div>
                              <h4 className="text-xs font-bold text-white truncate mt-1.5">{inst.title}</h4>
                              <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                                Para: {inst.assignedTo?.name} | Recompensa: {inst.rewardType === 'REAL_MONEY' ? `R$ ${parseFloat(inst.rewardReal).toFixed(2)}` : inst.rewardType === 'COINS' ? `${inst.rewardCoins} Moedas` : `${inst.rewardCoins} Moedas + R$ ${parseFloat(inst.rewardReal).toFixed(2)}`}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {(inst.status === 'PENDING' || inst.status === 'REJECTED') && (
                                <button
                                  onClick={() => openEditTask(inst)}
                                  className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-xl hover:bg-indigo-950/20 transition-all shrink-0"
                                  title="Editar dever"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {inst.status === 'COMPLETED' && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleRejectTask(inst.id)} className="bg-red-950/20 text-red-400 border border-red-900/20 p-1.5 rounded-xl hover:bg-red-900/20 active:scale-95 transition-all" title="Rejeitar">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleApproveTask(inst.id)} className="bg-[#76c043] text-slate-950 p-1.5 rounded-xl hover:bg-[#609d34] active:scale-95 transition-all" title="Aprovar">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                              {(inst.status === 'PENDING' || inst.status === 'REJECTED') && (
                                <button
                                  onClick={() => handleDeleteTask(inst.id)}
                                  className="text-red-400 hover:text-red-300 p-1.5 rounded-xl hover:bg-red-950/20 transition-all shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Repeating Chores rendering (daily or has multiple completions)
                      return (
                        <div key={gIdx} className="bg-slate-950 border border-slate-855 rounded-2xl p-3.5 space-y-3 shadow-sm hover:border-slate-800 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  REPETITIVO
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase">{task.category}</span>
                              </div>
                              <h4 className="text-xs font-bold text-white mt-1.5">{task.title}</h4>
                              {task.description && <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{task.description}</p>}
                            </div>
                            {/* Edit repeating task header */}
                            <button
                              onClick={() => openEditTask(task.instances[0])}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/20 transition-all shrink-0"
                              title="Editar dever"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="border-t border-slate-900 pt-2.5 space-y-2">
                            {task.instances.map((inst, index) => (
                              <div key={inst.id || index} className="flex items-center justify-between text-xs py-1.5 px-3 bg-slate-900/40 rounded-xl border border-slate-850/40">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] text-slate-400 font-black">
                                    Repetição #${index + 1}
                                  </span>
                                  <span className="ml-2 text-[9px] text-slate-500">
                                    {inst.rewardType === 'REAL_MONEY' ? `R$ &nbsp;${parseFloat(inst.rewardReal).toFixed(2)}` : inst.rewardType === 'COINS' ? `${inst.rewardCoins} Moedas` : `${inst.rewardCoins} Moedas + R$ ${parseFloat(inst.rewardReal).toFixed(2)}`}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                                    inst.status === 'APPROVED' ? 'bg-[#76c043]/10 text-[#76c043] border border-[#76c043]/20' :
                                    inst.status === 'COMPLETED' ? 'bg-[#fef01e]/10 text-[#fef01e] border border-[#fef01e]/20 animate-pulse' :
                                    inst.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-850 text-slate-500'
                                  }`}>
                                    {inst.status === 'APPROVED' ? 'OK' :
                                     inst.status === 'COMPLETED' ? 'PENDENTE' :
                                     inst.status === 'REJECTED' ? 'CORRIGIR' : 'ATIVO'}
                                  </span>
                                  
                                  {inst.status === 'COMPLETED' && (
                                    <div className="flex gap-1">
                                      <button onClick={() => handleRejectTask(inst.id)} className="bg-red-950/20 text-red-400 border border-red-900/20 p-1 rounded-lg hover:bg-red-900/20" title="Rejeitar">
                                        <X className="w-3 h-3" />
                                      </button>
                                      <button onClick={() => handleApproveTask(inst.id)} className="bg-[#76c043] text-slate-950 p-1 rounded-lg hover:bg-[#609d34]" title="Aprovar">
                                        <Check className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  
                                  {(inst.status === 'PENDING' || inst.status === 'REJECTED') && (
                                    <button onClick={() => handleDeleteTask(inst.id)} className="text-red-400 hover:text-red-350 p-1 rounded-lg hover:bg-red-950/10" title="Deletar">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 4: FAMILY DEPENDENTS & SAVINGS */}
          {activeTab === 'family' && (
            <div className="space-y-4">
              
              {/* Dependents Shelf */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Membros da Família
                  </h3>
                  <button
                    onClick={() => setShowAddChild(true)}
                    className="text-[10px] font-bold text-[#a48cb3] hover:text-[#b6a1c2] flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>

                <div className="space-y-2">
                  {children.length === 0 && (
                    <p className="text-[10px] text-slate-500 text-center py-6 bg-slate-950 border border-slate-850 rounded-2xl">
                      Nenhum membro cadastrado ainda.
                    </p>
                  )}
                  {children.map((child) => {
                    const isSelected = child.id === selectedChildId;
                    const initials = child.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                    const childColors = ['#a48cb3','#7bc3db','#76c043','#fca570','#e6728a','#25cca7'];
                    const colorIdx = child.id?.charCodeAt(0) % childColors.length || 0;
                    const avatarColor = childColors[colorIdx];
                    return (
                      <div
                        key={child.id}
                        onClick={() => setSelectedChildId(child.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#a48cb3]/8 border-[#a48cb3] shadow-[0_0_18px_rgba(164,140,179,0.18)]'
                            : 'bg-slate-950 border-slate-850 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar circle */}
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black flex-shrink-0 transition-all"
                            style={{
                              background: isSelected ? `${avatarColor}22` : '#1e293b',
                              border: `2px solid ${isSelected ? avatarColor : '#334155'}`,
                              color: avatarColor
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white">{child.name}</h4>
                              {isSelected && (
                                <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-[#a48cb3]/20 text-[#a48cb3] border border-[#a48cb3]/30 uppercase tracking-wide">
                                  Ativo
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-500">
                              {child.role === 'CHILD' ? `Nível ${child.level || 1} • XP ${child.xp || 0}` : 'Responsável'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            {child.role === 'CHILD' && (
                              <>
                                <div className="text-[10px] font-black text-[#fef01e]">🪙 {child.wallet?.balanceCoins || 0}</div>
                                <div className="text-[9px] font-bold text-[#25cca7]">R$ {parseFloat(child.wallet?.balanceReal || 0).toFixed(2)}</div>
                              </>
                            )}
                          </div>
                          {/* Edit button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditChild(child); }}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-800/50 hover:bg-indigo-950/20 transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteChild(child); }}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 transition-all"
                            title="Excluir membro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Savings dreams for selected child */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                    Cofres de Sonhos ({selectedChild?.name || 'Nenhum'})
                  </h3>
                  <button
                    onClick={() => setShowCreateGoal(true)}
                    className="text-[10px] font-bold text-[#25cca7] bg-[#25cca7]/10 px-2 py-0.5 rounded-md border border-[#25cca7]/20"
                  >
                    Adicionar
                  </button>
                </div>

                {goals.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4 bg-slate-950 border border-slate-850 rounded-2xl">
                    Nenhum cofre cadastrado para este filho.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {goals.map((g) => {
                      const isCoins = g.type === 'COINS';
                      const target = isCoins ? g.targetCoins : parseFloat(g.targetReal);
                      const current = isCoins ? g.currentCoins : parseFloat(g.currentReal);
                      return (
                        <div key={g.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{g.title}</h4>
                            <p className="text-[9px] text-slate-500 mt-0.5">
                              Acumulado: {isCoins ? `🪙 ${current} / ${target}` : `R$ ${current.toFixed(2)} / R$ ${target.toFixed(2)}`}
                            </p>
                          </div>
                          {/* Mini gauge percent */}
                          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-center min-w-10">
                            <div className="text-[9px] font-bold text-[#25cca7]">
                              {Math.min(100, Math.floor((current/target)*100))}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

            </div>
          )}

        </main>

        {/* Sticky Mobile bottom navigation menu */}
        <footer className="absolute bottom-5 left-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl py-2.5 shadow-2xl flex justify-around z-30 select-none">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 ${
              activeTab === 'summary' 
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner' 
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider px-1">Resumo</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 relative ${
              activeTab === 'approvals' 
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner' 
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Bell className="w-5 h-5" />
            {totalApprovalsCount > 0 && (
              <span className="absolute top-0.5 right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalApprovalsCount}
              </span>
            )}
            <span className="text-[8px] font-bold uppercase tracking-wider px-1">Aprovações</span>
          </button>

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
            onClick={() => setActiveTab('family')}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-300 ${
              activeTab === 'family' 
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner' 
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase tracking-wider px-1">Família</span>
          </button>
        </footer>

      </div>

      {/* CREATE TASK MODAL */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-1">
              <ClipboardList className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Criar Nova Tarefa</h3>
            </div>
            <p className="text-[11px] text-slate-500">Crie um novo dever para seu filho realizar.</p>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Título da Tarefa</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Escovar os dentes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-xs mt-1 text-white focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição (Opcional)</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Ex: Deixar a escova limpa."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-xs mt-1 text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white"
                  >
                    <option value="Organização">Organização</option>
                    <option value="Estudos">Estudos</option>
                    <option value="Leitura">Leitura</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Responsabilidade">Responsabilidade</option>
                    <option value="Atividades físicas">Atividades físicas</option>
                    <option value="Tarefas domésticas">Tarefas domésticas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dificuldade</label>
                  <select
                    value={taskDifficulty}
                    onChange={(e) => setTaskDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recompensa</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['COINS', 'REAL_MONEY', 'BOTH'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTaskRewardType(type)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                        taskRewardType === type 
                          ? 'border-indigo-600 bg-indigo-500/10 text-indigo-400' 
                          : 'border-slate-800 text-slate-500 bg-slate-950'
                      }`}
                    >
                      {type === 'COINS' ? 'Moedas' : type === 'REAL_MONEY' ? 'Dinheiro' : 'Ambos'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(taskRewardType === 'COINS' || taskRewardType === 'BOTH') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">EduCoins</label>
                    <input
                      type="number"
                      value={taskRewardCoins}
                      onChange={(e) => setTaskRewardCoins(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white"
                    />
                  </div>
                )}
                {(taskRewardType === 'REAL_MONEY' || taskRewardType === 'BOTH') && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor R$</label>
                    <input
                      type="number"
                      step="0.50"
                      value={taskRewardReal}
                      onChange={(e) => setTaskRewardReal(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP do Jogo</label>
                  <input
                    type="number"
                    value={taskXpReward}
                    onChange={(e) => setTaskXpReward(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prazo final</label>
                  <input
                    type="datetime-local"
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-400"
                  />
                </div>
              </div>

              {/* isDaily toggle */}
              <div
                onClick={() => setTaskIsDaily(v => !v)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  taskIsDaily ? 'bg-indigo-600/10 border-indigo-600/40' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white">Pode ser feita mais de uma vez por dia</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">A criança pode enviar para aprovação várias vezes no mesmo dia</p>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${
                  taskIsDaily ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                }`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Adicionar Novo Sonho</h3>
            </div>
            <p className="text-[11px] text-slate-500">Crie uma meta de economia para stimulá-lo a poupar.</p>

            <form onSubmit={handleCreateGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome do Sonho</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Ex: Videogame Switch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs mt-1 text-white focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo do Cofre</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs mt-1 text-white"
                >
                  <option value="REAL_MONEY">Economizar em R$ Dinheiro Real</option>
                  <option value="COINS">Economizar em Moedas EduCoins</option>
                </select>
              </div>

              {goalType === 'COINS' ? (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor em Moedas</label>
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
                    step="5.00"
                    value={goalTargetReal}
                    onChange={(e) => setGoalTargetReal(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGoal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-850"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-755 shadow-lg"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER DEPENDENT/MEMBER MODAL */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Cadastrar Membro</h3>
            </div>
            <p className="text-[11px] text-slate-500">Crie os dados de acesso de um responsável ou de uma criança.</p>

            <form onSubmit={handleAddChild} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Membro</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { type: 'CHILD', label: 'Criança (Dependente)' },
                    { type: 'PARENT', label: 'Responsável (Pai/Mãe)' }
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setMemberType(item.type)}
                      className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                        memberType === item.type 
                          ? 'border-[#a48cb3] bg-[#a48cb3]/10 text-[#a48cb3]' 
                          : 'border-slate-800 text-slate-500 bg-slate-950'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {memberType === 'PARENT' ? 'Nome do Responsável' : 'Nome da Criança'}
                </label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder={memberType === 'PARENT' ? 'Ex: Mariana (Mãe)' : 'Ex: Sofia'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail de Login</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={childEmail}
                    onChange={(e) => setChildEmail(e.target.value)}
                    placeholder={memberType === 'PARENT' ? 'Ex: responsavel@email.com' : 'Ex: sofia@email.com'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Senha da Conta</label>
                <div className="relative mt-1">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={childPassword}
                    onChange={(e) => setChildPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddChild(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-850"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-[#25cca7] hover:bg-[#1fb393] shadow-lg"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CHILD/MEMBER MODAL */}
      {showEditChild && editChildData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <Edit3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Editar Membro</h3>
            </div>
            <p className="text-[11px] text-slate-500">Altere o nome, e-mail ou senha de <strong className="text-slate-300">{editChildData.name}</strong>.</p>

            {error && (
              <div className="bg-red-950/40 text-red-400 border border-red-900/30 p-2.5 rounded-xl text-[10px] font-bold mt-3">
                {error}
              </div>
            )}

            <form onSubmit={handleEditChild} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nome</label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail de Login</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nova Senha <span className="text-slate-600 normal-case font-normal">(deixe vazio para manter)</span>
                </label>
                <div className="relative mt-1">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Nova senha (opcional)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-indigo-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowEditChild(false); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-[#a48cb3] hover:bg-[#9276a5] shadow-lg disabled:opacity-60 transition-colors"
                >
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {showEditTask && editTaskData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center gap-1.5 mb-1">
              <Edit3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Editar Dever</h3>
            </div>
            <p className="text-[11px] text-slate-500">Altere os dados do dever <strong className="text-slate-300">{editTaskData.title}</strong>.</p>

            {error && (
              <div className="bg-red-950/40 text-red-400 border border-red-900/30 p-2.5 rounded-xl text-[10px] font-bold mt-3">{error}</div>
            )}

            <form onSubmit={handleEditTask} className="mt-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Título do Dever</label>
                <input
                  type="text"
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-xs mt-1 text-white focus:outline-none focus:border-indigo-700"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição (Opcional)</label>
                <textarea
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-4 text-xs mt-1 text-white focus:outline-none focus:border-indigo-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categoria</label>
                  <select value={editTaskCategory} onChange={(e) => setEditTaskCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white">
                    <option value="Organização">Organização</option>
                    <option value="Estudos">Estudos</option>
                    <option value="Leitura">Leitura</option>
                    <option value="Higiene">Higiene</option>
                    <option value="Responsabilidade">Responsabilidade</option>
                    <option value="Atividades físicas">Atividades físicas</option>
                    <option value="Tarefas domésticas">Tarefas domésticas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dificuldade</label>
                  <select value={editTaskDifficulty} onChange={(e) => setEditTaskDifficulty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white">
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Recompensa</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {[{v:'COINS',l:'Moedas'},{v:'REAL_MONEY',l:'Dinheiro'},{v:'BOTH',l:'Ambos'}].map(opt => (
                    <button key={opt.v} type="button" onClick={() => setEditTaskRewardType(opt.v)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        editTaskRewardType === opt.v ? 'bg-indigo-600/20 border-indigo-600 text-indigo-300' : 'border-slate-800 text-slate-500 bg-slate-950'
                      }`}>{opt.l}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {editTaskRewardType !== 'REAL_MONEY' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moedas 🪙</label>
                    <input type="number" min="0" value={editTaskRewardCoins}
                      onChange={(e) => setEditTaskRewardCoins(parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white" />
                  </div>
                )}
                {editTaskRewardType !== 'COINS' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">R$</label>
                    <input type="number" step="0.50" min="0" value={editTaskRewardReal}
                      onChange={(e) => setEditTaskRewardReal(parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white" />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP</label>
                  <input type="number" min="0" value={editTaskXpReward}
                    onChange={(e) => setEditTaskXpReward(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prazo (Opcional)</label>
                <input type="date" value={editTaskDeadline}
                  onChange={(e) => setEditTaskDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs mt-1 text-white" />
              </div>

              {/* isDaily toggle */}
              <div
                onClick={() => setEditTaskIsDaily(v => !v)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                  editTaskIsDaily ? 'bg-indigo-600/10 border-indigo-600/40' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white">Pode ser feita mais de uma vez por dia</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">A criança pode enviar para aprovação várias vezes no mesmo dia</p>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${
                  editTaskIsDaily ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                }`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowEditTask(false); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg disabled:opacity-60 transition-colors">
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
