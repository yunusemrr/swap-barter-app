import React from 'react';
import { Home, Repeat, PlusCircle, MessageCircle, User as UserIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function BottomNav() {
  const { view, setView, selectedProduct } = useAppContext();

  if (view === 'chat' || selectedProduct) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 flex justify-between items-center z-40 pb-safe">
      <button
        onClick={() => setView('home')}
        className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-[#ffab00]' : 'text-zinc-400'}`}
      >
        <Home size={24} className={view === 'home' ? 'fill-current' : ''} />
        <span className="text-[10px] font-bold">Ana Sayfa</span>
      </button>

      <button
        onClick={() => setView('swipe')}
        className={`flex flex-col items-center gap-1 ${view === 'swipe' ? 'text-[#ffab00]' : 'text-zinc-400'}`}
      >
        <Repeat size={24} />
        <span className="text-[10px] font-bold">Takasla</span>
      </button>

      <div className="relative -top-6">
        <button
          onClick={() => setView('upload')}
          className="w-16 h-16 bg-[#00592e] rounded-full flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/50 hover:scale-105 transition-transform"
        >
          <PlusCircle size={32} />
        </button>
      </div>

      <button
        onClick={() => setView('matches')}
        className={`flex flex-col items-center gap-1 ${view === 'matches' ? 'text-[#ffab00]' : 'text-zinc-400'}`}
      >
        <MessageCircle size={24} className={view === 'matches' ? 'fill-current' : ''} />
        <span className="text-[10px] font-bold">Mesajlar</span>
      </button>

      <button
        onClick={() => setView('profile')}
        className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-[#ffab00]' : 'text-zinc-400'}`}
      >
        <UserIcon size={24} className={view === 'profile' ? 'fill-current' : ''} />
        <span className="text-[10px] font-bold">Profil</span>
      </button>
    </div>
  );
}
