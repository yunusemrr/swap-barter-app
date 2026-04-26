import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera as CameraIcon, X, ChevronDown, Crop as CropIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { db } from '../../../firebaseConfig';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { generateProductDescription } from '../../../services/geminiService';
import { useAppContext } from '../../context/AppContext';

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

  return (
    <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
      <div className="bg-[#00592e] p-6 pb-2 rounded-b-[35px] shadow-lg shadow-green-100 dark:shadow-none w-full mb-2">
        <h1 className="text-white text-3xl font-black italic uppercase drop-shadow-md">
          swap <span className="text-[#ffab00]">barter</span>
        </h1>
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
                  <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setShowPhotoOptions(true)}
                className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-300 dark:border-zinc-700"
              >
                <CameraIcon size={24} />
              </button>
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
            <input
              required value={uploadForm.title}
              onChange={e => setUploadForm(f => ({ ...f, title: e.target.value }))}
              className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-white"
              placeholder="Örn: iPhone 13 128GB"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-zinc-500 mb-2">Fiyat (TL)</label>
              <input
                type="text" required
                value={uploadForm.price ? Number(uploadForm.price).toLocaleString('tr-TR') : ''}
                onChange={e => {
                  const raw = e.target.value.replace(/\./g, '');
                  if (!isNaN(Number(raw))) setUploadForm(f => ({ ...f, price: raw }));
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
                  onChange={e => setUploadForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none font-bold text-zinc-900 dark:text-white appearance-none"
                >
                  {['Elektronik', 'Moda', 'Ev', 'Hobi', 'Araç', 'Spor', 'Müzik'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-4 text-zinc-400 pointer-events-none" size={20} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-500 mb-2">Açıklama</label>
            <textarea
              required value={uploadForm.description}
              onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
              className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl outline-none text-zinc-900 dark:text-white min-h-[120px]"
              placeholder="Ürün durumu, kullanım süresi vb."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-500 mb-2">Durum</label>
            <div className="flex gap-2">
              {(['Yeni Gibi', 'İdare Eder', 'Eski'] as const).map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setUploadForm(f => ({ ...f, condition: c }))}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${uploadForm.condition === c ? 'bg-[#00592e] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit" disabled={isUploading}
            className="w-full bg-[#00592e] text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50"
          >
            {isUploading ? 'Kaydediliyor...' : 'Yayınla'}
          </button>
        </form>

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
                    className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#00592e]"
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
                    className="flex-[2] py-4 bg-[#00592e] text-white rounded-2xl font-bold flex items-center justify-center gap-2"
                  >
                    <CropIcon size={20} /> Kırp & Kaydet
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
