import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { HfInference } from '@huggingface/inference';

// Khởi tạo Hugging Face (Dùng cho tạo ảnh)
// Lưu ý: Trong thực tế hãy dùng process.env.REACT_APP_HF_API_KEY
const hf = new HfInference(process.env.REACT_APP_HF_API_KEY); 

const STYLE_PRESETS = [
  { id: 'buzz', name: 'Buzz Cut', prompt: 'Very short buzz cut, high skin fade on sides, clean buzzed top, sharp hairline, high contrast black and white photography.' },
  { id: 'undercut', name: 'Undercut', prompt: 'Modern slicked back undercut, sharp shaved sides, long textured top, professional hair studio style, black and white.' },
  { id: 'pompadour', name: 'Pompadour', prompt: 'Classic pompadour hairstyle, high volume top, tapered sides, clean grooming, high contrast black and white.' },
  { id: 'mullet', name: 'Modern Mullet', prompt: 'Modern wolf cut mullet, short messy top, long back, edgy editorial style, black and white portrait.' }
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
        setRecommendation('');
        setErrorStatus(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- PHẦN SỬA CHÍNH: SIMULATION SỬ DỤNG HUGGING FACE ---
  const handleSimulation = async (stylePrompt: string) => {
    if (!image) {
      setErrorStatus("VUI LÒNG TẢI ẢNH CHÂN DUNG CỦA BẠN LÊN TRƯỚC.");
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    setGeneratedImage(null);

    try {
      // 1. Chuyển đổi base64 sang Blob
      const responseImg = await fetch(image);
      const blob = await responseImg.blob();

      // 2. Gọi model Stable Diffusion (Image-to-Image)
      // Model gợi ý: 'runwayml/stable-diffusion-v1-5' là model ổn định và miễn phí
      const result = await hf.imageToImage({
        model: 'CompVis/stable-diffusion-v-1-4-original',
        inputs: blob,
        parameters: {
          prompt: `A professional black and white studio portrait of a man, ${stylePrompt}, hyper-realistic hair, cinematic lighting, 8k resolution`,
          negative_prompt: "color, blurry, low quality, distorted face, extra fingers, cartoon",
          strength: 0.55, // 0.55 giúp giữ lại nét mặt gốc nhưng thay đổi được tóc
          guidance_scale: 7.5,
        },
      });

      // 3. Chuyển kết quả Blob thành URL để hiển thị
      const imageUrl = URL.createObjectURL(result);
      setGeneratedImage(imageUrl);
    } catch (error: any) {
      console.error("Simulation error:", error);
      setErrorStatus(`LỖI GEN ẢNH: Model đang khởi động hoặc quá tải. Hãy đợi 30 giây rồi thử lại.`);
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
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const parts: any[] = [
        { text: "Bạn là Giám đốc Sáng tạo kiểu tóc tại Barber B&W Studio. Hãy phân tích ảnh khuôn mặt và yêu cầu của khách hàng. Trả lời bằng tiếng Việt theo phong cách chuyên nghiệp, lịch lãm. Nội dung tư vấn cần có chiều sâu bao gồm: 1. Nhận xét về cấu trúc khuôn mặt. 2. Kiểu tóc đề xuất cụ thể. 3. Gợi ý sản phẩm tạo kiểu. Giữ câu trả lời súc tích trong khoảng 100-150 chữ." }
      ];

      if (image) parts.push({ inlineData: { data: image.split(',')[1], mimeType: 'image/png' } });
      if (prompt) parts.push({ text: prompt });

      const result = await model.generateContent({ contents: [{ role: "user", parts }] });
      const response = await result.response;
      setRecommendation(response.text());
    } catch (error: any) {
      console.error("Advice error:", error);
      setErrorStatus("AI đang bận, vui lòng thử lại sau giây lát.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-24 border-t-2 border-black/10 pt-20 mb-32 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter">B&W AI Studio</h2>
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-40">Kiến tạo phong cách cá nhân bằng trí tuệ nhân tạo</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left: Input Panel */}
          <div className="w-full lg:w-1/3 space-y-8">
            <div 
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`aspect-square border-2 border-black relative overflow-hidden cursor-pointer transition-all hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] bg-gray-50 group ${image ? 'border-solid' : 'border-dashed opacity-60'}`}
            >
              {image ? (
                <img src={image} className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-700" alt="Source" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-4xl mb-2">＋</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Tải ảnh chân dung</span>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white">
                  <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] animate-pulse">Đang xử lý ảnh...</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />

            <div className="border-2 border-black p-1 flex bg-white">
              <button 
                onClick={() => setActiveTab(ConsultantTab.ADVICE)}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === ConsultantTab.ADVICE ? 'bg-black text-white' : 'opacity-40 hover:opacity-100'}`}
              >
                Tư vấn chuyên sâu
              </button>
              <button 
                onClick={() => setActiveTab(ConsultantTab.SIMULATION)}
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === ConsultantTab.SIMULATION ? 'bg-black text-white' : 'opacity-40 hover:opacity-100'}`}
              >
                Mô phỏng tóc
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === ConsultantTab.ADVICE ? (
                <div className="space-y-4">
                  <textarea 
                    placeholder="Mô tả phong cách bạn yêu thích..."
                    className="w-full border-2 border-black p-4 text-xs font-bold uppercase focus:outline-none bg-gray-50 min-h-[120px] resize-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                  <button 
                    disabled={loading || (!image && !prompt)}
                    onClick={handleAdvice}
                    className="w-full bg-black text-white py-4 text-[11px] font-black uppercase tracking-[0.4em] hover:invert transition-all disabled:opacity-20"
                  >
                    Gửi yêu cầu
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {STYLE_PRESETS.map(style => (
                    <button
                      key={style.id}
                      disabled={loading || !image}
                      onClick={() => handleSimulation(style.prompt)}
                      className="border-2 border-black p-3 text-[9px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all disabled:opacity-20 text-center"
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {errorStatus && (
              <div className="p-4 bg-red-50 border-2 border-red-200 text-red-600 text-[9px] font-black uppercase">
                {errorStatus}
              </div>
            )}
          </div>

          {/* Right: Display Panel */}
          <div className="flex-1 w-full bg-white border-2 border-black p-8 md:p-12 min-h-[500px] flex flex-col shadow-[20px_20px_0px_0px_rgba(0,0,0,0.05)] relative">
            <div className="flex items-center justify-between mb-12 opacity-20">
              <span className="text-[8px] font-black uppercase tracking-[0.5em]">Studio Report v4.2</span>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {activeTab === ConsultantTab.SIMULATION && generatedImage ? (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
                  <div className="border-2 border-black p-2 bg-gray-100 shadow-xl">
                    <img src={generatedImage} className="w-full grayscale border border-black/10" alt="Result" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest italic opacity-40">Mô phỏng thực tế ảo</p>
                    <a href={generatedImage} download="my-new-style.png" className="text-[9px] font-black uppercase border-b-2 border-black hover:opacity-50 transition-opacity">Tải xuống ảnh</a>
                  </div>
                </div>
              ) : recommendation ? (
                <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-black uppercase tracking-tighter border-b-4 border-black inline-block pb-1">Lời khuyên chuyên gia</h3>
                    <div className="text-sm md:text-base font-medium leading-relaxed uppercase tracking-tight space-y-4 whitespace-pre-wrap">
                      {recommendation}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center opacity-10 select-none space-y-8 py-20">
                  <div className="w-32 h-32 border-4 border-black rounded-full flex items-center justify-center rotate-12">
                     <span className="font-black text-4xl italic">B&W</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-[1em]">Awaiting</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest">Dữ liệu đang được chờ xử lý</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-between items-end opacity-20">
              <div className="text-[8px] font-black uppercase leading-loose">
                Design by B&W<br/>
                Powered by Hugging Face & Gemini
              </div>
              <div className="text-4xl font-black italic tracking-tighter">AI.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleConsultant;