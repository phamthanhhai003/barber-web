
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

const STYLE_PRESETS = [
  { id: 'buzz', name: 'Buzz Cut', prompt: 'Chỉnh sửa ảnh để người trong ảnh có kiểu tóc Buzz Cut (cắt cua) cực ngắn, nam tính, phong cách lính thủy đánh bộ.' },
  { id: 'undercut', name: 'Undercut', prompt: 'Chỉnh sửa ảnh để người trong ảnh có kiểu tóc Undercut, hai bên cạo sát, phần trên vuốt ngược ra sau bóng mượt.' },
  { id: 'korean_sidepart', name: 'Side Part Hàn Quốc', prompt: 'Chỉnh sửa ảnh để người trong ảnh có kiểu tóc Side Part phong cách Hàn Quốc, tóc rủ tự nhiên, có độ phồng nhẹ, trông lãng tử và trẻ trung.' },
  { id: 'sidepart', name: 'Side Part', prompt: 'Chỉnh sửa ảnh để người trong ảnh có kiểu tóc Side Part 7/3 cổ điển, lịch lãm, phù hợp quý ông.' },
  { id: 'mullet', name: 'Mullet', prompt: 'Chỉnh sửa ảnh để người trong ảnh có kiểu tóc Mullet hiện đại, phần gáy dài sành điệu, phong cách nghệ sĩ.' },
  { id: 'mohawk', name: 'Mohawk', prompt: 'Chỉnh sửa ảnh để người trong ảnh có kiểu tóc Mohawk phá cách, dựng đứng ở giữa, hai bên cạo trắng.' }
];

enum ConsultantTab {
  SIMULATION = 'simulation',
  ADVICE = 'advice'
}

const StyleConsultant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ConsultantTab>(ConsultantTab.SIMULATION);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState('');
  const [suggestedStyles, setSuggestedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setGeneratedImage(null);
        setRecommendation('');
        setSuggestedStyles([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const runSimulation = async (styleName: string) => {
    if (!image) return;
    setLoading(true);
    setGeneratedImage(null);
    setActiveTab(ConsultantTab.SIMULATION); // Chuyển về tab mô phỏng để người dùng thấy kết quả ảnh

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const base64Data = image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/png' } },
            { text: `Chỉnh sửa ảnh chân dung này. Áp dụng kiểu tóc "${styleName}" lên khuôn mặt người trong ảnh một cách tự nhiên và sành điệu nhất.` }
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
        }
      }
    } catch (error) {
      console.error("Simulation Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAI = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!image && !finalPrompt.trim()) return;
    
    setLoading(true);
    setRecommendation('');
    setGeneratedImage(null);
    setSuggestedStyles([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const base64Data = image ? image.split(',')[1] : null;

      if (activeTab === ConsultantTab.SIMULATION) {
        if (!image) {
          setRecommendation("Vui lòng tải ảnh lên để thực hiện mô phỏng.");
          setLoading(false);
          return;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: base64Data!, mimeType: 'image/png' } },
              { text: `${finalPrompt}. Hãy tạo ra một hình ảnh mới dựa trên khuôn mặt này nhưng với kiểu tóc đã yêu cầu.` }
            ],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
          } else if (part.text) {
            setRecommendation(prev => prev + part.text);
          }
        }
      } else {
        // TAB 2: DEEP CONSULTATION
        const parts: any[] = [
          { text: "Bạn là chuyên gia tư vấn tóc. Hãy phân tích khuôn mặt khách hàng và đưa ra lời khuyên. QUAN TRỌNG: Ở cuối câu trả lời, hãy liệt kê tối đa 3 kiểu tóc phù hợp nhất theo định dạng: [TAGS: Tên kiểu 1, Tên kiểu 2, Tên kiểu 3]. Đừng quên phần [TAGS: ...] này vì nó giúp hệ thống tạo nút bấm cho người dùng." }
        ];

        if (image) {
          parts.push({ inlineData: { data: base64Data!, mimeType: 'image/png' } });
        }
        if (finalPrompt) {
          parts.push({ text: "Yêu cầu bổ sung của khách: " + finalPrompt });
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: { parts },
          config: {
            systemInstruction: "Bạn là Stylist Gâu Barber. Trả lời sành điệu, chuyên nghiệp.",
          }
        });

        const fullText = response.text || '';
        
        // Trích xuất tags
        const tagMatch = fullText.match(/\[TAGS:\s*(.*?)\]/);
        if (tagMatch && tagMatch[1]) {
          const tags = tagMatch[1].split(',').map(t => t.trim());
          setSuggestedStyles(tags);
          // Loại bỏ phần tag khỏi text hiển thị cho đẹp
          setRecommendation(fullText.replace(/\[TAGS:.*?\]/, '').trim());
        } else {
          setRecommendation(fullText);
        }
      }
    } catch (error) {
      console.error("Gemini Error:", error);
      setRecommendation('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setGeneratedImage(null);
    setRecommendation('');
    setSuggestedStyles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="border-t-2 border-dashed border-black pt-12 mt-12">
      <div className="max-w-3xl mx-auto border border-black bg-white relative">
        <div className="absolute top-0 right-0 bg-black text-white text-[9px] uppercase tracking-widest px-3 py-1 font-bold z-10">
          AI BARBER STUDIO
        </div>

        <div className="flex border-b border-black">
          <button
            onClick={() => { setActiveTab(ConsultantTab.SIMULATION); setRecommendation(''); setGeneratedImage(null); setSuggestedStyles([]); }}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === ConsultantTab.SIMULATION ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            Mô Phỏng Kiểu Tóc
          </button>
          <button
            onClick={() => { setActiveTab(ConsultantTab.ADVICE); setRecommendation(''); setGeneratedImage(null); setSuggestedStyles([]); }}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${activeTab === ConsultantTab.ADVICE ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            Tư Vấn Chuyên Sâu
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="animate-in fade-in duration-300">
            <h3 className="text-lg font-black uppercase mb-2">
              {activeTab === ConsultantTab.SIMULATION ? 'Thử Tóc Ảo' : 'Phân Tích Đặc Điểm'}
            </h3>
            <p className="text-[10px] opacity-60 mb-6 uppercase tracking-wider">
              {activeTab === ConsultantTab.SIMULATION 
                ? 'Tải ảnh và chọn kiểu tóc để AI mô phỏng diện mạo mới.' 
                : 'AI phân tích khuôn mặt để đưa ra lựa chọn hoàn hảo nhất.'}
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 p-2 min-h-[250px] relative group bg-gray-50/30">
                {image ? (
                  <div className="relative w-full h-full overflow-hidden">
                    <img src={image} alt="Original" className="w-full h-64 object-cover border border-black grayscale-[30%]" />
                    <p className="absolute bottom-1 left-1 bg-black text-white text-[8px] px-2 py-0.5 uppercase">Ảnh của bạn</p>
                    <button onClick={clearImage} className="absolute top-1 right-1 bg-black text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current?.click()} className="text-[10px] uppercase font-bold opacity-40 hover:opacity-100 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border border-black flex items-center justify-center">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/></svg>
                    </div>
                    Tải ảnh chân dung
                  </button>
                )}
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-black p-2 min-h-[250px] relative bg-black/5">
                {generatedImage ? (
                  <div className="relative w-full h-full">
                    <img src={generatedImage} alt="AI Result" className="w-full h-64 object-cover border border-black" />
                    <p className="absolute bottom-1 left-1 bg-black text-white text-[8px] px-2 py-0.5 uppercase animate-pulse">Kết quả mô phỏng</p>
                  </div>
                ) : (
                  <div className="text-center px-6">
                    {loading ? (
                      <div className="space-y-4">
                        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-[10px] uppercase font-black tracking-widest animate-pulse">Barber AI Đang xử lý...</p>
                      </div>
                    ) : (
                      <p className="text-[9px] uppercase tracking-widest opacity-30">
                        {activeTab === ConsultantTab.SIMULATION 
                          ? 'Ảnh mô phỏng sẽ xuất hiện tại đây' 
                          : 'Hãy gửi ảnh để nhận phân tích chuyên sâu'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {activeTab === ConsultantTab.SIMULATION && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => processAI(style.prompt)}
                      disabled={loading || !image}
                      className="px-4 py-2 border border-black text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-20"
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input 
                  type="text"
                  className="flex-1 border border-black px-4 py-4 text-xs font-medium focus:outline-none placeholder-gray-400"
                  placeholder={activeTab === ConsultantTab.SIMULATION ? "Mô tả kiểu tóc khác bạn muốn..." : "Nói thêm về phong cách của bạn (văn phòng, nghệ thuật...)"}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && processAI()}
                />
                <button 
                  onClick={() => processAI()}
                  disabled={loading || (!prompt.trim() && !image)}
                  className="bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {activeTab === ConsultantTab.SIMULATION ? 'Thử Ngay' : 'Phân Tích'}
                </button>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>

          {recommendation && (
            <div className="mt-8 p-8 bg-black text-white animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Kết quả từ Chuyên Gia AI</h4>
              </div>
              <p className="text-sm leading-relaxed font-light opacity-90 whitespace-pre-wrap mb-6">{recommendation}</p>
              
              {suggestedStyles.length > 0 && (
                <div className="pt-6 border-t border-white/20">
                  <p className="text-[9px] uppercase tracking-widest opacity-60 mb-3">Thử ngay các kiểu tóc được gợi ý:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedStyles.map((style, idx) => (
                      <button
                        key={idx}
                        onClick={() => runSimulation(style)}
                        disabled={loading || !image}
                        className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-30"
                      >
                        Mô phỏng: {style}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleConsultant;
