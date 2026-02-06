import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';

const STYLE_PRESETS = [
  { id: 'buzz', name: 'Buzz Cut', prompt: 'Very short buzz cut, high skin fade on sides, clean buzzed top, sharp hairline, black and white photography.' },
  { id: 'undercut', name: 'Undercut', prompt: 'Slicked back undercut, shaved sides, long textured top, professional barber style, black and white.' },
  { id: 'pompadour', name: 'Pompadour', prompt: 'Classic pompadour hairstyle, high volume top, tapered sides, clean look, high contrast black and white.' },
  { id: 'mullet', name: 'Modern Mullet', prompt: 'Modern wolf cut mullet, short messy top, long back, edgy style, black and white portrait.' }
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!image) {
      setErrorStatus("BẠN PHẢI TẢI ẢNH LÊN Ở BƯỚC 1.");
      return;
    }
  
    setLoading(true);
    setErrorStatus(null);
    setGeneratedImage(null);
  
    try {
      // Chuyển base64 image thành binary
      const base64Data = image.split(',')[1];
      
      // Tạo prompt kết hợp
      const combinedPrompt = `Portrait photo transformation: ${stylePrompt}`;
  
      const response = await fetch(
        "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.REACT_APP_HUGGING_FACE_API_KEY}`, // Lấy API key từ .env
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: combinedPrompt,
            parameters: {
              image: base64Data,
            }
          }),
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
  
      // Hugging Face trả về blob
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
  
    } catch (error: any) {
      console.error(error);
      setErrorStatus(`LỖI: ${error.message.substring(0, 150)}`);
    } finally {
      setLoading(false);
    }
  };
  const handleAdvice = async () => {
    if (!prompt && !image) return;
    
    setLoading(true);
    setErrorStatus(null);
    setRecommendation('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [
        { text: "Bạn là Thợ sáng tạo kiểu tóc của Gâu Barber. Hãy phân tích ảnh khuôn mặt và yêu cầu của khách hàng. Trả lời bằng tiếng Việt theo phong cách năng động, trẻ trung mang dáng dấp boy phố. Nội dung tư vấn bắt đầu bằng lời chào đến từ Gâu barber cần có chiều sâu bao gồm: 1. Nhận xét về cấu trúc khuôn mặt. 2. Kiểu tóc đề xuất cụ thể. 3. Gợi ý sản phẩm tạo kiểu." }
      ];

      if (image) parts.push({ inlineData: { data: image.split(',')[1], mimeType: 'image/png' } });
      if (prompt) parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts }
      });

      setRecommendation(response.text || 'Lỗi tư vấn.');
    } catch (error: any) {
      setErrorStatus("Lỗi tư vấn AI. Kiểm tra kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-24 border-t-4 border-black pt-20 mb-32">
      <div className="max-w-4xl mx-auto space-y-16">
        <div className="flex flex-col lg:flex-row gap-20">
          <div className="flex-1 space-y-12">
            <div className="flex border-4 border-black p-1.5 bg-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <button 
                onClick={() => setActiveTab(ConsultantTab.ADVICE)}
                className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === ConsultantTab.ADVICE ? 'bg-black text-white' : 'opacity-30 hover:opacity-100'}`}
              >
                Tư Vấn
              </button>
              <button 
                onClick={() => setActiveTab(ConsultantTab.SIMULATION)}
                className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === ConsultantTab.SIMULATION ? 'bg-black text-white' : 'opacity-30 hover:opacity-100'}`}
              >
                Mô Phỏng
              </button>
            </div>

            {errorStatus && (
              <div className="bg-black text-white p-6 border-l-[12px] border-red-500">
                <p className="text-[11px] font-black uppercase leading-relaxed">{errorStatus}</p>
              </div>
            )}

            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs italic shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">1</div>
                  <h4 className="text-[12px] font-black uppercase tracking-widest">Tải ảnh khuôn mặt</h4>
                </div>
                <div 
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className={`relative group aspect-square md:aspect-video border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${image ? 'border-black bg-white' : 'border-gray-300 hover:border-black bg-gray-50'}`}
                >
                  {image ? (
                    <img src={image} className="w-full h-full object-cover grayscale" alt="Input" />
                  ) : (
                    <div className="text-center p-12 opacity-30 group-hover:opacity-100 transition-opacity">
                      <div className="text-7xl font-thin mb-4">＋</div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Chọn ảnh chân dung</p>
                    </div>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center z-40">
                      <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-6"></div>
                      <p className="text-[12px] font-black uppercase tracking-[0.8em] animate-pulse">Barber AI Drawing...</p>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-black text-xs italic shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">2</div>
                  <h4 className="text-[12px] font-black uppercase tracking-widest">Hành động AI</h4>
                </div>
                
                {activeTab === ConsultantTab.ADVICE ? (
                  <div className="flex flex-col gap-6">
                    <textarea 
                      placeholder="Mô tả phong cách mong muốn..."
                      className="w-full border-4 border-black p-6 text-sm font-bold uppercase focus:outline-none bg-white min-h-[160px] resize-none shadow-[6px_6px_0px_0px_rgba(0,0,0,0.05)]"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button 
                      disabled={loading}
                      onClick={handleAdvice}
                      className="bg-black text-white py-6 text-[13px] font-black uppercase tracking-[0.5em] hover:bg-white hover:text-black border-4 border-black transition-all shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-2 active:translate-x-2 disabled:opacity-20"
                    >
                      Xác Nhận Tư Vấn
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {STYLE_PRESETS.map(style => (
                      <button
                        key={style.id}
                        disabled={loading || !image}
                        onClick={() => handleSimulation(style.prompt)}
                        className="group relative border-4 border-black p-6 text-[11px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 active:translate-x-1"
                      >
                        {style.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white border-8 border-black p-12 min-h-[650px] flex flex-col shadow-[40px_40px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 border-[20px] border-black/5 rounded-full"></div>
            
            <h3 className="text-center text-[14px] font-black uppercase tracking-[1.2em] mb-16 pb-8 border-b-4 border-black italic">Studio Result</h3>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              {activeTab === ConsultantTab.SIMULATION && generatedImage ? (
                <div className="w-full space-y-12 animate-in zoom-in-95 duration-1000">
                  <div className="p-4 border-4 border-black bg-gray-50 shadow-2xl relative">
                    <img src={generatedImage} className="w-full border-2 border-black grayscale" alt="Result" />
                    <div className="absolute top-8 left-8 bg-black text-white px-4 py-1.5 text-[10px] font-black uppercase tracking-widest skew-x-[-12deg]">New Style</div>
                  </div>
                  <div className="text-center">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] italic mb-4">Mẫu phác thảo của bạn đã sẵn sàng</p>
                    <button className="text-[10px] font-black uppercase border-b-4 border-black pb-1 hover:opacity-40 transition-opacity">Lưu ảnh này</button>
                  </div>
                </div>
              ) : recommendation ? (
                <div className="w-full animate-in fade-in slide-in-from-bottom-12 duration-700">
                  <div className="text-9xl font-serif mb-12 opacity-5 text-black leading-none italic">“</div>
                  <div className="text-xl leading-loose font-bold uppercase tracking-tight italic border-l-[16px] border-black pl-12 mb-12 py-8 bg-gray-50">
                    {recommendation}
                  </div>
                  <div className="text-9xl font-serif text-right opacity-5 text-black leading-none italic">”</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-16 opacity-5 grayscale select-none">
                  <div className="w-56 h-56 border-[12px] border-black rotate-45 flex items-center justify-center">
                     <div className="-rotate-45 font-black text-8xl italic">AI</div>
                  </div>
                  <div className="space-y-6">
                    <p className="text-[20px] font-black uppercase tracking-[1em]">NO DATA</p>
                    <p className="text-[11px] uppercase font-bold max-w-[320px] leading-relaxed tracking-widest">
                      Hãy thực hiện đầy đủ Bước 1 và Bước 2 để chuyên gia AI của chúng tôi bắt đầu kiến tạo phong cách cho bạn.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-20 pt-12 border-t-4 border-black flex justify-between items-end opacity-40">
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Studio Engine: Gemini 3 Pro</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">Processing Resolution: 1024px</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-4 h-4 bg-black rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-black rounded-full opacity-50"></div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleConsultant;
