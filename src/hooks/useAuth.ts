import { useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { User, ViewState } from '../../types';
import { ConfirmationModalState } from '../context/AppContext';

interface UseAuthParams {
  email: string;
  password: string;
  name: string;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  setAuthLoading: (v: boolean) => void;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setAuthError: (v: string) => void;
  setAuthMode: (v: 'login' | 'signup' | 'forgot') => void;
  setView: (v: ViewState | 'profile-settings') => void;
  setConfirmationModal: (v: ConfirmationModalState) => void;
}

export function useAuth({
  email, password, name, currentUser,
  setCurrentUser, setAuthLoading, setEmail, setPassword,
  setAuthError, setAuthMode, setView, setConfirmationModal,
}: UseAuthParams) {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setCurrentUser(snap.exists()
            ? (snap.data() as User)
            : buildFallbackUser(firebaseUser));
          setView('home');
        } catch {
          setCurrentUser(buildFallbackUser(firebaseUser));
          setView('home');
        }
      } else {
        setCurrentUser(null);
        setView('auth');
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.reload();
    } catch {
      setAuthError('Giriş başarısız. E-posta veya şifre hatalı.');
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: User = {
        id: cred.user.uid, name, email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cred.user.uid}`,
        location: 'İstanbul', swapCount: 0,
      };
      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      window.location.reload();
    } catch (err: any) {
      setAuthError('Kayıt başarısız. ' + err.message);
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setAuthError('Lütfen e-posta adresinizi girin.'); return; }
    setAuthLoading(true);
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      alert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      setAuthMode('login');
    } catch (err: any) {
      setAuthError('İşlem başarısız. ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setConfirmationModal({
      isOpen: true,
      title: 'Çıkış Yap',
      message: 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
      type: 'normal',
      onConfirm: async () => {
        try { await signOut(auth); } catch {}
        setCurrentUser(null);
        setEmail('');
        setPassword('');
        setView('auth');
      },
    });
  };

  const handleDeleteAccount = () => {
    setConfirmationModal({
      isOpen: true,
      title: 'Hesabı Sil',
      message: 'Hesabınızı ve tüm verilerinizi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      type: 'danger',
      onConfirm: async () => {
        if (!currentUser) return;
        try {
          await deleteDoc(doc(db, 'users', currentUser.id));
          const fbUser = auth.currentUser;
          if (fbUser) try { await fbUser.delete(); } catch {}
          await signOut(auth);
          setCurrentUser(null);
          setView('auth');
          alert('Hesabınız silindi.');
        } catch {
          alert('Hesap silinirken bir hata oluştu.');
        }
      },
    });
  };

  return { handleLogin, handleSignup, handleForgotPassword, handleLogout, handleDeleteAccount };
}

function buildFallbackUser(firebaseUser: { uid: string; email: string | null }): User {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.email?.split('@')[0] || 'Kullanıcı',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
    email: firebaseUser.email || '',
    location: 'İstanbul',
    swapCount: 0,
  };
}
