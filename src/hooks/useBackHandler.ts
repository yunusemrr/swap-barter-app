import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { ViewState } from '../../types';

interface UseBackHandlerParams {
  stateRef: React.MutableRefObject<any>;
  viewHistory: React.MutableRefObject<string[]>;
  isBackNavigation: React.MutableRefObject<boolean>;
  lastBackPress: React.MutableRefObject<number>;
  setView: (v: ViewState | 'profile-settings') => void;
  closeConfirmationModal: () => void;
  closeProductSwapSelection: () => void;
  closeLocationModal: () => void;
  closeFilterModal: () => void;
  closeChatMenu: () => void;
  closePhotoOptions: () => void;
  closeSelectedProduct: () => void;
  closeUserProfile: () => void;
}

export function useBackHandler({
  stateRef, viewHistory, isBackNavigation, lastBackPress,
  setView,
  closeConfirmationModal, closeProductSwapSelection, closeLocationModal,
  closeFilterModal, closeChatMenu, closePhotoOptions,
  closeSelectedProduct, closeUserProfile,
}: UseBackHandlerParams) {
  useEffect(() => {
    CapacitorApp.removeAllListeners();

    const listener = CapacitorApp.addListener('backButton', () => {
      const now = Date.now();
      if (now - lastBackPress.current < 300) return;
      lastBackPress.current = now;

      const s = stateRef.current;

      if (s.confirmationModal) { closeConfirmationModal(); return; }
      if (s.showProductSwapSelection) { closeProductSwapSelection(); return; }
      if (s.showLocationModal) { closeLocationModal(); return; }
      if (s.showFilterModal) { closeFilterModal(); return; }
      if (s.showChatMenu) { closeChatMenu(); return; }
      if (s.showPhotoOptions) { closePhotoOptions(); return; }
      if (s.selectedProduct) { closeSelectedProduct(); return; }

      if (s.view === 'user-profile') closeUserProfile();

      if (viewHistory.current.length > 1) {
        viewHistory.current.pop();
        const prev = viewHistory.current[viewHistory.current.length - 1];
        isBackNavigation.current = true;
        setView(prev as ViewState);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => { listener.then(h => h.remove()); };
  }, []);
}
