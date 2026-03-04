import { GoogleGenerativeAI } from "@google/generative-ai";

// API Key'i doğrudan buraya yapıştırarak test et (boşluk kalmadığından emin ol)
const API_KEY = "AIzaSyCpwAx7Hm44mzcVWa-n5DyyMUVJSQtd270".trim(); 
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateProductDescription = async (
    title: string, 
    category: string, 
    condition: string, 
    imageBase64?: string
): Promise<string> => {
    try {
        // ÇÖZÜM: 'models/' ön ekini ekleyerek tam yol tanımlıyoruz
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash" 
        });

        // Prompt (Komut) - Tek cümle sorununu çözen zenginleştirilmiş komut
        const prompt = `
            GÖREV: Swap Barter adlı takas uygulaması için profesyonel bir ürün açıklaması yazarı ol.
            
            Ürün Bilgileri:
            - Başlık: ${title}
            - Kategori: ${category}
            - Bildirilen Durum: ${condition}
            
            KURALLAR:
            1. "Resimde gördüğüm kadarıyla..." diye söze başla.
            2. Ürünün özelliklerini vurgulayan etkileyici ve güven veren bir ton kullan.
            3. Takas için neden iyi bir seçenek olduğunu ve kullanım alanlarını anlat.
            4. En az 3-4 cümlelik, zengin bir paragraf oluştur. Kesinlikle tek cümle yazma!
        `;

        const parts: any[] = [{ text: prompt }];

        if (imageBase64) {
            const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
            });
        }

        // generateContent çağrısı
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        return text.trim();

    } catch (error: any) {
        console.error("Gemini Servis Hatası Detayı:", error);
        return "Ürün analizi şu an yapılamıyor, lütfen manuel açıklama giriniz.";
    }
};