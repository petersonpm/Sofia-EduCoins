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
  ChevronDown,
  ChevronUp,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Library,
  BarChart2
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
        if (task.status === 'APPROVED' && task.approvedAt) {
          return isSameDay(task.approvedAt, day);
        }
        if ((task.status === 'COMPLETED' || task.status === 'REJECTED') && task.completedAt) {
          return isSameDay(task.completedAt, day);
        }
        return isSameDay(new Date(), day);
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

  // Navigation: 'summary', 'approvals', 'register', 'agenda', 'family'
  const [activeTab, setActiveTab] = useState('summary');

  // States
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [expenseRequests, setExpenseRequests] = useState([]);
  const [selectedInstIndices, setSelectedInstIndices] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});

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

  // Wallet adjustment modal
  const [showAdjustWallet, setShowAdjustWallet] = useState(false);
  const [adjustWalletChild, setAdjustWalletChild] = useState(null);
  const [adjustCoins, setAdjustCoins] = useState('');
  const [adjustReal, setAdjustReal] = useState('');

  // Report modal
  const [showReport, setShowReport] = useState(false);
  const [reportChild, setReportChild] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const openReport = (child) => {
    setSelectedChildId(child.id);
    setActiveTab('summary');
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load parent data
  const loadData = async () => {
    try {
      const [refreshedUser, tasksRes, expensesRes] = await Promise.all([
        refreshUser(),
        api.get('/tasks'),
        api.get('/expenses/requests')
      ]);

      if (refreshedUser && refreshedUser.children) {
        setChildren(refreshedUser.children);
        
        if (!selectedChildId && refreshedUser.children.length > 0) {
          setSelectedChildId(refreshedUser.children[0].id);
        }
      }

      setTasks(tasksRes.data);
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

  useEffect(() => {
    if (activeTab === 'summary' && selectedChildId && children.length > 0) {
      const child = children.find(c => c.id === selectedChildId);
      if (child) {
        setReportChild(child);
        setReportData(null);
        setReportLoading(true);
        api.get(`/tasks/report?childId=${selectedChildId}`)
          .then(res => {
            setReportData(res.data);
          })
          .catch(err => {
            setReportData(null);
          })
          .finally(() => {
            setReportLoading(false);
          });
      }
    } else if (activeTab === 'summary' && !selectedChildId) {
      setReportChild(null);
      setReportData(null);
    }
  }, [selectedChildId, activeTab, children]);

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

  const openAdjustWallet = (child) => {
    setAdjustWalletChild(child);
    setAdjustCoins(String(child.wallet?.balanceCoins ?? ''));
    setAdjustReal(String(parseFloat(child.wallet?.balanceReal || 0).toFixed(2)));
    setError('');
    setShowAdjustWallet(true);
  };

  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    if (!adjustWalletChild) return;
    setError('');
    setLoading(true);
    try {
      const payload = { childId: adjustWalletChild.id };
      if (adjustCoins !== '') payload.balanceCoins = adjustCoins;
      if (adjustReal !== '') payload.balanceReal = adjustReal;
      await api.patch('/wallet/adjust', payload);
      setSuccess(`Saldo de "${adjustWalletChild.name}" ajustado com sucesso!`);
      setShowAdjustWallet(false);
      setAdjustWalletChild(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao ajustar saldo.');
    } finally {
      setLoading(false);
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
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'APPROVED', approvedAt: new Date().toISOString() } : t));
    try {
      await api.post(`/tasks/${taskId}/approve`);
      loadData();
    } catch (err) {
      setTasks(originalTasks);
      alert('Erro ao aprovar tarefa.');
    }
  };

  const handleRejectTask = async (taskId) => {
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'REJECTED' } : t));
    try {
      await api.post(`/tasks/${taskId}/reject`);
      loadData();
    } catch (err) {
      setTasks(originalTasks);
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

  const handleDeleteAllInstances = async (instances) => {
    if (!window.confirm('Excluir esta tarefa e todas as suas repetições permanentemente?')) return;
    try {
      // Run optimistic updates locally
      const taskIds = instances.map(i => i.id);
      setTasks(prev => prev.filter(t => !taskIds.includes(t.id)));
      
      await Promise.all(instances.map(inst => api.delete(`/tasks/${inst.id}`)));
      loadData();
    } catch (err) {
      alert('Erro ao excluir tarefa e suas repetições.');
    }
  };

  const handleApproveExpense = async (expenseId) => {
    const originalExpenses = [...expenseRequests];
    setExpenseRequests(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'APPROVED' } : e));
    try {
      await api.post(`/expenses/${expenseId}/approve`);
      loadData();
    } catch (err) {
      setExpenseRequests(originalExpenses);
      alert(err.response?.data?.error || 'Erro ao aprovar compra.');
    }
  };

  const handleRejectExpense = async (expenseId) => {
    const originalExpenses = [...expenseRequests];
    setExpenseRequests(prev => prev.map(e => e.id === expenseId ? { ...e, status: 'REJECTED' } : e));
    try {
      await api.post(`/expenses/${expenseId}/reject`);
      loadData();
    } catch (err) {
      setExpenseRequests(originalExpenses);
      alert('Erro ao rejeitar compra.');
    }
  };

  const handleResetDaily = async () => {
    if (!window.confirm('Isso vai resetar todas as tarefas diárias para PENDENTE e remover as repetições do histórico. Confirmar?')) return;
    try {
      const res = await api.post('/tasks/reset-daily', selectedChildId ? { childId: selectedChildId } : {});
      setSuccess(res.data.message);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao reiniciar o dia.');
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  const pendingApprovalsCount = tasks.filter(t => t.status === 'COMPLETED').length;
  const approvedTasksCount = tasks.filter(t => t.status === 'APPROVED').length;
  const totalPaidReal = selectedChild ? parseFloat(selectedChild.wallet?.totalEarnedReal || 0) : 0;
  const totalPaidCoins = selectedChild ? (selectedChild.wallet?.totalEarnedCoins || 0) : 0;
  
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
              {/* Child selector chips */}
              {children.filter(c => c.role === 'CHILD').length > 0 && (
                <div className="flex gap-2 pb-1 overflow-x-auto select-none shrink-0 custom-scrollbar-horizontal border-b border-slate-800/50 pb-2">
                  {children.filter(c => c.role === 'CHILD').map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChildId(c.id)}
                      className={`shrink-0 px-3 py-1 rounded-xl text-[10px] font-black border transition-all ${
                        selectedChildId === c.id
                          ? 'bg-[#a48cb3] border-[#a48cb3] text-slate-955'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              {children.filter(c => c.role === 'CHILD').length === 0 ? (
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 text-center text-xs text-slate-500">
                  Cadastre um filho na aba Família para visualizar o resumo de desempenho.
                </div>
              ) : reportLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-400">Carregando desempenho...</p>
                </div>
              ) : !reportData ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Selecione um filho acima para carregar o resumo de desempenho.
                </div>
              ) : (
                <>
                  {/* Header / XP details */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-black text-white">{reportChild?.name}</h3>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nível {reportData.child?.level || 1} • {reportData.child?.xp || 0} XP
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {reportData.child?.streak > 0 ? (
                        <span className="flex items-center gap-0.5 text-orange-400 text-[9px] font-black bg-orange-550/10 border border-orange-550/20 px-2 py-0.5 rounded-lg">
                          <Flame className="w-3.5 h-3.5 fill-orange-400" /> {reportData.child.streak} {reportData.child.streak === 1 ? 'dia' : 'dias'}
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-500">Sem sequência ativa</span>
                      )}

                      <button
                        onClick={() => openAdjustWallet(reportChild)}
                        className="flex items-center gap-1 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/10 px-2.5 py-1 rounded-xl text-[9px] font-black transition-all cursor-pointer"
                        title="Zerar ou ajustar o saldo do dinheiro"
                      >
                        <Wallet className="w-3 h-3" /> Zerar / Ajustar Saldo
                      </button>
                    </div>
                  </div>

                  {/* Quick statistics widgets grid */}
                  <section className="grid grid-cols-3 gap-2.5">
                    <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-2xl flex flex-col justify-between">
                      <span className="text-[8px] text-slate-500 font-bold uppercase">Aprovadas</span>
                      <div className="text-sm font-black text-white mt-1 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                        {reportData.summary?.totalApproved || 0}
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-2xl flex flex-col justify-between">
                      <span className="text-[8px] text-slate-500 font-bold uppercase">Carteira (R$)</span>
                      <div className="text-sm font-black text-[#25cca7] mt-1">
                        R$ {reportData.wallet?.balanceReal.toFixed(2)}
                      </div>
                      <span className="text-[7px] text-slate-500 mt-0.5">Ganho: R$ {reportData.wallet?.totalEarnedReal.toFixed(2)}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-2xl flex flex-col justify-between">
                      <span className="text-[8px] text-slate-500 font-bold uppercase">Carteira (Coins)</span>
                      <div className="text-sm font-black text-yellow-400 mt-1 flex items-center gap-0.5">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        {reportData.wallet?.balanceCoins}
                      </div>
                      <span className="text-[7px] text-slate-500 mt-0.5">Ganho: {reportData.wallet?.totalEarnedCoins}</span>
                    </div>
                  </section>

                  {/* Recommendations / Improvement Tips */}
                  <div className="bg-amber-950/10 border border-amber-900/20 p-4 rounded-3xl space-y-2.5">
                    <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      O que {reportChild?.name} pode melhorar
                    </h4>
                    {reportData.recommendations && reportData.recommendations.length > 0 ? (
                      <ul className="space-y-1.5">
                        {reportData.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-[9.5px] text-slate-350 leading-relaxed flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold mt-0.5 shrink-0">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[9.5px] text-slate-400">
                        🎉 {reportChild?.name} está com excelente desempenho em todas as áreas! Continue acompanhando.
                      </p>
                    )}
                  </div>

                  {/* Daily Activity Heatmap/Chart */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-3">
                    <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      Consistência Diária (Últimos 14 dias)
                    </h4>
                    <div className="h-24 flex items-end justify-between gap-1 pt-4 pb-1 px-1">
                      {Object.entries(reportData.dailyActivity || {}).map(([dateStr, count]) => {
                        const date = new Date(dateStr + 'T00:00:00');
                        const dayLabel = date.getDate();
                        const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'narrow' });
                        const maxCount = Math.max(...Object.values(reportData.dailyActivity || {}), 1);
                        const percentHeight = (count / maxCount) * 100;

                        return (
                          <div key={dateStr} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-slate-950 text-slate-200 border border-slate-800 text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                              {count} {count === 1 ? 'tarefa' : 'tarefas'} ({date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })})
                            </div>
                            
                            {/* Bar */}
                            <div className="w-full bg-slate-900/60 border border-slate-900 rounded-t-md h-16 flex items-end overflow-hidden">
                              <div 
                                style={{ height: `${percentHeight}%` }} 
                                className={`w-full rounded-t-sm transition-all duration-500 ${
                                  count > 0 
                                    ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300' 
                                    : 'bg-transparent'
                                }`}
                              />
                            </div>

                            {/* Label */}
                            <div className="flex flex-col items-center text-[8px] mt-0.5">
                              <span className="text-slate-555 font-bold leading-none">{weekDay}</span>
                              <span className="text-slate-400 font-bold mt-0.5">{dayLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Breakdown Charts */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-indigo-400" />
                      Desempenho por Categoria (Últimos 30 dias)
                    </h4>

                    {reportData.categoryBreakdown?.length === 0 ? (
                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl text-center text-[10px] text-slate-500">
                        Nenhuma tarefa aprovada nos últimos 30 dias.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {reportData.categoryBreakdown.map((catInfo) => {
                          const totalCount = reportData.summary.totalApproved || 1;
                          const percent = Math.round((catInfo.count / totalCount) * 100);

                          // Category icons and colors
                          let emoji = '📋';
                          let barColor = 'bg-indigo-500';
                          if (catInfo.category.toLowerCase().includes('estudo')) {
                            emoji = '📚';
                            barColor = 'bg-blue-500';
                          } else if (catInfo.category.toLowerCase().includes('organiza')) {
                            emoji = '🧹';
                            barColor = 'bg-amber-500';
                          } else if (catInfo.category.toLowerCase().includes('higien')) {
                            emoji = '🧼';
                            barColor = 'bg-emerald-500';
                          } else if (catInfo.category.toLowerCase().includes('leitura')) {
                            emoji = '📖';
                            barColor = 'bg-violet-500';
                          } else if (catInfo.category.toLowerCase().includes('físic') || catInfo.category.toLowerCase().includes('fisic')) {
                            emoji = '⚽';
                            barColor = 'bg-rose-500';
                          }

                          return (
                            <div key={catInfo.category} className="bg-slate-950 border border-slate-850 p-3 rounded-2xl space-y-2 flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                                  <span>{emoji}</span> {catInfo.category}
                                </span>
                                <span className="text-[9px] font-black bg-slate-900 border border-slate-800 text-indigo-300 px-1.5 py-0.5 rounded-md">
                                  {catInfo.count}x aprovada(s)
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-[8px] text-slate-500 pt-1 border-t border-slate-900/50 flex-wrap">
                                {catInfo.coins > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-yellow-500/10 text-yellow-450 px-1.5 py-0.5 rounded-md font-bold">
                                    🪙 +{catInfo.coins}
                                  </span>
                                )}
                                {catInfo.real > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-[#25cca7]/10 text-[#25cca7] px-1.5 py-0.5 rounded-md font-bold">
                                    💵 +R$ {catInfo.real.toFixed(2)}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-0.5 bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-md font-bold">
                                  ✨ +{catInfo.xp} XP
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
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

          {/* TAB 3: AGENDA / CALENDAR VIEW */}
          {activeTab === 'agenda' && (() => {
            const childTasks = tasks.filter(t => t.assignedToId === selectedChildId);
            const groupedTasks = [];

            if (taskViewMode === 'all') {
              // "Ver Tudo" mode: show all active tasks (hide approved daily task history clones)
              const filtered = childTasks.filter(task => !(task.isDaily && task.status === 'APPROVED'));
              const dailyGroups = {};

              filtered.forEach(task => {
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
            } else {
              // Calendar modes ("weekly" or "monthly"):
              // 1. Identify all unique daily task definitions
              const dailyDefs = [];
              childTasks.forEach(task => {
                if (task.isDaily) {
                  const alreadyAdded = dailyDefs.some(d => 
                    d.title.trim().toLowerCase() === task.title.trim().toLowerCase() && 
                    d.category.trim().toLowerCase() === task.category.trim().toLowerCase()
                  );
                  if (!alreadyAdded) {
                    dailyDefs.push(task);
                  }
                }
              });

              // 2. Identify one-off tasks belonging to this date
              const oneOffTasks = childTasks.filter(task => {
                if (task.isDaily) return false;
                if (task.deadline) {
                  return isSameDay(task.deadline, selectedDate);
                }
                return isSameDay(task.createdAt, selectedDate);
              });

              const isToday = isSameDay(selectedDate, new Date());

              // 3. Map each daily task to its instances for the selected date
              dailyDefs.forEach(def => {
                const completions = childTasks.filter(task => {
                  if (!task.isDaily) return false;
                  if (task.title.trim().toLowerCase() !== def.title.trim().toLowerCase() ||
                      task.category.trim().toLowerCase() !== def.category.trim().toLowerCase()) {
                    return false;
                  }

                  if (task.status === 'APPROVED') {
                    return isSameDay(task.approvedAt, selectedDate);
                  }
                  if (task.status === 'COMPLETED' || task.status === 'REJECTED') {
                    return isSameDay(task.completedAt, selectedDate);
                  }

                  return isToday;
                });

                if (completions.length > 0) {
                  groupedTasks.push({
                    title: def.title,
                    description: def.description,
                    category: def.category,
                    difficulty: def.difficulty,
                    isDaily: true,
                    rewardType: def.rewardType,
                    rewardCoins: def.rewardCoins,
                    rewardReal: def.rewardReal,
                    xpReward: def.xpReward,
                    instances: completions
                  });
                } else {
                  groupedTasks.push({
                    title: def.title,
                    description: def.description,
                    category: def.category,
                    difficulty: def.difficulty,
                    isDaily: true,
                    rewardType: def.rewardType,
                    rewardCoins: def.rewardCoins,
                    rewardReal: def.rewardReal,
                    xpReward: def.xpReward,
                    instances: [{
                      ...def,
                      id: `virtual-${def.id}`,
                      status: 'PENDING',
                      completedAt: null,
                      approvedAt: null
                    }]
                  });
                }
              });

              oneOffTasks.forEach(task => {
                groupedTasks.push({
                  ...task,
                  instances: [task]
                });
              });
            }

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                    Agenda de Tarefas
                  </h3>
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    {selectedChild?.name || 'Nenhum selecionado'}
                  </span>
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
                              <button
                                onClick={() => handleDeleteTask(inst.id)}
                                className="text-red-400 hover:text-red-300 p-1.5 rounded-xl hover:bg-red-950/20 transition-all shrink-0"
                                title="Deletar dever"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      }
                      // Repeating Chores
                      const key = `${task.title}-${task.category}`;
                      const defaultIndex = task.instances.findIndex(inst => inst.status === 'COMPLETED');
                      const selectedIndex = selectedInstIndices[key] !== undefined 
                        ? selectedInstIndices[key] 
                        : (defaultIndex !== -1 ? defaultIndex : 0);
                      const selectedInstance = task.instances[selectedIndex] || task.instances[0];
                      const isExpanded = !!expandedTasks[key];

                      return (
                        <div key={gIdx} className="bg-slate-950 border border-slate-855 rounded-2xl p-3.5 space-y-4 shadow-sm hover:border-slate-800 transition-colors">
                          <div 
                            className="flex justify-between items-start cursor-pointer select-none"
                            onClick={() => setExpandedTasks(prev => ({ ...prev, [key]: !prev[key] }))}
                          >
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
                            {/* Edit/Delete repeating task header group */}
                            <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => openEditTask(task.instances[0])}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/20 transition-all"
                                title="Editar dever"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAllInstances(task.instances)}
                                className="p-1.5 rounded-xl text-red-500/80 hover:text-red-400 hover:bg-red-950/20 transition-all"
                                title="Excluir dever e todas repetições"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setExpandedTasks(prev => ({ ...prev, [key]: !prev[key] }))}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-white transition-all"
                                title={isExpanded ? "Esconder repetições" : "Mostrar repetições"}
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Lista de repetições concluídas (Aprovação rápida direta no card) */}
                          {task.instances.filter(inst => inst.status === 'COMPLETED').length > 0 && (
                            <div className="space-y-2 border-t border-slate-900 pt-3" onClick={e => e.stopPropagation()}>
                              {task.instances.filter(inst => inst.status === 'COMPLETED').map((inst) => {
                                const realIndex = task.instances.findIndex(i => i.id === inst.id);
                                return (
                                  <div key={inst.id} className="flex items-center justify-between bg-slate-900/40 border border-slate-850/40 p-2.5 rounded-xl text-xs gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-300 font-black">
                                          Repetição #{realIndex + 1}
                                        </span>
                                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-[#fef01e]/10 text-[#fef01e] border border-[#fef01e]/20 animate-pulse">
                                          COMPLETO
                                        </span>
                                      </div>
                                      <div className="text-[9px] text-slate-500 mt-0.5">
                                        Recompensa: {inst.rewardType === 'REAL_MONEY' ? `R$ ${parseFloat(inst.rewardReal).toFixed(2)}` : inst.rewardType === 'COINS' ? `${inst.rewardCoins} Moedas` : `${inst.rewardCoins} Moedas + R$ ${parseFloat(inst.rewardReal).toFixed(2)}`}
                                      </div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                      <button 
                                        onClick={() => handleRejectTask(inst.id)} 
                                        className="bg-red-955/20 text-red-400 border border-red-900/20 p-1.5 rounded-xl hover:bg-red-900/20 active:scale-95 transition-all" 
                                        title="Rejeitar"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => handleApproveTask(inst.id)} 
                                        className="bg-[#76c043] text-slate-955 p-1.5 rounded-xl hover:bg-[#609d34] active:scale-95 transition-all" 
                                        title="Aprovar"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {isExpanded && (
                            <>
                              {/* Seletor compacto de repetições (Checkpoints) */}
                              <div className="flex items-center gap-2 border-t border-slate-900 pt-3 flex-wrap">
                                <span className="text-[10px] text-slate-500 font-bold mr-1">Repetições:</span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {task.instances.map((inst, index) => {
                                    const isSelected = index === selectedIndex;
                                    let statusColor = "bg-slate-900 border-slate-850 text-slate-500";
                                    if (inst.status === 'APPROVED') {
                                      statusColor = "bg-[#76c043]/10 border-[#76c043]/30 text-[#76c043]";
                                    } else if (inst.status === 'COMPLETED') {
                                      statusColor = "bg-[#fef01e]/10 border-[#fef01e]/30 text-[#fef01e] animate-pulse";
                                    } else if (inst.status === 'REJECTED') {
                                      statusColor = "bg-red-500/10 border-red-500/30 text-red-400";
                                    }

                                    return (
                                      <button
                                        key={inst.id || index}
                                        type="button"
                                        onClick={() => setSelectedInstIndices(prev => ({ ...prev, [key]: index }))}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${statusColor} ${
                                          isSelected ? 'ring-2 ring-indigo-400 scale-110' : 'hover:scale-105 active:scale-95'
                                        }`}
                                        title={`Repetição #${index + 1}: ${inst.status}`}
                                      >
                                        {index + 1}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Detalhes da Repetição Selecionada */}
                              {selectedInstance && (
                                <div className="bg-slate-900/40 border border-slate-850/40 rounded-xl p-3 flex items-center justify-between text-xs transition-all">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-400 font-black">
                                        Repetição #${selectedIndex + 1}
                                      </span>
                                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                                        selectedInstance.status === 'APPROVED' ? 'bg-[#76c043]/10 text-[#76c043] border border-[#76c043]/20' :
                                        selectedInstance.status === 'COMPLETED' ? 'bg-[#fef01e]/10 text-[#fef01e] border border-[#fef01e]/20 animate-pulse' :
                                        selectedInstance.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-850 text-slate-500'
                                      }`}>
                                        {selectedInstance.status === 'APPROVED' ? 'OK' :
                                         selectedInstance.status === 'COMPLETED' ? 'PENDENTE' :
                                         selectedInstance.status === 'REJECTED' ? 'CORRIGIR' : 'ATIVO'}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 mt-1">
                                      Recompensa: {selectedInstance.rewardType === 'REAL_MONEY' ? `R$ ${parseFloat(selectedInstance.rewardReal).toFixed(2)}` : selectedInstance.rewardType === 'COINS' ? `${selectedInstance.rewardCoins} Moedas` : `${selectedInstance.rewardCoins} Moedas + R$ ${parseFloat(selectedInstance.rewardReal).toFixed(2)}`}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {selectedInstance.status === 'COMPLETED' && (
                                      <div className="flex gap-1">
                                        <button 
                                          onClick={() => handleRejectTask(selectedInstance.id)} 
                                          className="bg-red-950/20 text-red-400 border border-red-900/20 p-1.5 rounded-xl hover:bg-red-900/20 active:scale-95 transition-all" 
                                          title="Rejeitar"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                          onClick={() => handleApproveTask(selectedInstance.id)} 
                                          className="bg-[#76c043] text-slate-955 p-1.5 rounded-xl hover:bg-[#609d34] active:scale-95 transition-all" 
                                          title="Aprovar"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}

                                    <button 
                                      onClick={() => handleDeleteTask(selectedInstance.id)} 
                                      className="text-red-400 hover:text-red-350 p-1.5 rounded-xl hover:bg-red-955/20 transition-all flex items-center justify-center shrink-0" 
                                      title="Deletar repetição"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 4: REGISTER — TASK LIBRARY */}
          {activeTab === 'register' && (() => {
            // Group all tasks by child, then by title (for daily repeats)
            const allChildren = children.filter(c => c.role === 'CHILD');

            // For library view: show ONE representative per daily group (the PENDING one, or first)
            const getLibraryTasks = (childId) => {
              const childTasks = tasks.filter(t => t.assignedToId === childId);
              const seen = new Set();
              return childTasks.filter(task => {
                if (!task.isDaily) return true; // non-daily: always show
                const key = `${task.title}-${task.category}`;
                if (task.status === 'APPROVED') return false; // skip approved history clones
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });
            };

            const categoryColors = {
              'Organização': '#fca570',
              'Tarefas domésticas': '#fca570',
              'Estudos': '#7bc3db',
              'Leitura': '#a48cb3',
              'Higiene': '#f3aba2',
              'Atividades físicas': '#76c043',
              'Responsabilidade': '#25cca7',
            };

            return (
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Library className="w-4 h-4 text-indigo-400" />
                      Cadastro de Deveres
                    </h3>
                    <p className="text-[9px] text-slate-500 mt-0.5">Crie, edite e organize os deveres da família</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetDaily}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black py-1.5 px-2.5 rounded-xl text-[10px] flex items-center gap-1 transition-colors"
                      title="Zerar repetições e reiniciar tarefas diárias"
                    >
                      <RotateCcw className="w-3 h-3" /> Virar o Dia
                    </button>
                    <button
                      onClick={() => setShowCreateTask(true)}
                      className="bg-[#25cca7] hover:bg-[#1fb393] text-slate-950 font-black py-1.5 px-3 rounded-xl text-[10px] flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Criar dever
                    </button>
                  </div>
                </div>

                {/* Child selector chips */}
                {allChildren.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => setSelectedChildId('')}
                      className={`shrink-0 px-3 py-1 rounded-xl text-[10px] font-black border transition-all ${
                        !selectedChildId
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Todos
                    </button>
                    {allChildren.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedChildId(c.id)}
                        className={`shrink-0 px-3 py-1 rounded-xl text-[10px] font-black border transition-all ${
                          selectedChildId === c.id
                            ? 'bg-[#a48cb3] border-[#a48cb3] text-slate-950'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {c.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Per-child task lists */}
                {(selectedChildId ? allChildren.filter(c => c.id === selectedChildId) : allChildren).map(child => {
                  const libTasks = getLibraryTasks(child.id);
                  return (
                    <div key={child.id} className="space-y-2">
                      {/* Child label */}
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-800" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{child.name}</span>
                        <div className="h-px flex-1 bg-slate-800" />
                      </div>

                      {libTasks.length === 0 ? (
                        <button
                          onClick={() => { setSelectedChildId(child.id); setShowCreateTask(true); }}
                          className="w-full py-5 rounded-2xl border border-dashed border-slate-800 text-[10px] text-slate-500 hover:border-indigo-800/50 hover:text-indigo-400 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Nenhum dever cadastrado — clique para criar
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {libTasks.map(task => {
                            const dotColor = categoryColors[task.category] || '#7bc3db';
                            const statusBadge = task.status === 'PENDING'
                              ? { label: 'Ativo', cls: 'bg-slate-900 text-slate-400 border-slate-800' }
                              : task.status === 'COMPLETED'
                              ? { label: 'Enviado', cls: 'bg-[#fef01e]/10 text-[#fef01e] border-[#fef01e]/20 animate-pulse' }
                              : task.status === 'REJECTED'
                              ? { label: 'Corrigir', cls: 'bg-red-500/10 text-red-400 border-red-500/20' }
                              : { label: 'OK', cls: 'bg-[#76c043]/10 text-[#76c043] border-[#76c043]/20' };

                            return (
                              <div
                                key={task.id}
                                className="bg-slate-950 border border-slate-850 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-800 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Category dot */}
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}80` }}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="text-xs font-bold text-white truncate">{task.title}</h4>
                                      {task.isDaily && (
                                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase shrink-0">↻ Diária</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="text-[9px] text-slate-500">{task.category}</span>
                                      <span className="text-[9px] text-slate-600">•</span>
                                      <span className="text-[9px] text-slate-500">
                                        {task.rewardType === 'REAL_MONEY'
                                          ? `R$ ${parseFloat(task.rewardReal).toFixed(2)}`
                                          : task.rewardType === 'COINS'
                                          ? `🪙 ${task.rewardCoins}`
                                          : `🪙 ${task.rewardCoins} + R$ ${parseFloat(task.rewardReal).toFixed(2)}`}
                                      </span>
                                      <span className="text-[9px] text-slate-600">•</span>
                                      <span className="text-[9px] text-indigo-400">+{task.xpReward} XP</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-md border ${statusBadge.cls}`}>
                                    {statusBadge.label}
                                  </span>
                                  <button
                                    onClick={() => openEditTask(task)}
                                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-800/50 transition-all"
                                    title="Editar dever"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-900/50 transition-all"
                                    title="Excluir dever"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

                {allChildren.length === 0 && (
                  <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 text-center">
                    <Library className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-[11px] text-slate-500">Cadastre um filho primeiro para criar deveres.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 5: FAMILY DEPENDENTS & SAVINGS */}
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
                          {/* Report button (children only) */}
                          {child.role === 'CHILD' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openReport(child); }}
                              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-800/50 hover:bg-indigo-950/20 transition-all"
                              title="Ver relatório de desempenho"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Wallet adjust button (children only) */}
                          {child.role === 'CHILD' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openAdjustWallet(child); }}
                              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-[#25cca7] hover:border-[#25cca7]/40 hover:bg-[#25cca7]/10 transition-all"
                              title="Ajustar saldo"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                            </button>
                          )}
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

        {/* Sticky Mobile bottom navigation menu — 5 tabs */}
        <footer className="absolute bottom-5 left-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl py-2 shadow-2xl flex justify-around z-30 select-none">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-300 ${
              activeTab === 'summary'
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner'
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span className="text-[7px] font-bold uppercase tracking-wider">Resumo</span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-300 relative ${
              activeTab === 'approvals'
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner'
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            {totalApprovalsCount > 0 && (
              <span className="absolute top-0.5 right-1 bg-red-500 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {totalApprovalsCount}
              </span>
            )}
            <span className="text-[7px] font-bold uppercase tracking-wider">Aprovar</span>
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-300 ${
              activeTab === 'register'
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner'
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Library className="w-4.5 h-4.5" />
            <span className="text-[7px] font-bold uppercase tracking-wider">Cadastro</span>
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-300 ${
              activeTab === 'agenda'
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner'
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span className="text-[7px] font-bold uppercase tracking-wider">Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('family')}
            className={`flex flex-col items-center gap-1 py-1.5 px-2 rounded-xl transition-all duration-300 ${
              activeTab === 'family'
                ? 'text-indigo-400 bg-indigo-500/10 scale-105 shadow-inner'
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span className="text-[7px] font-bold uppercase tracking-wider">Família</span>
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

      {/* WALLET ADJUSTMENT MODAL */}
      {showAdjustWallet && adjustWalletChild && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-[#25cca7]" />
              <h3 className="text-base font-bold text-white">Ajustar Saldo</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Ajuste o saldo da carteira de <strong className="text-white">{adjustWalletChild.name}</strong>. Use os botões de zerar para apagar os saldos rapidamente.
            </p>

            {/* Current balances */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-[8px] text-slate-500 font-bold uppercase">Saldo Atual</div>
                <div className="text-sm font-black text-[#fef01e] mt-0.5">
                  🪙 {adjustWalletChild.wallet?.balanceCoins || 0}
                </div>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center">
                <div className="text-[8px] text-slate-500 font-bold uppercase">Saldo Atual</div>
                <div className="text-sm font-black text-[#25cca7] mt-0.5">
                  R$ {parseFloat(adjustWalletChild.wallet?.balanceReal || 0).toFixed(2)}
                </div>
              </div>
            </div>

            <form onSubmit={handleAdjustWallet} className="mt-4 space-y-4">
              {/* Coins adjustment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    🪙 Moedas (EduCoins)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdjustCoins('0')}
                    className="text-[9px] font-black text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded-lg hover:bg-red-900/30 transition-colors"
                  >
                    Zerar
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={adjustCoins}
                  onChange={(e) => setAdjustCoins(e.target.value)}
                  placeholder="Novo valor de moedas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-hidden focus:border-[#fef01e]/60 transition-colors"
                />
              </div>

              {/* Real adjustment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    💵 Dinheiro Real (R$)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdjustReal('0')}
                    className="text-[9px] font-black text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded-lg hover:bg-red-900/30 transition-colors"
                  >
                    Zerar
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustReal}
                  onChange={(e) => setAdjustReal(e.target.value)}
                  placeholder="Novo valor em R$"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-hidden focus:border-[#25cca7]/60 transition-colors"
                />
              </div>

              {/* Quick actions */}
              <div className="bg-slate-950 border border-red-900/20 rounded-xl p-3">
                <p className="text-[9px] text-slate-500 mb-2 font-bold">AÇÃO RÁPIDA</p>
                <button
                  type="button"
                  onClick={() => { setAdjustCoins('0'); setAdjustReal('0'); }}
                  className="w-full py-2 rounded-xl text-[10px] font-black text-red-400 bg-red-950/20 border border-red-900/30 hover:bg-red-900/30 transition-colors"
                >
                  🗑️ Zerar Tudo (Coins + R$)
                </button>
              </div>

              {error && (
                <div className="bg-red-950/40 text-red-400 border border-red-900/30 p-2.5 rounded-xl text-[10px] font-bold text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAdjustWallet(false); setAdjustWalletChild(null); setError(''); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-[#25cca7] hover:bg-[#1fb393] transition-colors shadow-lg disabled:opacity-60"
                >
                  {loading ? 'Salvando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PERFORMANCE REPORT MODAL */}
      {showReport && reportChild && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
            {/* Header */}
            <div className="p-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-400" />
                  Desempenho de {reportChild.name}
                </h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nível {reportData?.child?.level || 1} • {reportData?.child?.xp || 0} XP
                  {reportData?.child?.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-orange-400 ml-1.5">
                      <Flame className="w-3.5 h-3.5 fill-orange-400" /> {reportData.child.streak} {reportData.child.streak === 1 ? 'dia' : 'dias'} de ofensiva
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => { setShowReport(false); setReportChild(null); setReportData(null); }}
                className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-5 flex-1 min-h-0 custom-scrollbar">
              {reportLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="text-xs text-slate-400">Carregando relatório...</p>
                </div>
              ) : !reportData ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum dado encontrado para gerar o relatório.
                </div>
              ) : (
                <>
                  {/* Grid Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-850/40 border border-slate-800/60 p-3 rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Aprovadas</span>
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-lg font-black text-white">{reportData.summary?.totalApproved || 0}</div>
                      <span className="text-[8px] text-slate-500 mt-0.5">tarefas validadas</span>
                    </div>

                    <div className="bg-slate-850/40 border border-slate-800/60 p-3 rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Esta Semana</span>
                        <Calendar className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-lg font-black text-white">{reportData.summary?.thisWeek?.count || 0}</div>
                      <div className="flex items-center gap-1.5 text-[8.5px] text-slate-450 mt-0.5 flex-wrap">
                        {reportData.summary?.thisWeek?.coins > 0 && (
                          <span className="text-yellow-400 font-bold">+{reportData.summary.thisWeek.coins}m</span>
                        )}
                        {reportData.summary?.thisWeek?.real > 0 && (
                          <span className="text-[#25cca7] font-bold">+R$ {reportData.summary.thisWeek.real.toFixed(2)}</span>
                        )}
                        <span className="text-indigo-400">+{reportData.summary.thisWeek.xp} XP</span>
                      </div>
                    </div>

                    <div className="bg-slate-850/40 border border-slate-800/60 p-3 rounded-xl flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Este Mês</span>
                        <Activity className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-lg font-black text-white">{reportData.summary?.thisMonth?.count || 0}</div>
                      <div className="flex items-center gap-1.5 text-[8.5px] text-slate-450 mt-0.5 flex-wrap">
                        {reportData.summary?.thisMonth?.coins > 0 && (
                          <span className="text-yellow-400 font-bold">+{reportData.summary.thisMonth.coins}m</span>
                        )}
                        {reportData.summary?.thisMonth?.real > 0 && (
                          <span className="text-[#25cca7] font-bold">+R$ {reportData.summary.thisMonth.real.toFixed(2)}</span>
                        )}
                        <span className="text-indigo-400">+{reportData.summary.thisMonth.xp} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Activity Heatmap/Chart */}
                  <div className="bg-slate-850/20 border border-slate-800/50 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      Consistência Diária (Últimos 14 dias)
                    </h4>
                    <div className="h-24 flex items-end justify-between gap-1 pt-4 pb-1 px-1">
                      {Object.entries(reportData.dailyActivity || {}).map(([dateStr, count]) => {
                        const date = new Date(dateStr + 'T00:00:00');
                        const dayLabel = date.getDate();
                        const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'narrow' });
                        const maxCount = Math.max(...Object.values(reportData.dailyActivity || {}), 1);
                        const percentHeight = (count / maxCount) * 100;

                        return (
                          <div key={dateStr} className="flex-1 flex flex-col items-center gap-1 group relative">
                            {/* Tooltip */}
                            <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-slate-950 text-slate-200 border border-slate-800 text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                              {count} {count === 1 ? 'tarefa' : 'tarefas'} ({date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })})
                            </div>
                            
                            {/* Bar */}
                            <div className="w-full bg-slate-800/40 rounded-t-md h-16 flex items-end overflow-hidden">
                              <div 
                                style={{ height: `${percentHeight}%` }} 
                                className={`w-full rounded-t-sm transition-all duration-500 ${
                                  count > 0 
                                    ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300' 
                                    : 'bg-transparent'
                                }`}
                              />
                            </div>

                            {/* Label */}
                            <div className="flex flex-col items-center text-[8px]">
                              <span className="text-slate-500 font-bold">{weekDay}</span>
                              <span className="text-slate-400">{dayLabel}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-indigo-400" />
                      Desempenho por Categoria
                    </h4>

                    {reportData.categoryBreakdown?.length === 0 ? (
                      <div className="bg-slate-850/20 border border-slate-800/40 p-4 rounded-xl text-center text-[10px] text-slate-500">
                        Nenhuma tarefa aprovada nos últimos 30 dias.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {reportData.categoryBreakdown.map((catInfo) => {
                          const totalCount = reportData.summary.totalApproved || 1;
                          const percent = Math.round((catInfo.count / totalCount) * 100);

                          // Category icons and colors
                          let emoji = '📋';
                          let barColor = 'bg-indigo-500';
                          if (catInfo.category.toLowerCase().includes('estudo')) {
                            emoji = '📚';
                            barColor = 'bg-blue-500';
                          } else if (catInfo.category.toLowerCase().includes('organiza')) {
                            emoji = '🧹';
                            barColor = 'bg-amber-500';
                          } else if (catInfo.category.toLowerCase().includes('higien')) {
                            emoji = '🧼';
                            barColor = 'bg-emerald-500';
                          } else if (catInfo.category.toLowerCase().includes('leitura')) {
                            emoji = '📖';
                            barColor = 'bg-violet-500';
                          } else if (catInfo.category.toLowerCase().includes('físic') || catInfo.category.toLowerCase().includes('fisic')) {
                            emoji = '⚽';
                            barColor = 'bg-rose-500';
                          }

                          return (
                            <div key={catInfo.category} className="bg-slate-850/20 border border-slate-800/40 p-3 rounded-xl space-y-2 flex flex-col justify-between">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                                  <span>{emoji}</span> {catInfo.category}
                                </span>
                                <span className="text-[9px] font-black bg-slate-800/80 text-indigo-300 px-1.5 py-0.5 rounded-md">
                                  {catInfo.count}x
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[8px] text-slate-400">
                                  <span>Recompensas acumuladas:</span>
                                  <span>{percent}% do total</span>
                                </div>
                                <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 text-[8px] text-slate-400 pt-1 border-t border-slate-850/50 flex-wrap">
                                {catInfo.coins > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-yellow-500/10 text-yellow-400 px-1 rounded font-bold">
                                    +{catInfo.coins} moedas
                                  </span>
                                )}
                                {catInfo.real > 0 && (
                                  <span className="inline-flex items-center gap-0.5 bg-[#25cca7]/10 text-[#25cca7] px-1 rounded font-bold">
                                    +R$ {catInfo.real.toFixed(2)}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-0.5 bg-indigo-500/10 text-indigo-400 px-1 rounded font-bold">
                                  +{catInfo.xp} XP
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-850 bg-slate-900/50 flex gap-2">
              <button
                type="button"
                onClick={() => { setShowReport(false); setReportChild(null); setReportData(null); }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-400 bg-slate-850 hover:bg-slate-800 transition-colors text-center cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
