import React from 'react';
import { ArrowLeft, Camera as CameraIcon, User as UserIcon, Moon, Sun, MapPin, Shield, LogOut, ArrowRight } from 'lucide-react';
import { db } from '../../../firebaseConfig';
import { updateDoc, doc, setDoc } from 'firebase/firestore';
import { useAppContext } from '../../context/AppContext';

const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Şanlıurfa', 'Kocaeli', 'Samsun', 'Trabzon', 'Eskişehir', 'Mersin', 'Diyarbakır'];

export function SettingsScreen() {
  const {
    currentUser, setCurrentUser, isDarkMode, setIsDarkMode,
    editProfileName, setEditProfileName, editProfileAvatar, setEditProfileAvatar,
    profileFileInputRef, showLocationModal, setShowLocationModal,
    setView, handleLogout, handleDeleteAccount,
    blockedUsers, handleUnblockUser,
  } = useAppContext();

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

  const handleProfileImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    try { setEditProfileAvatar(await compressImage(e.target.files[0])); }
    catch (err) { console.error('Image error', err); }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { name: editProfileName, avatar: editProfileAvatar });
      setCurrentUser({ ...currentUser, name: editProfileName, avatar: editProfileAvatar });
      alert('Profil başarıyla güncellendi.');
      setView('profile');
    } catch { alert('Profil güncellenemedi.'); }
  };

  const handleUpdateLocation = async (newLocation: string) => {
    if (!currentUser) return;
    setCurrentUser({ ...currentUser, location: newLocation });
    setShowLocationModal(false);
    try { await setDoc(doc(db, 'users', currentUser.id), { location: newLocation }, { merge: true }); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
      <div className="px-6 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '16px' }}>
        <button onClick={() => setView('profile')}><ArrowLeft className="dark:text-white" /></button>
        <h2 className="text-xl font-bold dark:text-white">Ayarlar</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider">Profil</h3>
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img src={editProfileAvatar || currentUser?.avatar} className="w-24 h-24 rounded-full object-cover" />
              <button onClick={() => profileFileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#00592e] text-white p-2 rounded-full">
                <CameraIcon size={16} />
              </button>
              <input type="file" ref={profileFileInputRef} onChange={handleProfileImageSelect} className="hidden" accept="image/*" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl flex items-center gap-3">
              <UserIcon className="text-zinc-400" />
              <input
                value={editProfileName}
                onChange={e => setEditProfileName(e.target.value)}
                className="bg-transparent flex-1 outline-none font-bold dark:text-white"
                placeholder="Ad Soyad"
              />
            </div>
            <button onClick={handleSaveProfile} className="w-full py-3 bg-[#00592e] text-white rounded-xl font-bold">Kaydet</button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider">Uygulama</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon size={20} className="text-[#ffab00]" /> : <Sun size={20} className="text-orange-400" />}
                <span className="font-bold dark:text-white">Karanlık Mod</span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#00592e]' : 'bg-zinc-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : ''}`} />
              </button>
            </div>
            <button
              onClick={() => setShowLocationModal(true)}
              className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl dark:text-white"
            >
              <div className="flex items-center gap-3"><MapPin size={20} className="text-zinc-400" /><span className="font-bold">Konum Değiştir</span></div>
              <span className="text-zinc-400 text-sm">{currentUser?.location}</span>
            </button>
            <button
              onClick={() => setView('blocked-users')}
              className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl dark:text-white"
            >
              <div className="flex items-center gap-3"><Shield size={20} className="text-zinc-400" /><span className="font-bold">Engellenenler</span></div>
              <ArrowRight size={16} className="text-zinc-400" />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider">Hesap</h3>
          <div className="space-y-2">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold">
              <LogOut size={20} /> Çıkış Yap
            </button>
            <button onClick={handleDeleteAccount} className="w-full flex items-center gap-3 p-4 bg-transparent text-zinc-400 rounded-xl font-bold text-sm">
              Hesabımı Sil
            </button>
          </div>
        </div>
      </div>

      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6">
            <h3 className="font-bold text-lg mb-4 dark:text-white">Konum Seç</h3>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto mb-4">
              {CITIES.map(c => (
                <button
                  key={c} onClick={() => handleUpdateLocation(c)}
                  className={`p-3 rounded-xl font-bold text-sm ${currentUser?.location === c ? 'bg-[#00592e] text-white' : 'bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300'}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLocationModal(false)} className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 font-bold rounded-xl dark:text-white">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BlockedUsersScreen() {
  const { blockedUsers, handleUnblockUser, setView } = useAppContext();

  return (
    <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
      <div className="px-6 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '16px' }}>
        <button onClick={() => setView('settings')}><ArrowLeft className="dark:text-white" /></button>
        <h2 className="font-bold text-lg dark:text-white">Engellenen Kullanıcılar</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {blockedUsers.length === 0 ? (
          <p className="text-center text-zinc-400 mt-10">Engellenen kullanıcı yok.</p>
        ) : (
          blockedUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" />
                <span className="font-bold dark:text-white">{u.name}</span>
              </div>
              <button
                onClick={() => handleUnblockUser(u.id)}
                className="text-sm font-bold text-[#ffab00] bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-lg"
              >
                Engeli Kaldır
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
