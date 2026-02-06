
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

  // Kiểm tra trạng thái Key từ môi trường AI Studio
  useEffect(() => {
    const checkKey = async () => {
      // Trong môi trường preview, hasSelectedApiKey giúp kiểm tra xem dev đã chọn key chưa
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else if (process.env.API_KEY) {
        // Trong môi trường Production thật (Vercel/Netlify), API_KEY sẽ được tiêm qua process.env
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
      alert("Để tính năng AI hoạt động trong Production, hãy cấu hình biến môi trường API_KEY trong Hosting của bạn.");
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

  const handleSimulation = async (stylePrompt: string) => {
    if (!image || cooldown > 0) return;
    
    // Luôn lấy API_KEY từ process.env. Không hardcode chuỗi trực tiếp để tránh lỗi bảo mật/CSP
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setErrorStatus("Lỗi: Không tìm thấy API Key. Hãy nhấn 'CẤU HÌNH AI' để tiếp tục.");
      handleOpenKey();
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = image.split(',')[1];
      
      // Sử dụng model Pro cho chất lượng ảnh cao hơn nếu có key cá nhân
      const modelName = 'gemini-3-pro-image-preview';

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/png' } },
            { text: `Professional barber simulation. Apply a ${stylePrompt} hairstyle to this person. Black and white high-contrast editorial photography style. Ensure natural integration.` }
          ],
        },
        config: { 
          imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
        }
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart) {
        setGeneratedImage(`data:image/png;base64,${imagePart.inlineData.data}`);
      } else {
        throw new Error("Không nhận được dữ liệu hình ảnh từ AI. Hãy thử lại.");
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
      const ai = new GoogleGenAI({ apiKey });
      const parts: any[] = [
        { text: "Bạn là chuyên gia Barber tư vấn phong cách. Trả lời bằng tiếng Việt, ngắn gọn, cá tính, tập trung vào form tóc và khuôn mặt khách hàng trong ảnh (nếu có)." }
      ];

      if (image) parts.push({ inlineData: { data: image.split(',')[1], mimeType: 'image/png' } });
      if (prompt) parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts }
      });

      setRecommendation(response.text || 'Barber AI đang bận, vui lòng thử lại.');
    } catch (error: any) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error: any) => {
    const message = error.message || '';
    console.error("AI Error Detailed:", error);

    if (message.includes('400') || message.includes('API key not valid')) {
      setErrorStatus('LỖI 400: Key bạn dán (hardcode) không được hệ thống chấp nhận. Vui lòng xóa code dán đè và dùng nút "CHỌN KEY" để hệ thống tự cấu hình.');
      setHasKey(false);
    } else if (message.includes('429')) {
      setErrorStatus('LỖI 429: Hết hạn mức (Quota). Vui lòng đợi 60 giây hoặc sử dụng Key từ dự án có Billing.');
      setCooldown(60);
    } else {
      setErrorStatus(`Lỗi: ${message.substring(0, 100)}`);
    }
  };

  return (
    <div className="mt-16 border-t border-black pt-12 mb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Banner hướng dẫn Key cho Production */}
        {!hasKey && (
          <div className="bg-black text-white p-6 border-2 border-black flex flex-col md:flex-row items-center justify-between gap-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase tracking-widest mb-2">Cấu hình Production AI</h3>
              <p className="text-[10px] opacity-70 uppercase leading-relaxed">
                Để khách hàng sử dụng được AI, bạn không nên dán key vào code (bị chặn do CSP). 
                Hãy thiết lập biến <code className="bg-white/20 px-1">API_KEY</code> trong cài đặt Hosting của bạn.
              </p>
            </div>
            <button 
              onClick={handleOpenKey}
              className="bg-white text-black px-10 py-4 text-xs font-black uppercase tracking-widest hover:invert transition-all active:scale-95"
            >
              Cấu Hình Ngay
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-1 space-y-8">
            <div className="flex border-b-2 border-black">
              <button 
                onClick={() => setActiveTab(ConsultantTab.ADVICE)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === ConsultantTab.ADVICE ? 'bg-black text-white' : 'opacity-40'}`}
              >
                Tư Vấn
              </button>
              <button 
                onClick={() => setActiveTab(ConsultantTab.SIMULATION)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all ${activeTab === ConsultantTab.SIMULATION ? 'bg-black text-white' : 'opacity-40'}`}
              >
                Mô Phỏng
              </button>
            </div>

            {errorStatus && (
              <div className="bg-red-50 border-l-4 border-red-600 p-5">
                <p className="text-[10px] font-black uppercase text-red-700">{errorStatus}</p>
                {cooldown > 0 && <p className="text-[9px] mt-2 font-mono">Thử lại sau: {cooldown}s</p>}
              </div>
            )}

            <div className="space-y-6">
              <div 
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`aspect-square md:aspect-video border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden ${image ? 'border-black' : 'border-gray-300 bg-gray-50'}`}
              >
                {image ? (
                  <img src={image} className="w-full h-full object-cover grayscale" alt="Input" />
                ) : (
                  <div className="text-center p-10">
                    <div className="text-4xl font-thin mb-4">+</div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Tải ảnh chân dung</p>
                  </div>
                )}
                {loading && (
                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-20">
                    <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">Barber AI Processing...</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />

              {activeTab === ConsultantTab.ADVICE ? (
                <div className="flex flex-col gap-4">
                  <textarea 
                    placeholder="Mô tả phong cách mong muốn..."
                    className="w-full border-2 border-black p-4 text-xs font-bold uppercase focus:outline-none focus:bg-gray-50 min-h-[100px] resize-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <button 
                    disabled={loading || cooldown > 0}
                    onClick={handleAdvice}
                    className="bg-black text-white py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 disabled:opacity-20 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)]"
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
                      className="border-2 border-black py-5 text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-10 active:translate-y-1"
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white border-4 border-black p-10 min-h-[500px] flex flex-col shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-center text-[10px] font-black uppercase tracking-[0.6em] mb-10 pb-4 border-b border-black/10">Result Window</h3>
            
            <div className="flex-1 overflow-y-auto">
              {activeTab === ConsultantTab.SIMULATION && generatedImage ? (
                <div className="space-y-8 animate-in zoom-in-95 duration-700">
                  <img src={generatedImage} className="w-full border-2 border-black grayscale" alt="Result" />
                  <p className="text-[9px] uppercase tracking-widest opacity-40 text-center">Bản phác thảo phong cách AI</p>
                </div>
              ) : recommendation ? (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
                  <p className="text-sm leading-relaxed font-bold uppercase tracking-tight italic border-l-4 border-black pl-6">
                    {recommendation}
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center grayscale py-20">
                  <div className="w-16 h-16 border-2 border-black mb-8 flex items-center justify-center font-black text-xl">B&W</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ready for request</p>
                </div>
              )}
            </div>

            <div className="mt-10 pt-6 border-t border-black/10 flex justify-between items-end opacity-30">
                <span className="text-[8px] font-black uppercase tracking-widest">Powered by Gemini Pro</span>
                <span className="text-[8px] font-black uppercase tracking-widest">B&W Studio Production</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleConsultant;
