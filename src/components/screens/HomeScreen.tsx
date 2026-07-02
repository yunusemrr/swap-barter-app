import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search, SlidersHorizontal, Heart, ArrowLeftRight, Sparkles, ChevronRight,
  ChevronDown, Bell, Layers, Smartphone, Gamepad2, Trophy, Star, MapPin,
} from 'lucide-react';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { useAppContext } from '../../context/AppContext';

const PAGE_SIZE = 6;

const CATEGORY_CHIPS: { id: string; label: string; Icon: any }[] = [
  { id: '',           label: 'Tümü',       Icon: Layers },
  { id: 'Elektronik', label: 'Elektronik', Icon: Smartphone },
  { id: 'Gaming',      label: 'Gaming',     Icon: Gamepad2 },
  { id: 'Koleksiyon',  label: 'Koleksiyon', Icon: Trophy },
];

export function HomeScreen() {
  const {
    marketProducts, searchQuery, setSearchQuery, filters, setFilters,
    setShowFilterModal, setSelectedProduct,
    contentRef, handleTouchStart, handleTouchEnd,
    favorites, setFavorites,
    setView, currentUser,
  } = useAppContext();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);
  const prevQueryRef = useRef(searchQuery);
  const prevFiltersRef = useRef(filters);

  const featuredProducts = marketProducts.filter(p => p.featured === true);

  const filtered = marketProducts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filters.category === '' || p.category === filters.category;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (prevQueryRef.current !== searchQuery || prevFiltersRef.current !== filters) {
      setVisibleCount(PAGE_SIZE);
      prevQueryRef.current = searchQuery;
      prevFiltersRef.current = filters;
    }
  }, [searchQuery, filters]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 150) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filtered.length));
    }
  }, [filtered.length]);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = 306; // 290px card + 16px gap
    const index = Math.round(scrollLeft / cardWidth);
    setFeaturedIndex(index);
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollTo({ left: index * 306, behavior: 'smooth' });
    setFeaturedIndex(index);
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedListings(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const visible = filtered.slice(0, visibleCount);
  const userInitial = (currentUser?.name || currentUser?.displayName || 'A').charAt(0).toUpperCase();
  const userCity = currentUser?.city || (typeof currentUser?.location === 'string' ? currentUser?.location : '') || 'Konum seçilmedi';

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#F3F2EE' }}>

      {/* ── HEADER ── */}
      <div
        className="flex-shrink-0 w-full pb-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #12693b 0%, #0b3f24 92%)',
          borderRadius: '0 0 34px 34px',
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        {/* Decorative light blobs */}
        <div className="pointer-events-none absolute" style={{
          top: -40, right: -30, width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,.35) 0%, rgba(245,166,35,0) 70%)',
        }} />
        <div className="pointer-events-none absolute" style={{
          top: 10, left: -50, width: 160, height: 160, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,.14) 0%, rgba(255,255,255,0) 70%)',
        }} />

        {/* Location + notification/avatar row */}
        <div className="flex items-center justify-between px-6 relative">
          <button className="flex flex-col items-start active:opacity-70 transition-opacity">
            <span className="font-semibold uppercase" style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', letterSpacing: '.5px' }}>
              KONUM
            </span>
            <span className="flex items-center gap-1 font-bold text-[14px]" style={{ color: '#fff' }}>
              <MapPin size={12} color="#F5A623" />
              {userCity}
              <ChevronDown size={13} color="rgba(255,255,255,.7)" />
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button className="relative flex items-center justify-center active:scale-95 transition-transform" style={{ width: 38, height: 38 }}>
              <Bell size={20} color="#fff" strokeWidth={2} />
              <span style={{ position: 'absolute', top: 6, right: 7, width: 7, height: 7, borderRadius: '50%', background: '#F5A623', border: '1.5px solid #0b3f24' }} />
            </button>
            <button
              onClick={() => setView('profile')}
              className="flex items-center justify-center font-bold active:scale-95 transition-transform"
              style={{
                width: 38, height: 38, borderRadius: '50%', color: '#fff', fontSize: 15,
                background: 'linear-gradient(145deg,#F5A623,#E8890C)',
                border: '2px solid rgba(255,255,255,.5)',
              }}
            >
              {userInitial}
            </button>
          </div>
        </div>

        {/* Logo row */}
        <div className="flex items-center px-6 pt-3 pb-4 relative">
          <h1
            className="text-[28px] font-bold italic tracking-[-1px] leading-none"
            style={{ fontFamily: "'Space Grotesk', Inter, sans-serif", color: '#fff', letterSpacing: '-1px' }}
          >
            SWAP <span style={{ color: '#F5A623' }}>BARTER</span>
          </h1>
        </div>

        {/* Search row */}
        <div className="flex gap-3 px-6 relative">
          <div
            className="flex-1 flex items-center gap-2 bg-white px-4"
            style={{ borderRadius: 16, height: 52, boxShadow: '0 8px 20px rgba(0,0,0,.16)' }}
          >
            <Search size={17} color="#9A9A92" strokeWidth={2} />
            <input
              type="text"
              placeholder="İstediğin her şeyi ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none border-none text-[15px]"
              style={{ color: '#16241C' }}
            />
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center justify-center active:scale-95 transition-transform"
            style={{ width: 52, height: 52, borderRadius: 16, background: '#F5A623', boxShadow: '0 8px 20px rgba(0,0,0,.16)' }}
          >
            <SlidersHorizontal size={20} color="#fff" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div
        className="flex-1 overflow-y-auto"
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >

        {/* ── KAYDIRARAK EŞLEŞ FEATURE MODULE ── */}
        <div className="px-6 pt-5">
          <div
            onClick={() => setView('swipe')}
            className="relative overflow-hidden cursor-pointer active:scale-[.98] transition-transform"
            style={{
              borderRadius: 22,
              padding: '18px 18px',
              background: 'linear-gradient(120deg,#0f5a33,#0b3f24)',
            }}
          >
            <div className="pointer-events-none absolute" style={{
              bottom: -30, right: -20, width: 140, height: 140, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,166,35,.30) 0%, rgba(245,166,35,0) 70%)',
            }} />
            <div className="flex items-center justify-between relative">
              <div className="flex-1 pr-3">
                <div
                  className="inline-flex items-center gap-1 mb-2"
                  style={{ background: 'rgba(245,166,35,.2)', borderRadius: 20, padding: '4px 10px' }}
                >
                  <Star size={11} color="#ffd36b" fill="#ffd36b" />
                  <span className="font-extrabold" style={{ fontSize: 10.5, color: '#ffd36b', letterSpacing: '.3px' }}>
                    YENİ ÖZELLİK
                  </span>
                </div>
                <h3 className="font-extrabold text-white text-[17px] leading-tight mb-1">Kaydırarak Eşleş</h3>
                <p className="text-[12.5px] mb-3" style={{ color: 'rgba(255,255,255,.75)' }}>
                  Değeri yakın ürünleri kaydırarak keşfet
                </p>
                <div
                  className="inline-flex items-center gap-1.5 bg-white font-bold active:scale-95 transition-transform"
                  style={{ borderRadius: 20, padding: '9px 16px', fontSize: 12.5, color: '#0b3f24' }}
                >
                  Hemen Başla <ChevronRight size={14} />
                </div>
              </div>
              <div className="relative flex-shrink-0" style={{ width: 70, height: 78 }}>
                <div style={{
                  position: 'absolute', width: 54, height: 68, borderRadius: 14, top: 6, left: 10,
                  background: 'linear-gradient(145deg,#4B8DE8,#2A5DB0)', transform: 'rotate(-10deg)',
                  boxShadow: '0 8px 16px rgba(0,0,0,.25)',
                }} />
                <div style={{
                  position: 'absolute', width: 54, height: 68, borderRadius: 14, top: 0, left: 0,
                  background: 'linear-gradient(145deg,#F5A623,#E8890C)', transform: 'rotate(8deg)',
                  boxShadow: '0 8px 16px rgba(0,0,0,.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Heart size={20} color="#fff" fill="#fff" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORY CHIPS ── */}
        <div
          className="flex overflow-x-auto gap-2.5 px-6 pt-5 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORY_CHIPS.map(({ id, label, Icon }) => {
            const isActive = filters.category === id;
            return (
              <button
                key={id || 'all'}
                onClick={() => setFilters(prev => ({ ...prev, category: id }))}
                className="flex-shrink-0 flex items-center gap-1.5 font-bold active:scale-95 transition-transform"
                style={{
                  borderRadius: 14,
                  padding: '9px 15px',
                  fontSize: 13,
                  background: isActive ? '#0F5A33' : '#F1F0EA',
                  color: isActive ? '#fff' : '#6A6A62',
                }}
              >
                <Icon size={14} strokeWidth={2.3} />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── FEATURED CAROUSEL ── */}
        {featuredProducts.length > 0 && (
          <div className="pt-6">
            <div className="flex items-center justify-between px-6 mb-3">
              <div className="flex items-center gap-2">
                <div style={{ width: 7, height: 18, background: '#F5A623', borderRadius: 4 }} />
                <span className="font-extrabold text-[18px] tracking-[-0.3px]" style={{ color: '#16241C' }}>
                  Öne Çıkan Takaslar
                </span>
              </div>
              <button className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: '#0F5A33' }}>
                Tümünü gör <ChevronRight size={14} />
              </button>
            </div>

            <div
              ref={carouselRef}
              onScroll={handleCarouselScroll}
              className="flex overflow-x-auto gap-4 px-6 pb-2"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="flex-none cursor-pointer"
                  style={{ width: 290, scrollSnapAlign: 'start' }}
                >
                  <div
                    className="bg-white overflow-hidden"
                    style={{ borderRadius: 24, boxShadow: '0 18px 36px -14px rgba(13,60,33,.34)' }}
                  >

                    {/* Image area */}
                    <div className="relative" style={{ height: 186 }}>
                      {product.images?.[0] ? (
                        <img src={product.images[0]} className="w-full h-full object-cover" alt={product.title} />
                      ) : (
                        <div className="w-full h-full" style={{ background: 'repeating-linear-gradient(45deg,#e8e6df,#e8e6df 8px,#f0ede6 8px,#f0ede6 16px)' }} />
                      )}
                      <div
                        className="absolute top-3 left-3 flex items-center gap-1"
                        style={{ background: '#F5A623', borderRadius: 20, padding: '5px 10px' }}
                      >
                        <Sparkles size={10} color="#fff" />
                        <span className="text-white font-extrabold" style={{ fontSize: 11 }}>ÖNE ÇIKAN</span>
                      </div>
                      <button
                        onClick={(e) => toggleSave(product.id, e)}
                        className="absolute top-3 right-3 flex items-center justify-center"
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.9)' }}
                      >
                        <Heart size={16} color="#0F5A33" fill={savedListings.has(product.id) ? '#0F5A33' : 'none'} strokeWidth={2} />
                      </button>
                      {/* Seller overlay */}
                      <div
                        className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2.5"
                        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 100%)' }}
                      >
                        <div
                          className="flex items-center justify-center font-bold flex-shrink-0"
                          style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(145deg,#F5A623,#E8890C)', color: '#fff', fontSize: 11 }}
                        >
                          {(product.userName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-semibold text-[12px] truncate flex-1">
                          {product.userName || 'Satıcı'}
                        </span>
                        <span className="flex items-center gap-0.5 text-white font-bold text-[11px]">
                          <Star size={10} color="#FFD36B" fill="#FFD36B" /> 4.9
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <span className="font-bold text-[16px] block truncate" style={{ color: '#16241C' }}>
                        {product.title}
                      </span>

                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="font-semibold text-[11px]" style={{ color: '#6A6A62', background: '#F1F0EA', padding: '4px 9px', borderRadius: 8 }}>
                          {product.category || '—'}
                        </span>
                        <span className="font-semibold text-[11px]" style={{ color: '#6A6A62', background: '#F1F0EA', padding: '4px 9px', borderRadius: 8 }}>
                          {product.city || 'Yakınında'}
                        </span>
                        {product.condition && (
                          <span className="font-semibold text-[11px]" style={{ color: '#6A6A62', background: '#F1F0EA', padding: '4px 9px', borderRadius: 8 }}>
                            {product.condition}
                          </span>
                        )}
                      </div>

                      <div style={{ height: 1, background: '#F1F0EA', margin: '12px 0' }} />

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="font-semibold uppercase tracking-[.5px]" style={{ fontSize: 10.5, color: '#9A9A92' }}>
                            TAKAS DEĞERİ
                          </p>
                          <p className="font-extrabold text-[19px]" style={{ color: '#0F5A33' }}>
                            {product.price ? `${Number(product.price).toLocaleString('tr-TR')} TL` : '—'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                          className="flex items-center gap-1.5 text-white font-bold text-[13px] active:scale-95 transition-transform"
                          style={{ background: 'linear-gradient(145deg,#12693b,#0b3f24)', borderRadius: 13, padding: '11px 18px' }}
                        >
                          <ArrowLeftRight size={14} strokeWidth={2.2} />
                          Takasla
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {featuredProducts.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-3">
                {featuredProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToCard(i)}
                    style={{
                      width: i === featuredIndex ? 22 : 6,
                      height: 6,
                      borderRadius: 9999,
                      background: i === featuredIndex ? '#0F5A33' : '#CDCBC3',
                      transition: 'all .3s',
                      border: 'none',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ALL LISTINGS ── */}
        <div className="px-6 pt-4 pb-2 flex items-center gap-2">
          <div style={{ width: 7, height: 18, background: '#0F5A33', borderRadius: 4 }} />
          <span className="font-extrabold text-[18px] tracking-[-0.3px]" style={{ color: '#16241C' }}>
            Tüm İlanlar
          </span>
        </div>

        <div className="px-6 pb-28">
          {marketProducts.length === 0 ? (
            <div className="grid grid-cols-2 gap-3.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white overflow-hidden" style={{ borderRadius: 20 }}>
                  <div className="w-full animate-pulse" style={{ height: 140, background: '#e8e8e2' }} />
                  <div className="p-3 space-y-2">
                    <div className="h-3 rounded animate-pulse w-3/4" style={{ background: '#e8e8e2' }} />
                    <div className="h-3 rounded animate-pulse w-1/2" style={{ background: '#e8e8e2' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-3.5"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {visible.map(product => (
                <motion.div
                  key={product.id}
                  variants={staggerItem}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white overflow-hidden cursor-pointer active:scale-[.98] transition-transform"
                  style={{ borderRadius: 20, boxShadow: '0 6px 18px -8px rgba(0,0,0,.18)' }}
                >

                  <div className="relative" style={{ height: 140 }}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} className="w-full h-full object-cover" alt={product.title} />
                    ) : (
                      <div className="w-full h-full" style={{ background: 'repeating-linear-gradient(45deg,#e8e6df,#e8e6df 8px,#f0ede6 8px,#f0ede6 16px)' }} />
                    )}
                    <button
                      onClick={(e) => toggleSave(product.id, e)}
                      className="absolute top-2.5 right-2.5 flex items-center justify-center"
                      style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.9)' }}
                    >
                      <Heart size={14} color="#0F5A33" fill={savedListings.has(product.id) ? '#0F5A33' : 'none'} strokeWidth={2} />
                    </button>
                  </div>
                  <div style={{ padding: '11px 13px 14px' }}>
                    <h3 className="font-bold truncate" style={{ fontSize: 14, color: '#16241C' }}>
                      {product.title}
                    </h3>
                    <p className="font-semibold truncate" style={{ fontSize: 11.5, color: '#9A9A92', marginTop: 3 }}>
                      {product.category || '—'}{product.city ? ` · ${product.city}` : ''}
                    </p>
                    <p className="font-extrabold" style={{ fontSize: 15, color: '#0F5A33', marginTop: 5 }}>
                      {product.price ? `${Number(product.price).toLocaleString('tr-TR')} TL` : '—'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {visibleCount < filtered.length && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0F5A33', borderTopColor: 'transparent' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
