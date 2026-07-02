import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { X, Heart, RotateCcw, MapPin, Star } from 'lucide-react';
import { Product } from '../types';

interface SwipeDeckProps {
  candidates: Product[];
  onSwipe: (direction: 'left' | 'right', product: Product) => void;
  myProduct?: Product | null;
}

interface CardProps {
  product: Product;
  onSwipe: (dir: 'left' | 'right') => void;
  index: number;
  matchScore: number;
}

function computeMatch(myProduct: Product | null | undefined, product: Product): number {
  if (!myProduct?.price || !product.price) return 90;
  const diff = Math.abs(myProduct.price - product.price) / Math.max(myProduct.price, product.price);
  return Math.max(70, Math.round(100 - diff * 100));
}

const Card: React.FC<CardProps> = ({ product, onSwipe, index, matchScore }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, v => v / 18);
  const likeOpacity = useTransform(x, v => Math.max(0, Math.min(1, v / 100)));
  const passOpacity = useTransform(x, v => Math.max(0, Math.min(1, -v / 100)));

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 110) onSwipe('right');
    else if (info.offset.x < -110) onSwipe('left');
  };

  return (
    <motion.div
      style={{
        x, rotate, zIndex: index, position: 'absolute', inset: 0, cursor: 'grab',
        borderRadius: 26, boxShadow: '0 20px 40px -16px rgba(13,60,33,.4)',
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      exit={{ x: x.get() > 0 ? 620 : -620, rotate: x.get() > 0 ? 26 : -26, opacity: 0, transition: { duration: 0.32, ease: 'easeOut' } }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className="bg-white overflow-hidden select-none flex flex-col"
    >

      {/* BEĞEN / GEÇ stamps */}
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 left-6 z-30 pointer-events-none">
        <div style={{ transform: 'rotate(-14deg)', border: '3px solid #2ECC71', color: '#2ECC71', borderRadius: 10, padding: '5px 14px', fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>
          BEĞEN
        </div>
      </motion.div>
      <motion.div style={{ opacity: passOpacity }} className="absolute top-6 right-6 z-30 pointer-events-none">
        <div style={{ transform: 'rotate(14deg)', border: '3px solid #C0392B', color: '#C0392B', borderRadius: 10, padding: '5px 14px', fontWeight: 900, fontSize: 22, letterSpacing: 1 }}>
          GEÇ
        </div>
      </motion.div>

      {/* Photo area */}
      <div className="relative flex-shrink-0" style={{ height: 280 }}>
        {product.images?.[0] || product.image ? (
          <img src={product.images?.[0] || product.image} alt={product.title} className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="w-full h-full" style={{ background: 'repeating-linear-gradient(45deg,#e8e6df,#e8e6df 8px,#f0ede6 8px,#f0ede6 16px)' }} />
        )}
        <span
          className="absolute top-3 left-3 font-extrabold text-white"
          style={{ fontSize: 12, background: '#0F5A33', borderRadius: 20, padding: '5px 11px' }}
        >
          %{matchScore} Değer Eşleşmesi
        </span>
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-4 py-3"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.65) 0%, rgba(0,0,0,0) 100%)' }}
        >
          <div
            className="flex items-center justify-center font-bold flex-shrink-0"
            style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(145deg,#F5A623,#E8890C)', color: '#fff', fontSize: 12 }}
          >
            {(product.userName || 'S').charAt(0).toUpperCase()}
          </div>
          <span className="text-white font-semibold text-[13px] truncate flex-1">{product.userName || 'Satıcı'}</span>
          <span className="flex items-center gap-1 text-white text-[11.5px]">
            <MapPin size={11} /> {product.city || 'Yakın'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <h2 className="font-extrabold text-[17px] truncate" style={{ color: '#16241C' }}>{product.title}</h2>
        <span
          className="inline-block font-semibold w-fit mt-2"
          style={{ fontSize: 11, color: '#6A6A62', background: '#F1F0EA', borderRadius: 8, padding: '4px 9px' }}
        >
          {product.category || '—'}
        </span>
        <div style={{ height: 1, background: '#F1F0EA', margin: '10px 0' }} />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold uppercase tracking-[.5px]" style={{ fontSize: 10, color: '#9A9A92' }}>TAKAS DEĞERİ</p>
            <p className="font-extrabold text-[18px]" style={{ color: '#0F5A33' }}>
              {product.price ? `${Number(product.price).toLocaleString('tr-TR')} TL` : '—'}
            </p>
          </div>
          {product.condition && (
            <span className="font-semibold text-[11px]" style={{ color: '#6A6A62', background: '#F1F0EA', borderRadius: 8, padding: '5px 10px' }}>
              {product.condition}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const SwipeDeck: React.FC<SwipeDeckProps> = ({ candidates, onSwipe, myProduct }) => {
  const activeCandidates = candidates.slice(0, 3);

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="flex items-center justify-center mb-6" style={{ width: 84, height: 84, borderRadius: '50%', background: '#F1F0EA' }}>
          <X size={36} color="#9A9A92" />
        </div>
        <h3 className="font-extrabold text-[19px] mb-2" style={{ color: '#16241C' }}>Aday Kalmadı</h3>
        <p className="max-w-[220px] mx-auto text-[13.5px]" style={{ color: '#9A9A92' }}>
          Şu an için kriterlerine uygun başka ürün bulamadık.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full py-4">
      <div className="relative" style={{ width: 302, maxWidth: '86vw', height: 438, maxHeight: '58vh' }}>
        <AnimatePresence>
          {activeCandidates.map((product, i) => {
            const depth = activeCandidates.length - 1 - i; // 0 = front
            const isFront = depth === 0;
            if (isFront) {
              return (
                <Card
                  key={product.id}
                  product={product}
                  index={10}
                  matchScore={computeMatch(myProduct, product)}
                  onSwipe={(dir) => onSwipe(dir, product)}
                />
              );
            }
            return (
              <motion.div
                key={product.id}
                style={{
                  position: 'absolute', inset: 0,
                  transform: `scale(${1 - depth * 0.04}) translateY(${depth * 10}px) rotate(${depth % 2 === 0 ? -3 : 3}deg)`,
                  opacity: 0.9 - depth * 0.15,
                  zIndex: 10 - depth,
                  pointerEvents: 'none',
                  borderRadius: 26,
                  boxShadow: '0 20px 40px -16px rgba(13,60,33,.25)',
                }}
                className="bg-white overflow-hidden"
              >
                {(product.images?.[0] || product.image) && (
                  <img src={product.images?.[0] || product.image} className="w-full h-full object-cover" style={{ opacity: 0.7 }} />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Control buttons */}
      <div className="flex justify-center items-start gap-7 mt-7">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => onSwipe('left', activeCandidates[0])}
            className="flex items-center justify-center active:scale-90 transition-transform"
            style={{ width: 54, height: 54, borderRadius: '50%', background: '#fff', boxShadow: '0 8px 18px -8px rgba(0,0,0,.25)' }}
          >
            <X size={24} color="#C0392B" strokeWidth={2.6} />
          </button>
          <span className="font-bold" style={{ fontSize: 10.5, color: '#9A9A92' }}>GEÇ</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button
            className="flex items-center justify-center active:scale-90 transition-transform"
            style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', boxShadow: '0 8px 18px -8px rgba(0,0,0,.2)', marginTop: 5 }}
          >
            <RotateCcw size={18} color="#9A9A92" />
          </button>
          <span style={{ fontSize: 10.5, color: 'transparent' }}>·</span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <button
            onClick={() => onSwipe('right', activeCandidates[0])}
            className="flex items-center justify-center active:scale-90 transition-transform"
            style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(145deg,#12693b,#0b3f24)', boxShadow: '0 12px 24px -8px rgba(15,90,51,.55)' }}
          >
            <Heart size={28} color="#fff" fill="#fff" />
          </button>
          <span className="font-bold" style={{ fontSize: 10.5, color: '#0F5A33' }}>TEKLİF GÖNDER</span>
        </div>
      </div>
    </div>
  );
};
