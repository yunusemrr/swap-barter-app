
import { Product, User, Offer } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'Kullanıcı',
  avatar: 'https://picsum.photos/id/64/100/100',
  swapCount: 12,
};

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ayşe Y.', avatar: 'https://picsum.photos/id/65/100/100', swapCount: 5 },
  { id: 'u2', name: 'Mehmet K.', avatar: 'https://picsum.photos/id/66/100/100', swapCount: 8 },
  { id: 'u3', name: 'Can B.', avatar: 'https://picsum.photos/id/67/100/100', swapCount: 3 },
  { id: 'u4', name: 'Zeynep S.', avatar: 'https://picsum.photos/id/68/100/100', swapCount: 15 },
];

export const INITIAL_MARKET_PRODUCTS: Product[] = [
  {
    id: 'p1',
    userId: 'u1',
    title: 'iPhone 13 128GB',
    description: 'Çok temiz, kutusu duruyor. Sadece ekranda kılcal çizik var.',
    price: 25000,
    image: 'https://picsum.photos/id/1/400/600',
    images: ['https://picsum.photos/id/1/400/600'],
    category: 'Elektronik',
    condition: 'Yeni Gibi',
    location: 'İstanbul',
  },
  {
    id: 'p2',
    userId: 'u2',
    title: 'Sony PS5 Oyun Konsolu',
    description: '2 kol ile birlikte verilecektir. Garantisi devam ediyor.',
    price: 22000,
    image: 'https://picsum.photos/id/2/400/600',
    images: ['https://picsum.photos/id/2/400/600'],
    category: 'Oyun',
    condition: 'Yeni Gibi',
    preferredTradeCategory: 'Elektronik',
    location: 'Ankara',
  },
  {
    id: 'p3',
    userId: 'u3',
    title: 'Macbook Air M1',
    description: 'Pil döngüsü 50. Çiziksiz.',
    price: 26000,
    image: 'https://picsum.photos/id/3/400/600',
    images: ['https://picsum.photos/id/3/400/600'],
    category: 'Bilgisayar',
    condition: 'Yeni Gibi',
    location: 'İzmir',
  },
  {
    id: 'p4',
    userId: 'u4',
    title: 'Vintage Deri Ceket',
    description: 'Gerçek deri, 80lerden kalma ama çok iyi durumda.',
    price: 4000,
    image: 'https://picsum.photos/id/4/400/600',
    images: ['https://picsum.photos/id/4/400/600'],
    category: 'Giyim',
    condition: 'İdare Eder',
    location: 'Bursa',
  },
  {
    id: 'p5',
    userId: 'u1',
    title: 'Elektro Gitar',
    description: 'Başlangıç seviyesi için uygun, kılıfı hediye.',
    price: 5000,
    image: 'https://picsum.photos/id/5/400/600',
    images: ['https://picsum.photos/id/5/400/600'],
    category: 'Müzik',
    condition: 'İdare Eder',
    location: 'İstanbul',
  },
   {
    id: 'p6',
    userId: 'u2',
    title: 'Profesyonel Kamera',
    description: 'DSLR kamera, lens dahil.',
    price: 24000,
    image: 'https://picsum.photos/id/6/400/600',
    images: ['https://picsum.photos/id/6/400/600'],
    category: 'Fotoğraf',
    condition: 'Yeni Gibi',
    location: 'Antalya',
  },
];

export const INITIAL_MY_PRODUCTS: Product[] = [
  {
    id: 'm1',
    userId: 'me',
    title: 'iPad Pro 11"',
    description: 'M1 çipli model. Çizim için almıştım kullanmadım.',
    price: 24000,
    image: 'https://picsum.photos/id/7/400/600',
    images: ['https://picsum.photos/id/7/400/600'],
    category: 'Elektronik',
    condition: 'Yeni Gibi',
    location: 'Samsun',
  },
  {
    id: 'm2',
    userId: 'me',
    title: 'Bisiklet',
    description: 'Şehir bisikleti, 21 vites.',
    price: 4500,
    image: 'https://picsum.photos/id/8/400/600',
    images: ['https://picsum.photos/id/8/400/600'],
    category: 'Spor',
    condition: 'İdare Eder',
    location: 'Samsun',
  }
];

export const MOCK_OFFERS: Offer[] = [
  {
    id: 'o1',
    fromUserId: 'u1',
    toUserId: 'me',
    myProductId: 'p1', // u1 offers their iPhone
    offeredProductId: 'm1', // for my iPad
    status: 'pending',
    timestamp: Date.now() - 100000,
  }
];
