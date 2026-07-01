import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, PlusCircle, Heart, Trash2, Settings } from 'lucide-react';
import { db } from '../../../firebaseConfig';
import { deleteDoc, doc } from 'firebase/firestore';
import { Product } from '../../../types';
import { useAppContext } from '../../context/AppContext';

export function ProfileScreen() {
  const {
    currentUser, myProducts, marketProducts, favorites, setFavorites,
    profileTab, setProfileTab, setView, setSelectedProduct,
    setUploadForm, setEditingProductId, swapCandidates, setSwapCandidates,
    setSelectedMyProductId, setSwapTab, blockedUsers,
  } = useAppContext();

  if (!currentUser) return null;

  const toggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleMyProductAction = (action: 'edit' | 'delete' | 'findMatch', product: Product) => {
    if (action === 'delete') {
      if (confirm(`${product.title} ilanını silmek istediğine emin misin?`))
        deleteDoc(doc(db, 'products', product.id)).catch(console.error);
    } else if (action === 'findMatch') {
      setSelectedMyProductId(product.id);
      const range = 0.3;
      const candidates = marketProducts.filter(p =>
        p.userId !== currentUser.id &&
        !blockedUsers.some(u => u.id === p.userId) &&
        p.price >= product.price * (1 - range) &&
        p.price <= product.price * (1 + range)
      );
      setSwapCandidates(candidates);
      setSwapTab('swipe');
      setView('swipe');
    } else if (action === 'edit') {
      setUploadForm({
        title: product.title, description: product.description,
        price: product.price.toString(), images: product.images || [product.image],
        category: product.category, condition: product.condition as any,
        preferredTradeCategory: product.preferredTradeCategory || '',
      });
      setEditingProductId(product.id);
      setSelectedProduct(null);
      setView('upload');
    }
  };

  return (
    <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
      <div className="bg-[#00592e] pb-8 rounded-b-[40px] shadow-lg shadow-green-100 dark:shadow-none w-full relative" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingLeft: '24px', paddingRight: '24px' }}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-white text-3xl font-black italic tracking-tighter uppercase">
            swap <span className="text-[#ffab00]">barter</span>
          </h1>
          <button onClick={() => setView('settings')} className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center -mt-10 pb-6 relative z-10">
        <img src={currentUser.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl mb-3" />
        <h2 className="text-2xl font-bold dark:text-white mb-1">{currentUser.name}</h2>
        <p className="text-zinc-500 text-sm flex items-center gap-1 mb-6">
          <MapPin size={12} /> {currentUser.location || 'Konum Yok'}
        </p>
        <div className="flex items-center justify-center gap-8 w-full px-6">
          <div className="text-center min-w-[60px]">
            <span className="block text-xl font-bold text-zinc-900 dark:text-white">{currentUser.swapCount || 0}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Takas</span>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
          <div className="text-center min-w-[60px]">
            <span className="block text-xl font-bold text-zinc-900 dark:text-white">4.9</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Puan</span>
          </div>
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
          <div className="text-center min-w-[60px]">
            <span className="block text-xl font-bold text-zinc-900 dark:text-white">{myProducts.length}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">İlan</span>
          </div>
        </div>
      </div>

      <div className="flex px-6 mb-4 border-b border-zinc-100 dark:border-zinc-800">
        <button
          onClick={() => setProfileTab('my')}
          className={`pb-3 px-4 font-bold text-sm transition-all relative ${profileTab === 'my' ? 'text-[#ffab00]' : 'text-zinc-400'}`}
        >
          İlanlarım
          {profileTab === 'my' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00592e]" />}
        </button>
        <button
          onClick={() => setProfileTab('favorites')}
          className={`pb-3 px-4 font-bold text-sm transition-all relative ${profileTab === 'favorites' ? 'text-[#ffab00]' : 'text-zinc-400'}`}
        >
          Favorilerim
          {profileTab === 'favorites' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00592e]" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20">
        {profileTab === 'my' ? (
          <div className="grid grid-cols-2 gap-4">
            {myProducts.map(p => (
              <div
                key={p.id}
                onClick={() => !p.swapped && setSelectedProduct(p)}
                className={`bg-zinc-50 dark:bg-zinc-800 rounded-2xl overflow-hidden relative group ${p.swapped ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <img src={p.image} className="aspect-square object-cover" />
                {p.swapped && (
                  <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center rounded-2xl">
                    <span className="text-white font-black text-sm tracking-wide bg-[#00592e]/80 px-3 py-1.5 rounded-full uppercase">Takaslandı</span>
                  </div>
                )}
                <div className="p-3">
                  <p className="font-bold text-sm truncate dark:text-white">{p.title}</p>
                  <p className={`font-bold text-xs ${p.swapped ? 'text-zinc-400' : 'text-emerald-500'}`}>{p.price.toLocaleString('tr-TR')} TL</p>
                </div>
                {!p.swapped && (
                  <button
                    onClick={e => { e.stopPropagation(); handleMyProductAction('delete', p); }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setView('upload')}
              className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <PlusCircle size={32} className="mb-2" />
              <span className="font-bold text-sm">Yeni Ekle</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {marketProducts.filter(p => favorites.includes(p.id)).map(p => (
              <div key={p.id} onClick={() => setSelectedProduct(p)} className="flex gap-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl cursor-pointer">
                <img src={p.image} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold dark:text-white">{p.title}</h4>
                  <p className="text-emerald-500 font-bold">{p.price.toLocaleString('tr-TR')} TL</p>
                  <div className="flex items-center gap-1 text-zinc-400 text-xs mt-2">
                    <MapPin size={10} /> {p.location}
                  </div>
                </div>
                <button onClick={e => toggleFavorite(e, p.id)} className="self-start text-red-500">
                  <Heart size={20} className="fill-current" />
                </button>
              </div>
            ))}
            {favorites.length === 0 && (
              <div className="text-center py-10 text-zinc-400">
                <Heart size={48} className="mx-auto mb-3 opacity-20" />
                <p>Henüz favorin yok.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
