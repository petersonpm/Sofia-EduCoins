import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AvatarRenderer from '../components/AvatarRenderer';
import { playCoinSound, playSuccessSound, playBuzzerSound } from '../utils/sound';
import { ArrowLeft, Sparkles, Store, Coins, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function AvatarShop() {
  const { user, refreshUser } = useAuth();
  
  const [shopItems, setShopItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL', 'HAIR', 'CLOTHES', 'ACCESSORY', 'MASCOT'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadShop = async () => {
    try {
      const res = await api.get('/shop');
      setShopItems(res.data);
      await refreshUser();
    } catch (err) {
      console.error('Erro ao carregar a loja:', err);
    }
  };

  useEffect(() => {
    loadShop();
  }, []);

  let parsedConfig = {
    equipped: { hair: 'default', clothes: 'default', accessory: 'none', mascot: 'none' },
    inventory: { hair: ['default'], clothes: ['default'], accessory: ['none'], mascot: ['none'] }
  };

  if (user?.avatarConfig) {
    try {
      parsedConfig = JSON.parse(user.avatarConfig);
    } catch (e) {}
  }
  const equipped = parsedConfig.equipped || parsedConfig;

  const handlePurchase = async (item) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post(`/shop/purchase/${item.id}`);
      playCoinSound();
      confetti({ particleCount: 60, spread: 50 });
      setSuccessMsg(res.data.message);
      
      // Auto-equip purchased item
      await handleEquip(item.category, item.assetKey);
      loadShop();
    } catch (err) {
      playBuzzerSound();
      setErrorMsg(err.response?.data?.error || 'Erro ao realizar compra.');
    } finally {
      setLoading(false);
    }
  };

  const handleEquip = async (category, assetKey) => {
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

  const filteredItems = activeCategory === 'ALL' 
    ? shopItems 
    : shopItems.filter(item => item.category === activeCategory);

  const categoryLabels = {
    ALL: 'Tudo',
    HAIR: 'Cabelos',
    CLOTHES: 'Vestimentas',
    ACCESSORY: 'Acessórios',
    MASCOT: 'Mascotes'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center font-medium">
      
      {/* Mobile view container */}
      <div className="w-full max-w-md bg-slate-900 border-x border-slate-800 min-h-screen shadow-2xl flex flex-col justify-between relative pb-12">
        
        {/* Navigation bar */}
        <nav className="bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
          <Link 
            to="/child" 
            className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Painel</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Store className="w-4.5 h-4.5 text-indigo-400" />
            <span className="text-sm font-black text-white uppercase tracking-wider">Loja de Avatares</span>
          </div>
          <div className="w-12"></div> {/* Spacer */}
        </nav>

        {/* Shop Contents */}
        <main className="flex-1 p-4 space-y-4 overflow-y-auto">
          
          {/* Banner Virtual custom */}
          <section className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-inner shrink-0">
                <AvatarRenderer config={user?.avatarConfig} size="sm" />
              </div>
              <div>
                <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/10">
                  Provador Virtual
                </span>
                <h2 className="text-sm font-black text-white mt-1">Guarda-Roupa</h2>
                <p className="text-[10px] text-slate-500">Mude seu visual quando quiser.</p>
              </div>
            </div>

            {/* Coins container */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-2 text-center min-w-16">
              <div className="text-[8px] text-amber-500 font-bold uppercase">Saldo</div>
              <div className="text-sm font-black text-amber-500 flex items-center justify-center gap-0.5 mt-0.5">
                <Coins className="w-3.5 h-3.5" />
                <span>{user?.wallet?.balanceCoins || 0}</span>
              </div>
            </div>
          </section>

          {/* Status feedback alerts */}
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

          {/* Category tabs filters */}
          <section className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800">
            {Object.entries(categoryLabels).map(([cat, label]) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-bold border transition-all ${
                  activeCategory === cat 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </section>

          {/* Grid Cards Shop Items */}
          <section className="grid grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const categoryKey = item.category.toLowerCase();
              const ownsItem = parsedConfig.inventory[categoryKey] && parsedConfig.inventory[categoryKey].includes(item.assetKey);
              const isEquipped = equipped[categoryKey] === item.assetKey;

              return (
                <div 
                  key={item.id} 
                  className={`bg-slate-950 rounded-2xl p-3 border flex flex-col justify-between transition-all ${
                    isEquipped ? 'border-indigo-600 bg-indigo-500/5' : 'border-slate-850'
                  }`}
                >
                  <div>
                    {/* Item preview avatar circle */}
                    <div className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-xl mx-auto flex items-center justify-center p-0.5 relative overflow-hidden">
                      <AvatarRenderer config={{ [categoryKey]: item.assetKey }} size="sm" />
                    </div>

                    <h3 className="text-xs font-bold text-white text-center mt-2 truncate">{item.name}</h3>
                    <p className="text-[8px] text-slate-500 text-center uppercase mt-0.5 tracking-wider font-bold">
                      {categoryLabels[item.category]}
                    </p>
                  </div>

                  <div className="mt-3">
                    {isEquipped ? (
                      <button 
                        disabled
                        className="w-full bg-indigo-600 text-white font-bold py-1.5 rounded-lg text-[9px] flex items-center justify-center gap-1"
                      >
                        Equipado
                      </button>
                    ) : ownsItem ? (
                      <button
                        onClick={() => handleEquip(item.category, item.assetKey)}
                        className="w-full bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold py-1.5 rounded-lg text-[9px] border border-slate-800"
                      >
                        Equipar
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={loading}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black py-1.5 rounded-lg text-[9px] flex items-center justify-center gap-0.5"
                      >
                        <Coins className="w-3 h-3" /> {item.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </main>

      </div>
    </div>
  );
}
