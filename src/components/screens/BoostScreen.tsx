import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, CheckCircle, Zap, TrendingUp, Eye, Clock, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAppContext } from '../../context/AppContext';

const BOOST_PRICE   = 150;
const BOOST_DAYS    = 7;
const FUNCTION_URL  = import.meta.env.VITE_BOOST_FUNCTION_URL as string;

type PaymentState = 'idle' | 'loading' | 'iframe' | 'success' | 'error';

export function BoostScreen() {
  const { boostProduct, setBoostProduct, setView, currentUser } = useAppContext();
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [iframeToken, setIframeToken]   = useState<string>('');
  const [merchantOid, setMerchantOid]   = useState<string>('');
  const [errorMsg, setErrorMsg]         = useState<string>('');

  // Firestore'dan ödeme durumunu real-time dinle
  useEffect(() => {
    if (!merchantOid || paymentState !== 'iframe') return;

    const unsub = onSnapshot(doc(db, 'boostOrders', merchantOid), (snap) => {
      const data = snap.data();
      if (data?.status === 'completed') setPaymentState('success');
      if (data?.status === 'failed')    setPaymentState('error');
    });

    return () => unsub();
  }, [merchantOid, paymentState]);

  if (!boostProduct) { setView('home'); return null; }

  const isAlreadyFeatured =
    boostProduct.featured &&
    boostProduct.featuredUntil &&
    (boostProduct.featuredUntil?.toDate?.() ?? new Date(boostProduct.featuredUntil)) > new Date();

  const featuredUntilDate = isAlreadyFeatured
    ? (boostProduct.featuredUntil?.toDate?.() ?? new Date(boostProduct.featuredUntil))
    : null;

  // PayTR token al ve iframe'i aç
  const handleStartPayment = async () => {
    if (!currentUser) return;
    setPaymentState('loading');
    setErrorMsg('');

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: boostProduct.id,
          userId:    currentUser.id,
          userEmail: currentUser.email || `${currentUser.id}@swapbarter.app`,
          userName:  currentUser.name,
        }),
      });

      const data = await res.json();

      if (!data.success || !data.token) {
        throw new Error(data.error || 'Token alınamadı');
      }

      setIframeToken(data.token);
      setMerchantOid(data.merchantOid);
      setPaymentState('iframe');
    } catch (err: any) {
      setErrorMsg(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      setPaymentState('error');
    }
  };

  const handleClose = () => {
    setView('home');
    setBoostProduct(null);
  };

  // ─── Başarı ekranı ─────────────────────────────────────────────────────────
  if (paymentState === 'success') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-zinc-900 p-8 text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 bg-[#00592e] rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle size={48} className="text-white" />
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Ürün Öne Çıkarıldı!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="font-bold text-zinc-700 dark:text-zinc-200">{boostProduct.title}</span>, ana sayfada ve kategoride üst sıralarda gösteriliyor.
          </p>
          <p className="text-xs text-zinc-400 mb-8">{BOOST_DAYS} gün boyunca öne çıkacak.</p>
          <button
            onClick={handleClose}
            className="w-full py-4 bg-[#00592e] text-white font-bold rounded-2xl text-lg active:scale-95 transition-transform"
          >
            Ana Sayfaya Dön
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── PayTR iframe overlay ──────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-900 overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="bg-[#00592e] p-6 pb-8 rounded-b-[35px] shadow-lg w-full">
        <button onClick={handleClose} className="mb-4 p-2 bg-white/20 text-white rounded-full w-fit">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={22} className="text-[#ffab00]" />
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tight">Öne Çıkar</h1>
        </div>
        <p className="text-white/70 text-sm">İlanını daha fazla kişiye ulaştır</p>
      </div>

      <div className="px-4 pt-6 pb-24 space-y-4">
        {/* Ürün Önizleme */}
        <div className="bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-700 flex items-center gap-4 p-3">
          <img src={boostProduct.image} alt={boostProduct.title} className="w-20 h-20 rounded-2xl object-cover" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-zinc-900 dark:text-white truncate">{boostProduct.title}</h3>
            <p className="text-[#00592e] font-black text-sm">{boostProduct.price.toLocaleString('tr-TR')} TL</p>
            <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
              {boostProduct.category}
            </span>
          </div>
          {isAlreadyFeatured && (
            <div className="flex items-center gap-1 bg-[#ffab00]/10 px-2 py-1 rounded-xl">
              <Sparkles size={12} className="text-[#ffab00]" />
              <span className="text-[10px] font-bold text-[#ffab00]">AKTİF</span>
            </div>
          )}
        </div>

        {/* Mevcut boost bildirimi */}
        {isAlreadyFeatured && featuredUntilDate && (
          <div className="bg-[#ffab00]/10 border border-[#ffab00]/30 rounded-2xl p-4 flex items-start gap-3">
            <Clock size={18} className="text-[#ffab00] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-zinc-900 dark:text-white">Bu ürün zaten öne çıkarılmış</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Bitiş: {featuredUntilDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-zinc-400 mt-1">Ödeme yaparak süreyi uzatabilirsiniz.</p>
            </div>
          </div>
        )}

        {/* Paket Kartı */}
        <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-sm border-2 border-[#00592e] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={18} className="text-[#ffab00]" fill="currentColor" />
                <span className="font-black text-zinc-900 dark:text-white text-base">7 Günlük Paket</span>
              </div>
              <p className="text-xs text-zinc-400">En popüler tercih</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-[#00592e]">{BOOST_PRICE} TL</p>
              <p className="text-xs text-zinc-400">{BOOST_DAYS} gün</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              { icon: TrendingUp, text: 'Ana sayfada üst sırada gösterilir' },
              { icon: Eye,        text: 'Kategorinde ilk sırada listelenir' },
              { icon: Sparkles,   text: '"Öne Çıkar" rozeti ile dikkat çeker' },
              { icon: Zap,        text: '7 gün boyunca maksimum görünürlük' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#00592e]/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-[#00592e]" />
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hata mesajı */}
        {paymentState === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-600 dark:text-red-400">Ödeme başarısız</p>
              <p className="text-xs text-red-500 mt-0.5">{errorMsg || 'Lütfen tekrar deneyin.'}</p>
            </div>
          </div>
        )}

        {/* Bilgi notu */}
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Ödeme PayTR güvencesi ile işlenir. Kart bilgileriniz şifrelenerek iletilir. Ödeme tamamlandığında ilanınız anında öne çıkar.
          </p>
        </div>
      </div>

      {/* Alt Ödeme Butonu */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
        <button
          onClick={handleStartPayment}
          disabled={paymentState === 'loading'}
          className="w-full py-4 bg-[#00592e] text-white font-black rounded-2xl text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {paymentState === 'loading' ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={20} className="text-[#ffab00]" />
              {paymentState === 'error' ? 'Tekrar Dene' : `Öde ve Öne Çıkar — ${BOOST_PRICE} TL`}
            </>
          )}
        </button>
      </div>

      {/* PayTR iFrame Modal */}
      <AnimatePresence>
        {paymentState === 'iframe' && iframeToken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900">
              <span className="font-bold text-zinc-900 dark:text-white text-sm">PayTR Güvenli Ödeme</span>
              <button
                onClick={() => setPaymentState('idle')}
                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800"
              >
                <X size={18} className="text-zinc-600 dark:text-zinc-300" />
              </button>
            </div>
            <iframe
              src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
              id="paytriframe"
              className="flex-1 w-full border-0 bg-white"
              title="PayTR Ödeme"
              allow="payment"
            />
            <div className="bg-white dark:bg-zinc-900 py-2 text-center">
              <p className="text-[10px] text-zinc-400">
                🔒 Ödeme bilgileriniz 256-bit SSL şifreleme ile korunmaktadır.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
