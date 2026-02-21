
export interface Product {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  image: string; // Main display image
  images?: string[]; // Multiple images support
  category: string;
  condition: 'Yeni Gibi' | 'İdare Eder' | 'Eski';
  preferredTradeCategory?: string;
  location?: string;
  userAvatar?: string;
  userName?: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  location?: string;
  swapCount?: number;
}

export interface Match {
  id: string;
  myProductId: string;
  otherProductId: string;
  otherUser: User;
  timestamp: number;
}

export interface Offer {
  id: string;
  fromUserId: string;
  toUserId: string;
  myProductId: string; // Product offered BY the sender
  offeredProductId: string; // Product WANTED by the sender (owned by receiver)
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export type ViewState = 'auth' | 'home' | 'upload' | 'swipe' | 'matches' | 'profile' | 'settings' | 'user-profile' | 'chat' | 'blocked-users';
