import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

export function ConfirmationModal() {
  const { confirmationModal, setConfirmationModal } = useAppContext();
  if (!confirmationModal?.isOpen) return null;

  const close = () => setConfirmationModal(null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl"
      >
        <h3 className="font-bold text-xl mb-2 dark:text-white">{confirmationModal.title}</h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">{confirmationModal.message}</p>
        <div className="flex gap-3">
          <button
            onClick={close}
            className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl"
          >
            İptal
          </button>
          <button
            onClick={() => { confirmationModal.onConfirm(); close(); }}
            className={`flex-1 py-3 font-bold rounded-xl text-white ${confirmationModal.type === 'danger' ? 'bg-red-500' : 'bg-[#00592e]'}`}
          >
            {confirmationModal.type === 'danger' ? 'Sil / Çıkış' : 'Onayla'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
