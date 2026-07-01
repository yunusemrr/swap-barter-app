import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, RefreshCw, Clock, CheckCircle, XCircle } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { db } from '../../../firebaseConfig';
import { addDoc, collection, serverTimestamp, updateDoc, doc, getDoc, increment } from 'firebase/firestore';
import { Match, Offer, User } from '../../../types';
import { useAppContext } from '../../context/AppContext';

export function MatchesScreen() {
  const {
    matches, offers, setOffers, setMatches, currentUser, setCurrentUser,
    myProducts, marketProducts, matchTab, setMatchTab,
    setSelectedProduct, handleOpenChat, setActiveMatch, setView, setNewMatch,
  } = useAppContext();

  const handleOfferResponse = async (offerId: string, response: 'accepted' | 'rejected') => {
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: response } : o));
    try {
      await updateDoc(doc(db, 'offers', offerId), { status: response });
    } catch (e) { console.error('Teklif güncellenemedi', e); }

    if (response !== 'accepted' || !currentUser) return;

    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    try {
      const otherUserSnap = await getDoc(doc(db, 'users', offer.fromUserId));
      const otherUser: User = otherUserSnap.exists()
        ? (otherUserSnap.data() as User)
        : { id: offer.fromUserId, name: 'Kullanıcı', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${offer.fromUserId}` };

      const matchData = {
        myProductId: offer.myProductId, otherProductId: offer.offeredProductId,
        users: [currentUser.id, offer.fromUserId],
        user1: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
        user2: { id: otherUser.id, name: otherUser.name, avatar: otherUser.avatar },
        lastMessage: '', timestamp: serverTimestamp(),
        status: 'pending', confirmedBy: [],
        user1Id: currentUser.id, user2Id: offer.fromUserId,
      };
      await Promise.all([
        updateDoc(doc(db, 'users', currentUser.id), { swapCount: increment(1) }),
        updateDoc(doc(db, 'users', offer.fromUserId), { swapCount: increment(1) }),
      ]);
      setCurrentUser(prev => prev ? { ...prev, swapCount: (prev.swapCount || 0) + 1 } : prev);

      const [ref] = await Promise.all([
        addDoc(collection(db, 'matches'), matchData),
        updateDoc(doc(db, 'products', offer.myProductId), { swapped: true }),
        updateDoc(doc(db, 'products', offer.offeredProductId), { swapped: true }),
      ]);
      const newMatchObj: Match = {
        id: ref.id, myProductId: offer.myProductId,
        otherProductId: offer.offeredProductId, otherUser, timestamp: Date.now(),
        status: 'pending', confirmedBy: [], user1Id: currentUser.id, user2Id: offer.fromUserId,
      };
      setMatches(prev => [newMatchObj, ...prev]);
      setNewMatch(newMatchObj);
    } catch (e) { console.error('Match oluşturulamadı', e); }
  };

  const handleStartChatFromOffer = (offer: Offer) => {
    if (!currentUser) return;
    const isMyOffer = offer.fromUserId === currentUser.id;
    const otherUserId = isMyOffer ? offer.toUserId : offer.fromUserId;
    const chatId = [currentUser.id, otherUserId].sort().join('_');
    setActiveMatch({
      id: chatId, myProductId: offer.myProductId, otherProductId: offer.offeredProductId,
      otherUser: { id: otherUserId, name: 'Kullanıcı', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}` },
      timestamp: Date.now(),
    });
    setView('chat');
  };

  return (
    <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
      <div className="bg-[#00592e] pb-4 rounded-b-[35px] shadow-lg w-full mb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingLeft: '24px', paddingRight: '24px' }}>
        <h2 className="text-xl font-black italic tracking-tighter text-white uppercase mb-4">Gelen Kutusu</h2>
        <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            onClick={() => setMatchTab('messages')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${matchTab === 'messages' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
          >
            Mesajlar
          </button>
          <button
            onClick={() => setMatchTab('offers')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${matchTab === 'offers' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}
          >
            Teklifler
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={matchTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {matchTab === 'messages' ? (
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                {matches.map(m => (
                  <motion.div
                    key={m.id}
                    variants={staggerItem}
                    onClick={() => handleOpenChat(m)}
                    className="flex items-center gap-4 py-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer"
                  >
                    <img src={m.otherUser.avatar} className="w-14 h-14 rounded-full object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold dark:text-white">{m.otherUser.name}</h4>
                      <p className="text-sm text-zinc-500 truncate">{(m as any).lastMessage || 'Sohbeti açmak için dokun'}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div variants={staggerContainer} initial="initial" animate="animate">
                {offers.map(o => {
                  const isMyOffer = o.fromUserId === currentUser?.id;
                  const otherUserId = isMyOffer ? o.toUserId : o.fromUserId;
                  const otherUser = otherUserId === currentUser?.id ? currentUser : {
                    id: otherUserId, name: 'Kullanıcı',
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`,
                  };
                  const senderProduct = (isMyOffer ? myProducts : marketProducts).find(p => p.id === o.myProductId);
                  const receiverProduct = (isMyOffer ? marketProducts : myProducts).find(p => p.id === o.offeredProductId);
                  if (!senderProduct || !receiverProduct) return null;

                  return (
                    <motion.div key={o.id} variants={staggerItem} className="py-4 border-b border-zinc-100 dark:border-zinc-800">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <img src={otherUser?.avatar} className="w-10 h-10 rounded-full object-cover" />
                        <div className="flex-1">
                          <p className="font-bold text-sm dark:text-white">{otherUser?.name}</p>
                          <p className="text-xs text-zinc-500">{isMyOffer ? 'Gönderilen Teklif' : 'Gelen Teklif'}</p>
                        </div>
                        {/* Status badge */}
                        {o.status === 'pending' && (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-[11px] font-bold">
                            <Clock size={11} /> Beklemede
                          </span>
                        )}
                        {o.status === 'accepted' && (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-bold">
                            <CheckCircle size={11} /> Onaylandı
                          </span>
                        )}
                        {o.status === 'rejected' && (
                          <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full text-[11px] font-bold">
                            <XCircle size={11} /> {isMyOffer ? 'Olumsuz Takas' : 'Reddedildi'}
                          </span>
                        )}
                      </div>

                      {/* Product comparison */}
                      <div
                        className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl mb-3 cursor-pointer"
                        onClick={() => setSelectedProduct(isMyOffer ? receiverProduct : senderProduct)}
                      >
                        <div className="relative">
                          <img src={isMyOffer ? senderProduct.image : receiverProduct.image} className="w-14 h-14 rounded-lg object-cover" />
                          <div className="absolute -bottom-1 -left-1 bg-zinc-900 text-white text-[8px] px-1 rounded-sm font-bold">SENİN</div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <RefreshCw size={16} className="text-zinc-400" />
                          <span className="text-[10px] text-zinc-400 font-bold">DEĞİŞİM</span>
                        </div>
                        <div className="relative">
                          <img src={isMyOffer ? receiverProduct.image : senderProduct.image} className="w-14 h-14 rounded-lg object-cover" />
                          <div className="absolute -bottom-1 -right-1 bg-[#00592e] text-white text-[8px] px-1 rounded-sm font-bold">TEKLİF</div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {isMyOffer ? (
                        /* Sent offer — only show chat button when accepted */
                        o.status === 'accepted' ? (
                          <button
                            onClick={() => handleStartChatFromOffer(o)}
                            className="w-full py-3 bg-[#00592e] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform"
                          >
                            <MessageCircle size={14} /> Mesaj Gönder
                          </button>
                        ) : null
                      ) : (
                        /* Received offer — show action buttons only when pending */
                        o.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOfferResponse(o.id, 'rejected')}
                              className="flex-1 py-3 border border-red-200 dark:border-red-800 text-red-500 rounded-xl font-bold text-xs active:scale-95 transition-transform"
                            >
                              Reddet
                            </button>
                            <button
                              onClick={() => handleStartChatFromOffer(o)}
                              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                            >
                              <MessageCircle size={14} /> Sohbet
                            </button>
                            <button
                              onClick={() => handleOfferResponse(o.id, 'accepted')}
                              className="flex-[2] py-3 bg-[#00592e] text-white rounded-xl font-bold text-xs active:scale-95 transition-transform"
                            >
                              Kabul Et
                            </button>
                          </div>
                        )
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
