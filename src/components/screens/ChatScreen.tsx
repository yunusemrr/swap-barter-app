import React from 'react';
import { ArrowLeft, MoreVertical, ImageIcon, MapPin, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../../firebaseConfig';
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc, getDocs, query, where, arrayUnion, increment, deleteDoc } from 'firebase/firestore';
import { useAppContext } from '../../context/AppContext';
import { chatMsgVariants } from '../../animations/variants';

export function ChatScreen() {
  const {
    activeMatch, currentUser, setCurrentUser, chatHistory, setChatHistory,
    chatMessage, setChatMessage, showChatMenu, setShowChatMenu,
    chatFileInputRef, setView, handleBlockUser, matches, setMatches,
  } = useAppContext();

  if (!activeMatch) return null;

  const match = matches.find(m => m.id === activeMatch.id);
  const alreadyConfirmed = match?.confirmedBy?.includes(currentUser?.id ?? '');

  const handleConfirmSwapFromChat = async () => {
    if (!currentUser || !match) return;
    if (!confirm('Bu takası tamamladığını onaylıyor musun?')) return;
    try {
      const matchesRef = collection(db, 'matches');
      const [s1, s2] = await Promise.all([
        getDocs(query(matchesRef, where('myProductId', '==', match.myProductId), where('users', 'array-contains', currentUser.id))),
        getDocs(query(matchesRef, where('otherProductId', '==', match.otherProductId), where('users', 'array-contains', currentUser.id))),
      ]);
      const matchDoc = s1.docs[0] || s2.docs[0];
      if (!matchDoc) return;

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
        setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'completed', confirmedBy: [...confirmedBy, currentUser.id] } : m));
        alert(`Tebrikler! Takas tamamlandı. Takas puanın: ${newCount}`);
      } else {
        await updateDoc(matchRef, { confirmedBy: arrayUnion(currentUser.id), status: 'in_progress' });
        setMatches(prev => prev.map(m => m.id === match.id ? { ...m, status: 'in_progress', confirmedBy: [...confirmedBy, currentUser.id] } : m));
        alert('Onayın alındı. Diğer kullanıcının onayı bekleniyor...');
      }
    } catch (err) {
      console.error('Chat onay hatası:', err);
    }
  };

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = event => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 800;
          let { width, height } = img;
          if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
          else { if (height > MAX) { width *= MAX / height; height = MAX; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Canvas error')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });

  const updateInboxMatch = async (msgText: string) => {
    if (!currentUser) return;
    await setDoc(doc(db, 'matches', activeMatch.id), {
      id: activeMatch.id,
      users: [currentUser.id, activeMatch.otherUser.id],
      user1: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
      user2: { id: activeMatch.otherUser.id, name: activeMatch.otherUser.name, avatar: activeMatch.otherUser.avatar },
      lastMessage: msgText, timestamp: serverTimestamp(),
    }, { merge: true });
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !currentUser) return;
    const msgText = chatMessage;
    setChatMessage('');
    try {
      await addDoc(collection(db, 'messages'), {
        matchId: activeMatch.id, senderId: currentUser.id,
        text: msgText, timestamp: serverTimestamp(),
      });
      await updateInboxMatch(msgText);
    } catch { console.error('Mesaj gönderilemedi'); }
  };

  const handleChatImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !currentUser) return;
    try {
      const img = await compressImage(e.target.files[0]);
      await addDoc(collection(db, 'messages'), {
        matchId: activeMatch.id, senderId: currentUser.id,
        image: img, timestamp: serverTimestamp(),
      });
      await updateInboxMatch('📷 Fotoğraf');
    } catch (err) { console.error('Resim hatası:', err); }
  };

  const handleSendLocation = async () => {
    if (!currentUser) return;
    const msgText = `📍 Konum: ${currentUser.location || 'İstanbul'}`;
    try {
      await addDoc(collection(db, 'messages'), {
        matchId: activeMatch.id, senderId: currentUser.id,
        text: msgText, timestamp: serverTimestamp(),
      });
      await updateInboxMatch(msgText);
    } catch (e) { console.error(e); }
  };

  const handleDeleteChat = () => {
    if (confirm('Tüm sohbet geçmişini silmek istediğinize emin misiniz?')) {
      setChatHistory([]);
      setShowChatMenu(false);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
      <div className="px-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 shadow-sm z-10 bg-white dark:bg-zinc-900" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setView('matches')}><ArrowLeft className="text-zinc-500 dark:text-white" /></button>
          <img src={activeMatch.otherUser.avatar} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h3 className="font-bold text-sm dark:text-white">{activeMatch.otherUser.name}</h3>
            <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Çevrimiçi
            </p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-2">
            <MoreVertical className="text-zinc-400" />
          </button>
          {showChatMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700 py-1 z-20">
              <button onClick={handleDeleteChat} className="w-full text-left px-4 py-3 text-red-500 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">
                Sohbeti Sil
              </button>
              <button onClick={() => handleBlockUser(activeMatch.otherUser)} className="w-full text-left px-4 py-3 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">
                Kullanıcıyı Engelle
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex justify-center my-4">
          <div className="bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs px-3 py-1 rounded-full">
            Takas eşleşmesi sağlandı • {new Date(activeMatch.timestamp).toLocaleDateString()}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={(msg as any).id || `msg-${i}`}
              variants={chatMsgVariants}
              initial="initial"
              animate="animate"
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] p-3 rounded-2xl ${msg.isMe ? 'bg-[#00592e] text-white rounded-br-none' : 'bg-white dark:bg-zinc-800 dark:text-white shadow-sm rounded-bl-none'}`}>
                {msg.image && <img src={msg.image} className="w-full rounded-lg mb-2" />}
                {msg.text && <p className="text-sm">{msg.text}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {match && match.status !== 'completed' && (
        <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          {alreadyConfirmed ? (
            <p className="flex-1 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
              Diğer kullanıcının onayı bekleniyor...
            </p>
          ) : (
            <>
              <p className="flex-1 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                Takası tamamladınız mı?
              </p>
              <button
                onClick={handleConfirmSwapFromChat}
                className="bg-[#00592e] text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-transform"
              >
                <CheckCircle size={14} /> Takaslandı
              </button>
            </>
          )}
        </div>
      )}
      <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
        <button onClick={() => chatFileInputRef.current?.click()} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">
          <ImageIcon size={20} />
        </button>
        <input type="file" ref={chatFileInputRef} onChange={handleChatImageSelect} className="hidden" accept="image/*" />
        <button onClick={handleSendLocation} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500">
          <MapPin size={20} />
        </button>
        <input
          value={chatMessage}
          onChange={e => setChatMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
          placeholder="Mesaj yaz..."
          className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-full outline-none text-zinc-900 dark:text-white"
        />
        <button
          onClick={handleSendMessage}
          className={`p-2.5 rounded-full ${chatMessage.trim() ? 'bg-[#00592e] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
