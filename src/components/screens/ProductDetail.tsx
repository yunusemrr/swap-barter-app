import React from 'react';
import { ArrowLeft, Heart, UserX, CheckCircle, Edit, Trash2, Repeat, MessageCircle, ArrowRight, XCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { db } from '../../../firebaseConfig';
import { addDoc, collection, deleteDoc, doc, updateDoc, query, where, getDocs, arrayUnion, increment } from 'firebase/firestore';
import { User, Match } from '../../../types';
import { useAppContext } from '../../context/AppContext';
import { ReportModal } from '../ReportModal';

export function ProductDetail() {
  const {
    selectedProduct, setSelectedProduct, currentUser, setCurrentUser,
    favorites, setFavorites, myProducts,
    showProductSwapSelection, setShowProductSwapSelection,
    setActiveMatch, setView, setUploadForm, setEditingProductId,
    setTempReturnProduct, setSelectedUser, setConfirmationModal,
    isDescriptionExpanded, setIsDescriptionExpanded,
    handleBlockUser, handleImageError,
    boostProduct, setBoostProduct,
    showReportModal, setShowReportModal, reportProduct, setReportProduct,
    setBannerContent,
  } = useAppContext();

  const [relatedMatch, setRelatedMatch] = React.useState<any>(null);

  React.useEffect(() => {
    if (!selectedProduct || !currentUser || currentUser.id !== selectedProduct.userId) return;
    (async () => {
      const matchesRef = collection(db, 'matches');
      const [s1, s2] = await Promise.all([
        getDocs(query(matchesRef, where('myProductId', '==', selectedProduct.id), where('users', 'array-contains', currentUser.id))),
        getDocs(query(matchesRef, where('otherProductId', '==', selectedProduct.id), where('users', 'array-contains', currentUser.id))),
      ]);
      const d = s1.docs[0] || s2.docs[0];
      if (d) setRelatedMatch({ id: d.id, ...d.data() });
      else setRelatedMatch(null);
    })();
  }, [selectedProduct?.id, currentUser?.id]);

  if (!selectedProduct) return null;

  const isOwner = currentUser?.id === selectedProduct.userId;

  let ownerName = selectedProduct.userName || 'Satıcı';
  let ownerAvatar = selectedProduct.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProduct.userId}`;
  if (isOwner && currentUser) { ownerName = currentUser.name; ownerAvatar = currentUser.avatar; }
  const ownerObj: User = { id: selectedProduct.userId, name: ownerName, avatar: ownerAvatar };
  const swapCount = isOwner ? (currentUser?.swapCount || 0) : 0;

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev =>
      prev.includes(selectedProduct.id)
        ? prev.filter(id => id !== selectedProduct.id)
        : [...prev, selectedProduct.id]
    );
  };

  const handleCompleteSwap = async () => {
    if (!currentUser || !selectedProduct) return;
    if (!confirm('Bu ürünü takasladığını onaylıyor musun?')) return;
    try {
      const matchesRef = collection(db, 'matches');
      const [s1, s2] = await Promise.all([
        getDocs(query(matchesRef, where('myProductId', '==', selectedProduct.id), where('users', 'array-contains', currentUser.id))),
        getDocs(query(matchesRef, where('otherProductId', '==', selectedProduct.id), where('users', 'array-contains', currentUser.id))),
      ]);
      const matchDoc = s1.docs[0] || s2.docs[0];

      if (!matchDoc) {
        await deleteDoc(doc(db, 'products', selectedProduct.id));
        const newCount = (currentUser.swapCount || 0) + 1;
        await updateDoc(doc(db, 'users', currentUser.id), { swapCount: newCount });
        setCurrentUser(prev => prev ? { ...prev, swapCount: newCount } : prev);
        setSelectedProduct(null);
        alert(`Tebrikler! Takas puanın: ${newCount}`);
        return;
      }

      const matchRef = doc(db, 'matches', matchDoc.id);
      const data = matchDoc.data();
      const confirmedBy: string[] = data.confirmedBy || [];
      const otherUserId = data.user1Id === currentUser.id ? data.user2Id : data.user1Id;

      if (confirmedBy.includes(currentUser.id)) {
        alert('Zaten onayladın. Diğer kullanıcının onayı bekleniyor...');
        return;
      }

      if (confirmedBy.length >= 1) {
        await updateDoc(matchRef, { confirmedBy: arrayUnion(currentUser.id), status: 'completed' });
        await Promise.all([
          updateDoc(doc(db, 'users', currentUser.id), { swapCount: increment(1) }),
          updateDoc(doc(db, 'users', otherUserId), { swapCount: increment(1) }),
          deleteDoc(doc(db, 'products', data.myProductId)).catch(() => {}),
          deleteDoc(doc(db, 'products', data.otherProductId)).catch(() => {}),
        ]);
        const newCount = (currentUser.swapCount || 0) + 1;
        setCurrentUser(prev => prev ? { ...prev, swapCount: newCount } : prev);
        setSelectedProduct(null);
        alert(`Tebrikler! Takas tamamlandı. Takas puanın: ${newCount}`);
      } else {
        await updateDoc(matchRef, { confirmedBy: arrayUnion(currentUser.id), status: 'in_progress' });
        setRelatedMatch((prev: any) => ({ ...prev, confirmedBy: [...confirmedBy, currentUser.id], status: 'in_progress' }));
        setSelectedProduct(null);
        alert('Onayın alındı. Diğer kullanıcının onayı bekleniyor...');
      }
    } catch (err) {
      console.error('Takas onaylama hatası:', err);
      setSelectedProduct(null);
    }
  };

  const handleInitiateSwap = async (myProductId: string) => {
    if (!currentUser) return;
    const offerData = {
      fromUserId: currentUser.id, toUserId: selectedProduct.userId,
      myProductId, offeredProductId: selectedProduct.id,
      status: 'pending', timestamp: Date.now(),
    };
    try {
      await addDoc(collection(db, 'offers'), offerData);
      alert('Teklif gönderildi!');
      setShowProductSwapSelection(false);
      setSelectedProduct(null);
    } catch { alert('Teklif gönderilirken bir hata oluştu.'); }
  };

  const handleDeleteCurrentProduct = () => {
    setConfirmationModal({
      isOpen: true, title: 'İlanı Sil',
      message: 'Bu ilanı silmek istediğinize emin misiniz?', type: 'danger',
      onConfirm: async () => {
        try { await deleteDoc(doc(db, 'products', selectedProduct.id)); setSelectedProduct(null); }
        catch { alert('Hata oluştu'); }
      },
    });
  };

  const handleGoToSellerProfile = () => {
    setTempReturnProduct(selectedProduct);
    setSelectedProduct(null);
    setSelectedUser(ownerObj);
    setView('user-profile');
  };

  const handleDirectChat = () => {
    if (!currentUser) return;
    const chatId = [currentUser.id, selectedProduct.userId].sort().join('_');
    const directMatch: Match = {
      id: chatId, myProductId: 'direct', otherProductId: selectedProduct.id,
      otherUser: { id: selectedProduct.userId, name: selectedProduct.userName || 'Satıcı', avatar: selectedProduct.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProduct.userId}` },
      timestamp: Date.now(),
    };
    setActiveMatch(directMatch);
    setView('chat');
    setSelectedProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="relative h-1/2">
        <img src={selectedProduct.image} className="w-full h-full object-cover" onError={handleImageError} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-24 pointer-events-none" />
        <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full">
          <ArrowLeft size={20} />
        </button>
        <button onClick={toggleFavorite} className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full">
          <Heart size={20} className={favorites.includes(selectedProduct.id) ? 'fill-red-500 text-red-500' : ''} />
        </button>
        {!isOwner && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setReportProduct(selectedProduct);
              setShowReportModal(true);
            }}
            className="absolute top-4 right-16 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors active:scale-90"
            title="Uygunsuz içeriği bildir"
          >
            <AlertTriangle size={20} />
          </button>
        )}
        {!isOwner && (
          <button onClick={() => handleBlockUser(ownerObj)} className="absolute top-4 right-28 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors active:scale-90">
            <UserX size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col bg-white dark:bg-zinc-900 -mt-6 rounded-t-3xl relative shadow-[0_-5px_20px_rgba(0,0,0,0.1)] no-scrollbar">
        <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-6" />

        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedProduct.title}</h1>
          <span className="text-xl font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg ml-2 whitespace-nowrap">
            {selectedProduct.price.toLocaleString('tr-TR')} TL
          </span>
        </div>

        <div className="flex gap-2 mb-6">
          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full text-xs font-semibold uppercase">{selectedProduct.category}</span>
          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full text-xs font-semibold uppercase">{selectedProduct.condition}</span>
        </div>

        <div
          onClick={() => !isOwner && handleGoToSellerProfile()}
          className={`flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-6 border border-zinc-100 dark:border-zinc-800 ${!isOwner ? 'cursor-pointer' : ''}`}
        >
          <img src={ownerAvatar} className="w-12 h-12 rounded-full object-cover" onError={handleImageError} />
          <div className="flex-1">
            <p className="font-bold text-sm text-zinc-900 dark:text-white">{ownerName}</p>
            <div className="flex items-center">
              <div className="flex text-yellow-400 text-[10px]">★★★★★</div>
              <p className="text-xs text-zinc-400 ml-1">({swapCount} Takas)</p>
            </div>
          </div>
          {!isOwner && <ArrowRight size={16} className="text-zinc-400" />}
        </div>

        <div
          className="mb-6 flex-1 overflow-y-auto no-scrollbar cursor-pointer"
          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
        >
          <div className="flex justify-between items-baseline mb-2">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Açıklama</h3>
            {!isDescriptionExpanded && <span className="text-xs text-[#ffab00] font-bold">Devamını Oku</span>}
          </div>
          <p className={`text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
            {selectedProduct.description}
          </p>
          {isDescriptionExpanded && <span className="text-xs text-[#ffab00] font-bold mt-2 block">Daha Az Göster</span>}
        </div>

        {isOwner ? (
          <div className="flex flex-col gap-2 mt-auto pb-safe pt-2">
            <button
              onClick={() => {
                setBoostProduct(selectedProduct);
                setSelectedProduct(null);
                setView('boost');
              }}
              className="w-full py-3.5 bg-[#ffab00] text-white rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
            >
              <Sparkles size={18} />
              {selectedProduct.featured ? 'Süreyi Uzat — 150 TL' : 'Öne Çıkar — 150 TL'}
            </button>
            <div className="flex gap-3">
              {relatedMatch?.confirmedBy?.includes(currentUser?.id) ? (
                <div className="flex-[2] py-4 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 rounded-2xl font-bold flex items-center justify-center text-xs text-center px-2">
                  Diğer onay bekleniyor...
                </div>
              ) : (
                <button onClick={handleCompleteSwap} className="flex-[2] py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                  <CheckCircle size={20} /> Takaslandı
                </button>
              )}
              <button
                onClick={() => {
                  setUploadForm({ title: selectedProduct.title, description: selectedProduct.description, price: selectedProduct.price.toString(), images: selectedProduct.images || [selectedProduct.image], category: selectedProduct.category, condition: selectedProduct.condition as any, preferredTradeCategory: selectedProduct.preferredTradeCategory || '' });
                  setEditingProductId(selectedProduct.id);
                  setSelectedProduct(null);
                  setView('upload');
                }}
                className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <Edit size={20} />
              </button>
              <button onClick={handleDeleteCurrentProduct} className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 mt-auto pb-safe pt-2">
            <button onClick={() => setShowProductSwapSelection(true)} className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
              <Repeat size={20} /> Takas Teklif Et
            </button>
            <button onClick={handleDirectChat} className="flex-1 py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
              <MessageCircle size={20} /> Mesaj At
            </button>
          </div>
        )}
      </div>

      {showProductSwapSelection && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-white dark:bg-zinc-900 w-full rounded-t-3xl p-6 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Takaslanacak Ürünü Seç</h3>
              <button onClick={() => setShowProductSwapSelection(false)}><XCircle className="text-zinc-400" /></button>
            </div>
            <div className="space-y-3 overflow-y-auto p-1 no-scrollbar">
              {myProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleInitiateSwap(p.id)}
                  className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors"
                >
                  <img src={p.image} className="w-14 h-14 rounded-xl object-cover" onError={handleImageError} />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{p.title}</p>
                    <p className="text-xs text-emerald-500 font-semibold">{p.price.toLocaleString('tr-TR')} TL</p>
                  </div>
                  <ArrowRight size={16} className="text-zinc-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportProduct && (
        <ReportModal
          isOpen={showReportModal}
          productId={reportProduct.id}
          productTitle={reportProduct.title}
          reportedUserId={reportProduct.userId}
          reportedUserName={reportProduct.userName || 'Satıcı'}
          currentUserId={currentUser?.id || ''}
          onClose={() => setShowReportModal(false)}
          onSuccess={() => {
            setBannerContent({
              message: '✅ Şikayet başarıyla gönderildi. Teşekkürler!',
              type: 'success',
            });
          }}
        />
      )}
    </div>
  );
}