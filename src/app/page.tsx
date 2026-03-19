'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Send, MessageSquare, Loader2, Download } from 'lucide-react';

export default function ChatPage() {
  const { messages, append, sendMessage, status, error } = useChat() as any;
  const [chatInput, setChatInput] = useState('');
  const isLoading = status === 'submitted' || status === 'streaming';
  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageModel, setImageModel] = useState('dall-e-3');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{ prompt: string, url: string, model: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages or images update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, generatedImages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    
    // Use sendMessage or append based on what's available
    const send = sendMessage || append;
    if (send) {
      send({ role: 'user', content: chatInput });
      setChatInput('');
    }
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || isGeneratingImage) return;

    setIsGeneratingImage(true);
    const currentPrompt = imagePrompt;
    setImagePrompt('');

    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentPrompt, model: imageModel }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImages(prev => [...prev, { prompt: currentPrompt, url: data.url, model: imageModel }]);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.message || 'Failed to generate image';
      alert(`图片生成失败: ${errorMsg}\n请检查 API Key 或重试`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">AI</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Durable Gateway Runtime</h1>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              mode === 'chat' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare size={18} />
            <span className="text-sm font-medium">对话</span>
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              mode === 'image' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon size={18} />
            <span className="text-sm font-medium">绘图</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {mode === 'chat' && (
            <>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center mt-20 text-gray-400">
                  <MessageSquare size={48} className="mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-600">欢迎使用 Durable Gateway Runtime 对话</p>
                  <p className="text-sm mt-2">在下方输入你想问的问题，或者切换到“绘图”模式生成图片</p>
                </div>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white border text-gray-800 rounded-bl-none'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {m.parts?.map((part: any, index: number) => {
                          if (part.type === 'text') {
                            return <span key={index}>{part.text}</span>;
                          } else if (part.type === 'reasoning') {
                            return (
                              <div key={index} className="text-gray-500 italic text-sm mb-2 border-l-2 border-gray-300 pl-2">
                                {part.details}
                              </div>
                            );
                          }
                          return null;
                        })}
                        {/* Fallback for older formats if any */}
                        {!m.parts && (m.content || m.text)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {error && (
                <div className="flex justify-center mt-4">
                  <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-3 text-sm max-w-md text-center">
                    无法连接到 AI 服务。请检查网络代理设置或 API Key。<br/>
                    错误信息: {error.message}
                  </div>
                </div>
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border text-gray-800 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="animate-spin text-blue-500" size={18} />
                    <span className="text-sm text-gray-500">AI 正在思考...</span>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'image' && (
            <>
              {generatedImages.length === 0 && !isGeneratingImage ? (
                <div className="flex flex-col items-center justify-center h-full text-center mt-20 text-gray-400">
                  <ImageIcon size={48} className="mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-600">欢迎使用 AI 绘画功能</p>
                  <p className="text-sm mt-2">描述你想要生成的画面，AI 将为你绘制出来</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {generatedImages.map((img, index) => (
                    <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border">
                      <p className="text-gray-700 font-medium mb-4 pb-4 border-b">
                        <span className="text-purple-600 mr-2">Prompt:</span>
                        {img.prompt}
                      </p>
                      <div className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square max-w-xl mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={img.url} 
                          alt={img.prompt} 
                          className="w-full h-full object-cover"
                        />
                        <a 
                          href={img.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 backdrop-blur-sm"
                        >
                          <Download size={18} />
                          <span className="text-sm">下载大图</span>
                        </a>
                      </div>
                    </div>
                  ))}
                  {isGeneratingImage && (
                    <div className="bg-white rounded-2xl p-8 shadow-sm border flex flex-col items-center justify-center text-center space-y-4">
                      <Loader2 className="animate-spin text-purple-500" size={32} />
                      <div>
                        <p className="text-gray-800 font-medium">正在生成你的专属画作...</p>
                        <p className="text-sm text-gray-500 mt-1">这可能需要大约 10-20 秒钟的时间</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t p-4">
        <div className="max-w-3xl mx-auto">
          {mode === 'chat' ? (
            <form onSubmit={handleChatSubmit} className="relative flex items-center">
              <input
                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full py-4 pl-6 pr-14 text-gray-800 placeholder-gray-400 outline-none transition-all shadow-sm disabled:opacity-50"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isLoading ? "AI 正在回复..." : "发送消息..."}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !chatInput.trim()}
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleImageSubmit} className="relative flex items-center">
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                disabled={isGeneratingImage}
                className="absolute left-1 z-10 bg-white border border-gray-200 text-gray-700 text-sm rounded-full py-2 px-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
              >
                <option value="dall-e-3">DALL-E 3</option>
                <option value="stable-diffusion">Stable Diffusion</option>
                <option value="midjourney">Midjourney</option>
              </select>
              <input
                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-full py-4 pl-40 pr-14 text-gray-800 placeholder-gray-400 outline-none transition-all shadow-sm"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="描述你要生成的画面..."
                disabled={isGeneratingImage}
              />
              <button
                type="submit"
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="absolute right-2 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors flex items-center justify-center"
              >
                <ImageIcon size={18} />
              </button>
            </form>
          )}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-400">
              Durable Gateway Runtime - 基于 ChatGPT 和 DALL-E 3 构建的本地网页客户端
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}