import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

const STYLE_PRESETS = [
  { id: 'buzz', name: 'Buzz Cut', prompt: 'Sharp buzz cut, skin fade sides, very short top.' },
  { id: 'undercut', name: 'Undercut', prompt: 'Classic undercut with long textured top swept back.' },
  { id: 'pompadour', name: 'Pompadour', prompt: 'Modern pompadour hairstyle, high volume, clean sides.' },
  { id: 'korean', name: 'Korean Wave', prompt: 'Korean style soft wavy hair with natural side part.' }
];

enum ConsultantTab {
  SIMULATION = 'simulation',
  ADVICE = 'advice'
}

const StyleConsultant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConsultantTab>(ConsultantTab.ADVICE);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [hasKey, setHasKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else if (process.env.API_KEY) {
        setHasKey(true);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleOpenKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      setErrorStatus(null);
      await window.aistudio.openSelectKey();
      setHasKey(true);
    } else {
      alert("Cấu hình API_KEY trong môi trường Hosting của bạn.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setGeneratedImage(null);
        setErrorStatus(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- PHẦN CHỈNH SỬA CHÍNH: XỬ LÝ GEN ẢNH ---
  const handleSimulation = async (stylePrompt: string) => {
    if (!image || cooldown > 0) return;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setErrorStatus("Lỗi: Không tìm thấy API Key.");
      handleOpenKey();
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    setGeneratedImage(null);

    try {
      const genAI = new GoogleGenAI(apiKey);
      // Sử dụng model chuyên về xử lý và tạo ảnh (Nano Banana)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

      const base64Data = image.split(',')[1];
      
      // Prompt được thiết kế để yêu cầu AI trả về kết quả là một hình ảnh
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/png"
          }
        },
        { text: `Hairstyle simulation task: Keep the face and identity of the person in the image exactly the same. Replace the current hair with a ${stylePrompt}. Style: Black and white high-contrast editorial photography. Output only the modified image.` }
      ]);

      const response = await result.response;
      
      // Tìm kiếm phần dữ liệu hình ảnh trong mảng parts trả về
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (imagePart && imagePart.inlineData) {
        setGeneratedImage(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
      } else {
        // Nếu AI trả về text thay vì ảnh (do lỗi hoặc model không hiểu lệnh vẽ)
        throw new Error("Mô hình không trả về ảnh. Có thể do nội dung vi phạm chính sách an toàn hoặc prompt chưa rõ ràng.");
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvice = async () => {
    const apiKey = process.env.API_KEY;
    if (cooldown > 0 || (!prompt && !image) || !apiKey) return;
    
    setLoading(true);
    setErrorStatus(null);
    setRecommendation('');

    try {
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      const parts: any[] = [
        { text: "Bạn là chuyên gia Barber tư vấn phong cách. Trả lời bằng tiếng Việt, ngắn gọn, cá tính, tập trung vào form tóc và khuôn mặt khách hàng." }
      ];

      if (image) parts.push({ inlineData: { data: image.split(',')[1], mimeType: 'image/png' } });
      if (prompt) parts.push({ text: prompt });

      const result = await model.generateContent(parts);
      const response = await result.response;
      setRecommendation(response.text());
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    const message = error.message || '';
    if (message.includes('429')) {
      setErrorStatus('Hết hạn mức (Quota). Vui lòng đợi 60s.');
      setCooldown(60);
    } else {
      setErrorStatus(`Lỗi: ${message.substring(0, 100)}`);
    }
  };

  return (
    <div className="mt-16 border-t border-black pt-12 mb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {!hasKey && (
          <div className="bg-black text-white p-6 border-2 border-black flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest mb-2">Cấu hình API Key</h3>
              <p className="text-[10px] opacity-70 uppercase">Thiết lập biến môi trường API_KEY để sử dụng tính năng mô phỏng.</p>
            </div>
            <button onClick={handleOpenKey} className="bg-white text-black px-10 py-4 text-xs font-black uppercase hover:invert transition-all">
              Cấu Hình
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-1 space-y-8">
            <div className="flex border-b-2 border-black">
              <button 
                onClick={() => setActiveTab(ConsultantTab.ADVICE)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === ConsultantTab.ADVICE ? 'bg-black text-white' : 'opacity-40'}`}
              >
                Tư Vấn
              </button>
              <button 
                onClick={() => setActiveTab(ConsultantTab.SIMULATION)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === ConsultantTab.SIMULATION ? 'bg-black text-white' : 'opacity-40'}`}
              >
                Mô Phỏng
              </button>
            </div>

            {errorStatus && (
              <div className="bg-red-50 border-l-4 border-red-600 p-5">
                <p className="text-[10px] font-black uppercase text-red-700">{errorStatus}</p>
              </div>
            )}

            <div className="space-y-6">
              <div 
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`aspect-square md:aspect-video border-2 border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden ${image ? 'border-black' : 'border-gray-300 bg-gray-50'}`}
              >
                {image ? (
                  <img src={image} className="w-full h-full object-cover grayscale" alt="Input" />
                ) : (
                  <div className="text-center p-10">
                    <p className="text-[10px] font-black uppercase tracking-widest">+ Tải ảnh chân dung</p>
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-20">
                    <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[9px] font-black uppercase tracking-widest">Barber AI Processing...</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />

              {activeTab === ConsultantTab.ADVICE ? (
                <div className="flex flex-col gap-4">
                  <textarea 
                    placeholder="Bạn muốn cắt kiểu gì..."
                    className="w-full border-2 border-black p-4 text-xs font-bold uppercase focus:outline-none min-h-[100px]"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <button 
                    disabled={loading || cooldown > 0}
                    onClick={handleAdvice}
                    className="bg-black text-white py-5 text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-20"
                  >
                    Gửi Yêu Cầu
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      disabled={loading || !image || cooldown > 0}
                      onClick={() => handleSimulation(style.prompt)}
                      className="border-2 border-black py-5 text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all disabled:opacity-10"
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white border-4 border-black p-10 min-h-[500px] flex flex-col shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-center text-[10px] font-black uppercase tracking-widest mb-10 pb-4 border-b">Kết quả mô phỏng</h3>
            
            <div className="flex-1 overflow-y-auto">
              {activeTab === ConsultantTab.SIMULATION && generatedImage ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-500">
                  <img src={generatedImage} className="w-full border-2 border-black grayscale" alt="Result" />
                  <p className="text-[9px] uppercase tracking-widest opacity-40 text-center italic">Đây là ảnh được AI render dựa trên chân dung gốc</p>
                </div>
              ) : recommendation ? (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                  <p className="text-sm leading-relaxed font-bold uppercase italic border-l-4 border-black pl-6">
                    {recommendation}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center grayscale py-20">
                  <div className="w-16 h-16 border-2 border-black mb-8 flex items-center justify-center font-black text-xl">AI</div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Đang chờ yêu cầu...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleConsultant;