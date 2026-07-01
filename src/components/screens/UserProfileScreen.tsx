import React from 'react';
import { ArrowLeft, MapPin, Shield, ShieldOff } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function UserProfileScreen() {
  const {
    selectedUser, marketProducts, setSelectedProduct, setTempReturnProduct,
    handleBackFromUserProfile, handleBlockUser, currentUser,
  } = useAppContext();

  if (!selectedUser) return null;

  const userProducts = marketProducts.filter(p => p.userId === selectedUser.id);
  
  // ✅ Engellenim mi kontrolü
  const isBlocked = currentUser?.blocked?.includes(selectedUser.id) || false;

  return (
    <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
      <div className="px-4 flex items-center gap-3 bg-white dark:bg-zinc-900" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '16px' }}>
        <button onClick={handleBackFromUserProfile} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
          <ArrowLeft className="dark:text-white" />
        </button>
        <h2 className="font-bold text-lg dark:text-white">{selectedUser.name}</h2>
      </div>

      <div className="px-6 py-6 flex flex-col items-center">
        <img src={selectedUser.avatar} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-zinc-100 dark:border-zinc-800" />
        <h3 className="text-2xl font-bold dark:text-white mb-1">{selectedUser.name}</h3>
        <p className="text-zinc-500 mb-6 flex items-center gap-1">
          <MapPin size={14} /> {selectedUser.location || 'İstanbul'}
        </p>
        <div className="flex gap-8 mb-8">
          <div className="text-center">
            <span className="block text-xl font-bold dark:text-white">{selectedUser.swapCount || 0}</span>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Takas</span>
          </div>
          <div className="text-center">
            <span className="block text-xl font-bold dark:text-white">{userProducts.length}</span>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">İlan</span>
          </div>
        </div>
        
        {/* ✅ ENGELLE/ENGELLEME KALDIR BUTONU */}
        <button
          onClick={() => handleBlockUser(selectedUser)}
          className={`font-bold text-sm flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95 ${
            isBlocked
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
              : 'bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20'
          }`}
        >
          {isBlocked ? (
            <>
              <ShieldOff size={16} /> Engellemeyi Kaldır
            </>
          ) : (
            <>
              <Shield size={16} /> Kullanıcıyı Engelle
            </>
          )}
        </button>
      </div>

      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-t-3xl p-6 overflow-y-auto">
        <h3 className="font-bold text-zinc-500 mb-4">İlanları</h3>
        <div className="grid grid-cols-2 gap-4">
          {userProducts.map(p => (
            <div
              key={p.id}
              onClick={() => { setSelectedProduct(p); setTempReturnProduct(null); }}
              className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer"
            >
              <img src={p.image} className="aspect-square object-cover" />
              <div className="p-3">
                <p className="font-bold text-sm dark:text-white truncate">{p.title}</p>
                <p className="text-emerald-500 font-bold text-xs">{p.price.toLocaleString('tr-TR')} TL</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}