  import React, { useState, useEffect, useRef, useCallback  } from 'react';
  import { 
    Home, 
    PlusCircle, 
    Repeat, 
    MessageCircle, 
    User as UserIcon, 
    Search, 
    MapPin, 
    Sparkles, 
    ArrowRight, 
    ArrowLeft, 
    Camera as CameraIcon, 
    Heart, 
    Settings, 
    Shield, 
    LogOut, 
    Trash2, 
    Moon, 
    Sun, 
    Image as ImageIcon, 
    CheckCircle, 
    XCircle, 
    MoreVertical, 
    SlidersHorizontal, 
    Send, 
    Lock, 
    Mail, 
    Loader2, 
    ChevronDown, 
    Edit, 
    RefreshCw, 
    X, 
    UserX,
    UserCog,
    Crop as CropIcon
  } from 'lucide-react';
  import Cropper from 'react-easy-crop';
  import appLogo from './src/logo.png';
  import { App as CapacitorApp } from '@capacitor/app';
  import { motion, AnimatePresence } from 'framer-motion';
  import { Product, ViewState, Match, User, Offer } from './types';
  import { Geolocation } from '@capacitor/geolocation';
  import { CameraResultType, CameraSource } from '@capacitor/camera';
  import { Camera } from '@capacitor/camera';
  import { generateProductDescription } from './services/geminiService';
  import { SwipeDeck } from './components/SwipeDeck';
  

  // Firebase Imports
  import { db, auth } from './firebaseConfig';
  import { getDocs, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, getDoc, deleteDoc, updateDoc, where } from 'firebase/firestore';
  import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';

  const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Şanlıurfa", "Kocaeli", "Samsun", "Trabzon", "Eskişehir", "Mersin", "Diyarbakır"];

  const App = () => {

  // GEÇİCİ MIGRATION
  useEffect(() => {
    const migrateProducts = async () => {
      if (!currentUser) return;
      try {
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const batch: Promise<void>[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.featured === undefined) {
            batch.push(updateDoc(doc(db, 'products', docSnap.id), { featured: false, featuredUntil: null, featuredCity: null }));
          }
        });
        await Promise.all(batch);
      } catch (error) {
        console.error('Migration hatası:', error);
      }
    };
    migrateProducts();
  });

  const requestPermissions = async () => {
    try {
      await Camera.requestPermissions();
      await Geolocation.requestPermissions();
    } catch (error) {
      console.warn("İzin hatası:", error);
    }
  };
  useEffect(() => { requestPermissions(); }, []);

    const [isTablet, setIsTablet] = useState(window.innerWidth > 768);
  useEffect(() => {
    const handleResize = () => setIsTablet(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authError, setAuthError] = useState('');

    const [view, setView] = useState<ViewState | 'profile-settings'>('home');
    const [matchTab, setMatchTab] = useState<'messages' | 'offers'>('messages');
    const [profileTab, setProfileTab] = useState<'my' | 'favorites'>('my');

    const [marketProducts, setMarketProducts] = useState<Product[]>([]);
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);

    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{id?: string, text?: string, image?: string, isMe: boolean}[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showProductSwapSelection, setShowProductSwapSelection] = useState(false);
    const [activeMatch, setActiveMatch] = useState<Match | null>(null);
    const [selectedMyProductForAction, setSelectedMyProductForAction] = useState<Product | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [bannerContent, setBannerContent] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error'; icon?: React.ReactNode } | null>(null);

    const [editProfileName, setEditProfileName] = useState('');
    const [editProfileAvatar, setEditProfileAvatar] = useState('');
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const [tempReturnProduct, setTempReturnProduct] = useState<Product | null>(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState<{
      isOpen: boolean; title: string; message: string; type: 'danger' | 'normal'; onConfirm: () => void;
    } | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({ minPrice: '', maxPrice: '', category: '', condition: '', location: '' });

    const [isUploading, setIsUploading] = useState(false);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCropperModal, setShowCropperModal] = useState(false);

    const [uploadForm, setUploadForm] = useState({
      title: '', description: '', price: '', images: [] as string[],
      category: 'Elektronik', condition: 'Yeni Gibi' as const, preferredTradeCategory: ''
    });
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    const [swapTab, setSwapTab] = useState<'swipe' | 'offers'>('offers');
    const [selectedMyProductId, setSelectedMyProductId] = useState<string | null>(null);
    const [swapCandidates, setSwapCandidates] = useState<Product[]>([]);
    const [newMatch, setNewMatch] = useState<Match | null>(null);

    const contentRef = useRef<HTMLDivElement>(null);
    const [pullStartY, setPullStartY] = useState(0);

    // Eşleşme bildirimi otomatik gizleme
    useEffect(() => {
      if (newMatch) {
        const timer = setTimeout(() => setNewMatch(null), 2000);
        return () => clearTimeout(timer);
      }
    }, [newMatch]);

    // Geri tuşu yönetimi
    const stateRef = useRef<any>({});
    const viewHistory = useRef<string[]>(['home']);
    const isBackNavigation = useRef(false);
    const lastBackPress = useRef(0);

    useEffect(() => {
      stateRef.current = {
        view, selectedProduct, showFilterModal, showLocationModal,
        showProductSwapSelection, confirmationModal, showChatMenu,
        showPhotoOptions, tempReturnProduct, selectedUser
      };
    });

    useEffect(() => {
      if (isBackNavigation.current) {
        isBackNavigation.current = false;
      } else {
        if (viewHistory.current[viewHistory.current.length - 1] !== view) {
          viewHistory.current.push(view);
        }
      }
    }, [view]);

    useEffect(() => {
      CapacitorApp.removeAllListeners();
      const listener = CapacitorApp.addListener('backButton', () => {
        const now = Date.now();
        if (now - lastBackPress.current < 300) return;
        lastBackPress.current = now;
        const state = stateRef.current;
        if (state.confirmationModal) { setConfirmationModal(null); return; }
        if (state.showProductSwapSelection) { setShowProductSwapSelection(false); return; }
        if (state.showLocationModal) { setShowLocationModal(false); return; }
        if (state.showFilterModal) { setShowFilterModal(false); return; }
        if (state.showChatMenu) { setShowChatMenu(false); return; }
        if (state.showPhotoOptions) { setShowPhotoOptions(false); return; }
        if (state.selectedProduct) { setSelectedProduct(null); return; }
        if (state.view === 'user-profile') { setSelectedUser(null); setTempReturnProduct(null); }
        if (viewHistory.current.length > 1) {
          viewHistory.current.pop();
          const previousView = viewHistory.current[viewHistory.current.length - 1];
          isBackNavigation.current = true;
          setView(previousView as ViewState);
        } else {
          CapacitorApp.exitApp();
        }
      });
      return () => { listener.then(handle => handle.remove()); };
    }, []);


    // Auth effect
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setCurrentUser(userDoc.data() as User);
            } else {
              setCurrentUser({
                id: firebaseUser.uid,
                name: firebaseUser.email?.split('@')[0] || 'Kullanıcı',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                email: firebaseUser.email || '', location: 'İstanbul', swapCount: 0
              });
            }
            setView('home');
          } catch (error) {
            console.error("Error fetching user data:", error);
            setCurrentUser({
              id: firebaseUser.uid,
              name: firebaseUser.email?.split('@')[0] || 'Kullanıcı',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              email: firebaseUser.email || '', location: 'İstanbul', swapCount: 0
            });
            setView('home');
          }
        } else {
          setCurrentUser(null);
          setView('auth');
        }
        setAuthLoading(false);
      });
      return () => unsubscribe();
    }, []);

    useEffect(() => {
      if (isDarkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    useEffect(() => {
      if (view === 'settings' && currentUser) {
        setEditProfileName(currentUser.name);
        setEditProfileAvatar(currentUser.avatar);
      }
    }, [view, currentUser]);

    useEffect(() => {
      switch (view) {
        case 'chat':
          setBannerContent({ message: `Sohbet: ${activeMatch?.otherUser.name || 'Kullanıcı'}`, type: 'info', icon: <MessageCircle size={18} /> });
          break;
        case 'user-profile':
          setBannerContent({ message: `Kullanıcı Profili: ${selectedUser?.name || 'Kullanıcı'}`, type: 'info', icon: <UserIcon size={18} /> });
          break;
        default:
          setBannerContent(null);
      }
    }, [view, activeMatch, selectedUser]);

    useEffect(() => {
      if (selectedProduct) setIsDescriptionExpanded(false);
    }, [selectedProduct]);

    // Products listener (featured + normal)
    useEffect(() => {
      if (!currentUser) return;
      const productsRef = collection(db, 'products');
      const now = new Date();
      const featuredQuery = query(productsRef, where('featured', '==', true), where('featuredUntil', '>', now), orderBy('featuredUntil', 'desc'), orderBy('timestamp', 'desc'));
      const normalQuery = query(productsRef, where('featured', '==', false), orderBy('timestamp', 'desc'));
      let featuredProducts: Product[] = [];
      let normalProducts: Product[] = [];

      const unsubscribeFeatured = onSnapshot(featuredQuery, (snapshot) => {
        featuredProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        const combined = [...featuredProducts, ...normalProducts];
        setMarketProducts(combined.filter(p => p.userId !== currentUser.id));
        setMyProducts(combined.filter(p => p.userId === currentUser.id));
        setIsLoading(false);
      }, () => setIsLoading(false));

      const unsubscribeNormal = onSnapshot(normalQuery, (snapshot) => {
        normalProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        const combined = [...featuredProducts, ...normalProducts];
        setMarketProducts(combined.filter(p => p.userId !== currentUser.id));
        setMyProducts(combined.filter(p => p.userId === currentUser.id));
        setIsLoading(false);
      }, () => setIsLoading(false));

      return () => { unsubscribeFeatured(); unsubscribeNormal(); };
    }, [currentUser]);

    // Matches listener
    useEffect(() => {
      if (!currentUser) return;
      const qMatches = query(collection(db, 'matches'), where('users', 'array-contains', currentUser.id));
      const unsubscribe = onSnapshot(qMatches, (snapshot) => {
        const allMatches = snapshot.docs.map(d => {
          const data = d.data();
          const otherUser = data.user1?.id === currentUser.id ? data.user2 : data.user1;
          return { ...data, id: d.id, otherUser } as Match;
        });
        allMatches.sort((a, b) => ((b as any).timestamp?.toMillis?.() || 0) - ((a as any).timestamp?.toMillis?.() || 0));
        setMatches(allMatches);
      });
      return () => unsubscribe();
    }, [currentUser]);

    // Offers listener (tek, temiz)
    useEffect(() => {
      if (!currentUser) return;
      const qOffers = query(collection(db, 'offers'), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(qOffers, (snapshot) => {
        const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Offer));
        setOffers(all.filter(o => o.fromUserId === currentUser.id || o.toUserId === currentUser.id));
      });
      return () => unsub();
    }, [currentUser]);

    // Messages listener
    useEffect(() => {
      if (!activeMatch || !currentUser) return;
      const q = query(collection(db, 'messages'), where('matchId', '==', activeMatch.id));
      const unsub = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any));
        msgs.sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
        setChatHistory(msgs.map(m => ({ id: m.id, text: m.text, image: m.image, isMe: m.senderId === currentUser.id })));
      });
      return () => unsub();
    }, [activeMatch, currentUser]);

    // --- Handlers ---

    const handleRefresh = async () => {
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsRefreshing(false);
    };
    const handleTouchStart = (e: React.TouchEvent) => {
      if (contentRef.current?.scrollTop === 0) setPullStartY(e.touches[0].clientY);
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      if (contentRef.current?.scrollTop === 0 && endY - pullStartY > 100 && !isRefreshing) handleRefresh();
      setPullStartY(0);
    };

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault(); setAuthLoading(true); setAuthError('');
      try { await signInWithEmailAndPassword(auth, email, password); window.location.reload(); }
      catch { setAuthError('Giriş başarısız. E-posta veya şifre hatalı.'); setAuthLoading(false); }
    };

    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault(); setAuthLoading(true); setAuthError('');
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const newUser: User = { id: cred.user.uid, name, email, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cred.user.uid}`, location: 'İstanbul', swapCount: 0 };
        await setDoc(doc(db, 'users', cred.user.uid), newUser);
        window.location.reload();
      } catch (err: any) { setAuthError('Kayıt başarısız. ' + err.message); setAuthLoading(false); }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email) { setAuthError('Lütfen e-posta adresinizi girin.'); return; }
      setAuthLoading(true); setAuthError('');
      try { await sendPasswordResetEmail(auth, email); alert('Şifre sıfırlama e-postası gönderildi.'); setAuthMode('login'); }
      catch (err: any) { setAuthError('İşlem başarısız. ' + err.message); }
      finally { setAuthLoading(false); }
    };

    const handleLogout = () => {
      setConfirmationModal({ isOpen: true, title: 'Çıkış Yap', message: 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', type: 'normal',
        onConfirm: async () => { try { await signOut(auth); } catch {} setCurrentUser(null); setEmail(''); setPassword(''); setView('auth'); }
      });
    };

    const handleDeleteAccount = () => {
      setConfirmationModal({ isOpen: true, title: 'Hesabı Sil', message: 'Hesabınızı kalıcı olarak silmek istediğinize emin misiniz?', type: 'danger',
        onConfirm: async () => {
          if (!currentUser) return;
          try {
            await deleteDoc(doc(db, 'users', currentUser.id));
            const user = auth.currentUser;
            if (user) { try { await user.delete(); } catch {} }
            await signOut(auth); setCurrentUser(null); setView('auth'); alert("Hesabınız silindi.");
          } catch { alert("Hesap silinirken bir hata oluştu."); }
        }
      });
    };

    const handleUpdateLocation = async (newLocation: string) => {
      if (currentUser) {
        setCurrentUser({ ...currentUser, location: newLocation }); setShowLocationModal(false);
        try { await setDoc(doc(db, 'users', currentUser.id), { location: newLocation }, { merge: true }); } catch (e) { console.error(e); }
      }
    };

    const toggleFavorite = (e: React.MouseEvent, productId: string) => {
      e.stopPropagation();
      setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    };

    const handleBlockUser = (userToBlock: User) => {
      if (confirm("Bu kullanıcıyı engellemek istediğinize emin misiniz?")) {
        if (!blockedUsers.some(u => u.id === userToBlock.id)) setBlockedUsers([...blockedUsers, userToBlock]);
        setView('home'); setSelectedUser(null);
      }
    };
    const handleUnblockUser = (userId: string) => setBlockedUsers(blockedUsers.filter(u => u.id !== userId));

    const handleAIHelp = async () => {
      if (!uploadForm.title || uploadForm.images.length === 0) { alert("Önce bir fotoğraf ekle!"); return; }
      setIsGeneratingAI(true);
      try {
        const desc = await generateProductDescription(uploadForm.title, uploadForm.category, uploadForm.condition, uploadForm.images[0]);
        setUploadForm(prev => ({ ...prev, description: desc }));
      } catch {} finally { setIsGeneratingAI(false); }
    };

    const compressImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX = 800;
          if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
          else { if (height > MAX) { width *= MAX / height; height = MAX; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error("Canvas error")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });

    const createImage = (url: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', reject);
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context bulunamadı');
      canvas.width = pixelCrop.width; canvas.height = pixelCrop.height;
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) return;
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => resolve(reader.result as string);
        }, 'image/jpeg', 0.9);
      });
    };

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => { setCroppedAreaPixels(croppedAreaPixels); }, []);

    const handleSaveCroppedImage = async () => {
      if (imageToCrop && croppedAreaPixels) {
        try {
          const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
          setUploadForm(prev => ({ ...prev, images: [...prev.images, croppedImage] }));
          setShowCropperModal(false); setImageToCrop(null); setCrop({ x: 0, y: 0 }); setZoom(1);
        } catch { alert("Resim kırpılırken bir hata oluştu."); }
      }
    };

    const handleTakePhoto = async () => {
      try {
        const image = await Camera.getPhoto({ quality: 90, allowEditing: true, resultType: CameraResultType.DataUrl, source: CameraSource.Camera });
        if (image.dataUrl) { setImageToCrop(image.dataUrl); setShowCropperModal(true); setShowPhotoOptions(false); }
      } catch (error) { console.error("Kamera hatası:", error); }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        try { const compressed = await compressImage(files[0]); setImageToCrop(compressed); setShowCropperModal(true); setShowPhotoOptions(false); }
        catch (error) { console.error("Resim hazırlama hatası:", error); }
        e.target.value = '';
      }
    };

    const handleProfileImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        try { const compressed = await compressImage(e.target.files[0]); setEditProfileAvatar(compressed); }
        catch (err) { console.error("Image error", err); }
      }
    };

    const handleSaveProfile = async () => {
      if (!currentUser) return;
      try {
        await updateDoc(doc(db, 'users', currentUser.id), { name: editProfileName, avatar: editProfileAvatar });
        setCurrentUser({ ...currentUser, name: editProfileName, avatar: editProfileAvatar });
        alert("Profil başarıyla güncellendi."); setView('profile');
      } catch { alert("Profil güncellenemedi."); }
    };

    const removeImage = (indexToRemove: number) => setUploadForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== indexToRemove) }));

    const handleUploadSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      setIsUploading(true);
      const finalImages = uploadForm.images.length > 0 ? uploadForm.images : [`https://picsum.photos/400/600?random=${Date.now()}`];
      const productData = {
        userId: currentUser.id, title: uploadForm.title, description: uploadForm.description,
        price: Number(uploadForm.price), image: finalImages[0], images: finalImages,
        category: uploadForm.category, condition: uploadForm.condition,
        preferredTradeCategory: uploadForm.preferredTradeCategory,
        location: currentUser.location || "İstanbul",
        userAvatar: currentUser.avatar, userName: currentUser.name,
        timestamp: serverTimestamp(), featured: false, featuredUntil: null, featuredCity: null,
      };
      try {
        if (editingProductId) { await updateDoc(doc(db, 'products', editingProductId), productData); alert("Ürün güncellendi!"); }
        else { await addDoc(collection(db, 'products'), productData); }
        setView('home');
        setUploadForm({ title: '', description: '', price: '', images: [], category: 'Elektronik', condition: 'Yeni Gibi', preferredTradeCategory: '' });
        setEditingProductId(null);
      } catch (error) { console.error("Error saving product:", error); alert("İşlem sırasında bir hata oluştu."); }
      finally { setIsUploading(false); }
    };

    const handleCompleteSwap = async () => {
      if (!selectedProduct || !currentUser) return;
      if (confirm('Bu ürünü takasladığını onaylıyor musun?')) {
        try {
          await deleteDoc(doc(db, 'products', selectedProduct.id));
          const newCount = (currentUser.swapCount || 0) + 1;
          await updateDoc(doc(db, 'users', currentUser.id), { swapCount: newCount });
          setCurrentUser({ ...currentUser, swapCount: newCount }); setSelectedProduct(null);
          alert(`Tebrikler! Takas puanın: ${newCount}`);
        } catch { setSelectedProduct(null); }
      }
    };

    const handleInitiateSwap = async (myProductId: string) => {
      if (!selectedProduct || !currentUser) return;
      const offerData = { fromUserId: currentUser.id, toUserId: selectedProduct.userId, myProductId, offeredProductId: selectedProduct.id, status: 'pending', timestamp: Date.now() };
      try {
        await addDoc(collection(db, 'offers'), offerData);
        alert(`Teklif gönderildi!`); setShowProductSwapSelection(false); setSelectedProduct(null);
      } catch { alert("Teklif gönderilirken bir hata oluştu."); }
    };

    const startSwapSession = (myProduct: Product) => {
      if (!currentUser) return;
      setSelectedMyProductId(myProduct.id);
      const range = 0.3;
      const candidates = marketProducts.filter(p =>
        p.userId !== currentUser.id && !blockedUsers.some(u => u.id === p.userId) &&
        p.price >= myProduct.price * (1 - range) && p.price <= myProduct.price * (1 + range)
      );
      setSwapCandidates(candidates); setSwapTab('swipe'); setView('swipe');
    };


    // DÜZELTME: handleSwipe - Firestore'dan gerçek kullanıcı çekiyor
    const handleSwipe = async (direction: 'left' | 'right', product: Product) => {
      setSwapCandidates(prev => prev.filter(p => p.id !== product.id));
      if (direction === 'right') {
        const isMatch = Math.random() > 0.3;
        if (isMatch && selectedMyProductId && currentUser) {
          try {
            const otherUserSnap = await getDoc(doc(db, 'users', product.userId));
            const otherUserData: User = otherUserSnap.exists()
              ? (otherUserSnap.data() as User)
              : { id: product.userId, name: product.userName || 'Kullanıcı', avatar: product.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${product.userId}` };
            const matchData = {
              myProductId: selectedMyProductId, otherProductId: product.id,
              users: [currentUser.id, product.userId],
              user1: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
              user2: { id: otherUserData.id, name: otherUserData.name, avatar: otherUserData.avatar },
              lastMessage: '', timestamp: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'matches'), matchData);
            setNewMatch({ id: docRef.id, myProductId: selectedMyProductId, otherProductId: product.id, otherUser: otherUserData, timestamp: Date.now() });
          } catch (e) { console.error("Match hatası", e); }
        }
      }
    };

    // DÜZELTME: handleOfferResponse - Firestore'dan gerçek kullanıcı çekiyor
    const handleOfferResponse = async (offerId: string, response: 'accepted' | 'rejected') => {
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: response } : o));
      if (response === 'accepted' && currentUser) {
        const offer = offers.find(o => o.id === offerId);
        if (offer) {
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
              lastMessage: '', timestamp: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, 'matches'), matchData);
            const newMatchObj: Match = { id: docRef.id, myProductId: offer.myProductId, otherProductId: offer.offeredProductId, otherUser, timestamp: Date.now() };
            setMatches(prev => [newMatchObj, ...prev]); setNewMatch(newMatchObj);
          } catch (e) { console.error("Match oluşturulamadı", e); }
        }
      }
    };

    const handleClearFilters = () => { setFilters({ minPrice: '', maxPrice: '', category: '', condition: '', location: '' }); setSearchQuery(''); };
    const handleApplyFilters = () => setShowFilterModal(false);
    const handleOpenChat = (match: Match) => { setActiveMatch(match); setView('chat'); };

    const handleStartChatFromOffer = (offer: Offer) => {
      if (!currentUser) return;
      const isMyOffer = offer.fromUserId === currentUser.id;
      const otherUserId = isMyOffer ? offer.toUserId : offer.fromUserId;
      const chatId = [currentUser.id, otherUserId].sort().join('_');
      setActiveMatch({ id: chatId, myProductId: offer.myProductId, otherProductId: offer.offeredProductId, otherUser: { id: otherUserId, name: 'Kullanıcı', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}` }, timestamp: Date.now() });
      setView('chat');
    };

    const handleDeleteCurrentProduct = () => {
      if (!selectedProduct) return;
      setConfirmationModal({ isOpen: true, title: 'İlanı Sil', message: 'Bu ilanı silmek istediğinize emin misiniz?', type: 'danger',
        onConfirm: async () => { try { await deleteDoc(doc(db, 'products', selectedProduct.id)); setSelectedProduct(null); } catch { alert("Hata oluştu"); } }
      });
    };

    const handleGoToSellerProfile = (seller: User) => { setTempReturnProduct(selectedProduct); setSelectedProduct(null); setSelectedUser(seller); setView('user-profile'); };

    const handleBackFromUserProfile = () => {
      if (tempReturnProduct) { setView('home'); setSelectedProduct(tempReturnProduct); setTempReturnProduct(null); setSelectedUser(null); }
      else { setView('home'); setSelectedUser(null); }
    };

    const handleMyProductAction = (action: 'edit' | 'delete' | 'findMatch', product: Product | null = null) => {
      const t = product || selectedMyProductForAction;
      if (!t) return;
      if (action === 'delete') { if (confirm(`${t.title} ilanını silmek istediğine emin misin?`)) deleteDoc(doc(db, 'products', t.id)).catch(console.error); }
      else if (action === 'findMatch') { startSwapSession(t); }
      else if (action === 'edit') {
        setUploadForm({ title: t.title, description: t.description, price: t.price.toString(), images: t.images || [t.image], category: t.category, condition: t.condition as any, preferredTradeCategory: t.preferredTradeCategory || '' });
        setEditingProductId(t.id); setSelectedProduct(null); setView('upload');
      }
      setSelectedMyProductForAction(null);
    };

    const updateInboxMatch = async (msgText: string) => {
      if (!activeMatch || !currentUser) return;
      await setDoc(doc(db, 'matches', activeMatch.id), {
        id: activeMatch.id, users: [currentUser.id, activeMatch.otherUser.id],
        user1: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar },
        user2: { id: activeMatch.otherUser.id, name: activeMatch.otherUser.name, avatar: activeMatch.otherUser.avatar },
        lastMessage: msgText, timestamp: serverTimestamp()
      }, { merge: true });
    };

    const handleSendMessage = async () => {
      if (!chatMessage.trim() || !activeMatch || !currentUser) return;
      const msgText = chatMessage; setChatMessage('');
      try {
        await addDoc(collection(db, 'messages'), { matchId: activeMatch.id, senderId: currentUser.id, text: msgText, timestamp: serverTimestamp() });
        await updateInboxMatch(msgText);
      } catch { console.error("Mesaj gönderilemedi"); }
    };

    const handleChatImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && activeMatch && currentUser) {
        try {
          const img = await compressImage(e.target.files[0]);
          await addDoc(collection(db, 'messages'), { matchId: activeMatch.id, senderId: currentUser.id, image: img, timestamp: serverTimestamp() });
          await updateInboxMatch("📷 Fotoğraf");
        } catch (err) { console.error("Resim hatası:", err); }
      }
    };

    const handleSendLocation = async () => {
      if (!activeMatch || !currentUser) return;
      const msgText = `📍 Konum: ${currentUser.location || "İstanbul"}`;
      try {
        await addDoc(collection(db, 'messages'), { matchId: activeMatch.id, senderId: currentUser.id, text: msgText, timestamp: serverTimestamp() });
        await updateInboxMatch(msgText);
      } catch (e) { console.error(e); }
    };

    const handleDeleteChat = () => { if (confirm("Tüm sohbet geçmişini silmek istediğinize emin misiniz?")) { setChatHistory([]); setShowChatMenu(false); } };
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image'; };


    // =================== RENDER FONKSİYONLARI ===================

    const renderConfirmationModal = () => {
      if (!confirmationModal?.isOpen) return null;
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmationModal(null)}></div>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl">
            <h3 className="font-bold text-xl mb-2 dark:text-white">{confirmationModal.title}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">{confirmationModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmationModal(null)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl">İptal</button>
              <button onClick={() => { confirmationModal.onConfirm(); setConfirmationModal(null); }} className={`flex-1 py-3 font-bold rounded-xl text-white ${confirmationModal.type === 'danger' ? 'bg-red-500' : 'bg-[#00592e]'}`}>
                {confirmationModal.type === 'danger' ? 'Sil / Çıkış' : 'Onayla'}
              </button>
            </div>
          </motion.div>
        </div>
      );
    };

    const renderHome = () => (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
        <div className="bg-[#00592e] p-6 pb-8 rounded-b-[35px] shadow-lg shadow-violet-200 dark:shadow-none w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-sm uppercase">swap <span className="text-[#ffab00]">barter</span></h1>
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-zinc-400 w-4 h-4" />
              <input type="text" placeholder="İstediğin her şeyi ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-800 rounded-2xl border-none outline-none text-xs" />
            </div>
            <button onClick={() => setShowFilterModal(true)} className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm text-[#ffab00] dark:text-white active:scale-90 transition-transform">
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar" ref={contentRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="grid grid-cols-2 gap-4 pt-6">
            {marketProducts.filter(product => {
              const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesCategory = filters.category === '' || product.category === filters.category;
              const matchesMinPrice = filters.minPrice === '' || product.price >= Number(filters.minPrice);
              const matchesMaxPrice = filters.maxPrice === '' || product.price <= Number(filters.maxPrice);
              return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
            }).map(product => (
              <motion.div key={product.id} layoutId={product.id} onClick={() => setSelectedProduct(product)} className="bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 pb-2 cursor-pointer">
                <div className="aspect-[4/5] relative"><img src={product.image} className="w-full h-full object-cover" /></div>
                <div className="p-3">
                  <h3 className="font-bold text-zinc-900 dark:text-white truncate text-sm mb-1">{product.title}</h3>
                  <p className="text-[#00592e] font-black text-sm">{product.price.toLocaleString('tr-TR')} TL</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );

    const renderProductDetail = () => {
      if (!selectedProduct) return null;
      let ownerName = 'Satıcı';
      let ownerAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProduct.userId}`;
      const ownerId = selectedProduct.userId;
      const isOwner = currentUser?.id === selectedProduct.userId;

      if (selectedProduct.userAvatar && selectedProduct.userName) { ownerName = selectedProduct.userName; ownerAvatar = selectedProduct.userAvatar; }
      else if (isOwner && currentUser) { ownerName = currentUser.name; ownerAvatar = currentUser.avatar; }
      const swapCount = isOwner ? (currentUser?.swapCount || 0) : 0;
      const ownerObj: User = { id: ownerId, name: ownerName, avatar: ownerAvatar };

      return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="relative h-1/2">
            <img src={selectedProduct.image} className="w-full h-full object-cover" onError={handleImageError} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-24 pointer-events-none"></div>
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full"><ArrowLeft size={20} /></button>
            <button onClick={(e) => toggleFavorite(e, selectedProduct.id)} className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full">
              <Heart size={20} className={favorites.includes(selectedProduct.id) ? "fill-red-500 text-red-500" : ""} />
            </button>
            {!isOwner && <button onClick={() => handleBlockUser(ownerObj)} className="absolute top-4 right-16 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full"><UserX size={20} /></button>}
          </div>
          <div className="flex-1 p-6 flex flex-col bg-white dark:bg-zinc-900 -mt-6 rounded-t-3xl relative shadow-[0_-5px_20px_rgba(0,0,0,0.1)] no-scrollbar">
            <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedProduct.title}</h1>
              <span className="text-xl font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg ml-2 whitespace-nowrap">{selectedProduct.price.toLocaleString('tr-TR')} TL</span>
            </div>
            <div className="flex gap-2 mb-6">
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full text-xs font-semibold uppercase">{selectedProduct.category}</span>
              <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full text-xs font-semibold uppercase">{selectedProduct.condition}</span>
            </div>
            <div onClick={() => !isOwner && handleGoToSellerProfile(ownerObj)} className={`flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-6 border border-zinc-100 dark:border-zinc-800 ${!isOwner ? 'cursor-pointer' : ''}`}>
              <img src={ownerAvatar} className="w-12 h-12 rounded-full object-cover" onError={handleImageError} />
              <div className="flex-1">
                <p className="font-bold text-sm text-zinc-900 dark:text-white">{ownerName}</p>
                <div className="flex items-center"><div className="flex text-yellow-400 text-[10px]">★★★★★</div><p className="text-xs text-zinc-400 ml-1">({swapCount} Takas)</p></div>
              </div>
              {!isOwner && <ArrowRight size={16} className="text-zinc-400" />}
            </div>
            <div className="mb-6 flex-1 overflow-y-auto no-scrollbar cursor-pointer" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <div className="flex justify-between items-baseline mb-2">
                <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Açıklama</h3>
                {!isDescriptionExpanded && <span className="text-xs text-[#ffab00] font-bold">Devamını Oku</span>}
              </div>
              <p className={`text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>{selectedProduct.description}</p>
              {isDescriptionExpanded && <span className="text-xs text-[#ffab00] font-bold mt-2 block">Daha Az Göster</span>}
            </div>
            {isOwner ? (
              <div className="flex gap-3 mt-auto pb-safe pt-2">
                <button onClick={handleCompleteSwap} className="flex-[2] py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"><CheckCircle size={20} />Takaslandı</button>
                <button onClick={() => handleMyProductAction('edit', selectedProduct)} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"><Edit size={20} /></button>
                <button onClick={handleDeleteCurrentProduct} className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"><Trash2 size={20} /></button>
              </div>
            ) : (
              <div className="flex gap-3 mt-auto pb-safe pt-2">
                <button onClick={() => setShowProductSwapSelection(true)} className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"><Repeat size={20} />Takas Teklif Et</button>
                <button onClick={() => {
                  if (!currentUser) return;
                  const chatId = [currentUser.id, selectedProduct.userId].sort().join('_');
                  const otherUser: User = { id: selectedProduct.userId, name: selectedProduct.userName || 'Satıcı', avatar: selectedProduct.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProduct.userId}` };
                  setActiveMatch({ id: chatId, myProductId: 'direct', otherProductId: selectedProduct.id, otherUser, timestamp: Date.now() });
                  setView('chat'); setSelectedProduct(null);
                }} className="flex-1 py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"><MessageCircle size={20} />Mesaj At</button>
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
                    <div key={p.id} onClick={() => handleInitiateSwap(p.id)} className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors">
                      <img src={p.image} className="w-14 h-14 rounded-xl object-cover" onError={handleImageError} />
                      <div className="flex-1"><p className="font-bold text-sm text-zinc-900 dark:text-white">{p.title}</p><p className="text-xs text-emerald-500 font-semibold">{p.price.toLocaleString('tr-TR')} TL</p></div>
                      <ArrowRight size={16} className="text-zinc-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };


    const renderMatches = () => (
      <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
        <div className="bg-[#00592e] p-6 pb-4 rounded-b-[35px] shadow-lg w-full mb-4">
          <h2 className="text-xl font-black italic tracking-tighter text-white uppercase mb-4">Gelen Kutusu</h2>
          <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <button onClick={() => setMatchTab('messages')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${matchTab === 'messages' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>Mesajlar</button>
            <button onClick={() => setMatchTab('offers')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${matchTab === 'offers' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>Teklifler</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
          {matchTab === 'messages' ? matches.map(m => (
            <div key={m.id} onClick={() => handleOpenChat(m)} className="flex items-center gap-4 py-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer">
              <img src={m.otherUser.avatar} className="w-14 h-14 rounded-full object-cover" />
              <div className="flex-1">
                <h4 className="font-bold dark:text-white">{m.otherUser.name}</h4>
                <p className="text-sm text-zinc-500 truncate">{(m as any).lastMessage || 'Sohbeti açmak için dokun'}</p>
              </div>
            </div>
          )) : offers.map(o => {
            const isMyOffer = o.fromUserId === currentUser?.id;
            const otherUserId = isMyOffer ? o.toUserId : o.fromUserId;
            const otherUser: User = otherUserId === currentUser?.id ? currentUser! : { id: otherUserId, name: 'Kullanıcı', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}` };
            const senderProduct = (isMyOffer ? myProducts : marketProducts).find(p => p.id === o.myProductId);
            const receiverProduct = (isMyOffer ? marketProducts : myProducts).find(p => p.id === o.offeredProductId);
            if (!senderProduct || !receiverProduct) return null;
            return (
              <div key={o.id} className="py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                  <img src={otherUser?.avatar} className="w-10 h-10 rounded-full object-cover" />
                  <div><p className="font-bold text-sm dark:text-white">{otherUser?.name}</p><p className="text-xs text-zinc-500">{isMyOffer ? 'Teklif Gönderdin' : 'Takas Teklifi'}</p></div>
                </div>
                <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl mb-4 cursor-pointer" onClick={() => setSelectedProduct(isMyOffer ? receiverProduct : senderProduct)}>
                  <div className="relative"><img src={isMyOffer ? senderProduct.image : receiverProduct.image} className="w-14 h-14 rounded-lg object-cover" /><div className="absolute -bottom-1 -left-1 bg-zinc-900 text-white text-[8px] px-1 rounded-sm font-bold">SENİN</div></div>
                  <div className="flex flex-col items-center gap-1"><RefreshCw size={16} className="text-zinc-400" /><span className="text-[10px] text-zinc-400 font-bold">DEĞİŞİM</span></div>
                  <div className="relative"><img src={isMyOffer ? receiverProduct.image : senderProduct.image} className="w-14 h-14 rounded-lg object-cover" /><div className="absolute -bottom-1 -right-1 bg-[#00592e] text-white text-[8px] px-1 rounded-sm font-bold">TEKLİF</div></div>
                </div>
                {o.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleStartChatFromOffer(o)} className="flex-[2] py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"><MessageCircle size={16} />Sohbet Et</button>
                    {!isMyOffer && <button onClick={() => handleOfferResponse(o.id, 'accepted')} className="flex-[3] py-3 bg-[#00592e] text-white rounded-xl font-bold text-xs">Kabul Et</button>}
                    {isMyOffer && <button className="flex-[3] py-3 bg-zinc-200 text-zinc-500 rounded-xl font-bold text-xs cursor-default">Bekleniyor</button>}
                  </div>
                ) : (
                  <div className={`text-center py-3 rounded-xl font-bold text-sm ${o.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {o.status === 'accepted' ? 'Kabul Edildi' : 'Reddedildi'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );

    const renderAuth = () => (
      <div className="min-h-screen bg-[#488118] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
        <div className="w-full max-w-md z-10">
          <div className="text-center mb-10">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center mb-6">
              <img src={appLogo} alt="Swap Barter Logo" className="w-32 h-32 object-contain" onError={() => console.log("Logo yüklenemedi")} />
            </motion.div>
            <h1 className="text-3xl font-black italic tracking-tighter text-[#00592e] dark:text-white uppercase">swap <span className="text-[#ffab00]">barter</span></h1>
            <p className="text-zinc-100 mt-2">Eşyalarını takasla, yenilerini keşfet.</p>
          </div>
          {authError && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2"><XCircle size={16} />{authError}</div>}
          <form onSubmit={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handleForgotPassword} className="space-y-4">
            {authMode === 'signup' && (
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <UserIcon className="text-zinc-400" size={20} />
                <input type="text" placeholder="Ad Soyad" value={name} onChange={e => setName(e.target.value)} className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400" required />
              </div>
            )}
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <Mail className="text-zinc-400" size={20} />
              <input type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400" required />
            </div>
            {authMode !== 'forgot' && (
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <Lock className="text-zinc-400" size={20} />
                <input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400" required />
              </div>
            )}
            <button disabled={authLoading} type="submit" className="w-full bg-[#ffab00] text-[#488118] py-4 rounded-xl font-bold text-lg shadow-xl shadow-[#ffab00]/40 active:scale-95 transition-all duration-200 disabled:opacity-50 uppercase tracking-wider">
              {authLoading ? <Loader2 className="animate-spin mx-auto" /> : authMode === 'login' ? 'Giriş Yap' : authMode === 'signup' ? 'Kayıt Ol' : 'Şifremi Sıfırla'}
            </button>
          </form>
          <div className="mt-6 text-center space-y-2">
            {authMode === 'login' && (<><button onClick={() => setAuthMode('signup')} className="text-zinc-100 font-bold text-sm block w-full">Hesabın yok mu? <span className="text-[#ffab00]">Kayıt Ol</span></button><button onClick={() => setAuthMode('forgot')} className="text-zinc-100 text-xs font-semibold">Şifremi Unuttum</button></>)}
            {authMode === 'signup' && <button onClick={() => setAuthMode('login')} className="text-zinc-100 font-bold text-sm">Zaten hesabın var mı? <span className="text-[#ffab00]">Giriş Yap</span></button>}
            {authMode === 'forgot' && <button onClick={() => setAuthMode('login')} className="text-zinc-500 font-bold text-sm">Giriş ekranına dön</button>}
          </div>
        </div>
      </div>
    );


    const renderUpload = () => (
      <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
        <div className="bg-[#00592e] p-6 pb-2 rounded-b-[35px] shadow-lg shadow-green-100 dark:shadow-none w-full mb-2">
          <h1 className="text-white text-3xl font-black italic uppercase drop-shadow-md">swap <span className="text-[#ffab00]">barter</span></h1>
          <h2 className="text-white text-sm italic opacity-95">{editingProductId ? 'İlanı Düzenle' : 'İlan Bilgileri'}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-zinc-500 mb-2">Fotoğraflar</label>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {uploadForm.images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 flex-shrink-0">
                    <img src={img} className="w-full h-full object-cover rounded-xl" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setShowPhotoOptions(true)} className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-300 dark:border-zinc-700"><CameraIcon size={24} /></button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" multiple />
              <input type="file" ref={cameraInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" capture="environment" />
              {showPhotoOptions && (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={handleTakePhoto} className="text-xs bg-emerald-100 text-[#00592e] px-3 py-1 rounded-lg font-bold">Kamera</button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-violet-100 text-[#ffab00] px-3 py-1 rounded-lg font-bold">Galeri</button>
                  <button type="button" onClick={() => setShowPhotoOptions(false)} className="text-xs text-zinc-400 px-3 py-1">İptal</button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-500 mb-2">Başlık</label>
              <input required value={uploadForm.title} onChange={e => setUploadForm({...uploadForm, title: e.target.value})} className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-white" placeholder="Örn: iPhone 13 128GB" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-zinc-500 mb-2">Fiyat (TL)</label>
                <input type="text" required value={uploadForm.price ? Number(uploadForm.price).toLocaleString('tr-TR') : ''} onChange={e => { const raw = e.target.value.replace(/\./g, ""); if (!isNaN(Number(raw))) setUploadForm({...uploadForm, price: raw}); }} className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-white" placeholder="0" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-zinc-500 mb-2">Kategori</label>
                <div className="relative">
                  <select value={uploadForm.category} onChange={e => setUploadForm({...uploadForm, category: e.target.value})} className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-white appearance-none">
                    {['Elektronik', 'Moda', 'Ev', 'Hobi', 'Araç', 'Spor', 'Müzik'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-4 text-zinc-400 pointer-events-none" size={20} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-500 mb-2">Açıklama</label>
              <textarea required value={uploadForm.description} onChange={e => setUploadForm({...uploadForm, description: e.target.value})} className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none text-zinc-900 dark:text-white min-h-[120px]" placeholder="Ürün durumu, kullanım süresi vb." />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-500 mb-2">Durum</label>
              <div className="flex gap-2">
                {['Yeni Gibi', 'İdare Eder', 'Eski'].map(c => (
                  <button key={c} type="button" onClick={() => setUploadForm({...uploadForm, condition: c as any})} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${uploadForm.condition === c ? 'bg-[#00592e] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{c}</button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={isUploading} className="w-full bg-[#00592e] text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50">
              {isUploading ? 'Kaydediliyor...' : 'Yayınla'}
            </button>
          </form>
          <AnimatePresence>
            {showCropperModal && imageToCrop && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black flex flex-col">
                <div className="relative flex-1 w-full bg-black">
                  <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                </div>
                <div className="bg-zinc-900 p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4 px-4">
                    <span className="text-xs text-zinc-400 font-bold">Uzak</span>
                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#00592e]" />
                    <span className="text-xs text-zinc-400 font-bold">Yakın</span>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => { setShowCropperModal(false); setImageToCrop(null); }} className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold">İptal</button>
                    <button onClick={handleSaveCroppedImage} className="flex-[2] py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2"><CropIcon size={20} />Kırp & Kaydet</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );

    const renderSwipe = () => (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
        <div className="bg-[#00592e] p-6 pb-4 rounded-b-[35px] shadow-lg w-full mb-4">
          <h2 className="text-xl font-black italic tracking-tighter text-white uppercase">Takas Keşfet</h2>
          <h3 className="text-xs font-black italic text-white uppercase opacity-80">hayalindeki ürüne parasız ulaş</h3>
        </div>
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {!selectedMyProductId ? (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              {myProducts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-2"><PlusCircle size={40} className="text-zinc-300 dark:text-zinc-600" /></div>
                  <h3 className="font-bold text-xl dark:text-white">Henüz Ürünün Yok</h3>
                  <button onClick={() => setView('upload')} className="bg-[#00592e] text-white px-6 py-3 rounded-xl font-bold mt-4">Hemen İlan Ekle</button>
                </div>
              ) : (
                <>
                  <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <Sparkles className="text-[#ffab00] shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="font-bold text-green-700 text-sm mb-1">Takaslamak istediğin ürünü seç</h3>
                      <p className="text-[#ffab00]/80 text-xs">Seçtiğin ürünün değerine yakın ilanları senin için bulacağız.</p>
                    </div>
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Ürünlerim ({myProducts.length})</h3>
                  <div className="space-y-3 pb-20">
                    {myProducts.map(p => (
                      <div key={p.id} onClick={() => startSwapSession(p)} className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-violet-500 transition-colors shadow-sm">
                        <img src={p.image} className="w-16 h-16 rounded-xl object-cover bg-zinc-100" onError={handleImageError} />
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{p.title}</h4>
                          <p className="text-emerald-500 font-bold text-xs mt-1">{p.price.toLocaleString('tr-TR')} TL</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center"><ArrowRight size={16} className="text-zinc-400" /></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center relative">
              <SwipeDeck candidates={swapCandidates} onSwipe={handleSwipe} />
              {swapCandidates.length === 0 && (
                <div className="absolute bottom-20 left-0 right-0 flex justify-center z-20 pointer-events-none">
                  <button onClick={() => setSelectedMyProductId(null)} className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-white px-6 py-3 rounded-full font-bold shadow-lg border border-zinc-200 dark:border-zinc-700 pointer-events-auto flex items-center gap-2">
                    <Repeat size={16} /> Farklı Ürün Seç
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );


};

export default App;
