import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Shield, Users, PlusCircle, Check, X, Award, Flame, 
  Wallet, Sparkles, TrendingUp, BookOpen, Trash2, Edit3, 
  UserPlus, Mail, Key, User, Plus, DollarSign, ListTodo, 
  BarChart3, PiggyBank, Bell, AlertCircle, Coins, Trophy,
  ClipboardList, Home, Activity, ShoppingBag, Target, Heart, LogOut
} from 'lucide-react';
import AvatarRenderer from '../components/AvatarRenderer';

export default function ParentDashboard() {
  const { user, logout, refreshUser } = useAuth();
  
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
  
  // Task form fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState('Organização');
  const [taskDifficulty, setTaskDifficulty] = useState('Fácil');
  const [taskRewardType, setTaskRewardType] = useState('COINS'); // 'COINS', 'REAL_MONEY', 'BOTH'
  const [taskRewardCoins, setTaskRewardCoins] = useState(10);
  const [taskRewardReal, setTaskRewardReal] = useState(2.00);
  const [taskXpReward, setTaskXpReward] = useState(15);
  const [taskDeadline, setTaskDeadline] = useState('');

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

          <div className="flex items-center gap-3">
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
                        <span className="text-[8px] font-bold text-[#e6728a] bg-[#e6728a]/10 px-2 py-0.5 rounded-md">
                          {task.category} • {task.assignedTo?.name}
                        </span>
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
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                  Gerenciamento de Tarefas
                </h3>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="bg-[#25cca7] hover:bg-[#1fb393] text-slate-950 font-black py-1.5 px-3 rounded-xl text-[10px] flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3 h-3" /> Criar dever
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-500">Nenhuma tarefa criada.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md ${
                            task.status === 'APPROVED' ? 'bg-[#76c043]/10 text-[#76c043] border border-[#76c043]/20' :
                            task.status === 'COMPLETED' ? 'bg-[#fef01e]/10 text-[#fef01e] border border-[#fef01e]/20' :
                            task.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-900 text-slate-500'
                          }`}>
                            {task.status === 'APPROVED' ? 'OK' :
                             task.status === 'COMPLETED' ? 'PENDENTE' :
                             task.status === 'REJECTED' ? 'CORRIGIR' : 'ATIVO'}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">{task.category}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mt-1.5">{task.title}</h4>
                        <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                          Para: {task.assignedTo?.name} | Recompensa: {task.rewardType === 'REAL_MONEY' ? `R$ ${parseFloat(task.rewardReal).toFixed(2)}` : task.rewardType === 'COINS' ? `${task.rewardCoins} Moedas` : `${task.rewardCoins} Moedas + R$ ${parseFloat(task.rewardReal).toFixed(2)}`}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-950/20 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                  {children.map((child) => {
                    const isSelected = child.id === selectedChildId;
                    return (
                      <div
                        key={child.id}
                        onClick={() => setSelectedChildId(child.id)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between bg-slate-950 ${
                          isSelected ? 'border-[#a48cb3]' : 'border-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-[10px] font-bold text-slate-300">
                            Lvl {child.level}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{child.name}</h4>
                            <p className="text-[9px] text-slate-500">XP: {child.xp} • Streak: {child.streak} Dias</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] font-black text-[#fef01e]">🪙 {child.wallet?.balanceCoins || 0}</div>
                          <div className="text-[9px] font-bold text-[#25cca7]">R$ {parseFloat(child.wallet?.balanceReal || 0).toFixed(2)}</div>
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

    </div>
  );
}
