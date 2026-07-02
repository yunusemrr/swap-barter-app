import React, { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera as CameraIcon, X, Crop as CropIcon, ArrowLeft, Minus, Plus,
  Star, Smartphone, Shirt, Home as HomeIcon, Puzzle, Car, Dumbbell, Music2,
  Check, ArrowRight, Sparkles,
} from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { db } from '../../../firebaseConfig';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { generateProductDescription } from '../../../services/geminiService';
import { useAppContext } from '../../context/AppContext';

const CATEGORIES: { id: string; Icon: any }[] = [
  { id: 'Elektronik', Icon: Smartphone },
  { id: 'Moda',       Icon: Shirt },
  { id: 'Ev',         Icon: HomeIcon },
  { id: 'Hobi',       Icon: Puzzle },
  { id: 'Araç',       Icon: Car },
  { id: 'Spor',       Icon: Dumbbell },
  { id: 'Müzik',      Icon: Music2 },
];

const CONDITIONS: { id: 'Yeni Gibi' | 'İdare Eder' | 'Eski'; label: string; desc: string }[] = [
  { id: 'Yeni Gibi',  label: 'Yeni Gibi',  desc: 'Hiç kullanılmamış, kutusunda' },
  { id: 'İdare Eder', label: 'İdare Eder', desc: 'Küçük kullanım izleri olabilir' },
  { id: 'Eski',       label: 'Eski',       desc: 'Belirgin kullanım izleri var' },
];

export function UploadScreen() {
  const {
    uploadForm, setUploadForm, editingProductId, setEditingProductId,
    isUploading, setIsUploading, isGeneratingAI, setIsGeneratingAI,
    showPhotoOptions, setShowPhotoOptions,
    fileInputRef, cameraInputRef,
    imageToCrop, setImageToCrop, crop, setCrop, zoom, setZoom,
    croppedAreaPixels, setCroppedAreaPixels, showCropperModal, setShowCropperModal,
    currentUser, setView,
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

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
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
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        if (!blob) return;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result as string);
      }, 'image/jpeg', 0.9);
    });
  };

  const onCropComplete = useCallback((_: any, pixels: any) => setCroppedAreaPixels(pixels), []);

  const handleSaveCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      const cropped = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setUploadForm(prev => ({ ...prev, images: [...prev.images, cropped] }));
      setShowCropperModal(false); setImageToCrop(null); setCrop({ x: 0, y: 0 }); setZoom(1);
    } catch { alert('Resim kırpılırken bir hata oluştu.'); }
  };

  const handleTakePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90, allowEditing: true,
        resultType: CameraResultType.DataUrl, source: CameraSource.Camera,
      });
      if (image.dataUrl) { setImageToCrop(image.dataUrl); setShowCropperModal(true); setShowPhotoOptions(false); }
    } catch (e) { console.error('Kamera hatası:', e); }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    try {
      const compressed = await compressImage(files[0]);
      setImageToCrop(compressed); setShowCropperModal(true); setShowPhotoOptions(false);
    } catch (e) { console.error('Resim hazırlama hatası:', e); }
    e.target.value = '';
  };

  const removeImage = (idx: number) =>
    setUploadForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const handleAIHelp = async () => {
    if (!uploadForm.title || uploadForm.images.length === 0) {
      alert('Önce bir fotoğraf eklemelisin!'); return;
    }
    setIsGeneratingAI(true);
    try {
      const desc = await generateProductDescription(uploadForm.title, uploadForm.category, uploadForm.condition, uploadForm.images[0]);
      setUploadForm(prev => ({ ...prev, description: desc }));
    } catch {} finally { setIsGeneratingAI(false); }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsUploading(true);
    const finalImages = uploadForm.images.length > 0
      ? uploadForm.images
      : [`https://picsum.photos/400/600?random=${Date.now()}`];
    const productData = {
      userId: currentUser.id, title: uploadForm.title, description: uploadForm.description,
      price: Number(uploadForm.price), image: finalImages[0], images: finalImages,
      category: uploadForm.category, condition: uploadForm.condition,
      preferredTradeCategory: uploadForm.preferredTradeCategory,
      location: currentUser.location || 'İstanbul',
      userAvatar: currentUser.avatar, userName: currentUser.name,
      timestamp: serverTimestamp(), featured: false, featuredUntil: null, featuredCity: null,
    };
    try {
      if (editingProductId) {
        await updateDoc(doc(db, 'products', editingProductId), productData);
        alert('Ürün güncellendi!');
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      setView('home');
      setUploadForm({ title: '', description: '', price: '', images: [], category: 'Elektronik', condition: 'Yeni Gibi', preferredTradeCategory: '' });
      setEditingProductId(null);
    } catch (e) {
      console.error('Error saving product:', e);
      alert('İşlem sırasında bir hata oluştu.');
    } finally { setIsUploading(false); }
  };

  const priceNum = Number(uploadForm.price || 0);
  const adjustPrice = (delta: number) => {
    const next = Math.max(0, priceNum + delta);
    setUploadForm(f => ({ ...f, price: String(next) }));
  };

  const filledSteps = uploadForm.images.length > 0 && uploadForm.title ? (uploadForm.description ? 3 : 2) : (uploadForm.images.length > 0 ? 1 : 0);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="h-full flex flex-col overflow-hidden relative" style={{ background: '#F3F2EE' }}>
      {/* ── HEADER ── */}
      <div
        className="flex-shrink-0 w-full px-6 pb-5"
        style={{
          background: 'linear-gradient(160deg, #12693b 0%, #0b3f24 92%)',
          borderRadius: '0 0 34px 34px',
          paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        }}
      >
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => setView('home')}
            className="flex items-center justify-center active:scale-95 transition-transform"
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,.14)' }}
          >
            <ArrowLeft size={17} color="#fff" />
          </button>
          <div>
            <h1 className="font-extrabold text-[19px]" style={{ color: '#fff' }}>
              {editingProductId ? 'İlanı Düzenle' : 'Yeni İlan'}
            </h1>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.65)' }}>Birkaç adımda ilanını yayınla</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-1" style={{ height: 4, borderRadius: 4, background: i < Math.max(filledSteps, 1) ? '#F5A623' : 'rgba(255,255,255,.2)' }} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form ref={formRef} onSubmit={handleUploadSubmit} className="px-6 pt-5 space-y-6" style={{ paddingBottom: 110 }}>

          {/* ── FOTOĞRAFLAR ── */}
          <div>
            <label className="block font-bold text-[13px] mb-2.5" style={{ color: '#16241C' }}>Fotoğraflar</label>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {uploadForm.images.map((img, idx) => (
                <div key={idx} className="relative flex-shrink-0" style={{ width: 132, height: 150 }}>
                  <img src={img} className="w-full h-full object-cover" style={{ borderRadius: 20 }} />
                  {idx === 0 && (
                    <span
                      className="absolute top-2 left-2 font-extrabold"
                      style={{ fontSize: 9.5, color: '#fff', background: 'rgba(15,90,51,.85)', borderRadius: 8, padding: '3px 7px' }}
                    >
                      KAPAK
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute bottom-2 right-2 flex items-center justify-center"
                    style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,.55)' }}
                  >
                    <X size={13} color="#fff" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowPhotoOptions(true)}
                className="flex flex-col items-center justify-center gap-2 flex-shrink-0"
                style={{ width: 132, height: 150, borderRadius: 20, border: '2px dashed #CDCBC3' }}
              >
                <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: '50%', background: '#0F5A33' }}>
                  <CameraIcon size={16} color="#fff" />
                </div>
                <span className="font-semibold text-[12px]" style={{ color: '#6A6A62' }}>Fotoğraf Ekle</span>
              </button>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" multiple />
            <input type="file" ref={cameraInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" capture="environment" />

            {showPhotoOptions && (
              <div className="mt-2.5 flex gap-2">
                <button type="button" onClick={handleTakePhoto} className="text-[12px] font-bold px-3 py-1.5" style={{ background: '#DFF0E6', color: '#0F5A33', borderRadius: 10 }}>Kamera</button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[12px] font-bold px-3 py-1.5" style={{ background: '#FDECD2', color: '#E8890C', borderRadius: 10 }}>Galeri</button>
                <button type="button" onClick={() => setShowPhotoOptions(false)} className="text-[12px] px-3 py-1.5" style={{ color: '#9A9A92' }}>İptal</button>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-2.5">
              <Star size={12} color="#F5A623" fill="#F5A623" />
              <span className="text-[11.5px] font-medium" style={{ color: '#6A6A62' }}>
                İyi ışıkta çekilen net fotoğraflar 3× daha fazla teklif alır
              </span>
            </div>
          </div>

          {/* ── BAŞLIK ── */}
          <div>
            <label className="block font-bold text-[13px] mb-2.5" style={{ color: '#16241C' }}>Başlık</label>
            <input
              required value={uploadForm.title}
              onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
              className="w-full outline-none font-semibold text-[15px]"
              style={{ background: '#fff', border: '1.5px solid #E4E2D9', borderRadius: 16, padding: '14px 16px', color: '#16241C' }}
              placeholder="Örn: iPhone 13 128GB"
            />
          </div>

          {/* ── AÇIKLAMA ── */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="font-bold text-[13px]" style={{ color: '#16241C' }}>Açıklama</label>
              <button
                type="button"
                onClick={handleAIHelp}
                disabled={isGeneratingAI}
                className="flex items-center gap-1 font-bold text-[11.5px] active:scale-95 transition-transform disabled:opacity-50"
                style={{ color: '#0F5A33' }}
              >
                <Sparkles size={12} /> {isGeneratingAI ? 'Oluşturuluyor...' : 'AI ile Oluştur'}
              </button>
            </div>
            <textarea
              required value={uploadForm.description}
              onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
              className="w-full outline-none text-[14.5px]"
              style={{ background: '#fff', border: '1.5px solid #E4E2D9', borderRadius: 16, padding: '14px 16px', color: '#16241C', minHeight: 92 }}
              placeholder="Ürün durumu, kullanım süresi vb."
            />
          </div>

          {/* ── TAKAS DEĞERİ ── */}
          <div>
            <label className="block font-bold text-[13px] mb-2.5" style={{ color: '#16241C' }}>Takas Değeri</label>
            <div
              className="flex items-center justify-between"
              style={{ background: 'linear-gradient(145deg,#12693b,#0b3f24)', borderRadius: 18, padding: '16px 18px' }}
            >
              <button
                type="button"
                onClick={() => adjustPrice(-50)}
                className="flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)' }}
              >
                <Minus size={18} color="#fff" />
              </button>

              <div className="flex items-baseline gap-1.5">
                <span className="font-extrabold text-[26px]" style={{ color: '#fff' }}>
                  {priceNum.toLocaleString('tr-TR')}
                </span>
                <span className="font-bold text-[15px]" style={{ color: 'rgba(255,255,255,.75)' }}>TL</span>
              </div>

              <button
                type="button"
                onClick={() => adjustPrice(50)}
                className="flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                style={{ width: 38, height: 38, borderRadius: '50%', background: '#F5A623' }}
              >
                <Plus size={18} color="#fff" />
              </button>
            </div>
            <input
              type="text" required value={uploadForm.price}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '');
                setUploadForm(f => ({ ...f, price: raw }));
              }}
              className="sr-only"
            />
          </div>

          {/* ── KATEGORİ ── */}
          <div>
            <label className="block font-bold text-[13px] mb-2.5" style={{ color: '#16241C' }}>Kategori</label>
            <div className="grid grid-cols-3 gap-2.5">
              {CATEGORIES.map(({ id, Icon }) => {
                const isActive = uploadForm.category === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setUploadForm(f => ({ ...f, category: id }))}
                    className="flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    style={{
                      borderRadius: 16, padding: '14px 6px',
                      background: isActive ? '#0F5A33' : '#fff',
                      border: isActive ? 'none' : '1.5px solid #E4E2D9',
                    }}
                  >
                    <Icon size={20} color={isActive ? '#fff' : '#6A6A62'} strokeWidth={2} />
                    <span className="font-semibold text-[11.5px]" style={{ color: isActive ? '#fff' : '#6A6A62' }}>{id}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── ÜRÜN DURUMU ── */}
          <div>
            <label className="block font-bold text-[13px] mb-2.5" style={{ color: '#16241C' }}>Ürün Durumu</label>
            <div className="space-y-2.5">
              {CONDITIONS.map(({ id, label, desc }) => {
                const isActive = uploadForm.condition === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setUploadForm(f => ({ ...f, condition: id }))}
                    className="w-full flex items-center gap-3 text-left active:scale-[.99] transition-transform"
                    style={{
                      borderRadius: 16, padding: '13px 14px',
                      background: isActive ? 'rgba(15,90,51,.07)' : '#fff',
                      border: isActive ? '1.5px solid #0F5A33' : '1.5px solid #E4E2D9',
                    }}
                  >
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{ width: 38, height: 38, borderRadius: 12, background: isActive ? '#0F5A33' : '#F1F0EA' }}
                    >
                      {isActive ? <Check size={17} color="#fff" /> : <Sparkles size={16} color="#9A9A92" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[14px]" style={{ color: '#16241C' }}>{label}</p>
                      <p className="text-[11.5px]" style={{ color: '#9A9A92' }}>{desc}</p>
                    </div>
                    <div
                      className="flex-shrink-0"
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        border: isActive ? '6px solid #0F5A33' : '2px solid #CDCBC3',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>


      {/* ── STICKY FOOTER ── */}
      <div
        className="absolute bottom-0 left-0 right-0 px-6 pt-8 pb-4"
        style={{ background: 'linear-gradient(0deg, #F3F2EE 55%, rgba(243,242,238,0) 100%)' }}
      >
        <button
          type="button"
          disabled={isUploading}
          onClick={() => formRef.current?.requestSubmit()}
          className="w-full flex items-center justify-center gap-2 text-white font-bold text-[15px] active:scale-95 transition-transform disabled:opacity-50"
          style={{
            background: 'linear-gradient(120deg,#12693b,#0b3f24)',
            borderRadius: 18, padding: '16px',
            boxShadow: '0 14px 26px -10px rgba(15,90,51,.55)',
          }}
        >
          {isUploading ? 'Kaydediliyor...' : editingProductId ? 'Güncelle' : 'İlanı Yayınla'}
          {!isUploading && <ArrowRight size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {showCropperModal && imageToCrop && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black flex flex-col"
          >
            <div className="relative flex-1 w-full bg-black">
              <Cropper
                image={imageToCrop} crop={crop} zoom={zoom} aspect={1}
                onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom}
              />
            </div>
            <div className="bg-zinc-900 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-4 px-4">
                <span className="text-xs text-zinc-400 font-bold">Uzak</span>
                <input
                  type="range" value={zoom} min={1} max={3} step={0.1}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#0F5A33]"
                />
                <span className="text-xs text-zinc-400 font-bold">Yakın</span>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => { setShowCropperModal(false); setImageToCrop(null); }}
                  className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveCroppedImage}
                  className="flex-[2] py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(145deg,#12693b,#0b3f24)' }}
                >
                  <CropIcon size={20} /> Kırp & Kaydet
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
