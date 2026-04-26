import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { useAppContext } from '../../context/AppContext';

const PAGE_SIZE = 6;

export function HomeScreen() {
  const {
    marketProducts, searchQuery, setSearchQuery, filters,
    setShowFilterModal, setSelectedProduct,
    contentRef, handleTouchStart, handleTouchEnd,
  } = useAppContext();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const prevQueryRef = useRef(searchQuery);
  const prevFiltersRef = useRef(filters);

  const filtered = marketProducts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filters.category === '' || p.category === filters.category;
    const matchesMin = filters.minPrice === '' || p.price >= Number(filters.minPrice);
    const matchesMax = filters.maxPrice === '' || p.price <= Number(filters.maxPrice);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
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

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
      <div className="bg-[#00592e] p-6 pb-8 rounded-b-[35px] shadow-lg shadow-violet-200 dark:shadow-none w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-sm uppercase">
            swap <span className="text-[#ffab00]">barter</span>
          </h1>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-zinc-400 w-4 h-4" />
            <input
              type="text"
              placeholder="İstediğin her şeyi ara..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-800 rounded-2xl border-none outline-none text-xs"
            />
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm text-[#ffab00] dark:text-white active:scale-90 transition-transform"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar"
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        {marketProducts.length === 0 && visible.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 pt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 pb-2">
                <div className="aspect-[4/5] bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-4 pt-6"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {visible.map(product => {
              const isFeatured = product.featured &&
                product.featuredUntil &&
                (product.featuredUntil?.toDate?.() ?? new Date(product.featuredUntil)) > new Date();
              return (
                <motion.div
                  key={product.id}
                  variants={staggerItem}
                  layoutId={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden shadow-sm pb-2 cursor-pointer ${isFeatured ? 'border-2 border-[#ffab00]' : 'border border-zinc-100 dark:border-zinc-800'}`}
                >
                  <div className="aspect-[4/5] relative">
                    <img src={product.image} className="w-full h-full object-cover" />
                    {isFeatured && (
                      <div className="absolute top-2 left-2 bg-[#ffab00] text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles size={10} />
                        ÖNE ÇIKAR
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-zinc-900 dark:text-white truncate text-sm mb-1">{product.title}</h3>
                    <p className="text-[#00592e] font-black text-sm">{product.price.toLocaleString('tr-TR')} TL</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
        {visibleCount < filtered.length && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-[#00592e] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
