import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (title: string, category: string, condition: string, imageBase64?: string): Promise<string> => {
  try {
    const prompt = `
      Bir ikinci el takas uygulamasında kullanıcı şu ürünü satıyor:
      Başlık: ${title}
      Kategori: ${category}
      Durum: ${condition}

      ${imageBase64 ? 'Eklenen görsele bakarak ve başlığı kullanarak,' : ''}
      Bu ürün için kısa, dikkat çekici, samimi ve satış/takas olasılığını artıracak Türkçe bir açıklama metni yaz. 
      Eğer resim varsa resimdeki detaylardan da (renk, şekil vb.) kısaca bahset.
      Sadece açıklamayı döndür, tırnak işareti kullanma. En fazla 2-3 cümle olsun.
    `;

    const parts: any[] = [];
    
    if (imageBase64) {
        // Handle different base64 formats (with or without prefix)
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg', 
                data: base64Data
            }
        });
    }
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Supports multimodal
      contents: { parts: parts },
    });

    return response.text?.trim() || "Harika bir ürün! Takas için kaçırılmayacak fırsat.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Bu ürün takas için harika bir fırsat olabilir. Detayları inceleyin.";
  }
};