import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Heart, ArrowLeftRight, Sparkles, ChevronRight } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { useAppContext } from '../../context/AppContext';

const PAGE_SIZE = 6;

export function HomeScreen() {
  const {
    marketProducts, searchQuery, setSearchQuery, filters,
    setShowFilterModal, setSelectedProduct,
    contentRef, handleTouchStart, handleTouchEnd,
    favorites, setFavorites,
    setView,
  } = useAppContext();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);
  const prevQueryRef = useRef(searchQuery);
  const prevFiltersRef = useRef(filters);

  const now = new Date();

  const featuredProducts = marketProducts.filter(p =>
    p.featured === true
  );

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
    const cardWidth = 316; // 300px card + 16px gap
    const index = Math.round(scrollLeft / cardWidth);
    setFeaturedIndex(index);
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollTo({ left: index * 316, behavior: 'smooth' });
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

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#F3F2EE' }}>

      {/* ── HEADER ── */}
      <div
        className="flex-shrink-0 w-full pb-6"
        style={{
          background: 'linear-gradient(165deg, #0F5A33 0%, #0B3F24 100%)',
          borderRadius: '0 0 30px 30px',
          paddingTop: 'env(safe-area-inset-top)',
        }}
      >
        {/* Logo row */}
        <div className="flex items-center px-6 pt-4 pb-4">
          <h1
            className="text-[30px] font-bold italic tracking-[-1px] leading-none"
            style={{ fontFamily: "'Space Grotesk', Inter, sans-serif", color: '#fff', letterSpacing: '-1px' }}
          >
            SWAP <span style={{ color: '#F5A623' }}>BARTER</span>
          </h1>
        </div>

        {/* Search row */}
        <div className="flex gap-3 px-6">
          <div
            className="flex-1 flex items-center gap-2 bg-white px-4"
            style={{ borderRadius: 16, height: 50, boxShadow: '0 6px 16px rgba(0,0,0,.12)' }}
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
            className="flex items-center justify-center bg-white active:scale-95 transition-transform"
            style={{ width: 50, height: 50, borderRadius: 16, boxShadow: '0 6px 16px rgba(0,0,0,.12)' }}
          >
            <SlidersHorizontal size={20} color="#F5A623" strokeWidth={2} />
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

        {/* ── FEATURED CAROUSEL ── */}
        {featuredProducts.length > 0 && (
          <div className="pt-5">
            {/* Section header */}
            <div className="flex items-center justify-between px-6 mb-3">
              <div className="flex items-center gap-2">
                <div style={{ width: 7, height: 18, background: '#F5A623', borderRadius: 4 }} />
                <span className="font-extrabold text-[18px] tracking-[-0.3px]" style={{ color: '#16241C' }}>
                  Öne Çıkan Takaslar
                </span>
              </div>
              <button
                className="flex items-center gap-1 text-[13px] font-semibold"
                style={{ color: '#0F5A33' }}
              >
                Tümünü gör <ChevronRight size={14} />
              </button>
            </div>

            {/* Cards */}
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
                  style={{ width: 300, scrollSnapAlign: 'start' }}
                >
                  <div
                    className="bg-white overflow-hidden"
                    style={{ borderRadius: 22, boxShadow: '0 14px 30px -12px rgba(13,60,33,.28)' }}
                  >
                    {/* Image area */}
                    <div className="relative" style={{ height: 172 }}>
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          className="w-full h-full object-cover"
                          alt={product.title}
                        />
                      ) : (
                        <div className="w-full h-full" style={{ background: 'repeating-linear-gradient(45deg,#e8e6df,#e8e6df 8px,#f0ede6 8px,#f0ede6 16px)' }} />
                      )}
                      {/* Badge */}
                      <div
                        className="absolute top-3 left-3 flex items-center gap-1"
                        style={{ background: '#F5A623', borderRadius: 20, padding: '5px 10px' }}
                      >
                        <Sparkles size={10} color="#fff" />
                        <span className="text-white font-extrabold" style={{ fontSize: 11 }}>ÖNE ÇIKAN</span>
                      </div>
                      {/* Save button */}
                      <button
                        onClick={(e) => toggleSave(product.id, e)}
                        className="absolute top-3 right-3 flex items-center justify-center"
                        style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.9)' }}
                      >
                        <Heart
                          size={16}
                          color="#0F5A33"
                          fill={savedListings.has(product.id) ? '#0F5A33' : 'none'}
                          strokeWidth={2}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[16px] truncate flex-1 mr-2" style={{ color: '#16241C' }}>
                          {product.title}
                        </span>
                        <span
                          className="font-semibold text-[11px] flex-shrink-0"
                          style={{ color: '#6A6A62', background: '#F1F0EA', padding: '4px 9px', borderRadius: 8 }}
                        >
                          {product.category}
                        </span>
                      </div>

                      <div className="flex items-end justify-between mt-3">
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
                          style={{ background: '#0F5A33', borderRadius: 13, padding: '11px 18px' }}
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

            {/* Pagination dots */}
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
                <div key={i} className="bg-white overflow-hidden" style={{ borderRadius: 18 }}>
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
                  style={{ borderRadius: 18, boxShadow: '0 6px 18px -8px rgba(0,0,0,.18)' }}
                >
                  <div style={{ height: 140 }}>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        className="w-full h-full object-cover"
                        alt={product.title}
                      />
                    ) : (
                      <div className="w-full h-full" style={{ background: 'repeating-linear-gradient(45deg,#e8e6df,#e8e6df 8px,#f0ede6 8px,#f0ede6 16px)' }} />
                    )}
                  </div>
                  <div style={{ padding: '11px 13px 14px' }}>
                    <h3 className="font-bold truncate" style={{ fontSize: 14, color: '#16241C' }}>
                      {product.title}
                    </h3>
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
