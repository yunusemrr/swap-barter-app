import { useEffect } from 'react';
import { db } from '../../firebaseConfig';
import {
  collection, query, orderBy, onSnapshot, where,
} from 'firebase/firestore';
import { Product, Match, User, Offer } from '../../types';
import { ChatMsg } from '../context/AppContext';

interface UseFirestoreParams {
  currentUser: User | null;
  activeMatch: Match | null;
  setMarketProducts: (p: Product[]) => void;
  setMyProducts: (p: Product[]) => void;
  setMatches: (m: Match[]) => void;
  setOffers: (o: Offer[]) => void;
  setChatHistory: (h: ChatMsg[]) => void;
  setIsLoading: (v: boolean) => void;
}

export function useFirestore({
  currentUser, activeMatch,
  setMarketProducts, setMyProducts, setMatches, setOffers, setChatHistory, setIsLoading,
}: UseFirestoreParams) {
  // Products listener
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'products'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      setMarketProducts(all);
      setMyProducts(all.filter(p => p.userId === currentUser.id));
      setIsLoading(false);
    }, () => {
      setMarketProducts([]);
      setMyProducts([]);
      setIsLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  // Matches listener
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'matches'),
      where('users', 'array-contains', currentUser.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => {
        const data = d.data();
        const otherUser = data.user1?.id === currentUser.id ? data.user2 : data.user1;
        return { ...data, id: d.id, otherUser } as Match;
      });
      all.sort((a, b) =>
        ((b as any).timestamp?.toMillis?.() || 0) - ((a as any).timestamp?.toMillis?.() || 0)
      );
      setMatches(all);
    });
    return () => unsub();
  }, [currentUser]);

  // Offers listener
  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'offers'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer));
      setOffers(all.filter(o => o.fromUserId === currentUser.id || o.toUserId === currentUser.id));
    });
    return () => unsub();
  }, [currentUser]);

  // Messages listener (depends on active chat)
  useEffect(() => {
    if (!activeMatch || !currentUser) return;
    const q = query(
      collection(db, 'messages'),
      where('matchId', '==', activeMatch.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map(d => ({ ...d.data(), id: d.id } as any))
        .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
      setChatHistory(msgs.map(m => ({
        id: m.id, text: m.text, image: m.image, isMe: m.senderId === currentUser.id,
      })));
    });
    return () => unsub();
  }, [activeMatch, currentUser]);
}
