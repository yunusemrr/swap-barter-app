import React, { useEffect, useState , useRef } from 'react';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, pageTransition } from './src/animations/variants';
import { X } from 'lucide-react';
import { AppContextProvider, useAppContext } from './src/context/AppContext';
import { ConfirmationModal } from './src/components/modals/ConfirmationModal';
import { FilterModal } from './src/components/modals/FilterModal';
import { BottomNav } from './src/components/shared/BottomNav';
import { MatchToast } from './src/components/shared/MatchToast';
import { AuthScreen } from './src/components/screens/AuthScreen';
import { HomeScreen } from './src/components/screens/HomeScreen';
import { SwapScreen } from './src/components/screens/SwapScreen';
import { MatchesScreen } from './src/components/screens/MatchesScreen';
import { UploadScreen } from './src/components/screens/UploadScreen';
import { ProfileScreen } from './src/components/screens/ProfileScreen';
import { SettingsScreen, BlockedUsersScreen } from './src/components/screens/SettingsScreen';
import { ChatScreen } from './src/components/screens/ChatScreen';
import { ProductDetail } from './src/components/screens/ProductDetail';
import { UserProfileScreen } from './src/components/screens/UserProfileScreen';
import { BoostScreen } from './src/components/screens/BoostScreen';
import { EulaModal } from './src/components/EulaModal';
import { db, auth } from './firebaseConfig';

const BANNER_COLORS: Record<string, string> = {
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-orange-500',
  error: 'bg-red-500',
};

function AppRouter({ showEula, eulaAccepted, setEulaAccepted, setShowEula }: any) {
  const { view, authLoading, bannerContent, setBannerContent, selectedProduct } = useAppContext();

  // ===== C) EULA KONTROLÜ - login/signup göstermeden ÖNCE =====
  if (showEula && !eulaAccepted) {
    return (
      <EulaModal
        isOpen={true}
        onAccept={() => {
          setEulaAccepted(true);
          setShowEula(false);
        }}
        onReject={() => {
          alert('Şartları kabul etmelisiniz.');
        }}
      />
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#00592e]">
        <div className="text-white text-xl font-black italic animate-pulse uppercase">
          swap <span className="text-[#ffab00]">barter</span>
        </div>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#488118] md:flex md:items-center md:justify-center">
        <div className="w-full md:max-w-[430px] md:min-h-0 md:rounded-[2.5rem] md:overflow-hidden md:shadow-2xl md:shadow-black/40">
          <AuthScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 md:bg-zinc-200 md:dark:bg-zinc-950 md:flex md:items-center md:justify-center font-sans text-zinc-900">
      <div className="relative w-full h-[100dvh] md:max-w-[430px] md:h-[90vh] md:max-h-[920px] md:rounded-[2.5rem] md:overflow-hidden md:shadow-2xl md:shadow-black/30 bg-white dark:bg-zinc-900">

        {/* Top banner */}
        <AnimatePresence>
          {bannerContent && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`absolute top-0 left-0 right-0 z-50 p-4 text-white font-bold flex items-center gap-3 ${BANNER_COLORS[bannerContent.type]}`}
            >
              {bannerContent.icon && <div className="flex-shrink-0">{bannerContent.icon}</div>}
              <p className="flex-1 text-sm">{bannerContent.message}</p>
              <button onClick={() => setBannerContent(null)} className="text-white/80 hover:text-white">
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global overlay components */}
        <ConfirmationModal />
        <FilterModal />
        {selectedProduct && <ProductDetail />}
        <MatchToast />

        {/* Screens */}
        <div className="h-full pb-20 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="absolute inset-0 overflow-hidden"
            >
              {view === 'home'          && <HomeScreen />}
              {view === 'matches'       && <MatchesScreen />}
              {view === 'upload'        && <UploadScreen />}
              {view === 'swipe'         && <SwapScreen />}
              {view === 'profile'       && <ProfileScreen />}
              {view === 'settings'      && <SettingsScreen />}
              {view === 'chat'          && <ChatScreen />}
              {view === 'user-profile'  && <UserProfileScreen />}
              {view === 'blocked-users' && <BlockedUsersScreen />}
              {view === 'boost'         && <BoostScreen />}
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

const App = () => {
  // ===== B) EULA STATE'LERİ =====
  const [showEula, setShowEula] = useState(true);
  const [eulaAccepted, setEulaAccepted] = useState(false);
  const pullRefreshRef = useRef<number>(0);
  const pullStartYRef = useRef<number>(0);

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await Camera.requestPermissions();
        await Geolocation.requestPermissions();
      } catch (e) {
        console.warn('İzin hatası:', e);
      }
    };
    requestPermissions();
  }, []);

  // ===== PULL-TO-REFRESH LOGIC =====
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      pullStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const pullDistance = e.touches[0].clientY - pullStartYRef.current;
      
      // Sayfa başında mı? (scroll position = 0)
      if (window.scrollY === 0 && pullDistance > 100) {
        pullRefreshRef.current = pullDistance;
        
        // Refresh göstergesi
        if (pullDistance > 150) {
          // Pull yeterli - refresh yap
          window.location.reload();
        }
      }
    };

    const handleTouchEnd = () => {
      pullRefreshRef.current = 0;
      pullStartYRef.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <AppContextProvider>
      <AppRouter
        showEula={showEula}
        eulaAccepted={eulaAccepted}
        setEulaAccepted={setEulaAccepted}
        setShowEula={setShowEula}
      />
    </AppContextProvider>
  );
};

export default App;