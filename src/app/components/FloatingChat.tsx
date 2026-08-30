'use client';

// 1. 在文件顶部添加导入
import { UIMessage } from 'ai';
import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');

    // ✅ 1. 新版 useChat 解构：使用 status 替代 isLoading
    const { messages, sendMessage, status, error } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 自动滚动到底部
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // ✅ 2. 辅助函数：从新版 UIMessage 的 parts 数组中提取纯文本
    const getMessageText = (message: UIMessage) => {
        return message.parts
            ?.filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join('') || '';
    };

    // ✅ 3. 自定义提交处理函数
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && status !== 'streaming') {
            sendMessage({ text: input });
            setInput(''); // 发送后清空输入框
        }
    };

    // 判断是否正在加载 (streaming 表示正在接收 AI 回复)
    const isStreaming = status === 'streaming';

    return (
        <>
            {/* 1. 右下角悬浮按钮 */}
            <div className="fixed bottom-6 right-6 z-50">
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        aria-label="打开 AI 助手"
                    >
                        <MessageCircle size={28} />
                    </button>
                )}
            </div>

            {/* 2. 聊天窗口 (Modal) */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-300">

                    {/* Header: 深色顶栏 */}
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
                        <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-500 rounded-md">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm leading-tight">AI Document Assistant</h3>
                                <p className="text-xs text-gray-400">基于 Unitree 文档库</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-slate-800 rounded-md transition-colors text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* 消息列表区域 */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                                <Bot size={48} className="text-blue-200" />
                                <p className="text-sm">你好！我是 AI 文档助手。</p>
                                <p className="text-xs text-center max-w-[200px]">你可以问我关于 README.md 的内容，或者任何技术文档问题。</p>
                            </div>
                        )}

                        {messages.map((m) => {
                            // ✅ 4. 获取当前消息的文本内容
                            const textContent = getMessageText(m);

                            return (
                                <div
                                    key={m.id}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${m.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                            }`}
                                    >
                                        {m.role === 'assistant' ? (
                                            <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                                                <ReactMarkdown>{textContent}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="whitespace-pre-wrap">{textContent}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* ✅ 5. 使用 isStreaming 替代 isLoading */}
                        {isStreaming && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}

                        {/* 错误提示 */}
                        {error && (
                            <div className="text-center text-red-500 text-xs bg-red-50 p-2 rounded-lg">
                                出错了: {error.message}
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* ✅ 6. 底部输入框：使用自定义的 handleFormSubmit 和 setInput */}
                    <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-gray-100">
                        <div className="relative flex items-center">
                            <input
                                className="w-full pl-4 pr-12 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-400"
                                value={input}
                                placeholder="输入你的问题..."
                                onChange={(e) => setInput(e.target.value)}
                                disabled={isStreaming}
                            />
                            <button
                                type="submit"
                                disabled={isStreaming || !input.trim()}
                                className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-gray-400">AI 生成内容可能不准确，请以官方文档为准</p>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}