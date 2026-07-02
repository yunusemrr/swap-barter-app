import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, PlusCircle, Repeat, MessageCircle, X, ArrowLeft, RefreshCw } from 'lucide-react';
import { db } from '../../../firebaseConfig';
import { addDoc, collection, getDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Product, Match, User, Offer } from '../../../types';
import { SwipeDeck } from '../../../components/SwipeDeck';
import { useAppContext } from '../../context/AppContext';

export function SwapScreen() {
  const {
    myProducts, marketProducts, blockedUsers, currentUser,
    selectedMyProductId, setSelectedMyProductId,
    swapCandidates, setSwapCandidates,
    setSwapTab, setView, handleImageError,
    setMatchTab, setActiveMatch, setOffers, offers,
  } = useAppContext();

  const [swipeSuccessProduct, setSwipeSuccessProduct] = useState<Product | null>(null);
  const [swipeSuccessOtherUser, setSwipeSuccessOtherUser] = useState<User | null>(null);

  const startSwapSession = (myProduct: Product) => {
    if (!currentUser) return;
    setSelectedMyProductId(myProduct.id);
    const range = 0.3;
    const candidates = marketProducts.filter(p =>
      p.userId !== currentUser.id &&
      !blockedUsers.some(u => u.id === p.userId) &&
      !p.swapped &&
      p.price >= myProduct.price * (1 - range) &&
      p.price <= myProduct.price * (1 + range)
    );
    setSwapCandidates(candidates);
    setSwapTab('swipe');
    setView('swipe');
  };

  const handleSwipe = async (direction: 'left' | 'right', product: Product) => {
    setSwapCandidates(prev => prev.filter(p => p.id !== product.id));
    if (direction !== 'right' || !selectedMyProductId || !currentUser) return;

    try {
      const otherUserSnap = await getDoc(doc(db, 'users', product.userId));
      const otherUser: User = otherUserSnap.exists()
        ? (otherUserSnap.data() as User)
        : { id: product.userId, name: product.userName || 'Kullanıcı', avatar: product.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.userId}` };

      const offerRef = await addDoc(collection(db, 'offers'), {
        fromUserId: currentUser.id,
        toUserId: product.userId,
        myProductId: selectedMyProductId,
        offeredProductId: product.id,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      const newOffer: Offer = {
        id: offerRef.id,
        fromUserId: currentUser.id,
        toUserId: product.userId,
        myProductId: selectedMyProductId,
        offeredProductId: product.id,
        status: 'pending',
        timestamp: Date.now(),
      };
      setOffers(prev => [newOffer, ...prev]);

      setSwipeSuccessProduct(product);
      setSwipeSuccessOtherUser(otherUser);
    } catch (e) { console.error('Teklif hatası', e); }
  };

  const handleOpenChatFromSwipe = () => {
    if (!currentUser || !swipeSuccessProduct || !swipeSuccessOtherUser || !selectedMyProductId) return;
    const chatId = [currentUser.id, swipeSuccessProduct.userId].sort().join('_');
    const directMatch: Match = {
      id: chatId,
      myProductId: selectedMyProductId,
      otherProductId: swipeSuccessProduct.id,
      otherUser: swipeSuccessOtherUser,
      timestamp: Date.now(),
    };
    setActiveMatch(directMatch);
    setMatchTab('messages');
    setSwipeSuccessProduct(null);
    setSwipeSuccessOtherUser(null);
    setView('chat');
  };

  const myProduct = myProducts.find(p => p.id === selectedMyProductId) || null;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#F3F2EE' }}>
      {/* ── HEADER ── */}
      <div
        className="flex-shrink-0 w-full px-6 pb-5"
        style={{
          background: 'linear-gradient(160deg, #12693b 0%, #0b3f24 92%)',
          borderRadius: '0 0 34px 34px',
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          {selectedMyProductId && (
            <button
              onClick={() => setSelectedMyProductId(null)}
              className="flex items-center justify-center active:scale-95 transition-transform"
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.14)' }}
            >
              <ArrowLeft size={17} color="#fff" />
            </button>
          )}
          <div>
            <h2 className="font-extrabold text-[20px] tracking-[-.4px]" style={{ color: '#fff' }}>Kaydırarak Eşleş</h2>
            <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,.65)' }}>
              Değeri yakın ürünleri keşfet
            </p>
          </div>
        </div>

        {selectedMyProductId && myProduct && (
          <div
            className="flex items-center gap-2.5 mt-4"
            style={{ background: 'rgba(255,255,255,.14)', borderRadius: 16, padding: '9px 12px' }}
          >
            <img src={myProduct.image} className="object-cover flex-shrink-0" style={{ width: 34, height: 34, borderRadius: 9 }} />
            <div className="flex-1 min-w-0">
              <p className="font-medium" style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>SENİN ÜRÜNÜN</p>
              <p className="font-bold text-[12.5px] truncate" style={{ color: '#fff' }}>
                {myProduct.title} · {Number(myProduct.price).toLocaleString('tr-TR')} TL
              </p>
            </div>
            <button
              onClick={() => setSelectedMyProductId(null)}
              className="font-bold flex-shrink-0"
              style={{ fontSize: 11.5, color: '#F5A623' }}
            >
              Değiştir
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!selectedMyProductId ? (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {myProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="flex items-center justify-center" style={{ width: 76, height: 76, borderRadius: '50%', background: '#F1F0EA' }}>
                  <PlusCircle size={34} color="#9A9A92" />
                </div>
                <h3 className="font-extrabold text-[18px]" style={{ color: '#16241C' }}>Henüz Ürünün Yok</h3>
                <p className="max-w-xs text-[13.5px]" style={{ color: '#9A9A92' }}>
                  Takas yapmaya başlamak için önce bir ilan eklemelisin.
                </p>
                <button
                  onClick={() => setView('upload')}
                  className="text-white font-bold mt-2"
                  style={{ background: '#0F5A33', borderRadius: 14, padding: '12px 22px' }}
                >
                  Hemen İlan Ekle
                </button>
              </div>
            ) : (
              <>
                <div
                  className="flex items-start gap-3 mb-5"
                  style={{ background: 'rgba(245,166,35,.12)', borderRadius: 16, padding: 14 }}
                >
                  <Sparkles size={19} color="#E8890C" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-[13.5px] mb-0.5" style={{ color: '#16241C' }}>Takaslamak istediğin ürünü seç</h3>
                    <p className="text-[12px]" style={{ color: '#8A6D2F' }}>Seçtiğin ürünün değerine yakın ilanları senin için bulup getireceğiz.</p>
                  </div>
                </div>
                <h3 className="font-bold mb-3" style={{ color: '#16241C', fontSize: 14.5 }}>
                  Ürünlerim ({myProducts.filter(p => !p.swapped).length})
                </h3>
                <div className="space-y-2.5 pb-20">
                  {myProducts.filter(p => !p.swapped).map(p => (
                    <div
                      key={p.id}
                      onClick={() => startSwapSession(p)}
                      className="flex items-center gap-3.5 p-3 bg-white cursor-pointer active:scale-[.99] transition-transform"
                      style={{ borderRadius: 18, boxShadow: '0 4px 14px -8px rgba(0,0,0,.12)' }}
                    >
                      <img src={p.image} className="object-cover flex-shrink-0" style={{ width: 60, height: 60, borderRadius: 14, background: '#F1F0EA' }} onError={handleImageError} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold truncate text-[14px]" style={{ color: '#16241C' }}>{p.title}</h4>
                        <p className="font-extrabold text-[13px] mt-0.5" style={{ color: '#0F5A33' }}>{p.price.toLocaleString('tr-TR')} TL</p>
                        <span className="inline-block font-semibold mt-1" style={{ fontSize: 10.5, background: '#F1F0EA', color: '#6A6A62', borderRadius: 8, padding: '2px 8px' }}>{p.category}</span>
                      </div>
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, borderRadius: '50%', background: '#F1F0EA' }}>
                        <ArrowRight size={14} color="#9A9A92" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center relative">
            <SwipeDeck candidates={swapCandidates} onSwipe={handleSwipe} myProduct={myProduct} />
            {swapCandidates.length === 0 && (
              <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <button
                  onClick={() => setSelectedMyProductId(null)}
                  className="flex items-center gap-2 font-bold pointer-events-auto"
                  style={{ background: '#fff', color: '#16241C', borderRadius: 20, padding: '11px 20px', boxShadow: '0 8px 20px -8px rgba(0,0,0,.2)' }}
                >
                  <RefreshCw size={15} /> Farklı Ürün Seç
                </button>
              </div>
            )}
          </div>
        )}

        {/* Swipe Success Overlay */}
        <AnimatePresence>
          {swipeSuccessProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
              onClick={() => { setSwipeSuccessProduct(null); setSwipeSuccessOtherUser(null); }}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">Teklif Gönderildi! 🎉</h3>
                  <button
                    onClick={() => { setSwipeSuccessProduct(null); setSwipeSuccessOtherUser(null); }}
                    className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-3 mb-5">
                  {myProduct && (
                    <div className="flex-1 text-center">
                      <img src={myProduct.image} className="w-16 h-16 rounded-xl object-cover mx-auto mb-1" onError={handleImageError} />
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{myProduct.title}</p>
                      <p className="text-[10px] text-zinc-400">Senin</p>
                    </div>
                  )}
                  <div className="flex flex-col items-center gap-1 px-2">
                    <div className="w-8 h-8 rounded-full bg-[#00592e] flex items-center justify-center">
                      <Repeat size={14} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center">
                    <img src={swipeSuccessProduct.image} className="w-16 h-16 rounded-xl object-cover mx-auto mb-1" onError={handleImageError} />
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate">{swipeSuccessProduct.title}</p>
                    <p className="text-[10px] text-zinc-400">Karşı Taraf</p>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-5">
                  Teklifin <span className="font-bold text-zinc-700 dark:text-zinc-200">{swipeSuccessOtherUser?.name}</span>'a iletildi. Kabul ederse Teklifler sekmesinde görünür.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setSwipeSuccessProduct(null); setSwipeSuccessOtherUser(null); }}
                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-2xl font-bold text-sm active:scale-95 transition-transform"
                  >
                    Devam Et
                  </button>
                  <button
                    onClick={handleOpenChatFromSwipe}
                    className="flex-[2] py-3 bg-[#00592e] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
                  >
                    <MessageCircle size={18} /> Mesaj Gönder
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
