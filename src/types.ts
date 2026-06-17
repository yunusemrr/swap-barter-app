export type ViewState =
  | 'loading'
  | 'login'
  | 'register'
  | 'home'
  | 'addProduct'
  | 'swipe'
  | 'matches'
  | 'messages'
  | 'profile'
  | 'settings'
  | 'productDetail'
  | 'chat'
  | 'editProduct'
  | 'search'
  | 'userProfile'
  | 'auth'
  | 'upload'
  | 'user-profile'
  | 'profile-settings';

export interface User {
  uid?: string;
  id?: string;
  email?: string;
  displayName?: string;
  name?: string;
  photoURL?: string;
  avatar?: string;
  city?: string;
  bio?: string;
  location?: { lat: number; lng: number } | string;
  swapCount?: number;
  createdAt?: any;
  blockedUsers?: string[];
}

export interface Product {
  id: string;
  userId: string;
  userName?: string;
  userPhoto?: string;
  userAvatar?: string;
  title: string;
  description?: string;
  category?: string;
  condition?: string;
  images: string[];
  image?: string;
  price?: number;
  city?: string;
  createdAt?: any;
  status?: 'active' | 'matched' | 'inactive';
  wantedCategories?: string[];
  preferredTradeCategory?: string;
  location?: { lat: number; lng: number };
}

export interface Match {
  id: string;
  users?: string[];
  products?: string[];
  myProductId?: string;
  otherProductId?: string;
  otherUser?: any;
  createdAt?: any;
  lastMessage?: string;
  lastMessageAt?: any;
  timestamp?: any;
  status?: 'active' | 'completed' | 'cancelled';
}

export interface Offer {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromProductId: string;
  toProductId: string;
  myProductId?: string;
  offeredProductId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt?: any;
  message?: string;
}
