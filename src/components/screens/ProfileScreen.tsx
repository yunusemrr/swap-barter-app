import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, PlusCircle, Heart, Trash2, Settings, Star, ChevronRight,
  Bell, LogOut, History, ShieldCheck,
} from 'lucide-react';
import { db } from '../../../firebaseConfig';
import { deleteDoc, doc } from 'firebase/firestore';
import { Product } from '../../../types';
import { useAppContext } from '../../context/AppContext';

export function ProfileScreen() {
  const {
    currentUser, myProducts, marketProducts, favorites, setFavorites,
    profileTab, setProfileTab, setView, setSelectedProduct,
    setUploadForm, setEditingProductId, setSwapCandidates,
    setSelectedMyProductId, setSwapTab, blockedUsers, offers,
    handleLogout,
  } = useAppContext();

  if (!currentUser) return null;

  const activeListings = myProducts.filter(p => !p.swapped).length;
  const completedSwaps = offers.filter(o => o.status === 'accepted').length;
  const userInitial = (currentUser.name || 'K').charAt(0).toUpperCase();

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
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#F3F2EE' }}>
      {/* ── HEADER ── */}
      <div
        className="flex-shrink-0 w-full pb-12 px-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #12693b 0%, #0b3f24 92%)',
          borderRadius: '0 0 34px 34px',
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        <div className="pointer-events-none absolute" style={{
          top: -40, right: -30, width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,.30) 0%, rgba(245,166,35,0) 70%)',
        }} />

        <div className="flex items-start gap-3.5 relative">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              className="object-cover flex-shrink-0"
              style={{ width: 78, height: 78, borderRadius: 22, border: '3px solid rgba(255,255,255,.5)' }}
            />
          ) : (
            <div
              className="flex items-center justify-center flex-shrink-0 font-extrabold"
              style={{
                width: 78, height: 78, borderRadius: 22, fontSize: 30, color: '#fff',
                background: 'linear-gradient(145deg,#F5A623,#E8890C)', border: '3px solid rgba(255,255,255,.5)',
              }}
            >
              {userInitial}
            </div>
          )}

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="font-extrabold text-[19px] truncate" style={{ color: '#fff' }}>{currentUser.name}</h2>
                <Star size={15} color="#FFD36B" fill="#FFD36B" />
              </div>
              <button
                onClick={() => setView('settings')}
                className="flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.14)' }}
              >
                <Settings size={17} color="#fff" />
              </button>
            </div>
            <p className="flex items-center gap-1 text-[12.5px] mt-1" style={{ color: 'rgba(255,255,255,.7)' }}>
              <MapPin size={11} /> {currentUser.city || (typeof currentUser.location === 'string' ? currentUser.location : 'Konum Yok')}
            </p>
            <p className="flex items-center gap-1 text-[12.5px] mt-1 font-semibold" style={{ color: '#FFD36B' }}>
              <Star size={11} fill="#FFD36B" /> 4.9 <span style={{ color: 'rgba(255,255,255,.55)' }}>({completedSwaps} değerlendirme)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats card overlapping header */}
      <div className="px-6 relative" style={{ marginTop: -34 }}>
        <div
          className="flex items-center bg-white"
          style={{ borderRadius: 20, boxShadow: '0 10px 24px -10px rgba(0,0,0,.18)', padding: '16px 8px' }}
        >
          <div className="flex-1 text-center">
            <p className="font-extrabold text-[19px]" style={{ color: '#16241C' }}>{currentUser.swapCount || 0}</p>
            <p className="font-semibold uppercase" style={{ fontSize: 10, color: '#9A9A92', letterSpacing: '.4px' }}>Takas</p>
          </div>
          <div style={{ width: 1, height: 32, background: '#F1F0EA' }} />
          <div className="flex-1 text-center">
            <p className="font-extrabold text-[19px]" style={{ color: '#16241C' }}>{activeListings}</p>
            <p className="font-semibold uppercase" style={{ fontSize: 10, color: '#9A9A92', letterSpacing: '.4px' }}>Aktif İlan</p>
          </div>
          <div style={{ width: 1, height: 32, background: '#F1F0EA' }} />
          <div className="flex-1 text-center">
            <p className="font-extrabold text-[19px]" style={{ color: '#0F5A33' }}>%97</p>
            <p className="font-semibold uppercase" style={{ fontSize: 10, color: '#9A9A92', letterSpacing: '.4px' }}>Güven</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-28 pt-5">

        {/* ── İLANLARIM ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div style={{ width: 7, height: 18, background: '#0F5A33', borderRadius: 4 }} />
            <span className="font-extrabold text-[17px] tracking-[-0.3px]" style={{ color: '#16241C' }}>İlanlarım</span>
          </div>
          <button
            onClick={() => setView('upload')}
            className="flex items-center gap-1 text-white font-bold active:scale-95 transition-transform"
            style={{ background: '#0F5A33', borderRadius: 20, padding: '7px 13px', fontSize: 12 }}
          >
            <PlusCircle size={13} /> Yeni İlan
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5 mb-6">
          {myProducts.map(p => (
            <div
              key={p.id}
              onClick={() => !p.swapped && setSelectedProduct(p)}
              className={`bg-white overflow-hidden relative group ${p.swapped ? 'cursor-default' : 'cursor-pointer'}`}
              style={{ borderRadius: 18, boxShadow: '0 6px 18px -8px rgba(0,0,0,.14)' }}
            >

              <div className="relative" style={{ height: 120 }}>
                <img src={p.image} className="w-full h-full object-cover" style={{ opacity: p.swapped ? 0.7 : 1 }} />
                <span
                  className="absolute top-2 left-2 font-extrabold"
                  style={{
                    fontSize: 9.5, padding: '4px 8px', borderRadius: 20,
                    background: p.swapped ? 'rgba(0,0,0,.45)' : '#0F5A33', color: '#fff',
                  }}
                >
                  {p.swapped ? 'TAKAS OLDU' : 'AKTİF'}
                </span>
                {!p.swapped && (
                  <button
                    onClick={e => { e.stopPropagation(); handleMyProductAction('delete', p); }}
                    className="absolute top-2 right-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,.9)' }}
                  >
                    <Trash2 size={13} color="#C0392B" />
                  </button>
                )}
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <p className="font-bold truncate" style={{ fontSize: 13.5, color: '#16241C' }}>{p.title}</p>
                <p className="font-extrabold" style={{ fontSize: 13.5, color: p.swapped ? '#9A9A92' : '#0F5A33', marginTop: 3 }}>
                  {p.price.toLocaleString('tr-TR')} TL
                </p>
              </div>
            </div>
          ))}
          {myProducts.length === 0 && (
            <button
              onClick={() => setView('upload')}
              className="col-span-2 flex flex-col items-center justify-center py-10"
              style={{ borderRadius: 18, border: '2px dashed #CDCBC3', color: '#9A9A92' }}
            >
              <PlusCircle size={30} className="mb-2" />
              <span className="font-bold text-sm">İlk ilanını ekle</span>
            </button>
          )}
        </div>

        {/* ── QUICK LINKS ── */}
        <div className="grid grid-cols-2 gap-3.5 mb-6">
          <button
            onClick={() => setProfileTab(profileTab === 'favorites' ? 'my' : 'favorites')}
            className="flex flex-col items-start active:scale-[.98] transition-transform"
            style={{
              borderRadius: 18, padding: '14px 16px', textAlign: 'left',
              background: profileTab === 'favorites' ? '#0F5A33' : '#fff',
              boxShadow: '0 6px 18px -10px rgba(0,0,0,.14)',
            }}
          >
            <Heart size={18} color={profileTab === 'favorites' ? '#fff' : '#C0392B'} fill={profileTab === 'favorites' ? '#fff' : 'none'} />
            <span className="font-bold text-[14px] mt-2" style={{ color: profileTab === 'favorites' ? '#fff' : '#16241C' }}>
              Favorilerim
            </span>
            <span className="text-[11.5px]" style={{ color: profileTab === 'favorites' ? 'rgba(255,255,255,.7)' : '#9A9A92' }}>
              {favorites.length} ürün
            </span>
          </button>

          <button
            onClick={() => setView('matches')}
            className="flex flex-col items-start bg-white active:scale-[.98] transition-transform"
            style={{ borderRadius: 18, padding: '14px 16px', textAlign: 'left', boxShadow: '0 6px 18px -10px rgba(0,0,0,.14)' }}
          >
            <History size={18} color="#0F5A33" />
            <span className="font-bold text-[14px] mt-2" style={{ color: '#16241C' }}>Geçmiş</span>
            <span className="text-[11.5px]" style={{ color: '#9A9A92' }}>{completedSwaps} takas</span>
          </button>
        </div>

        {/* ── FAVORITES LIST (inline, shown when Favorilerim card active) ── */}
        {profileTab === 'favorites' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div style={{ width: 7, height: 18, background: '#C0392B', borderRadius: 4 }} />
              <span className="font-extrabold text-[17px] tracking-[-0.3px]" style={{ color: '#16241C' }}>Favorilerim</span>
            </div>
            <div className="space-y-2.5">
              {marketProducts.filter(p => favorites.includes(p.id)).map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="flex gap-3 bg-white p-3 cursor-pointer"
                  style={{ borderRadius: 16, boxShadow: '0 4px 14px -8px rgba(0,0,0,.12)' }}
                >
                  <img src={p.image} className="object-cover flex-shrink-0" style={{ width: 64, height: 64, borderRadius: 12 }} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate" style={{ fontSize: 14, color: '#16241C' }}>{p.title}</h4>
                    <p className="font-extrabold" style={{ fontSize: 13, color: '#0F5A33', marginTop: 2 }}>
                      {p.price.toLocaleString('tr-TR')} TL
                    </p>
                    <div className="flex items-center gap-1 mt-1" style={{ color: '#9A9A92', fontSize: 11 }}>
                      <MapPin size={10} /> {p.city || p.location as any}
                    </div>
                  </div>
                  <button onClick={e => toggleFavorite(e, p.id)} className="self-start flex-shrink-0">
                    <Heart size={18} color="#C0392B" fill="#C0392B" />
                  </button>
                </div>
              ))}
              {favorites.length === 0 && (
                <div className="text-center py-8" style={{ color: '#9A9A92' }}>
                  <Heart size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[13px]">Henüz favorin yok.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AYARLAR ── */}
        <div className="flex items-center gap-2 mb-3">
          <div style={{ width: 7, height: 18, background: '#0F5A33', borderRadius: 4 }} />
          <span className="font-extrabold text-[17px] tracking-[-0.3px]" style={{ color: '#16241C' }}>Ayarlar</span>
        </div>
        <div className="bg-white overflow-hidden" style={{ borderRadius: 18, boxShadow: '0 4px 14px -8px rgba(0,0,0,.12)' }}>
          <button
            onClick={() => setView('settings')}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-black/[.02] transition-colors"
            style={{ borderBottom: '1px solid #F1F0EA' }}
          >
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 10, background: '#F1F0EA' }}>
              <Bell size={16} color="#6A6A62" />
            </div>
            <span className="flex-1 text-left font-semibold text-[14px]" style={{ color: '#16241C' }}>Bildirimler</span>
            <ChevronRight size={16} color="#9A9A92" />
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-black/[.02] transition-colors"
          >
            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(192,57,43,.1)' }}>
              <LogOut size={16} color="#C0392B" />
            </div>
            <span className="flex-1 text-left font-semibold text-[14px]" style={{ color: '#C0392B' }}>Çıkış Yap</span>
          </button>
        </div>
      </div>
    </div>
  );
}
