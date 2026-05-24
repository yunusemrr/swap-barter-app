import React, {
  useState, useRef, createContext, useContext, useEffect,
} from 'react';
import { MessageCircle, User as UserIcon, UserCog } from 'lucide-react';
import { Product, ViewState, Match, User, Offer } from '../../types';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useBackHandler } from '../hooks/useBackHandler';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export type ConfirmationModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'danger' | 'normal';
  onConfirm: () => void;
} | null;

export type FilterState = {
  minPrice: string;
  maxPrice: string;
  category: string;
  condition: string;
  location: string;
};

export type UploadFormState = {
  title: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  condition: 'Yeni Gibi' | 'İdare Eder' | 'Eski';
  preferredTradeCategory: string;
};

export type BannerContent = {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
} | null;

export type ChatMsg = { id?: string; text?: string; image?: string; isMe: boolean };

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  authLoading: boolean;
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  authMode: 'login' | 'signup' | 'forgot';
  setAuthMode: React.Dispatch<React.SetStateAction<'login' | 'signup' | 'forgot'>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  authError: string;
  setAuthError: React.Dispatch<React.SetStateAction<string>>;
  view: ViewState | 'profile-settings';
  setView: React.Dispatch<React.SetStateAction<ViewState | 'profile-settings'>>;
  matchTab: 'messages' | 'offers';
  setMatchTab: React.Dispatch<React.SetStateAction<'messages' | 'offers'>>;
  profileTab: 'my' | 'favorites';
  setProfileTab: React.Dispatch<React.SetStateAction<'my' | 'favorites'>>;
  marketProducts: Product[];
  myProducts: Product[];
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  offers: Offer[];
  setOffers: React.Dispatch<React.SetStateAction<Offer[]>>;
  chatMessage: string;
  setChatMessage: React.Dispatch<React.SetStateAction<string>>;
  chatHistory: ChatMsg[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMsg[]>>;
  isLoading: boolean;
  isRefreshing: boolean;
  setIsRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  blockedUsers: User[];
  setBlockedUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectedProduct: Product | null;
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  selectedUser: User | null;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
  showProductSwapSelection: boolean;
  setShowProductSwapSelection: React.Dispatch<React.SetStateAction<boolean>>;
  activeMatch: Match | null;
  setActiveMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  selectedMyProductForAction: Product | null;
  setSelectedMyProductForAction: React.Dispatch<React.SetStateAction<Product | null>>;
  isDescriptionExpanded: boolean;
  setIsDescriptionExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  showChatMenu: boolean;
  setShowChatMenu: React.Dispatch<React.SetStateAction<boolean>>;
  bannerContent: BannerContent;
  setBannerContent: React.Dispatch<React.SetStateAction<BannerContent>>;
  editProfileName: string;
  setEditProfileName: React.Dispatch<React.SetStateAction<string>>;
  editProfileAvatar: string;
  setEditProfileAvatar: React.Dispatch<React.SetStateAction<string>>;
  profileFileInputRef: React.RefObject<HTMLInputElement | null>;
  tempReturnProduct: Product | null;
  setTempReturnProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  showLocationModal: boolean;
  setShowLocationModal: React.Dispatch<React.SetStateAction<boolean>>;
  confirmationModal: ConfirmationModalState;
  setConfirmationModal: React.Dispatch<React.SetStateAction<ConfirmationModalState>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  showFilterModal: boolean;
  setShowFilterModal: React.Dispatch<React.SetStateAction<boolean>>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  showPhotoOptions: boolean;
  setShowPhotoOptions: React.Dispatch<React.SetStateAction<boolean>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  chatFileInputRef: React.RefObject<HTMLInputElement | null>;
  imageToCrop: string | null;
  setImageToCrop: React.Dispatch<React.SetStateAction<string | null>>;
  crop: { x: number; y: number };
  setCrop: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  croppedAreaPixels: any;
  setCroppedAreaPixels: React.Dispatch<React.SetStateAction<any>>;
  showCropperModal: boolean;
  setShowCropperModal: React.Dispatch<React.SetStateAction<boolean>>;
  uploadForm: UploadFormState;
  setUploadForm: React.Dispatch<React.SetStateAction<UploadFormState>>;
  editingProductId: string | null;
  setEditingProductId: React.Dispatch<React.SetStateAction<string | null>>;
  isGeneratingAI: boolean;
  setIsGeneratingAI: React.Dispatch<React.SetStateAction<boolean>>;
  swapTab: 'swipe' | 'offers';
  setSwapTab: React.Dispatch<React.SetStateAction<'swipe' | 'offers'>>;
  selectedMyProductId: string | null;
  setSelectedMyProductId: React.Dispatch<React.SetStateAction<string | null>>;
  swapCandidates: Product[];
  setSwapCandidates: React.Dispatch<React.SetStateAction<Product[]>>;
  newMatch: Match | null;
  setNewMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  pullStartY: number;
  setPullStartY: React.Dispatch<React.SetStateAction<number>>;
  isTablet: boolean;
  boostProduct: Product | null;
  setBoostProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  showReportModal: boolean;
  setShowReportModal: React.Dispatch<React.SetStateAction<boolean>>;
  reportProduct: Product | null;
  setReportProduct: React.Dispatch<React.SetStateAction<Product | null>>;
  // Cross-cutting handlers
  handleLogin: (e: React.FormEvent) => Promise<void>;
  handleSignup: (e: React.FormEvent) => Promise<void>;
  handleForgotPassword: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => void;
  handleDeleteAccount: () => void;
  handleBlockUser: (userToBlock: User) => void;
  handleUnblockUser: (userId: string) => void;
  handleBackFromUserProfile: () => void;
  handleImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  handleClearFilters: () => void;
  handleApplyFilters: () => void;
  handleOpenChat: (match: Match) => void;
  handleRefresh: () => Promise<void>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}

const AppContext = createContext<AppContextType>(null!);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
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
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([]);

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
  const [bannerContent, setBannerContent] = useState<BannerContent>(null);

  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileAvatar, setEditProfileAvatar] = useState('');
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const [tempReturnProduct, setTempReturnProduct] = useState<Product | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    minPrice: '', maxPrice: '', category: '', condition: '', location: '',
  });

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
  const [uploadForm, setUploadForm] = useState<UploadFormState>({
    title: '', description: '', price: '', images: [],
    category: 'Elektronik', condition: 'Yeni Gibi', preferredTradeCategory: '',
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [swapTab, setSwapTab] = useState<'swipe' | 'offers'>('offers');
  const [selectedMyProductId, setSelectedMyProductId] = useState<string | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<Product[]>([]);
  const [newMatch, setNewMatch] = useState<Match | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const [pullStartY, setPullStartY] = useState(0);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768);
  const [boostProduct, setBoostProduct] = useState<Product | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportProduct, setReportProduct] = useState<Product | null>(null);

  // Tablet resize listener
  useEffect(() => {
    const handleResize = () => setIsTablet(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-hide new match toast
  useEffect(() => {
    if (!newMatch) return;
    const timer = setTimeout(() => setNewMatch(null), 5000);
    return () => clearTimeout(timer);
  }, [newMatch]);

  // Dark mode toggle
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Init profile form when settings opens
  useEffect(() => {
    if (view === 'settings' && currentUser) {
      setEditProfileName(currentUser.name);
      setEditProfileAvatar(currentUser.avatar);
    }
  }, [view, currentUser]);

  // Banner content per view
  useEffect(() => {
    switch (view) {
      case 'chat':
        setBannerContent({
          message: `Sohbet: ${activeMatch?.otherUser.name || 'Kullanıcı'}`,
          type: 'info', icon: <MessageCircle size={18} />,
        });
        break;
      case 'user-profile':
        setBannerContent({
          message: `Kullanıcı Profili: ${selectedUser?.name || 'Kullanıcı'}`,
          type: 'info', icon: <UserIcon size={18} />,
        });
        break;
      case 'profile-settings':
        setBannerContent({
          message: 'Profil bilgilerinizi güncelleyin.',
          type: 'info', icon: <UserCog size={18} />,
        });
        break;
      default:
        setBannerContent(null);
    }
  }, [view, activeMatch, selectedUser]);

  // Reset description expansion on product change
  useEffect(() => {
    if (selectedProduct) setIsDescriptionExpanded(false);
  }, [selectedProduct]);

  // --- Hooks ---
  const { handleLogin, handleSignup, handleForgotPassword, handleLogout, handleDeleteAccount } = useAuth({
    email, password, name, currentUser,
    setCurrentUser, setAuthLoading, setEmail, setPassword,
    setAuthError, setAuthMode, setView, setConfirmationModal,
  });

  useFirestore({
    currentUser, activeMatch,
    setMarketProducts, setMyProducts, setMatches, setOffers, setChatHistory, setIsLoading,
  });

  const stateRef = useRef<any>({});
  const viewHistory = useRef<string[]>(['home']);
  const isBackNavigation = useRef(false);
  const lastBackPress = useRef(0);

  useEffect(() => {
    stateRef.current = {
      view, selectedProduct, showFilterModal, showLocationModal,
      showProductSwapSelection, confirmationModal, showChatMenu,
      showPhotoOptions, tempReturnProduct, selectedUser,
    };
  });

  useEffect(() => {
    if (isBackNavigation.current) {
      isBackNavigation.current = false;
    } else if (viewHistory.current[viewHistory.current.length - 1] !== view) {
      viewHistory.current.push(view as string);
    }
  }, [view]);

  useBackHandler({
    stateRef, viewHistory, isBackNavigation, lastBackPress,
    setView,
    closeConfirmationModal: () => setConfirmationModal(null),
    closeProductSwapSelection: () => setShowProductSwapSelection(false),
    closeLocationModal: () => setShowLocationModal(false),
    closeFilterModal: () => setShowFilterModal(false),
    closeChatMenu: () => setShowChatMenu(false),
    closePhotoOptions: () => setShowPhotoOptions(false),
    closeSelectedProduct: () => setSelectedProduct(null),
    closeUserProfile: () => { setSelectedUser(null); setTempReturnProduct(null); },
  });

  // --- Cross-cutting handlers ---
  const handleBlockUser = (userToBlock: User) => {
    if (!currentUser) return;
    
    if (confirm(`${userToBlock.name} kullanıcısını engellemek istediğinize emin misiniz?`)) {
      (async () => {
        try {
          console.log('[Block] Blocking user:', userToBlock.id);
          
          const userRef = doc(db, 'users', currentUser.id);
          const blockedList = currentUser.blocked || [];
          
          // Zaten engellenmişse kaldır, değilse ekle
          if (blockedList.includes(userToBlock.id)) {
            // Engellemeyi kaldır
            await updateDoc(userRef, {
              blocked: arrayRemove(userToBlock.id),
            });
            
            const updated = { ...currentUser, blocked: blockedList.filter(id => id !== userToBlock.id) };
            setCurrentUser(updated);
            console.log('[Block] User unblocked:', userToBlock.id);
          } else {
            // Engelle
            await updateDoc(userRef, {
              blocked: arrayUnion(userToBlock.id),
            });
            
            const updated = { ...currentUser, blocked: [...blockedList, userToBlock.id] };
            setCurrentUser(updated);
            console.log('[Block] User blocked:', userToBlock.id);
          }
          
          // UI'yi kapat
          setView('home');
          setSelectedUser(null);
          setSelectedProduct(null);
        } catch (err: any) {
          console.error('[Block] Error:', err.message);
          alert('Engelleme işlemi başarısız oldu.');
        }
      })();
    }
  };

  const handleUnblockUser = (userId: string) =>
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));

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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
  };

  const handleClearFilters = () => {
    setFilters({ minPrice: '', maxPrice: '', category: '', condition: '', location: '' });
    setSearchQuery('');
  };

  const handleApplyFilters = () => setShowFilterModal(false);

  const handleOpenChat = (match: Match) => {
    setActiveMatch(match);
    setView('chat');
  };

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

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, authLoading, setAuthLoading,
      authMode, setAuthMode, email, setEmail, password, setPassword,
      name, setName, authError, setAuthError,
      view, setView, matchTab, setMatchTab, profileTab, setProfileTab,
      marketProducts, myProducts, matches, setMatches, offers, setOffers,
      chatMessage, setChatMessage, chatHistory, setChatHistory,
      isLoading, isRefreshing, setIsRefreshing,
      favorites, setFavorites, blockedUsers, setBlockedUsers, isDarkMode, setIsDarkMode,
      selectedProduct, setSelectedProduct, selectedUser, setSelectedUser,
      showProductSwapSelection, setShowProductSwapSelection,
      activeMatch, setActiveMatch, selectedMyProductForAction, setSelectedMyProductForAction,
      isDescriptionExpanded, setIsDescriptionExpanded, showChatMenu, setShowChatMenu,
      bannerContent, setBannerContent,
      editProfileName, setEditProfileName, editProfileAvatar, setEditProfileAvatar, profileFileInputRef,
      tempReturnProduct, setTempReturnProduct, showLocationModal, setShowLocationModal,
      confirmationModal, setConfirmationModal,
      searchQuery, setSearchQuery, showFilterModal, setShowFilterModal, filters, setFilters,
      isUploading, setIsUploading, showPhotoOptions, setShowPhotoOptions,
      fileInputRef, cameraInputRef, chatFileInputRef,
      imageToCrop, setImageToCrop, crop, setCrop, zoom, setZoom,
      croppedAreaPixels, setCroppedAreaPixels, showCropperModal, setShowCropperModal,
      uploadForm, setUploadForm, editingProductId, setEditingProductId,
      isGeneratingAI, setIsGeneratingAI,
      swapTab, setSwapTab, selectedMyProductId, setSelectedMyProductId,
      swapCandidates, setSwapCandidates, newMatch, setNewMatch,
      contentRef, pullStartY, setPullStartY, isTablet,
      boostProduct, setBoostProduct,
      showReportModal, setShowReportModal, reportProduct, setReportProduct,
      handleLogin, handleSignup, handleForgotPassword, handleLogout, handleDeleteAccount,
      handleBlockUser, handleUnblockUser, handleBackFromUserProfile, handleImageError,
      handleClearFilters, handleApplyFilters, handleOpenChat,
      handleRefresh, handleTouchStart, handleTouchEnd,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
};