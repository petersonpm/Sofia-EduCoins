import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Sparkles, User, Key, Mail, Award, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login, registerParent } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('child'); // 'child' or 'parent'
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'parent' && isRegistering) {
        const user = await registerParent(name, email, password);
        if (user.role === 'PARENT') navigate('/parent');
      } else {
        const user = await login(email, password);
        if (user.role === 'PARENT') {
          navigate('/parent');
        } else {
          navigate('/child');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Premium Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-violet-500/10 rounded-full blur-[120px]"></div>

      {/* Main Container - Constrained to a Mobile App Viewport size */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl flex flex-col overflow-hidden relative z-10 my-4">
        
        {/* Header App Brand */}
        <header className="text-center pt-8 px-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-300 tracking-wider uppercase">Sofia EduCoins</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>Sofia</span>
            <span className="text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-xl border border-indigo-500/30">
              EduCoins
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Aprendendo responsabilidades e conquistando recompensas.
          </p>
        </header>

        {/* Tab Selector */}
        <div className="flex bg-slate-950/80 p-1.5 mx-6 mt-6 rounded-2xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('child');
              setIsRegistering(false);
              setError('');
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === 'child'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Perfil Infantil
          </button>
          <button
            onClick={() => {
              setActiveTab('parent');
              setIsRegistering(false);
              setError('');
              setEmail('');
              setPassword('');
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === 'parent'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Área dos Pais
          </button>
        </div>

        <div className="p-6">
          {/* Section details */}
          {activeTab === 'child' ? (
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl mx-auto flex items-center justify-center text-indigo-400 shadow-inner">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white mt-3">Oi! Que bom ver você!</h2>
              <p className="text-[11px] text-slate-400 mt-1">Coloque seu login para ver as tarefas do dia.</p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl mx-auto flex items-center justify-center text-indigo-400">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-white mt-3">
                {isRegistering ? 'Nova Conta de Responsável' : 'Painel de Controle Familiar'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">Gerencie tarefas, aprove metas e acompanhe economias.</p>
            </div>
          )}

          {/* Errors */}
          {error && (
            <div className="bg-red-950/50 text-red-400 border border-red-900/50 p-3 rounded-xl text-xs font-semibold text-center mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'parent' && isRegistering && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu Nome"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-hidden focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                E-mail de Login
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'child' ? 'sofia@educoins.com' : 'responsavel@email.com'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-hidden focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Senha</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-hidden focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs tracking-wider uppercase shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Carregando...' : isRegistering ? 'Confirmar Cadastro' : 'Entrar no Aplicativo'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle registration */}
          {activeTab === 'parent' && (
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
              >
                {isRegistering ? 'Já possui conta? Fazer Login' : 'Criar nova conta de Responsável'}
              </button>
            </div>
          )}


        </div>
      </div>

      <footer className="text-center mt-4 text-[10px] text-slate-500 relative z-10 font-bold">
        <span>Sofia EduCoins © 2026</span>
      </footer>

    </div>
  );
}
