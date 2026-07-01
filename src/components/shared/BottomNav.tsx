import React from 'react';
import { Home, ArrowLeftRight, Plus, MessageCircle, User as UserIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function BottomNav() {
  const { view, setView, selectedProduct } = useAppContext();

  if (view === 'chat' || selectedProduct) return null;

  const leftItems = [
    { id: 'home',    Icon: Home,            label: 'Ana Sayfa' },
    { id: 'swipe',   Icon: ArrowLeftRight,  label: 'Takasla' },
  ];
  const rightItems = [
    { id: 'matches', Icon: MessageCircle,   label: 'Mesajlar' },
    { id: 'profile', Icon: UserIcon,        label: 'Profil' },
  ];

  const NavBtn = ({ id, Icon, label }: { id: string; Icon: any; label: string }) => {
    const isActive = view === id;
    return (
      <button
        onClick={() => setView(id as any)}
        className="flex flex-col items-center justify-center gap-1 flex-1 active:scale-95 transition-transform"
      >
        <Icon
          size={22}
          strokeWidth={2.1}
          color={isActive ? '#F5A623' : '#9A9A92'}
          fill={isActive ? '#F5A623' : 'none'}
        />
        <span
          className="text-[11px]"
          style={{
            color: isActive ? '#F5A623' : '#9A9A92',
            fontWeight: isActive ? 700 : 600,
          }}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40 flex items-start"
      style={{
        background: '#fff',
        borderRadius: '28px 28px 44px 44px',
        boxShadow: '0 -8px 24px -10px rgba(0,0,0,.14)',
        padding: '13px 26px 0',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
        minHeight: 86,
      }}
    >
      {/* Left items */}
      {leftItems.map(item => <NavBtn key={item.id} {...item} />)}

      {/* Center FAB */}
      <div className="flex flex-col items-center flex-1" style={{ marginTop: -30 }}>
        <button
          onClick={() => setView('upload' as any)}
          className="flex items-center justify-center active:scale-95 transition-transform"
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#0F5A33',
            border: '4px solid #fff',
            boxShadow: '0 10px 22px -6px rgba(15,90,51,.6)',
          }}
        >
          <Plus size={26} color="#fff" strokeWidth={2.4} />
        </button>
        <span className="text-[11px] font-semibold mt-1" style={{ color: '#9A9A92' }}>
          İlan Ver
        </span>
      </div>

      {/* Right items */}
      {rightItems.map(item => <NavBtn key={item.id} {...item} />)}
    </div>
  );
}
