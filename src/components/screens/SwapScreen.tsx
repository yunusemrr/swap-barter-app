import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, PlusCircle, Repeat, MessageCircle, X } from 'lucide-react';
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

  const myProduct = myProducts.find(p => p.id === selectedMyProductId);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
      <div className="bg-[#00592e] pb-4 rounded-b-[35px] shadow-lg w-full mb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingLeft: '24px', paddingRight: '24px' }}>
        <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Takas Keşfet</h2>
        <h3 className="text-xs font-black italic text-white uppercase opacity-80">hayalindeki ürüne parasız ulaş</h3>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!selectedMyProductId ? (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">
            {myProducts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                  <PlusCircle size={40} className="text-zinc-300 dark:text-zinc-600" />
                </div>
                <h3 className="font-bold text-xl dark:text-white">Henüz Ürünün Yok</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
                  Takas yapmaya başlamak için önce bir ilan eklemelisin.
                </p>
                <button onClick={() => setView('upload')} className="bg-[#00592e] text-white px-6 py-3 rounded-xl font-bold mt-4">
                  Hemen İlan Ekle
                </button>
              </div>
            ) : (
              <>
                <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-xl mb-6 flex items-start gap-3">
                  <Sparkles className="text-[#ffab00] shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-green-700 text-sm mb-1">Takaslamak istediğin ürünü seç</h3>
                    <p className="text-[#ffab00]/80 text-xs">Seçtiğin ürünün değerine yakın ilanları senin için bulup getireceğiz.</p>
                  </div>
                </div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Ürünlerim ({myProducts.filter(p => !p.swapped).length})</h3>
                <div className="space-y-3 pb-20">
                  {myProducts.filter(p => !p.swapped).map(p => (
                    <div
                      key={p.id}
                      onClick={() => startSwapSession(p)}
                      className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-violet-500 transition-colors shadow-sm"
                    >
                      <img src={p.image} className="w-16 h-16 rounded-xl object-cover bg-zinc-100" onError={handleImageError} />
                      <div className="flex-1">
                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{p.title}</h4>
                        <p className="text-emerald-500 font-bold text-xs mt-1">{p.price.toLocaleString('tr-TR')} TL</p>
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full">{p.category}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                        <ArrowRight size={16} className="text-zinc-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center relative">
            <SwipeDeck candidates={swapCandidates} onSwipe={handleSwipe} />
            {swapCandidates.length === 0 && (
              <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <button
                  onClick={() => setSelectedMyProductId(null)}
                  className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-white px-6 py-3 rounded-full font-bold shadow-lg border border-zinc-200 dark:border-zinc-700 pointer-events-auto flex items-center gap-2"
                >
                  <Repeat size={16} /> Farklı Ürün Seç
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
