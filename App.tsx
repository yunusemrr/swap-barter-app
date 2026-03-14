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
    ShoppingBag, 
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
    Star,
    UserX,
    UserCog,
    Bell,
    Filter,
    Crop as CropIcon
  } from 'lucide-react';
  import Cropper from 'react-easy-crop';
  import appLogo from './src/logo.png'; // Dosya adın neyse ona göre yaz
  import { App as CapacitorApp } from '@capacitor/app';
  import { motion, AnimatePresence } from 'framer-motion';
  import { Product, ViewState, Match, User, Offer } from './types';
  import { Geolocation } from '@capacitor/geolocation';
  import { CameraResultType, CameraSource } from '@capacitor/camera';
  import { Camera } from '@capacitor/camera';
  import { INITIAL_MARKET_PRODUCTS, MOCK_USERS, INITIAL_MY_PRODUCTS, MOCK_OFFERS } from './constants';
  import { generateProductDescription } from './services/geminiService';
  import { SwipeDeck } from './components/SwipeDeck';

  // Firebase Imports
  import { db, auth } from './firebaseConfig';
  import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, getDoc, deleteDoc, updateDoc, where } from 'firebase/firestore';
  import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
  // Bu değişken App bileşeninin DIŞINDA olmalı!


  const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Şanlıurfa", "Kocaeli", "Samsun", "Trabzon", "Eskişehir", "Mersin", "Diyarbakır"];

  const App = () => {
      alert('APP BAŞLADI');

    // Uygulama ilk açıldığında izinleri istemek için fonksiyon
  const requestPermissions = async () => {
    try {
      // Kamera izni iste
      await Camera.requestPermissions();
      // Konum izni iste
      await Geolocation.requestPermissions();
    } catch (error) {
      console.warn("Kullanıcı bazı izinleri reddetti veya bir hata oluştu.");
    }
  };
  useEffect(() => {
    requestPermissions();
  }, []);

    //tablet genişliği 
    const [isTablet, setIsTablet] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => setIsTablet(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); 
    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
    
    // Auth Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [authError, setAuthError] = useState('');

    // App State
    const [view, setView] = useState<ViewState | 'profile-settings'>('home');
    const [matchTab, setMatchTab] = useState<'messages' | 'offers'>('messages');
    const [profileTab, setProfileTab] = useState<'my' | 'favorites'>('my');
    
    // Data States
    const [marketProducts, setMarketProducts] = useState<Product[]>([]);
    const [myProducts, setMyProducts] = useState<Product[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);  

  // Chat State
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{id?: string, text?: string, image?: string, isMe: boolean}[]>([]);
    
    // Loading & Refresh States
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // New State Features
    const [favorites, setFavorites] = useState<string[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    // Selection States
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); 
    const [selectedUser, setSelectedUser] = useState<User | null>(null); 
    const [showProductSwapSelection, setShowProductSwapSelection] = useState(false); 
    const [activeMatch, setActiveMatch] = useState<Match | null>(null); 
    const [selectedMyProductForAction, setSelectedMyProductForAction] = useState<Product | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [bannerContent, setBannerContent] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error'; icon?: React.ReactNode } | null>(null);
    
    // Profile Editing State
    const [editProfileName, setEditProfileName] = useState('');
    const [editProfileAvatar, setEditProfileAvatar] = useState('');
    const profileFileInputRef = useRef<HTMLInputElement>(null);

    // Navigation History for overlay return
    const [tempReturnProduct, setTempReturnProduct] = useState<Product | null>(null);
    
    // Location State
    const [showLocationModal, setShowLocationModal] = useState(false);
    
    // Confirmation Modal State
    const [confirmationModal, setConfirmationModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      type: 'danger' | 'normal';
      onConfirm: () => void;
    } | null>(null);

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
      minPrice: '',
      maxPrice: '',
      category: '',
      condition: '',
      location: ''
    });

    // States for Upload & Edit
    const [isUploading, setIsUploading] = useState(false);
    const [showPhotoOptions, setShowPhotoOptions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null); 
    const chatFileInputRef = useRef<HTMLInputElement>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null); 
    const [crop, setCrop] = useState({ x: 0, y: 0 }); 
    const [zoom, setZoom] = useState(1); 
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null); 
    const [showCropperModal, setShowCropperModal] = useState(false);
    
    // Upload Form State
    const [uploadForm, setUploadForm] = useState({
      title: '',
      description: '',
      price: '',
      images: [] as string[],
      category: 'Elektronik',
      condition: 'Yeni Gibi' as const,
      preferredTradeCategory: ''
    });
    const [editingProductId, setEditingProductId] = useState<string | null>(null); 

    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    // States for Swap Mode
    const [swapTab, setSwapTab] = useState<'swipe' | 'offers'>('offers');
    const [selectedMyProductId, setSelectedMyProductId] = useState<string | null>(null);
    const [swapCandidates, setSwapCandidates] = useState<Product[]>([]);
    const [newMatch, setNewMatch] = useState<Match | null>(null);

    // Pull to refresh refs
    const contentRef = useRef<HTMLDivElement>(null);
    const [pullStartY, setPullStartY] = useState(0);
    // ========================================
    // --- EŞLEŞME BİLDİRİMİ OTOMATİK GİZLEME ---
    // ========================================
    useEffect(() => {
        if (newMatch) {
            // Eğer yeni bir eşleşme varsa, 2 saniye (2000ms) sonra state'i null yap (gizle)
            const timer = setTimeout(() => {
                setNewMatch(null);
            }, 2000);

            // Eğer kullanıcı 3 saniye dolmadan başka bir işlem yaparsa sayacı temizle (Memory leak önlemi)
            return () => clearTimeout(timer);
        }
    }, [newMatch]);

   // ========================================
    // --- GERİ TUŞU YÖNETİMİ (SAYFA GEÇMİŞİ / HISTORY VERSİYONU) ---
    // ========================================
    
    // 1. Ekran durumunu ve geçmişini tutacak Ref'ler
    const stateRef = useRef({});
    const viewHistory = useRef(['home']); // Ziyaret edilen sayfalar listesi ('home' ile başlar)
    const isBackNavigation = useRef(false); // Sadece geri tuşuyla dönüldüğünü anlamak için
    const lastBackPress = useRef(0); // Çift basma (bounce) koruması

    // 2. Her renderda güncel durumu Ref'e kaydet
    useEffect(() => {
        stateRef.current = {
            view, selectedProduct, showFilterModal, showLocationModal, 
            showProductSwapSelection, confirmationModal, showChatMenu, 
            showPhotoOptions, tempReturnProduct, selectedUser
        };
    }); 

    // 3. OTOMATİK SAYFA GEÇMİŞİ (HISTORY) KAYDEDİCİ
    // Sen sekmelerde her dolaştığında burası çalışır ve girdiğin sayfayı gizlice listeye ekler
    useEffect(() => {
        // Eğer geri tuşuyla bir önceki sayfaya döndüysek, listeye tekrar ekleme yapma
        if (isBackNavigation.current) {
            isBackNavigation.current = false;
        } else {
            // Yeni bir sayfaya tıklandıysa ve bu sayfa listedeki en son sayfa değilse, listeye ekle
            if (viewHistory.current[viewHistory.current.length - 1] !== view) {
                viewHistory.current.push(view);
            }
        }
    }, [view]);

    // 4. Ana Dinleyici
    useEffect(() => {
        CapacitorApp.removeAllListeners();

        const listener = CapacitorApp.addListener('backButton', () => {
            const now = Date.now();
            // Donanımsal çift tıklamayı önle (300ms koruma)
            if (now - lastBackPress.current < 300) return;
            lastBackPress.current = now;

            const state = stateRef.current;

            // A. MODALLAR VE POPUPLAR (Açıksa SADECE onu kapat ve bekle)
            if (state.confirmationModal) { setConfirmationModal(null); return; }
            if (state.showProductSwapSelection) { setShowProductSwapSelection(false); return; }
            if (state.showLocationModal) { setShowLocationModal(false); return; }
            if (state.showFilterModal) { setShowFilterModal(false); return; }
            if (state.showChatMenu) { setShowChatMenu(false); return; }
            if (state.showPhotoOptions) { setShowPhotoOptions(false); return; }
            if (state.selectedProduct) { setSelectedProduct(null); return; }

            // (Kullanıcı profilinden çıkarken arkada kalan geçici verileri temizle)
            if (state.view === 'user-profile') {
                setSelectedUser(null);
                setTempReturnProduct(null);
            }

            // B. SAYFA GEÇMİŞİNE GÖRE (ADIM ADIM) GERİ DÖN
            if (viewHistory.current.length > 1) {
                // Şu anki bulunduğumuz sayfayı listeden çıkar
                viewHistory.current.pop();
                
                // Listede kalan en son sayfayı (bir önceki sayfayı) al
                const previousView = viewHistory.current[viewHistory.current.length - 1];
                
                // Geri tuşu ile gittiğimizi işaretle ve sayfayı değiştir
                isBackNavigation.current = true;
                setView(previousView);
            } else {
                // Geçmişte gidecek sayfa kalmadıysa (yani en başa döndüysek) uygulamadan çık
                CapacitorApp.exitApp();
            }
        });

        return () => {
            listener.then(handle => handle.remove());
        };
    }, []);
    // ========================================
    // --- Auth & Initial Setup Effects ---

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              setCurrentUser(userDoc.data() as User);
            } else {
              const fallbackUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.email?.split('@')[0] || 'Kullanıcı',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                email: firebaseUser.email || '',
                location: 'İstanbul',
                swapCount: 0
              };
              setCurrentUser(fallbackUser);
            }
            if (view === 'auth') setView('home');
          } catch (error) {
            console.error("Error fetching user data:", error);
            setCurrentUser({
                id: firebaseUser.uid,
                name: firebaseUser.email?.split('@')[0] || 'Kullanıcı',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                email: firebaseUser.email || '',
                location: 'İstanbul',
                swapCount: 0
            });
            if (view === 'auth') setView('home');
          }
        } else {
          setCurrentUser(null);
          setView('auth');
        }
        setAuthLoading(false);
      });

      return () => unsubscribe();
    }, 
  );
  // GEÇICI DEBUG - Sorun bulduktan sonra sil
useEffect(() => {
  const debugFirebase = async () => {
    try {
      const { getDocs, collection: col } = await import('firebase/firestore');
      const snapshot = await getDocs(col(db, 'products'));
      alert('Firebase OK! Ürün sayısı: ' + snapshot.size);
    } catch (error: any) {
      alert('Firebase HATA: ' + error.message + ' | Code: ' + error.code);
    }
  };
  setTimeout(debugFirebase, 3000); // 3 saniye bekle, uygulama açılsın
}, []);

    useEffect(() => {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, [isDarkMode]);
    useEffect(() => {
  if (view === 'settings' && currentUser) {
      setEditProfileName(currentUser.name);
      setEditProfileAvatar(currentUser.avatar); // Ayarlara girince mevcut fotoyu hafızaya al
  }
}, [view, currentUser]);

    useEffect(() => {
      // Update banner content based on current view
      switch (view) {
        case 'chat':
          setBannerContent({ message: `Sohbet: ${activeMatch?.otherUser.name || 'Kullanıcı'}`, type: 'info', icon: <MessageCircle size={18} /> });
          break;
        case 'user-profile':
          setBannerContent({ message: `Kullanıcı Profili: ${selectedUser?.name || 'Kullanıcı'}`, type: 'info', icon: <UserIcon size={18} /> });
          break;
        case 'profile-settings':
          setBannerContent({ message: 'Profil bilgilerinizi güncelleyin.', type: 'info', icon: <UserCog size={18} /> });
          break;
        default:
          setBannerContent(null);
      }
    }, [view, activeMatch, selectedUser]);

    useEffect(() => {
      if (view === 'profile-settings' && currentUser) {
          setEditProfileName(currentUser.name);
          setEditProfileAvatar(currentUser.avatar);
      }
    }, [view, currentUser]);

    useEffect(() => {
      if (selectedProduct) {
          setIsDescriptionExpanded(false);
      }
    }, [selectedProduct]);

    useEffect(() => {
  if (!currentUser) return;

      const productsRef = collection(db, 'products');
      const q = query(productsRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const allProducts: Product[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));

        // Sadece veritabanından gelen gerçek ürünleri listeliyoruz
        setMarketProducts(allProducts); 
        setMyProducts(allProducts.filter(p => p.userId === currentUser.id));
        
        setIsLoading(false);
      }, (error) => {
        console.error("Firebase fetch error:", error);
        // Hata olursa ekranı boş bırak, sahte veri getirme
        setMarketProducts([]); 
        setMyProducts([]);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
      if (!currentUser) return;
      const matchesRef = collection(db, 'matches');
      
      // Yalnızca benim ID'min geçtiği (benim dahil olduğum) sohbetleri getir
      const qMatches = query(matchesRef, where('users', 'array-contains', currentUser.id));
      
      const unsubscribe = onSnapshot(qMatches, (snapshot) => {
        const allMatches = snapshot.docs.map(doc => {
            const data = doc.data();
            // EĞER user1 bensem karşı taraf user2'dir, değilse user1'dir. (Böylece herkes karşı tarafı görür)
            const otherUser = data.user1.id === currentUser.id ? data.user2 : data.user1;
            return { ...data, id: doc.id, otherUser } as Match;
        });
        
        // Mesajları son atılana göre sırala (En yeni mesaj en üstte)
        allMatches.sort((a, b) => {
            const tA = (a as any).timestamp?.toMillis?.() || 0;
            const tB = (b as any).timestamp?.toMillis?.() || 0;
            return tB - tA;
        });

        setMatches(allMatches); 
      });
      return () => unsubscribe();
    }, [currentUser]);

    // Listen to Offers
    // Listen to Offers
    useEffect(() => {
      if (!currentUser) return;
      const offersRef = collection(db, 'offers');
      const qOffers = query(offersRef, orderBy('timestamp', 'desc'));

      const unsubscribeOffers = onSnapshot(qOffers, (snapshot) => {
          const allOffers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
          
          // Sadece bana gelen veya benim gönderdiğim gerçek teklifleri filtrele
          const myOffers = allOffers.filter(o => o.fromUserId === currentUser.id || o.toUserId === currentUser.id);
          
          // Sahte veri yok, direkt gerçek teklifleri basıyoruz
          setOffers(myOffers);
      });

      return () => unsubscribeOffers();
    }, [currentUser]);
    
    // Listen to Real Messages
    useEffect(() => {
      if (!activeMatch || !currentUser) return;
      
      const messagesRef = collection(db, 'messages');
      // Sadece bu eşleşmeye (sohbete) ait mesajları getir
      const q = query(messagesRef, where('matchId', '==', activeMatch.id));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
        
        // Mesajları gönderim zamanına göre (eskiden yeniye) sırala
        msgs.sort((a, b) => {
            const tA = a.timestamp?.toMillis?.() || 0;
            const tB = b.timestamp?.toMillis?.() || 0;
            return tA - tB;
        });

        setChatHistory(msgs.map(m => ({
            id: m.id,
            text: m.text,
            image: m.image,
            isMe: m.senderId === currentUser.id
        })));
      });

      return () => unsubscribe();
    }, [activeMatch, currentUser]);
    
    useEffect(() => {
      if (!currentUser) return;
      const offersRef = collection(db, 'offers');
      const qOffers = query(offersRef, orderBy('timestamp', 'desc'));

      const unsubscribeOffers = onSnapshot(qOffers, (snapshot) => {
          const allOffers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Offer));
          const myOffers = allOffers.filter(o => o.fromUserId === currentUser.id || o.toUserId === currentUser.id);
          
          if (myOffers.length > 0) {
              setOffers(myOffers);
          } else {
              setOffers(MOCK_OFFERS.filter(o => o.toUserId === 'me' || o.fromUserId === 'me'));
          }
      });

      return () => unsubscribeOffers();
    }, [currentUser]);

  
    // --- Handlers ---

    const handleRefresh = async () => {
      setIsRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsRefreshing(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (contentRef.current?.scrollTop === 0) {
        setPullStartY(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      if (contentRef.current?.scrollTop === 0 && endY - pullStartY > 100 && !isRefreshing) {
        handleRefresh();
      }
      setPullStartY(0);
    };

    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError('');
      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.reload();
      } catch (err: any) {
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
          id: cred.user.uid,
          name: name,
          email: email,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cred.user.uid}`,
          location: 'İstanbul',
          swapCount: 0
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
      if (!email) {
        setAuthError('Lütfen e-posta adresinizi girin.');
        return;
      }
      setAuthLoading(true);
      setAuthError('');
      try {
        await sendPasswordResetEmail(auth, email);
        alert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        setAuthMode('login');
      } catch (err: any) {
        console.error(err);
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
          try {
            await signOut(auth);
            setCurrentUser(null);
            setEmail('');
            setPassword('');
            setView('auth');
          } catch (error) {
            console.error("Logout failed:", error);
            setCurrentUser(null);
            setView('auth');
          }
        }
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
            
            const user = auth.currentUser;
            if (user) {
              try {
                  await user.delete();
              } catch (authError) {
                  console.error("Auth account deletion failed:", authError);
              }
            }

            await signOut(auth);
            setCurrentUser(null);
            setView('auth');
            alert("Hesabınız silindi.");
          } catch (error) {
            console.error("Delete account error:", error);
            alert("Hesap silinirken bir hata oluştu.");
          }
        }
      });
    };

    const handleUpdateLocation = async (newLocation: string) => {
      if(currentUser) {
          const updatedUser = { ...currentUser, location: newLocation };
          setCurrentUser(updatedUser);
          setShowLocationModal(false);
          try {
              await setDoc(doc(db, 'users', currentUser.id), { location: newLocation }, { merge: true });
          } catch (e) { console.error(e); }
      }
    };

    const toggleFavorite = (e: React.MouseEvent, productId: string) => {
      e.stopPropagation();
      if (favorites.includes(productId)) {
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        setFavorites([...favorites, productId]);
      }
    };

    const handleBlockUser = (userToBlock: User) => {
      if (confirm("Bu kullanıcıyı engellemek istediğinize emin misiniz?")) {
        if (!blockedUsers.some(u => u.id === userToBlock.id)) {
          setBlockedUsers([...blockedUsers, userToBlock]);
        }
        setView('home');
        setSelectedUser(null);
      }
    };

    const handleUnblockUser = (userId: string) => {
      setBlockedUsers(blockedUsers.filter(u => u.id !== userId));
    };

    const handleAIHelp = async () => {
  if (!uploadForm.title || uploadForm.images.length === 0) {
    alert("Önce bir fotoğraf eklemelisin ki yapay zeka ürünü analiz edebilsin!");
    return;
  }
  
  setIsGeneratingAI(true);
  try {
    // Sadece ilk resmi analiz için gönderiyoruz
    const mainImage = uploadForm.images[0]; 
    const desc = await generateProductDescription(
      uploadForm.title, 
      uploadForm.category, 
      uploadForm.condition, 
      mainImage
    );
    setUploadForm(prev => ({ ...prev, description: desc }));
  } catch (error) {
    console.error("AI Hatası:", error);
  } finally {
    setIsGeneratingAI(false);
  }
};

    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          };
          img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
      });
    };
    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous'); 
            image.src = url;
        });

    const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d'); // <-- DÜZELTİLEN YER (const ctx)

        if (!ctx) {
            throw new Error('Canvas context bulunamadı');
        }

        // Canvas boyutlarını kırpılan alana göre ayarla
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        // Resmi canvas üzerine kırpılmış şekilde çiz
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // Canvas'ı base64 resim formatına çevir
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Canvas boş!');
                    return;
                }
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    resolve(reader.result as string);
                };
            }, 'image/jpeg', 0.9);
        });
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSaveCroppedImage = async () => {
        if (imageToCrop && croppedAreaPixels) {
            try {
                const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
                setUploadForm(prev => ({
                    ...prev,
                    images: [...prev.images, croppedImage]
                }));
                setShowCropperModal(false);
                setImageToCrop(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            } catch (e) {
                console.error("Kırpma hatası:", e);
                alert("Resim kırpılırken bir hata oluştu.");
            }
        }
    };
// 1. KAMERA FONKSİYONU (Dışarıda ve bağımsız - Doğru yapmışsın)
const handleTakePhoto = async () => {
    try {
        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera
        });

        if (image.dataUrl) {
            setImageToCrop(image.dataUrl);
            setShowCropperModal(true);
            setShowPhotoOptions(false);
        }
    } catch (error) {
        console.error("Kamera açılırken hata:", error);
    }
};

// 2. GALERİDEN SEÇME FONKSİYONU (Temizlenmiş hali)
const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        try {
            const compressed = await compressImage(file);
            setImageToCrop(compressed);
            setShowCropperModal(true);
            setShowPhotoOptions(false);
        } catch (error) {
            console.error("Resim hazırlama hatası:", error);
        }
        e.target.value = ''; // Aynı resmi tekrar seçebilmek için reset
    }
};

    const handleProfileImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        try {
            const compressed = await compressImage(e.target.files[0]);
            setEditProfileAvatar(compressed);
        } catch (err) {
            console.error("Image error", err);
        }
      }
    };

const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
        // 1. Firebase'e hem ismi hem de fotoğrafı gönderiyoruz
        await updateDoc(doc(db, 'users', currentUser.id), {
            name: editProfileName,
            avatar: editProfileAvatar // Fotoğrafın kaybolmaması için bu satır kritik
        });

        // 2. Uygulama içindeki kullanıcı bilgisini de anında güncelliyoruz
        setCurrentUser({
            ...currentUser, 
            name: editProfileName, 
            avatar: editProfileAvatar 
        });

        alert("Profil başarıyla güncellendi.");
        setView('profile'); // Ayarlardan profil sayfasına geri dön
    } catch (error) {
        console.error("Profil güncellenirken hata oluştu:", error);
        alert("Profil güncellenemedi, lütfen tekrar deneyin.");
    }
};



  

    const removeImage = (indexToRemove: number) => {
      setUploadForm(prev => ({
        ...prev,
        images: prev.images.filter((_, index) => index !== indexToRemove)
      }));
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;
      setIsUploading(true);
      
      const finalImages = uploadForm.images.length > 0 
        ? uploadForm.images 
        : [`https://picsum.photos/400/600?random=${Date.now()}`];

      const productData = {
        userId: currentUser.id, 
        title: uploadForm.title,
        description: uploadForm.description,
        price: Number(uploadForm.price),
        image: finalImages[0], 
        images: finalImages, 
        category: uploadForm.category,
        condition: uploadForm.condition,
        preferredTradeCategory: uploadForm.preferredTradeCategory,
        location: currentUser.location || "İstanbul",
        userAvatar: currentUser.avatar, 
        userName: currentUser.name, 
        timestamp: serverTimestamp()
      };

      try {
  if (editingProductId) {
    await updateDoc(doc(db, 'products', editingProductId), productData);
    alert("Ürün güncellendi!");
  } else {
    await addDoc(collection(db, 'products'), productData);
    // İsteğe bağlı alert'i kaldırabilirsin
  }
  
  // DÜZELTME: 'profile' yerine 'home' yaparak ana sayfaya yönlendir
  setView('home'); 
  
  // Formu sıfırla
  setUploadForm({ title: '', description: '', price: '', images: [], category: 'Elektronik', condition: 'Yeni Gibi', preferredTradeCategory: '' });
  setEditingProductId(null);
} catch (error) {
  // ... hata yönetimi
}
 finally {
        setIsUploading(false);
      }
    };

    const handleCompleteSwap = async () => {
      if (!selectedProduct || !currentUser) return;
      
      if (confirm('Bu ürünü takasladığını onaylıyor musun? Profilinden kaldırılacak ve takas puanın artacak.')) {
          try {
              await deleteDoc(doc(db, 'products', selectedProduct.id));
              
              const newCount = (currentUser.swapCount || 0) + 1;
              const userRef = doc(db, 'users', currentUser.id);
              await updateDoc(userRef, { swapCount: newCount });
              
              setCurrentUser({ ...currentUser, swapCount: newCount });
              
              setSelectedProduct(null);
              alert(`Tebrikler! Takas puanın yükseldi: ${newCount}`);
          } catch (error) {
              console.error("Error completing swap", error);
              const newCount = (currentUser.swapCount || 0) + 1;
              setCurrentUser({ ...currentUser, swapCount: newCount });
              setMyProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
              setSelectedProduct(null);
          }
      }
    };

    const handleInitiateSwap = async (myProductId: string) => {
      if (!selectedProduct || !currentUser) return;

      // Save offer to DB
      const offerData = {
          fromUserId: currentUser.id,
          toUserId: selectedProduct.userId,
          myProductId: myProductId,
          offeredProductId: selectedProduct.id,
          status: 'pending',
          timestamp: Date.now()
      };

      try {
          await addDoc(collection(db, 'offers'), offerData);
          alert(`Teklif gönderildi: ${myProducts.find(p=>p.id===myProductId)?.title} <-> ${selectedProduct.title}`);
          setShowProductSwapSelection(false);
          setSelectedProduct(null);
      } catch (error) {
          console.error("Error sending offer:", error);
          alert("Teklif gönderilirken bir hata oluştu.");
      }
    };

    const startSwapSession = (myProduct: Product) => {
      if (!currentUser) return;
      setSelectedMyProductId(myProduct.id);
      const range = 0.3; 
      const minPrice = myProduct.price * (1 - range);
      const maxPrice = myProduct.price * (1 + range);
      
      const candidates = marketProducts.filter(p => 
        p.userId !== currentUser.id && 
        !blockedUsers.some(u => u.id === p.userId) &&
        p.price >= minPrice && 
        p.price <= maxPrice
      );
      
      setSwapCandidates(candidates);
      setSwapTab('swipe');
      setView('swipe');
    };

    const handleSwipe = async (direction: 'left' | 'right', product: Product) => {
      setSwapCandidates(prev => prev.filter(p => p.id !== product.id));

      if (direction === 'right') {
        const isMatch = Math.random() > 0.3; 
        
        if (isMatch && selectedMyProductId) {
          const matchData = {
            myProductId: selectedMyProductId,
            otherProductId: product.id,
            otherUser: MOCK_USERS.find(u => u.id === product.userId) || { id: product.userId, name: 'Kullanıcı', avatar: 'https://via.placeholder.com/50' },
            timestamp: Date.now()
          };

          try {
            const docRef = await addDoc(collection(db, 'matches'), matchData);
            const newMatchObj = { id: docRef.id, ...matchData } as Match;
            setNewMatch(newMatchObj);
          } catch (e) {
              console.error("Error saving match", e);
          }
        }
      }
    };

    const handleOfferResponse = (offerId: string, response: 'accepted' | 'rejected') => {
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: response } : o));
      if (response === 'accepted') {
        const offer = offers.find(o => o.id === offerId);
        if(offer) {
            const match: Match = {
                  id: Date.now().toString(),
                  myProductId: offer.myProductId,
                  otherProductId: offer.offeredProductId,
                  otherUser: MOCK_USERS.find(u => u.id === offer.fromUserId) || MOCK_USERS[0],
                  timestamp: Date.now()
              };
              setMatches([match, ...matches]);
              setNewMatch(match);
        }
      }
    };

    const handleClearFilters = () => {
      setFilters({
        minPrice: '',
        maxPrice: '',
        category: '',
        condition: '',
        location: ''
      });
      setSearchQuery('');
    };

    const handleApplyFilters = () => {
      setShowFilterModal(false);
    };

    const handleOpenChat = (match: Match) => {
      setActiveMatch(match);
      setView('chat');
    };

  const handleStartChatFromOffer = (offer: Offer) => {
      if (!currentUser) return;
      
      // Teklifi ben mi attım yoksa bana mı geldi? Ona göre karşı tarafın ID'sini bul
      const isMyOffer = offer.fromUserId === currentUser.id;
      const otherUserId = isMyOffer ? offer.toUserId : offer.fromUserId;
      
      // Ortak Sohbet ID'si oluştur (İki kişinin ID'sini birleştirir)
      const chatId = [currentUser.id, otherUserId].sort().join('_');
      
      const tempMatch: Match = {
        id: chatId,
        myProductId: offer.myProductId,
        otherProductId: offer.offeredProductId,
        otherUser: { id: otherUserId, name: 'Kullanıcı', avatar: 'https://via.placeholder.com/50' },
        timestamp: Date.now()
      };
      setActiveMatch(tempMatch);
      setView('chat');
    };

    const handleDeleteProduct = async (e: React.MouseEvent, product: Product) => {
      e.stopPropagation();
      if (confirm(`${product.title} ilanını silmek istediğine emin misin?`)) {
        try {
          await deleteDoc(doc(db, 'products', product.id));
        } catch (error) {
          console.error("Error deleting product:", error);
          alert("Ürün silinirken bir hata oluştu.");
        }
      }
    };

    const handleDeleteCurrentProduct = () => {
      if(!selectedProduct) return;
      setConfirmationModal({
          isOpen: true,
          title: 'İlanı Sil',
          message: 'Bu ilanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
          type: 'danger',
          onConfirm: async () => {
            try {
                await deleteDoc(doc(db, 'products', selectedProduct.id));
                setSelectedProduct(null);
            } catch(e) {
                console.error("Error deleting", e);
                alert("Hata oluştu");
            }
          }
      });
    };

    const handleGoToSellerProfile = (seller: User) => {
        setTempReturnProduct(selectedProduct);
        setSelectedProduct(null);
        setSelectedUser(seller);
        setView('user-profile');
    };

    const handleBackFromUserProfile = () => {
        if (tempReturnProduct) {
            setView('home'); 
            setSelectedProduct(tempReturnProduct);
            setTempReturnProduct(null);
            setSelectedUser(null);
        } else {
            setView('home');
            setSelectedUser(null);
        }
    };

    const handleMyProductAction = (action: 'edit' | 'delete' | 'findMatch', product: Product | null = null) => {
      const targetProduct = product || selectedMyProductForAction;
      if(!targetProduct) return;
      
      if (action === 'delete') {
          if(confirm(`${targetProduct.title} ilanını silmek istediğine emin misin?`)) {
              deleteDoc(doc(db, 'products', targetProduct.id))
                  .catch(console.error);
          }
      } else if (action === 'findMatch') {
          startSwapSession(targetProduct);
      } else if (action === 'edit') {
          setUploadForm({
              title: targetProduct.title,
              description: targetProduct.description,
              price: targetProduct.price.toString(),
              images: targetProduct.images || [targetProduct.image],
              category: targetProduct.category,
              condition: targetProduct.condition as any,
              preferredTradeCategory: targetProduct.preferredTradeCategory || ''
          });
          setEditingProductId(targetProduct.id);
          setSelectedProduct(null);
          setView('upload');
      }
      setSelectedMyProductForAction(null);
    };

  // 1. Ortak Gelen Kutusu Kayıt Fonksiyonu (YENİ EKLENDİ)
    const updateInboxMatch = async (msgText: string) => {
      if (!activeMatch || !currentUser) return;
      const matchRef = doc(db, 'matches', activeMatch.id);
      // setDoc ile Gelen Kutusuna bu sohbeti oluştur veya güncelle
      await setDoc(matchRef, {
          id: activeMatch.id,
          users: [currentUser.id, activeMatch.otherUser.id], // İki kullanıcının ID'si
          user1: { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar }, // Benim bilgilerim
          user2: { id: activeMatch.otherUser.id, name: activeMatch.otherUser.name, avatar: activeMatch.otherUser.avatar }, // Karşı tarafın bilgileri
          lastMessage: msgText,
          timestamp: serverTimestamp()
      }, { merge: true });
    };

    // 2. Metin Mesajı Gönderme
    const handleSendMessage = async () => {
      if (!chatMessage.trim() || !activeMatch || !currentUser) return;
      const msgText = chatMessage;
      setChatMessage(''); 
      
      try {
          await addDoc(collection(db, 'messages'), {
            matchId: activeMatch.id,
            senderId: currentUser.id,
            text: msgText,
            timestamp: serverTimestamp()
          });
          await updateInboxMatch(msgText); // Gelen Kutusunu Güncelle!
      } catch (error) {
          console.error("Mesaj gönderilemedi:", error);
      }
    };

    // 3. Fotoğraf Gönderme
    const handleChatImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && activeMatch && currentUser) {
        try {
            const img = await compressImage(e.target.files[0]);
            await addDoc(collection(db, 'messages'), {
              matchId: activeMatch.id,
              senderId: currentUser.id,
              image: img,
              timestamp: serverTimestamp()
            });
            await updateInboxMatch("📷 Fotoğraf"); // Gelen Kutusunu Güncelle!
        } catch (err) {
            console.error("Resim hatası:", err);
        }
      }
    };

    // 4. Konum Gönderme
    const handleSendLocation = async () => {
      if (!activeMatch || !currentUser) return;
      const loc = currentUser?.location || "İstanbul";
      const msgText = `📍 Konum: ${loc}`;
      try {
          await addDoc(collection(db, 'messages'), {
              matchId: activeMatch.id,
              senderId: currentUser.id,
              text: msgText,
              timestamp: serverTimestamp()
          });
          await updateInboxMatch(msgText); // Gelen Kutusunu Güncelle!
      } catch (e) { console.error(e); }
    };

    const handleDeleteChat = () => {
      if(confirm("Tüm sohbet geçmişini silmek istediğinize emin misiniz?")) {
          setChatHistory([]);
          setShowChatMenu(false);
      }
    };

    const handleDeleteMessage = (index: number) => {
      if(confirm("Bu mesajı silmek istediğinize emin misiniz?")) {
          setChatHistory(prev => prev.filter((_, i) => i !== index));
      }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
    };

    const renderConfirmationModal = () => {
      if (!confirmationModal || !confirmationModal.isOpen) return null;
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmationModal(null)}></div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl"
          >
            <h3 className="font-bold text-xl mb-2 dark:text-white">{confirmationModal.title}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">{confirmationModal.message}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmationModal(null)} 
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl"
              >
                İptal
              </button>
              <button 
                onClick={() => {
                  confirmationModal.onConfirm();
                  setConfirmationModal(null);
                }}
                className={`flex-1 py-3 font-bold rounded-xl text-white ${confirmationModal.type === 'danger' ? 'bg-red-500' : 'bg-[#00592e]'}`}
              >
                {confirmationModal.type === 'danger' ? 'Sil / Çıkış' : 'Onayla'}
              </button>
            </div>
          </motion.div>
        </div>
      );
    };
    
    // Views
    const renderHeroBanner = () => (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4 p-5 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl shadow-violet-200 dark:shadow-none relative overflow-hidden shrink-0"
    >
      {/* Dekoratif Arka Plan Çemberi */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={18} className="text-yellow-300" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Günün Fırsatı</span>
        </div>
        <h3 className="text-lg font-black leading-tight mb-1">
          Takasla, Keşfet, <br />Yenilen! 🔄
        </h3>
        <p className="text-white/80 text-[11px] font-medium">
          Kullanmadığın eşyaları ilana koy, <br />hayalindekilerle ücretsiz değiştir.
        </p>
      </div>
    </motion.div>
  );
    const renderHome = () => (

  <div className=" h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
      {/* Üst Mor Banner - Ekranı Tam Kaplayan Yapı */}
      <div className="bg-[#00592e] p-6 pb-8 rounded-b-[35px] shadow-lg shadow-violet-200 dark:shadow-none w-full">
        
        {/* Şık ve Küçük Logo Alanı */}
        
        
        <div className="flex items-center justify-between mb-6">
          
          <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-sm uppercase">
            swap <span className="text-[#ffab00]">barter</span>
          </h1>
        </div>

        {/* Alt Satırdaki Arama ve Filtreleme */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-zinc-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="İstediğin her şeyi ara..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-800 rounded-2xl border-none outline-none text-xs"
    />
          </div>
          <button 
            onClick={() => setShowFilterModal(true)} 
            className="p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm text-[#ffab00] dark:text-white active:scale-90 transition-transform"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Ürün Kartları Listesi */}
      <div className="flex-1 overflow-y-auto px-4 pb-20 no-scrollbar" ref={contentRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="grid grid-cols-2 gap-4 pt-6">
    {marketProducts
      .filter(product => {
        // 1. Arama Metni Filtresi
        const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
        
        // 2. Kategori Filtresi (Eğer bir kategori seçilmişse)
        const matchesCategory = filters.category === '' || product.category === filters.category;
        
        // 3. Minimum Fiyat Filtresi
        const matchesMinPrice = filters.minPrice === '' || product.price >= Number(filters.minPrice);
        
        // 4. Maksimum Fiyat Filtresi
        const matchesMaxPrice = filters.maxPrice === '' || product.price <= Number(filters.maxPrice);

        // Hepsi doğruysa ürünü göster
        return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
      })
      .map(product => (
        <motion.div 
          key={product.id}
          layoutId={product.id}
          // ... ürün kartı içeriği (resim, başlık, fiyat) buraya gelecek ...
          onClick={() => setSelectedProduct(product)}
          className="bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden shadow-sm border border-zinc-100 dark:border-zinc-800 pb-2 cursor-pointer"
        >
          {/* Daha önceki tasarımda yaptığımız ürün kartı kodlarını buraya koy */}
          <div className="aspect-[4/5] relative">
            <img src={product.image} className="w-full h-full object-cover" />
          </div>
          <div className="p-3">
            <h3 className="font-bold text-zinc-900 dark:text-white truncate text-sm mb-1">{product.title}</h3>
            <p className="text-[#00592e] font-black text-sm">{product.price.toLocaleString('tr-TR')} TL</p>
          </div>
        </motion.div>
      ))
    }
  </div>
        
      </div>
    </div>
  );

    const renderProductDetail = () => {
      if (!selectedProduct) return null;
      
      let ownerName = 'Satıcı';
      let ownerAvatar = 'https://via.placeholder.com/50';
      let ownerId = selectedProduct.userId;

      const isOwner = currentUser?.id === selectedProduct.userId;

      if (selectedProduct.userAvatar && selectedProduct.userName) {
          ownerName = selectedProduct.userName;
          ownerAvatar = selectedProduct.userAvatar;
      } else if (isOwner && currentUser) {
          ownerName = currentUser.name;
          ownerAvatar = currentUser.avatar;
      } else {
          const mockOwner = MOCK_USERS.find(u => u.id === selectedProduct.userId);
          if (mockOwner) {
              ownerName = mockOwner.name;
              ownerAvatar = mockOwner.avatar;
          }
      }
      
      const productOwner = isOwner ? currentUser : MOCK_USERS.find(u => u.id === selectedProduct.userId);
      const swapCount = productOwner?.swapCount || 12; 
      
      const ownerObj: User = { id: ownerId, name: ownerName, avatar: ownerAvatar };

      return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="relative h-1/2">
            <img src={selectedProduct.image} className="w-full h-full object-cover" onError={handleImageError} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-24 pointer-events-none"></div>
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 left-4 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <button onClick={(e) => toggleFavorite(e, selectedProduct.id)} className="absolute top-4 right-4 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors">
              <Heart size={20} className={favorites.includes(selectedProduct.id) ? "fill-red-500 text-red-500" : ""} />
            </button>
            {!isOwner && (
                <button onClick={() => handleBlockUser(ownerObj)} className="absolute top-4 right-16 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors">
                  <UserX size={20} />
                </button>
            )}
          </div>
          
          <div className="flex-1 p-6 flex flex-col bg-white dark:bg-zinc-900 -mt-6 rounded-t-3xl relative shadow-[0_-5px_20px_rgba(0,0,0,0.1)] no-scrollbar">
            <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedProduct.title}</h1>
              <span className="text-xl font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg ml-2 whitespace-nowrap">{selectedProduct.price.toLocaleString('tr-TR')} TL</span>
            </div>
            
            <div className="flex gap-2 mb-6">
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">{selectedProduct.category}</span>
                <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">{selectedProduct.condition}</span>
            </div>

            <div 
                onClick={() => !isOwner && handleGoToSellerProfile(ownerObj)}
                className={`flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-6 border border-zinc-100 dark:border-zinc-800 ${!isOwner ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800' : ''}`}
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

            <div className="mb-6 flex-1 overflow-y-auto no-scrollbar cursor-pointer" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
              <div className="flex justify-between items-baseline mb-2">
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">Açıklama</h3>
                  {!isDescriptionExpanded && (
                      <span className="text-xs text-[#ffab00] font-bold">Devamını Oku</span>
                  )}
              </div>
              <p className={`text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed transition-all duration-200 ${isDescriptionExpanded ? '' : 'line-clamp-3'}`}>
                  {selectedProduct.description}
              </p>
              {isDescriptionExpanded && (
                  <span className="text-xs text-[#ffab00] font-bold mt-2 block">Daha Az Göster</span>
              )}
            </div>

            {isOwner ? (
              <div className="flex gap-3 mt-auto pb-safe pt-2">
                  <button 
                    onClick={handleCompleteSwap}
                    className="flex-[2] py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                  >
                    <CheckCircle size={20} />
                    Takaslandı
                  </button>
                  <button 
                    onClick={() => handleMyProductAction('edit', selectedProduct)}
                    className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Edit size={20} />
                  </button>
                  <button 
                    onClick={handleDeleteCurrentProduct}
                    className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                  >
                    <Trash2 size={20} />
                  </button>
              </div>
            ) : (
              <div className="flex gap-3 mt-auto pb-safe pt-2">
                  <button 
                    onClick={() => setShowProductSwapSelection(true)}
                    className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                  >
                    <Repeat size={20} />
                    Takas Teklif Et
                  </button>
                  <button 
                    onClick={() => { 
                      if(!currentUser) return;
                      // İki kullanıcı arasında benzersiz bir sohbet ID'si oluştur (Hep aynı sohbete girmeleri için)
                      const chatId = [currentUser.id, selectedProduct.userId].sort().join('_');
                      const otherUser = MOCK_USERS.find(u => u.id === selectedProduct.userId) || { id: selectedProduct.userId, name: selectedProduct.userName || 'Satıcı', avatar: selectedProduct.userAvatar || 'https://via.placeholder.com/50' };
                      
                      const directMatch: Match = {
                        id: chatId,
                        myProductId: 'direct',
                        otherProductId: selectedProduct.id,
                        otherUser: otherUser,
                        timestamp: Date.now()
                      };
                      
                      setActiveMatch(directMatch);
                      setView('chat');
                      setSelectedProduct(null);
                    }}
                    className="flex-1 py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-200 dark:shadow-violet-900/20 active:scale-95 transition-transform"
                  >
                    <MessageCircle size={20} />
                    Mesaj At
                  </button>
              </div>
            )}
          </div>

          {showProductSwapSelection && (
            <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
              <div className="bg-white dark:bg-zinc-900 w-full rounded-t-3xl p-6 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Takaslanacak Ürünü Seç</h3>
                    <button onClick={() => setShowProductSwapSelection(false)}><XCircle className="text-zinc-400 hover:text-zinc-600" /></button>
                  </div>
                  <div className="space-y-3 overflow-y-auto p-1 no-scrollbar">
                    {myProducts.map(p => (
                        <div key={p.id} onClick={() => handleInitiateSwap(p.id)} className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-colors">
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
        </div>
      );
    };

    const renderMatches = () => (
      <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
        
            {/* Gelen Kutusu Mor Banner */}
  <div className="bg-[#00592e] p-6 pb-4 rounded-b-[35px] shadow-lg shadow-violet-200 dark:shadow-none w-full mb-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black italic tracking-tighter text-white drop-shadow-sm uppercase">
        Gelen Kutusu
      </h2>    
  </div>
  <div>&nbsp;</div>
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <button onClick={() => setMatchTab('messages')} className={`flex-1 py-0 rounded-lg font-bold text-sm transition-all ${matchTab === 'messages' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>Mesajlar</button>
              <button onClick={() => setMatchTab('offers')} className={`flex-1 py-0 rounded-lg font-bold text-sm transition-all ${matchTab === 'offers' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'}`}>Teklifler</button>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
            {matchTab === 'messages' ? matches.map(m => (
              <div key={m.id} onClick={() => handleOpenChat(m)} className="flex items-center gap-4 py-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer">
                  <img src={m.otherUser.avatar} className="w-14 h-14 rounded-full object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold dark:text-white">{m.otherUser.name}</h4>
                      <p className="text-sm text-zinc-500 truncate">{(m as any).lastMessage || 'Sohbeti açmak için dokun'}</p>                </div>
                  <span className="text-xs text-zinc-400"></span>
              </div>
            )) : offers.map(o => {
              const isMyOffer = o.fromUserId === currentUser?.id;
              const otherUserId = isMyOffer ? o.toUserId : o.fromUserId;
              const otherUser = MOCK_USERS.find(u => u.id === otherUserId) || (otherUserId === currentUser?.id ? currentUser : { id: otherUserId, name: 'Kullanıcı', avatar: 'https://via.placeholder.com/50' });
              
              const senderProduct = (isMyOffer ? myProducts : marketProducts).find(p => p.id === o.myProductId) || (isMyOffer ? INITIAL_MY_PRODUCTS[0] : INITIAL_MARKET_PRODUCTS[0]);
              const receiverProduct = (isMyOffer ? marketProducts : myProducts).find(p => p.id === o.offeredProductId) || (isMyOffer ? INITIAL_MARKET_PRODUCTS[0] : INITIAL_MY_PRODUCTS[0]);
              
              return (
                  <div key={o.id} className="py-4 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={otherUser?.avatar} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <p className="font-bold text-sm dark:text-white">{otherUser?.name}</p>
                            <p className="text-xs text-zinc-500">{isMyOffer ? 'Teklif Gönderdin' : 'Takas Teklifi'}</p>
                        </div>
                      </div>
                      
                      <div 
                          className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl mb-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
                          onClick={() => setSelectedProduct(isMyOffer ? receiverProduct : senderProduct)}
                      >
                          <div className="relative">
                              <img src={isMyOffer ? senderProduct.image : receiverProduct.image} className="w-14 h-14 rounded-lg object-cover" />
                              <div className="absolute -bottom-1 -left-1 bg-zinc-900 text-white text-[8px] px-1 rounded-sm font-bold">SENİN</div>
                          </div>
                          
                          <div className="flex flex-col items-center gap-1">
                              <RefreshCw size={16} className="text-zinc-400" />
                              <span className="text-[10px] text-zinc-400 font-bold">DEĞİŞİM</span>
                          </div>
                          
                          <div className="relative">
                              <img src={isMyOffer ? receiverProduct.image : senderProduct.image} className="w-14 h-14 rounded-lg object-cover" />
                              <div className="absolute -bottom-1 -right-1 bg-[#00592e] text-white text-[8px] px-1 rounded-sm font-bold">TEKLİF</div>
                          </div>
                      </div>
                      
                      {o.status === 'pending' ? (
                        <div className="flex gap-2">
                            <button onClick={() => handleStartChatFromOffer(o)} className="flex-[2] py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                              <MessageCircle size={16} /> Sohbet Et
                            </button>
                            {!isMyOffer && (
                              <button onClick={() => handleOfferResponse(o.id, 'accepted')} className="flex-[3] py-3 bg-[#00592e] text-white rounded-xl font-bold text-xs shadow-lg shadow-violet-200 dark:shadow-violet-900/20">
                                  Kabul Et
                              </button>
                            )}
                            {isMyOffer && (
                              <button className="flex-[3] py-3 bg-zinc-200 text-zinc-500 rounded-xl font-bold text-xs cursor-default">
                                  Bekleniyor
                              </button>
                            )}
                        </div>
                      ) : (
                        <div className={`text-center py-3 rounded-xl font-bold text-sm ${o.status === 'accepted' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
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
    {/* Hafif bir derinlik katmak için dekoratif arka plan dokusu (Opsiyonel) */}
    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

    <div className="w-full max-w-md z-10">
      <div className="text-center mb-10">
        
        {/* LOGO ALANI */}
        <motion.div 
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  className="flex justify-center mb-6"
>
  <img 
    src={appLogo} 
    alt="Swap Barter Logo" 
    className="w-32 h-32 object-contain"
    style={{ display: 'block' }} // Görünürlüğü garantiye alalım
    onError={(e) => console.log("Logo yüklenemedi, yol hatalı olabilir.")} 
  />
</motion.div>

        <h1 className="text-3xl font-black italic tracking-tighter text-[#00592e] dark:text-white uppercase">
          swap <span className="text-[#ffab00]">barter</span>
        </h1>
        <p className="text-zinc-100 dark:text-zinc-100 mt-2">Eşyalarını takasla, yenilerini keşfet.</p>
      </div>
          
          {authError && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2">
              <XCircle size={16} />
              {authError}
            </div>
          )}

          <form onSubmit={authMode === 'login' ? handleLogin : authMode === 'signup' ? handleSignup : handleForgotPassword} className="space-y-4">
            {authMode === 'signup' && (
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
                  <UserIcon className="text-zinc-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Ad Soyad"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                    required
                  />
              </div>
            )}
            
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
              <Mail className="text-zinc-400" size={20} />
              <input 
                type="email" 
                placeholder="E-posta"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                required
              />
            </div>

            {authMode !== 'forgot' && (
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3">
                <Lock className="text-zinc-400" size={20} />
                <input 
                  type="password" 
                  placeholder="Şifre"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="bg-transparent flex-1 outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                  required
                />
              </div>
            )}

           {/* GİRİŞ YAP BUTONU */}
<button 
  disabled={authLoading}
  type="submit" 
  /* shadow-xl: Standart gölge
     shadow-[#ffab00]/40: Sarı rengin %40 şeffaflıkta gölgesi (ışıltı efekti verir)
  */
  className="w-full bg-[#ffab00] text-[#488118] py-4 rounded-xl font-bold text-lg shadow-xl shadow-[#ffab00]/40 active:scale-95 transition-all duration-200 disabled:opacity-50 uppercase tracking-wider"
>
  {authLoading ? (
    <Loader2 className="animate-spin mx-auto" />
  ) : (
    authMode === 'login' ? 'Giriş Yap' : authMode === 'signup' ? 'Kayıt Ol' : 'Şifremi Sıfırla'
  )}
</button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {authMode === 'login' && (
                <>
                  <button onClick={() => setAuthMode('signup')} className="text-zinc-100 font-bold text-sm block w-full">Hesabın yok mu? <span className="text-[#ffab00]">Kayıt Ol</span></button>
                  <button onClick={() => setAuthMode('forgot')} className="text-zinc-100 text-xs font-semibold">Şifremi Unuttum</button>
                </>
            )}
            {authMode === 'signup' && (
                <button onClick={() => setAuthMode('login')} className="text-zinc-100 font-bold text-sm">Zaten hesabın var mı? <span className="text-[#ffab00]">Giriş Yap</span></button>
            )}
            {authMode === 'forgot' && (
                <button onClick={() => setAuthMode('login')} className="text-zinc-500 font-bold text-sm">Giriş ekranına dön</button>
            )}
          </div>
        </div>
      </div>
    );

  const renderUpload = () => (
    <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
      {/* --- BURADAN BAŞLIYOR: Yeni Yeşil Banner --- */}
      <div className="bg-[#00592e] p-6 pb-2 rounded-b-[35px] shadow-lg shadow-green-100 dark:shadow-none w-full mb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-3xl  font-black italic uppercase drop-shadow-md">
              swap <span className="text-[#ffab00]">barter</span>
            </h1>
            <h1 className="text-white text-s font-large  italic tracking-tight opacity-95">
              {editingProductId ? 'İlanı Düzenle' : 'İlan Bilgileri '}
            </h1>
          </div>
          
          {/* Kapat Butonu */}
          
        </div>
      </div>
      {/* --- BURAYA KADAR: Banner bitti --- */}
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
                    <button type="button" onClick={() => setShowPhotoOptions(true)} className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                       <CameraIcon size={24} /> 
                    </button>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageSelect} 
                    className="hidden" 
                    accept="image/*"
                    multiple
                  />
                  {/* YENİ: Kameradan çekmek için olan */}
                  <input 
                    type="file" 
                    ref={cameraInputRef}
                    onChange={handleImageSelect} 
                    className="hidden" 
                    accept="image/*"
                    capture="environment" 
                  />
                  {showPhotoOptions && (
                    <div className="mt-2 flex gap-2">
<button 
      type="button"  
      onClick={handleTakePhoto} // Burası handleTakePhoto'yu çağırıyor
      className="text-xs bg-emerald-100 text-[#00592e] px-3 py-1 rounded-lg font-bold"
    >  
      Kamera 
    </button>                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs bg-violet-100 text-[#ffab00] px-3 py-1 rounded-lg font-bold">Galeri</button>
                        <button type="button" onClick={() => setShowPhotoOptions(false)} className="text-xs text-zinc-400 px-3 py-1">İptal</button>
                    </div>
                  )}
              </div>

              <div>
                  <label className="block text-sm font-bold text-zinc-500 mb-2">Başlık</label>
                  <input 
                    required
                    value={uploadForm.title}
                    onChange={e => setUploadForm({...uploadForm, title: e.target.value})}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-white"
                    placeholder="Örn: iPhone 13 128GB"
                  />
              </div>
              
              <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-zinc-500 mb-2">Fiyat (TL)</label>
                    <input 
          type="text" 
          required
          value={uploadForm.price ? Number(uploadForm.price).toLocaleString('tr-TR') : ''}
          onChange={e => {
            const rawValue = e.target.value.replace(/\./g, ""); 
            if (!isNaN(Number(rawValue))) {
              setUploadForm({...uploadForm, price: rawValue});
            }
          }}
          className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-white"
          placeholder="0"
        />
    </div>
    <div className="flex-1">
        <label className="block text-sm font-bold text-zinc-500 mb-2">Kategori</label>
                      <div className="relative">
                        <select 
                            value={uploadForm.category}
                            onChange={e => setUploadForm({...uploadForm, category: e.target.value})}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-white appearance-none"
                        >
                            {['Elektronik', 'Moda', 'Ev', 'Hobi', 'Araç', 'Spor', 'Müzik'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-4 text-zinc-400 pointer-events-none" size={20} />
                      </div>
                  </div>
              </div>

              <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-zinc-500">Açıklama</label>
                    
                  </div>
                  <textarea 
                    required
                    value={uploadForm.description}
                    onChange={e => setUploadForm({...uploadForm, description: e.target.value})}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none text-zinc-900 dark:text-white min-h-[120px]"
                    placeholder="Ürün durumu, kullanım süresi vb."
                  />
              </div>
              
              <div>
                  <label className="block text-sm font-bold text-zinc-500 mb-2">Durum</label>
                  <div className="flex gap-2">
                    {['Yeni Gibi', 'İdare Eder', 'Eski'].map(c => (
                        <button 
                          key={c}
                          type="button"
                          onClick={() => setUploadForm({...uploadForm, condition: c as any})}
                          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${uploadForm.condition === c ? 'bg-[#00592e] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                        >
                          {c}
                        </button>
                    ))}
                  </div>
              </div>

              <button type="submit" disabled={isUploading} className="w-full bg-[#00592e] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-violet-200 dark:shadow-violet-900/20 active:scale-95 transition-transform disabled:opacity-50">
                  {isUploading ? 'Kaydediliyor...' : 'Yayınla'}
              </button>
            </form>
            {/* --- YENİ: KIRPMA MODALI --- */}
        <AnimatePresence>
            {showCropperModal && imageToCrop && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150] bg-black flex flex-col"
                >
                    {/* Kırpma Alanı */}
                    <div className="relative flex-1 w-full bg-black">
                        <Cropper
                            image={imageToCrop}
                            crop={crop}
                            zoom={zoom}
                            aspect={1} // 1:1 Kare kırpma (İstersen 4/3 veya 16/9 yapabilirsin)
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    {/* Alt Kontrol Paneli */}
                    <div className="bg-zinc-900 p-6 flex flex-col gap-4 safe-area-bottom">
                        {/* Zoom Slider */}
                        <div className="flex items-center gap-4 px-4">
                            <span className="text-xs text-zinc-400 font-bold">Uzak</span>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#00592e]"
                            />
                            <span className="text-xs text-zinc-400 font-bold">Yakın</span>
                        </div>

                        {/* Butonlar */}
                        <div className="flex gap-4">
                            <button 
                                onClick={() => {
                                    setShowCropperModal(false);
                                    setImageToCrop(null);
                                }}
                                className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold"
                            >
                                İptal
                            </button>
                            <button 
                                onClick={handleSaveCroppedImage}
                                className="flex-[2] py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                            >
                                <CropIcon size={20} />
                                Kırp & Kaydet
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        {/* ------------------------- */}
        </div>
      </div>
    );

    const renderSwipe = () => (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-900">
        <div className="bg-[#00592e] p-6 pb-4 rounded-b-[35px] shadow-lg shadow-violet-200 dark:shadow-none w-full mb-4">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-black italic tracking-tighter text-white drop-shadow-sm uppercase">
        Takas Keşfet 
      </h2>  

  </div>

  <h1 className="text-xs font-black italic tracking-tighter text-white drop-shadow-sm uppercase">
      hayalindeki ürüne parasız ulaş 
      </h1> 
  <div>&nbsp;</div>
          
        </div>

        <div className="flex-1 flex flex-col overflow-hidden relative">
            {!selectedMyProductId ? (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                  {myProducts.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                            <PlusCircle size={40} className="text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <h3 className="font-bold text-xl dark:text-white">Henüz Ürünün Yok</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xs">
                            Takas yapmaya başlamak için önce bir ilan eklemelisin.
                        </p>
                        <button 
                            onClick={() => setView('upload')}
                            className="bg-[#00592e] text-white px-6 py-3 rounded-xl font-bold mt-4"
                        >
                            Hemen İlan Ekle
                        </button>
                      </div>
                  ) : (
                      <>
                          <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-xl mb-6 flex items-start gap-3">
                            <Sparkles className="text-[#ffab00] shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-bold text-green-700 darktext-green-300 text-sm mb-1">Takaslamak istediğin ürünü seç</h3>
                                <p className="text-[#ffab00]/80 darktext-green-300/70 text-xs">
                                  Seçtiğin ürünün değerine yakın ilanları senin için bulup getireceğiz.
                                </p>
                            </div>
                          </div>

                          <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Ürünlerim ({myProducts.length})</h3>
                          <div className="space-y-3 pb-20">
                            {myProducts.map(p => (
                                <div 
                                  key={p.id} 
                                  onClick={() => startSwapSession(p)} 
                                  className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-violet-500 transition-colors shadow-sm"
                                >
                                  <img src={p.image} className="w-16 h-16 rounded-xl object-cover bg-zinc-100" onError={handleImageError} />
                                  <div className="flex-1">
                                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{p.title}</h4>
                                      <p className="text-emerald-500 font-bold text-xs mt-1">{p.price.toLocaleString('tr-TR')} TL</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full">{p.category}</span>
                                      </div>
                                  </div>
                                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                                      <ArrowRight size={16} className="text-zinc-400" />
                                  </div>
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
                        <button 
                          onClick={() => setSelectedMyProductId(null)} 
                          className="bg-white dark:bg-zinc-800 text-zinc-600 dark:text-white px-6 py-3 rounded-full font-bold shadow-lg border border-zinc-200 dark:border-zinc-700 pointer-events-auto flex items-center gap-2 hover:bg-zinc-50"
                        >
                          <Repeat size={16} /> Farklı Ürün Seç
                        </button>
                    </div>
                  )}
              </div>
            )}
        </div>
      </div>
    );

  const renderProfile = () => {
    if (!currentUser) return null;
    return (
      <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
        {/* Sade Profil Banner */}
        <div className="bg-[#00592e] p-6 pb-8 rounded-b-[40px] shadow-lg shadow-green-100 dark:shadow-none w-full relative">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-white text-3xl font-black italic tracking-tighter uppercase">
              swap <span className="text-[#ffab00]">barter</span>
            </h1>
            <button 
              onClick={() => setView('settings')} 
              className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 text-white"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Profil Bilgileri (Banner'ın üzerine hafifçe taşan yapı) */}
        <div className="flex flex-col items-center -mt-10 pb-6 relative z-10">
          <div className="relative mb-3">
            <img 
              src={currentUser.avatar} 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl" 
            />
          </div>
          
          <h2 className="text-2xl font-bold dark:text-white mb-1">{currentUser.name}</h2>
          <p className="text-zinc-500 text-sm flex items-center gap-1 mb-6">
            <MapPin size={12} /> {currentUser.location || 'Konum Yok'}
          </p>
          
          {/* İstatistikler */}
          <div className="flex items-center justify-center gap-8 w-full px-6">
            <div className="text-center min-w-[60px]">
              <span className="block text-xl font-bold text-zinc-900 dark:text-white">{currentUser.swapCount || 0}</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Takas</span>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="text-center min-w-[60px]">
              <span className="block text-xl font-bold text-zinc-900 dark:text-white">4.9</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Puan</span>
            </div>
            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>
            <div className="text-center min-w-[60px]">
              <span className="block text-xl font-bold text-zinc-900 dark:text-white">{myProducts.length}</span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">İlan</span>
            </div>
          </div>
        </div>
        
        {/* Sekmeler (İlanlarım / Favorilerim) burdan aşağısı aynı kalabilir... */}
          
          {/* Tabs */}
          <div className="flex px-6 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setProfileTab('my')} className={`pb-3 px-4 font-bold text-sm transition-all relative ${profileTab === 'my' ? 'text-[#ffab00]' : 'text-zinc-400'}`}>
                  İlanlarım
                  {profileTab === 'my' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00592e]" />}
              </button>
              <button onClick={() => setProfileTab('favorites')} className={`pb-3 px-4 font-bold text-sm transition-all relative ${profileTab === 'favorites' ? 'text-[#ffab00]' : 'text-zinc-400'}`}>
                  Favorilerim
                  {profileTab === 'favorites' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00592e]" />}
              </button>
          </div>

          {/* Grid Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-20">
              {profileTab === 'my' ? (
                <div className="grid grid-cols-2 gap-4">
                    {myProducts.map(p => (
                      <div key={p.id} onClick={() => { setSelectedProduct(p); }} className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl overflow-hidden cursor-pointer relative group">
                          <img src={p.image} className="aspect-square object-cover" />
                          <div className="p-3">
                            <p className="font-bold text-sm truncate dark:text-white">{p.title}</p>
                            <p className="text-emerald-500 font-bold text-xs">{p.price.toLocaleString('tr-TR')} TL</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMyProductAction('delete', p); }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                      </div>
                    ))}
                    <button onClick={() => setView('upload')} className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <PlusCircle size={32} className="mb-2" />
                      <span className="font-bold text-sm">Yeni Ekle</span>
                    </button>
                </div>
              ) : (
                <div className="space-y-3">
                    {marketProducts.filter(p => favorites.includes(p.id)).map(p => (
                      <div key={p.id} onClick={() => setSelectedProduct(p)} className="flex gap-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl cursor-pointer">
                          <img src={p.image} className="w-20 h-20 rounded-xl object-cover" />
                          <div className="flex-1">
                            <h4 className="font-bold dark:text-white">{p.title}</h4>
                            <p className="text-emerald-500 font-bold">{p.price.toLocaleString('tr-TR')} TL</p>
                            <div className="flex items-center gap-1 text-zinc-400 text-xs mt-2">
                                <MapPin size={10} /> {p.location}
                            </div>
                          </div>
                          <button onClick={(e) => toggleFavorite(e, p.id)} className="self-start text-red-500"><Heart size={20} className="fill-current" /></button>
                      </div>
                    ))}
                    {favorites.length === 0 && (
                      <div className="text-center py-10 text-zinc-400">
                          <Heart size={48} className="mx-auto mb-3 opacity-20" />
                          <p>Henüz favorin yok.</p>
                      </div>
                    )}
                </div>
              )}
          </div>
        </div>
      );
    };

    const renderSettings = () => (
      <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
          <div className="px-6 py-4 flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800">
            <button onClick={() => setView('profile')}><ArrowLeft className="dark:text-white" /></button>
            <h2 className="text-xl font-bold dark:text-white">Ayarlar</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
                <h3 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider">Profil</h3>
                <div className="flex flex-col items-center mb-6">
                  <div className="relative">
                      <img src={editProfileAvatar || currentUser?.avatar} className="w-24 h-24 rounded-full object-cover" />
                      <button onClick={() => profileFileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-[#00592e] text-white p-2 rounded-full"><CameraIcon size={16} /></button>
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
                      <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#00592e]' : 'bg-zinc-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-6' : ''}`} />
                      </button>
                  </div>
                  <button onClick={() => setShowLocationModal(true)} className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl dark:text-white">
                      <div className="flex items-center gap-3"><MapPin size={20} className="text-zinc-400" /><span className="font-bold">Konum Değiştir</span></div>
                      <span className="text-zinc-400 text-sm">{currentUser?.location}</span>
                  </button>
                  <button onClick={() => setView('blocked-users')} className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl dark:text-white">
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
                        <button key={c} onClick={() => handleUpdateLocation(c)} className={`p-3 rounded-xl font-bold text-sm ${currentUser?.location === c ? 'bg-[#00592e] text-white' : 'bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                            {c}
                        </button>
                      ))}
                  </div>
                  <button onClick={() => setShowLocationModal(false)} className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 font-bold rounded-xl dark:text-white">Kapat</button>
                </div>
            </div>
          )}
      </div>
    );

    const renderChat = () => {
      if (!activeMatch) return null;
      return (
          <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('matches')}><ArrowLeft className="text-zinc-500 dark:text-white" /></button>
                  <img src={activeMatch.otherUser.avatar} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                      <h3 className="font-bold text-sm dark:text-white">{activeMatch.otherUser.name}</h3>
                      <p className="text-[10px] text-green-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Çevrimiçi</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-2"><MoreVertical className="text-zinc-400" /></button>
                  {showChatMenu && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700 py-1 z-20">
                        <button onClick={handleDeleteChat} className="w-full text-left px-4 py-3 text-red-500 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">Sohbeti Sil</button>
                        <button onClick={() => handleBlockUser(activeMatch.otherUser)} className="w-full text-left px-4 py-3 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700">Kullanıcıyı Engelle</button>
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
                
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3 rounded-2xl ${msg.isMe ? 'bg-[#00592e] text-white rounded-br-none' : 'bg-white dark:bg-zinc-800 dark:text-white shadow-sm rounded-bl-none'}`}>
                        {msg.image && <img src={msg.image} className="w-full rounded-lg mb-2" />}
                        {msg.text && <p className="text-sm">{msg.text}</p>}
                      </div>
                  </div>
                ))}
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <button onClick={() => chatFileInputRef.current?.click()} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500"><ImageIcon size={20} /></button>
                <input type="file" ref={chatFileInputRef} onChange={handleChatImageSelect} className="hidden" accept="image/*" />
                <button onClick={handleSendLocation} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500"><MapPin size={20} /></button>
                <input 
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Mesaj yaz..."
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-full outline-none text-zinc-900 dark:text-white"
                />
                <button onClick={handleSendMessage} className={`p-2.5 rounded-full ${chatMessage.trim() ? 'bg-[#00592e] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                  <Send size={20} />
                </button>
            </div>
          </div>
      );
    };

    const renderUserProfile = () => {
      if (!selectedUser) return null;
      const userProducts = marketProducts.filter(p => p.userId === selectedUser.id);
      
      return (
          <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
            <div className="px-4 py-4 flex items-center gap-3">
                <button onClick={handleBackFromUserProfile} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full"><ArrowLeft className="dark:text-white" /></button>
                <h2 className="font-bold text-lg dark:text-white">{selectedUser.name}</h2>
            </div>
            
            <div className="px-6 py-6 flex flex-col items-center">
                <img src={selectedUser.avatar} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-zinc-100 dark:border-zinc-800" />
                <h3 className="text-2xl font-bold dark:text-white mb-1">{selectedUser.name}</h3>
                <p className="text-zinc-500 mb-6 flex items-center gap-1"><MapPin size={14} /> {selectedUser.location || 'İstanbul'}</p>
                
                <div className="flex gap-8 mb-8">
                    <div className="text-center">
                        <span className="block text-xl font-bold dark:text-white">{selectedUser.swapCount || 0}</span>
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Takas</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-xl font-bold dark:text-white">{userProducts.length}</span>
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">İlan</span>
                    </div>
                </div>
                
                <button onClick={() => handleBlockUser(selectedUser)} className="text-red-500 font-bold text-sm flex items-center gap-2 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-full">
                    <Shield size={16} /> Kullanıcıyı Engelle
                </button>
            </div>

            <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 rounded-t-3xl p-6 overflow-y-auto">
                <h3 className="font-bold text-zinc-500 mb-4">İlanları</h3>
                <div className="grid grid-cols-2 gap-4">
                  {userProducts.map(p => (
                      <div key={p.id} onClick={() => { setSelectedProduct(p); setTempReturnProduct(null); }} className="bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden shadow-sm cursor-pointer">
                        <img src={p.image} className="aspect-square object-cover" />
                        <div className="p-3">
                            <p className="font-bold text-sm dark:text-white truncate">{p.title}</p>
                            <p className="text-emerald-500 font-bold text-xs">{p.price.toLocaleString('tr-TR')} TL</p>
                        </div>
                      </div>
                  ))}
                </div>
            </div>
          </div>
      );
    };

    const renderBlockedUsers = () => (
      <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
          <div className="px-6 py-4 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800">
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
                      <button onClick={() => handleUnblockUser(u.id)} className="text-sm font-bold text-[#ffab00] bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-lg">Engeli Kaldır</button>
                  </div>
                ))
            )}
          </div>
      </div>
    );

    // Render Banner
    const renderBanner = () => {
      if (!bannerContent) return null;

      const bannerColors = {
        info: 'bg-blue-500',
        success: 'bg-emerald-500',
        warning: 'bg-orange-500',
        error: 'bg-red-500',
      };

      return (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`absolute top-0 left-0 right-0 z-50 p-4 text-white font-bold flex items-center gap-3 ${bannerColors[bannerContent.type]}`}
        >
          {bannerContent.icon && <div className="flex-shrink-0">{bannerContent.icon}</div>}
          <p className="flex-1 text-sm">{bannerContent.message}</p>
          <button onClick={() => setBannerContent(null)} className="text-white/80 hover:text-white"><X size={18} /></button>
        </motion.div>
      );
    };

  // Main Render
    if (view === 'auth') return renderAuth();
    
    return (
      <div className="h-[100dvh] w-full bg-white dark:bg-zinc-900 overflow-hidden relative font-sans text-zinc-900">
        {/* Sınırları (max-w-md vs) tamamen kaldırdık, ekranı %100 kaplayacak */}
        
        {renderBanner()}
        {renderConfirmationModal()}
        
        {/* Filtreleme Modalı */}
        {showFilterModal && ( 
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              className="bg-white dark:bg-zinc-900 w-full rounded-t-[40px] p-8 pb-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black dark:text-white italic text-[#00592e]">Filtrele</h3>
                <button onClick={() => setShowFilterModal(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <X size={20} className="dark:text-white" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Kategori Seçimi */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Kategori</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['Elektronik', 'Moda', 'Ev', 'Hobi'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setFilters({...filters, category: cat})}
                        className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${filters.category === cat ? 'bg-[#00592e] text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fiyat Aralığı */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Fiyat Aralığı (TL)</label>
                  <div className="flex gap-4">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={filters.minPrice}
                      onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl outline-none text-sm font-bold dark:text-white"
                    />
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl outline-none text-sm font-bold dark:text-white"
                    />
                  </div>
                </div>

                {/* Uygula Butonu */}
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleClearFilters}
                    className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold rounded-2xl"
                  >
                    Temizle
                  </button>
                  <button 
                    onClick={handleApplyFilters}
                    className="flex-[2] py-4 bg-[#00592e] text-white font-bold rounded-2xl shadow-lg shadow-green-100"
                  >
                    Sonuçları Gör
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {selectedProduct && renderProductDetail()}
        
        {newMatch && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-emerald-500 text-white p-4 rounded-2xl shadow-xl animate-in slide-in-from-top flex items-center gap-4">
              <div className="flex -space-x-2">
                  <img src={newMatch.otherUser.avatar} className="w-10 h-10 rounded-full border-2 border-white" />
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 font-bold border-2 border-white">+1</div>
              </div>
              <div className="flex-1">
                  <h4 className="font-bold text-lg">Eşleşme!</h4>
                  <p className="text-xs text-white/90">Takas teklifin kabul edildi.</p>
              </div>
          </div>
        )}
        
        {/* View Content */}
        <div className="h-full pb-20 overflow-hidden">
          {view === 'home' && renderHome()}
          {view === 'matches' && renderMatches()}
          {view === 'upload' && renderUpload()}
          {view === 'swipe' && renderSwipe()}
          {view === 'profile' && renderProfile()}
          {view === 'settings' && renderSettings()}
          {view === 'chat' && renderChat()}
          {view === 'user-profile' && renderUserProfile()}
          {view === 'blocked-users' && renderBlockedUsers()}
        </div>

        {/* Bottom Navigation */}
        {!['chat'].includes(view) && !selectedProduct && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 px-6 py-4 flex justify-between items-center z-40 pb-safe">
            <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-[#ffab00]' : 'text-zinc-400'}`}>
              <Home size={24} className={view === 'home' ? 'fill-current' : ''} />
              <span className="text-[10px] font-bold">Ana Sayfa</span>
            </button>
            
            <button onClick={() => setView('swipe')} className={`flex flex-col items-center gap-1 ${view === 'swipe' ? 'text-[#ffab00]' : 'text-zinc-400'}`}>
              <Repeat size={24} />
              <span className="text-[10px] font-bold">Takasla</span>
            </button>

            <div className="relative -top-6">
              <button 
                onClick={() => setView('upload')}
                className="w-16 h-16 bg-[#00592e] rounded-full flex items-center justify-center text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/50 hover:scale-105 transition-transform"
              >
                <PlusCircle size={32} />
              </button>
            </div>

            <button onClick={() => setView('matches')} className={`flex flex-col items-center gap-1 ${view === 'matches' ? 'text-[#ffab00]' : 'text-zinc-400'}`}>
              <MessageCircle size={24} className={view === 'matches' ? 'fill-current' : ''} />
              <span className="text-[10px] font-bold">Mesajlar</span>
            </button>

            <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-[#ffab00]' : 'text-zinc-400'}`}>
              <UserIcon size={24} className={view === 'profile' ? 'fill-current' : ''} />
              <span className="text-[10px] font-bold">Profil</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  export default App;