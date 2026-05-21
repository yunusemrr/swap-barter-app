import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface EulaModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onReject: () => void;
}

export const EulaModal: React.FC<EulaModalProps> = ({ isOpen, onAccept, onReject }) => {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#00592e] p-6 text-white">
          <h2 className="text-2xl font-bold italic">Swap Barter</h2>
          <p className="text-sm opacity-90 mt-1">Kullanıcı Sözleşmesi ve Gizlilik Politikası</p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
          
          <section>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">1. Hoş Geldiniz</h3>
            <p>
              Swap Barter'a hoş geldiniz! Bu platform, kullanıcıların eşyalarını güvenli bir şekilde takas etmelerini sağlar.
              Uygulamayı kullanarak aşağıdaki şartları kabul etmiş olursunuz.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">2. Kabul Edilebilir İçerik</h3>
            <p>
              Swap Barter'da yayınlanan tüm içerik (ilanlar, fotoğraflar, açıklamalar) uygun ve yasal olmalıdır.
              <strong className="text-red-600"> Zararlı, müstehcen, sahte, çalıntı veya tehditkar içeriğe tolerans gösterilmez.</strong>
            </p>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">3. Yasak İçerik</h3>
            <p className="mb-2">Aşağıdaki içerik kesinlikle yasaktır:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Cinsel, şiddet içeriği veya çocuk istismarı</li>
              <li>Nefret söylemi, ırk ayrımcılığı, ayrımcılık</li>
              <li>Sahte, çalıntı veya korsan ürünler</li>
              <li>Dolandırıcılık, manipülasyon veya yalan</li>
              <li>Kişisel bilginin yetkisiz paylaşımı</li>
              <li>Spam, reklam veya zararlı bağlantılar</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">4. İçeriği Bildirme</h3>
            <p>
              Uygunsuz içerik görürseniz, <strong>"Şikayet Et"</strong> düğmesini kullanarak bize bildir.
              Biz 24 saat içinde inceleme yapacağız ve gerektiğinde içeriği kaldıracağız.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">5. Kullanıcı Engelleme</h3>
            <p>
              Uygunsuz davranışta bulunan kullanıcıları engelle. Engellenen kişinin ilanları feed'inde görülmeyecek.
              Ciddi ihlaller halinde hesap kalıcı olarak silinebilir.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">6. Gizlilik</h3>
            <p>
              Kişisel verileriniz güvenli tutulur. E-posta, telefon ve konum bilgileri sadece takas amacıyla kullanılır.
              3. taraflarla paylaşılmaz.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">7. Sorumluluk</h3>
            <p>
              Swap Barter, kullanıcılar arasında doğabilecek anlaşmazlıklardan sorumlu değildir.
              Takas yapmadan önce ürünü dikkatle incele ve satıcıyla iletişim kur.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">8. Hüküm Değişikliği</h3>
            <p>
              Bu şartlar herhangi bir uyarı olmaksızın değiştirilebilir. Düzenli olarak kontrol et.
            </p>
          </section>

        </div>

        {/* Checkbox & Buttons */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 accent-[#00592e] cursor-pointer"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Yukarıdaki şartları ve gizlilik politikasını okudum ve kabul ediyorum.
              <strong className="text-red-600"> Zararlı içeriğe tolerans olmadığını anlıyorum.</strong>
            </span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onReject}
              className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Reddet
            </button>
            <button
              onClick={onAccept}
              disabled={!agreed}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                agreed
                  ? 'bg-[#00592e] text-white hover:bg-[#003d1f] active:scale-95'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle size={18} />
              Kabul Et
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};