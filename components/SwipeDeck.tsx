import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { X, Check, Info } from 'lucide-react';
import { Product } from '../types';

interface SwipeDeckProps {
  candidates: Product[];
  onSwipe: (direction: 'left' | 'right', product: Product) => void;
}

interface CardProps {
  product: Product;
  onSwipe: (dir: 'left' | 'right') => void;
  index: number;
}

const Card: React.FC<CardProps> = ({ product, onSwipe, index }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const [expanded, setExpanded] = useState(false);
  
  // Color feedback overlay
  const rightOpacity = useTransform(x, [0, 150], [0, 0.5]);
  const leftOpacity = useTransform(x, [0, -150], [0, 0.5]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        zIndex: index,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        cursor: 'grab',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 select-none flex flex-col"
    >
      {/* Swipe Feedback Overlays */}
      <motion.div style={{ opacity: rightOpacity }} className="absolute inset-0 bg-green-500 z-20 pointer-events-none flex items-center justify-center">
        <Check className="text-white w-24 h-24" />
      </motion.div>
      <motion.div style={{ opacity: leftOpacity }} className="absolute inset-0 bg-red-500 z-20 pointer-events-none flex items-center justify-center">
        <X className="text-white w-24 h-24" />
      </motion.div>

      <div className="relative h-3/5 w-full flex-shrink-0">
        <img src={product.image} alt={product.title} className="w-full h-full object-cover pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
          <div className="text-white">
            <h2 className="text-3xl font-bold">{product.title}</h2>
            <p className="text-lg font-medium text-emerald-400">{product.price.toLocaleString('tr-TR')} TL</p>
          </div>
        </div>
      </div>
      <div 
         onClick={() => setExpanded(!expanded)} 
         className="p-6 flex-1 flex flex-col justify-start cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
      >
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              {product.category}
            </span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{product.condition}</span>
          </div>
          <p className={`text-zinc-600 dark:text-zinc-300 text-sm ${expanded ? '' : 'line-clamp-3'}`}>
             {product.description}
          </p>
        </div>
        {!expanded && (
           <div className="flex justify-center text-zinc-400 text-xs mt-auto pt-4">
             <Info size={14} className="mr-1" /> Detaylar için karta dokun
           </div>
        )}
      </div>
    </motion.div>
  );
};

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ candidates, onSwipe }) => {
  // We only render the top 2 cards for performance and visual stacking
  const activeCandidates = candidates.slice(0, 2);

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-full mb-4 animate-pulse">
          <X className="w-12 h-12 text-zinc-400" />
        </div>
        <h3 className="text-xl font-bold text-zinc-800 dark:text-white mb-2">Aday Kalmadı</h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          Bu fiyat aralığındaki şimdilik tüm ürünleri gördün. Daha sonra tekrar dene veya kriterlerini değiştir.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm h-[600px] mx-auto mt-4">
      <AnimatePresence>
        {activeCandidates.map((product, index) => (
          <Card 
            key={product.id} 
            product={product} 
            index={activeCandidates.length - index} // Reverse index so first is on top
            onSwipe={(dir) => onSwipe(dir, product)} 
          />
        )).reverse()} 
      </AnimatePresence>
      
      {/* Control Buttons */}
      <div className="absolute -bottom-24 left-0 right-0 flex justify-center space-x-8">
        <button 
          onClick={() => onSwipe('left', activeCandidates[0])}
          className="bg-white dark:bg-zinc-800 p-4 rounded-full shadow-lg text-red-500 hover:bg-red-50 hover:scale-110 transition-all border border-zinc-200 dark:border-zinc-700"
        >
          <X size={32} />
        </button>
        <button 
          onClick={() => onSwipe('right', activeCandidates[0])}
          className="bg-white dark:bg-zinc-800 p-4 rounded-full shadow-lg text-emerald-500 hover:bg-emerald-50 hover:scale-110 transition-all border border-zinc-200 dark:border-zinc-700"
        >
          <Check size={32} />
        </button>
      </div>
    </div>
  );
};