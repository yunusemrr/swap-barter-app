import React, { useState } from 'react';
import { AlertTriangle, X, Send, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

interface ReportModalProps {
  isOpen: boolean;
  productId: string;
  productTitle: string;
  reportedUserId: string;
  reportedUserName: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REPORT_REASONS = [
  'Ürün yasak veya sahte',
  'Cinsel veya şiddet içeriği',
  'Dolandırıcılık şüphesi',
  'Spam veya reklam',
  'Nefret söylemi',
  'Kişisel bilgi ihlali',
  'Diğer',
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  productId,
  productTitle,
  reportedUserId,
  reportedUserName,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Lütfen bir sebep seçin');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('[Report] Submitting report...');
      
      const reportData = {
        reportedBy: currentUserId,
        reportedProduct: productId,
        reportedProductTitle: productTitle,
        reportedUser: reportedUserId,
        reportedUserName: reportedUserName,
        reportReason: selectedReason,
        reportReasonDetail: details,
        timestamp: serverTimestamp(),
        status: 'pending',
        adminNotes: '',
      };

      const docRef = await addDoc(collection(db, 'reports'), reportData);
      console.log('[Report] Report submitted successfully:', docRef.id);

      // Reset form
      setSelectedReason('');
      setDetails('');
      
      // Show success and close
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[Report] Failed to submit:', err.message);
      setError('Şikayet gönderilemedi. Lütfen tekrar deneyin.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-red-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={24} />
            <h2 className="text-2xl font-bold">İçeriği Bildir</h2>
          </div>
          <p className="text-sm opacity-90">Uygunsuz içeriği moderatörlere bildir</p>
        </div>

        {/* Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Product Info */}
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Bildirilecek İçerik:</p>
            <p className="font-bold text-zinc-900 dark:text-white">{productTitle}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              Kullanıcı: <span className="font-semibold">{reportedUserName}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-3">
              Şikayet Sebebini Seç *
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label key={reason} className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 accent-red-500 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-bold text-zinc-900 dark:text-white mb-2">
              Ek Açıklama (İsteğe Bağlı)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Neden bu içeriği uygunsuz buluyorsunuz? Lütfen detaylı açıklayın..."
              maxLength={500}
              className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none text-zinc-900 dark:text-white placeholder-zinc-400 resize-none text-sm"
              rows={4}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {details.length}/500 karakter
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              <strong>Uyarı:</strong> Yanlış şikayetler raporlayan kullanıcının hesabını etkileyebilir. Lütfen gerçek şikayetler gönderin.
            </p>
          </div>

        </form>

        {/* Buttons */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedReason}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              selectedReason && !isSubmitting
                ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send size={18} />
                Bildir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};