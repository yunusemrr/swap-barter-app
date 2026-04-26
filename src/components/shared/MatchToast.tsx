import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function MatchToast() {
  const { newMatch, setNewMatch, setActiveMatch, setView, setMatchTab } = useAppContext();

  const handleSendMessage = () => {
    if (!newMatch) return;
    setActiveMatch(newMatch);
    setMatchTab('messages');
    setNewMatch(null);
    setView('chat');
  };

  return (
    <AnimatePresence>
      {newMatch && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="absolute top-4 left-4 right-4 z-50 bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
        >
          <div className="flex -space-x-2 shrink-0">
            <img src={newMatch.otherUser.avatar} className="w-10 h-10 rounded-full border-2 border-white" />
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 font-bold border-2 border-white text-sm">
              +1
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold">Eşleşme!</h4>
            <p className="text-xs text-white/90 truncate">{newMatch.otherUser.name} ile eşleştin.</p>
          </div>
          <button
            onClick={handleSendMessage}
            className="shrink-0 bg-white text-emerald-600 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1"
          >
            <MessageCircle size={13} /> Mesaj
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
