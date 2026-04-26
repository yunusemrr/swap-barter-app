import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function FilterModal() {
  const {
    showFilterModal, setShowFilterModal, filters, setFilters,
    handleClearFilters, handleApplyFilters,
  } = useAppContext();

  if (!showFilterModal) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        className="bg-white dark:bg-zinc-900 w-full rounded-t-[40px] p-8 pb-10 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black dark:text-white italic text-[#00592e]">Filtrele</h3>
          <button
            onClick={() => setShowFilterModal(false)}
            className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"
          >
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Kategori</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['Elektronik', 'Moda', 'Ev', 'Hobi'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilters(f => ({ ...f, category: cat }))}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${filters.category === cat ? 'bg-[#00592e] text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Fiyat Aralığı (TL)</label>
            <div className="flex gap-4">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl outline-none text-sm font-bold dark:text-white"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl outline-none text-sm font-bold dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClearFilters}
              className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold rounded-2xl"
            >
              Temizle
            </button>
            <button
              onClick={handleApplyFilters}
              className="flex-[2] py-4 bg-[#00592e] text-white font-bold rounded-2xl shadow-lg shadow-green-100"
            >
              Sonuçları Gör
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
