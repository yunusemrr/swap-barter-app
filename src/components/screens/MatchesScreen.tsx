import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, RefreshCw, Clock, CheckCircle, XCircle, History, Search } from 'lucide-react';
import { staggerContainer, staggerItem } from '../../animations/variants';
import { db } from '../../../firebaseConfig';
import { addDoc, collection, serverTimestamp, updateDoc, doc, getDoc, increment } from 'firebase/firestore';
import { Match, Offer, User } from '../../../types';
import { useAppContext } from '../../context/AppContext';

function timeAgo(ts: any): string {
  if (!ts) return 'şimdi';
  const ms = typeof ts?.toMillis === 'function' ? ts.toMillis() : (typeof ts === 'number' ? ts : Date.now());
  const diff = Math.max(0, Date.now() - ms);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'şimdi';
  if (min < 60) return `${min}dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}s önce`;
  return `${Math.floor(hr / 24)}g önce`;
}

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

  const pendingCount = offers.filter(o => o.status === 'pending' && o.toUserId === currentUser?.id).length;

  return (
    <div className="h-full bg-[#F3F2EE] flex flex-col overflow-hidden">
      {/* ── HEADER ── */}
      <div
        className="flex-shrink-0 w-full pb-5 px-6"
        style={{
          background: 'linear-gradient(160deg, #12693b 0%, #0b3f24 92%)',
          borderRadius: '0 0 34px 34px',
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-extrabold text-[22px] tracking-[-.4px]" style={{ color: '#fff' }}>Mesajlar</h2>
            <p className="text-[12.5px] font-medium" style={{ color: 'rgba(255,255,255,.65)' }}>
              {matchTab === 'messages' ? `${matches.length} sohbet` : `${offers.length} teklif`}
            </p>
          </div>
          <button className="flex items-center justify-center active:scale-95 transition-transform" style={{ width: 38, height: 38 }}>
            <History size={20} color="#fff" strokeWidth={2} />
          </button>
        </div>

        {/* Segmented tabs */}
        <div className="flex p-1" style={{ background: 'rgba(255,255,255,.14)', borderRadius: 13 }}>
          <button
            onClick={() => setMatchTab('messages')}
            className="flex-1 py-2.5 font-bold text-[13px] transition-all"
            style={{
              borderRadius: 10,
              background: matchTab === 'messages' ? '#fff' : 'transparent',
              color: matchTab === 'messages' ? '#0F5A33' : 'rgba(255,255,255,.75)',
            }}
          >
            Mesajlar
          </button>
          <button
            onClick={() => setMatchTab('offers')}
            className="flex-1 py-2.5 font-bold text-[13px] transition-all relative"
            style={{
              borderRadius: 10,
              background: matchTab === 'offers' ? '#fff' : 'transparent',
              color: matchTab === 'offers' ? '#0F5A33' : 'rgba(255,255,255,.75)',
            }}
          >
            Teklifler
            {pendingCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex items-center justify-center font-extrabold"
                style={{ width: 17, height: 17, borderRadius: '50%', background: '#F5A623', color: '#fff', fontSize: 9.5 }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={matchTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {matchTab === 'messages' ? (
              matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F1F0EA' }}>
                    <MessageCircle size={28} color="#9A9A92" />
                  </div>
                  <p className="font-bold text-[15px]" style={{ color: '#16241C' }}>Henüz sohbetin yok</p>
                  <p className="text-[13px] mt-1" style={{ color: '#9A9A92' }}>Bir takas teklif ettiğinde burada görünecek</p>
                </div>
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate">
                  {matches.map(m => {
                    const relatedProduct = marketProducts.find(p => p.id === (m as any).otherProductId)
                      || myProducts.find(p => p.id === (m as any).myProductId);
                    return (
                      <motion.div
                        key={m.id}
                        variants={staggerItem}
                        onClick={() => handleOpenChat(m)}
                        className="flex items-center gap-3 py-3 px-3 mb-2 cursor-pointer active:scale-[.98] transition-transform"
                        style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 14px -8px rgba(0,0,0,.12)' }}
                      >

                        <img
                          src={m.otherUser.avatar}
                          className="object-cover flex-shrink-0"
                          style={{ width: 52, height: 52, borderRadius: 16 }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[15px] truncate" style={{ color: '#16241C' }}>{m.otherUser.name}</h4>
                            <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: '#9A9A92' }}>
                              {timeAgo((m as any).timestamp)}
                            </span>
                          </div>
                          <p className="text-[13px] truncate" style={{ color: '#9A9A92' }}>
                            {(m as any).lastMessage || 'Sohbeti açmak için dokun'}
                          </p>
                          {relatedProduct && (
                            <div className="flex items-center gap-1 mt-1">
                              <RefreshCw size={10} color="#0F5A33" />
                              <span className="text-[11px] font-semibold truncate" style={{ color: '#0F5A33' }}>
                                {relatedProduct.title} takası
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )
            ) : (

              offers.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#F1F0EA' }}>
                    <RefreshCw size={28} color="#9A9A92" />
                  </div>
                  <p className="font-bold text-[15px]" style={{ color: '#16241C' }}>Henüz teklifin yok</p>
                  <p className="text-[13px] mt-1" style={{ color: '#9A9A92' }}>Bir ürüne takas teklif ettiğinde burada görünecek</p>
                </div>
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
                  const myMiniProduct = isMyOffer ? senderProduct : receiverProduct;
                  const otherMiniProduct = isMyOffer ? receiverProduct : senderProduct;

                  return (
                    <motion.div
                      key={o.id}
                      variants={staggerItem}
                      className="mb-3 p-4"
                      style={{
                        background: 'rgba(255,255,255,.6)',
                        backdropFilter: 'blur(16px) saturate(1.3)',
                        WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
                        border: '1px solid rgba(255,255,255,.7)',
                        borderRadius: 22,
                      }}
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <img src={otherUser?.avatar} className="rounded-full object-cover flex-shrink-0" style={{ width: 36, height: 36 }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[13.5px] truncate" style={{ color: '#16241C' }}>
                            {otherUser?.name}{' '}
                            <span className="font-medium" style={{ color: '#9A9A92' }}>
                              {isMyOffer ? 'teklif gönderdin' : 'sana teklif gönderdi'} · {timeAgo((o as any).timestamp)}
                            </span>
                          </p>
                        </div>

                        {o.status === 'pending' && (
                          <span className="flex items-center gap-1 flex-shrink-0 font-bold" style={{ fontSize: 10.5, color: '#E8890C', background: 'rgba(245,166,35,.15)', borderRadius: 20, padding: '4px 9px' }}>
                            <Clock size={10} /> {isMyOffer ? 'Yanıt bekliyor' : 'Bekliyor'}
                          </span>
                        )}
                        {o.status === 'accepted' && (
                          <span className="flex items-center gap-1 flex-shrink-0 font-bold" style={{ fontSize: 10.5, color: '#0F5A33', background: 'rgba(46,204,113,.15)', borderRadius: 20, padding: '4px 9px' }}>
                            <CheckCircle size={10} /> Tamamlandı
                          </span>
                        )}
                        {o.status === 'rejected' && (
                          <span className="flex items-center gap-1 flex-shrink-0 font-bold" style={{ fontSize: 10.5, color: '#C0392B', background: 'rgba(192,57,43,.12)', borderRadius: 20, padding: '4px 9px' }}>
                            <XCircle size={10} /> Reddedildi
                          </span>
                        )}
                      </div>

                      {/* SENİN ⇄ ONUN comparison */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedProduct(myMiniProduct)}
                          style={{ background: '#fff', borderRadius: 14, padding: 8 }}
                        >
                          <div className="w-full overflow-hidden mb-1.5" style={{ height: 56, borderRadius: 10 }}>
                            <img src={myMiniProduct.image || myMiniProduct.images?.[0]} className="w-full h-full object-cover" />
                          </div>
                          <p className="font-bold text-[11.5px] truncate" style={{ color: '#16241C' }}>{myMiniProduct.title}</p>
                          <p className="font-extrabold text-[11.5px]" style={{ color: '#0F5A33' }}>
                            {Number(myMiniProduct.price || 0).toLocaleString('tr-TR')} TL
                          </p>
                        </div>

                        <div
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: o.status === 'accepted' ? '#0F5A33' : (o.status === 'rejected' ? '#CDCBC3' : '#0F5A33'),
                          }}
                        >
                          <RefreshCw size={14} color="#fff" />
                        </div>

                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => setSelectedProduct(otherMiniProduct)}
                          style={{ background: '#fff', borderRadius: 14, padding: 8 }}
                        >
                          <div className="w-full overflow-hidden mb-1.5" style={{ height: 56, borderRadius: 10 }}>
                            <img src={otherMiniProduct.image || otherMiniProduct.images?.[0]} className="w-full h-full object-cover" />
                          </div>
                          <p className="font-bold text-[11.5px] truncate" style={{ color: '#16241C' }}>{otherMiniProduct.title}</p>
                          <p className="font-extrabold text-[11.5px]" style={{ color: '#0F5A33' }}>
                            {Number(otherMiniProduct.price || 0).toLocaleString('tr-TR')} TL
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {o.status === 'pending' && !isMyOffer && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOfferResponse(o.id, 'rejected')}
                            className="flex-1 py-2.5 font-bold text-[12.5px] active:scale-95 transition-transform"
                            style={{ border: '1.5px solid #F1B3AB', color: '#C0392B', borderRadius: 13, background: 'transparent' }}
                          >
                            Reddet
                          </button>
                          <button
                            onClick={() => handleStartChatFromOffer(o)}
                            className="flex-1 py-2.5 font-bold text-[12.5px] flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                            style={{ background: '#fff', color: '#16241C', borderRadius: 13 }}
                          >
                            <MessageCircle size={13} /> Sohbet
                          </button>
                          <button
                            onClick={() => handleOfferResponse(o.id, 'accepted')}
                            className="flex-[1.4] py-2.5 text-white font-bold text-[12.5px] active:scale-95 transition-transform"
                            style={{ background: 'linear-gradient(145deg,#12693b,#0b3f24)', borderRadius: 13 }}
                          >
                            Kabul Et
                          </button>
                        </div>
                      )}

                      {o.status === 'pending' && isMyOffer && (
                        <button
                          className="w-full py-2.5 font-bold text-[12.5px]"
                          style={{ border: '1.5px solid #CDCBC3', color: '#6A6A62', borderRadius: 13, background: 'transparent' }}
                        >
                          Teklifi Geri Çek
                        </button>
                      )}

                      {o.status === 'accepted' && (
                        <button
                          onClick={() => handleStartChatFromOffer(o)}
                          className="w-full py-2.5 font-bold text-[12.5px] flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                          style={{ border: '1.5px solid #A9DDBB', color: '#0F5A33', borderRadius: 13, background: 'transparent' }}
                        >
                          <MessageCircle size={13} /> Mesaj Gönder
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
