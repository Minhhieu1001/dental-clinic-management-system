import { useState, useRef, useEffect } from 'react';
import {
    Bot,
    X,
    Send,
    Sparkles,
    RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithAiAgent } from '../../services/ai.service';
import toast from 'react-hot-toast';

const INITIAL_MESSAGE = {
    id: 'welcome',
    sender: 'bot',
    text: 'Xin chào! Em là Trợ lý ảo AI của Nha khoa Crown Dental 🦷✨\n\nEm có thể hỗ trợ quý khách tra cứu bảng giá dịch vụ chuẩn xác, quy trình đặt lịch, chính sách bảo hành và trả góp 0%. Quý khách đang quan tâm đến dịch vụ nào ạ?',
    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
};

const SUGGESTIONS = [
    'Bảng giá trám răng',
    'Giá bọc răng sứ bao nhiêu?',
    'Quy trình đặt lịch khám',
    'Chính sách trả góp 0%',
    'Chính sách bảo hành dịch vụ'
];

export default function Chatbot({ isOpen, onClose }) {
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Lưu và lấy sessionId từ localStorage để duy trì mạch hội thoại
    const [sessionId, setSessionId] = useState(() => {
        let saved = localStorage.getItem('crown_ai_session_id');
        if (!saved) {
            saved = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
            localStorage.setItem('crown_ai_session_id', saved);
        }
        return saved;
    });

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 250);
        }
    }, [isOpen, messages]);

    // Xử lý gửi tin nhắn
    const handleSendMessage = async (textToSend) => {
        const text = (textToSend || inputMessage).trim();
        if (!text || isLoading) return;

        const userMsg = {
            id: 'user_' + Date.now(),
            sender: 'user',
            text,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const data = await chatWithAiAgent(text, sessionId);

            if (data?.sessionId && data.sessionId !== sessionId) {
                setSessionId(data.sessionId);
                localStorage.setItem('crown_ai_session_id', data.sessionId);
            }

            const botReply = {
                id: 'bot_' + Date.now(),
                sender: 'bot',
                text: data?.reply || 'Cảm ơn quý khách đã gửi câu hỏi. Hiện tại hệ thống đang được cập nhật, quý khách vui lòng liên hệ hotline phòng khám để được hỗ trợ nhanh nhất ạ!',
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            };

            setMessages(prev => [...prev, botReply]);
        } catch (error) {
            console.error('Lỗi gọi AI Chatbot:', error);
            const errorMsg = {
                id: 'bot_err_' + Date.now(),
                sender: 'bot',
                text: 'Dạ, kết nối đến máy chủ AI đang gặp gián đoạn tạm thời. Quý khách vui lòng thử lại sau vài giây hoặc liên hệ trực tiếp với phòng khám nhé!',
                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                isError: true
            };
            setMessages(prev => [...prev, errorMsg]);
            toast.error('Không thể kết nối đến Trợ lý AI. Vui lòng thử lại!');
        } finally {
            setIsLoading(false);
        }
    };

    // Làm mới cuộc trò chuyện
    const handleResetChat = () => {
        const newSession = 'session_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        setSessionId(newSession);
        localStorage.setItem('crown_ai_session_id', newSession);
        setMessages([INITIAL_MESSAGE]);
        toast.success('Đã làm mới phiên trò chuyện!');
    };

    // Format tin nhắn hiển thị xuống dòng và in đậm cơ bản
    const formatMessageText = (text) => {
        if (!text) return '';
        return text.split('\n').map((line, idx) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <span key={idx} className="block min-h-[1.25rem]">
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </span>
            );
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="crown-chatbot-window"
                    initial={{ opacity: 0, scale: 0.85, y: 35, transformOrigin: 'bottom right' }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{
                        opacity: 0,
                        scale: 0.82,
                        y: 35,
                        transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
                    }}
                    transition={{
                        type: 'spring',
                        damping: 24,
                        stiffness: 320
                    }}
                    className="fixed inset-x-2.5 bottom-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[400px] max-w-[calc(100vw-20px)] h-[520px] max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white shadow-sm select-none">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white">
                                <Bot className="w-6 h-6" />
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white"></span>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
                                    Trợ lý Crown Dental
                                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-normal">AI</span>
                                </div>
                                <div className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                                    Trực tuyến 24/7 • Báo giá tức thì
                                </div>
                            </div>
                        </div>

                        {/* Actions: Làm mới & Đóng */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleResetChat}
                                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
                                title="Làm mới cuộc trò chuyện"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
                                title="Đóng cửa sổ chat"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Body: Danh sách tin nhắn */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 text-slate-800 text-sm">
                        {messages.map((msg) => {
                            const isBot = msg.sender === 'bot';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                                >
                                    {isBot && (
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1f4fb2] text-white text-xs shadow-sm mt-0.5">
                                            <Bot className="w-4 h-4" />
                                        </div>
                                    )}

                                    <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} max-w-[82%]`}>
                                        <div
                                            className={`rounded-2xl px-3.5 py-2.5 shadow-sm text-[13px] leading-relaxed ${isBot
                                                ? msg.isError
                                                    ? 'bg-rose-50 text-rose-800 border border-rose-200 rounded-tl-sm'
                                                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                                                : 'bg-gradient-to-r from-[#1f4fb2] to-[#2563eb] text-white rounded-tr-sm shadow-blue-500/10'
                                                }`}
                                        >
                                            {formatMessageText(msg.text)}
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                                            {msg.time}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Trạng thái AI đang tra cứu */}
                        {isLoading && (
                            <div className="flex gap-2.5 justify-start items-center">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1f4fb2] text-white text-xs">
                                    <Bot className="w-4 h-4 animate-spin" />
                                </div>
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
                                    <span className="text-[11px] font-medium text-slate-500">Trợ lý AI đang tra cứu</span>
                                    <span className="flex gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#1f4fb2] animate-bounce"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#1f4fb2] animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#1f4fb2] animate-bounce [animation-delay:0.4s]"></span>
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Gợi ý câu hỏi nhanh (Quick Prompts) */}
                    {messages.length <= 3 && !isLoading && (
                        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý:
                            </span>
                            {SUGGESTIONS.map((item, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleSendMessage(item)}
                                    className="shrink-0 text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-[#1f4fb2] text-slate-600 px-2.5 py-1 rounded-full transition-colors border border-slate-200/60 cursor-pointer active:scale-95"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Footer: Nhập câu hỏi */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Nhập câu hỏi (giá trám răng, đặt lịch, bảo hành...)"
                            disabled={isLoading}
                            className="flex-1 text-[13px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1f4fb2] focus:bg-white transition-all disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || isLoading}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#1f4fb2] to-[#00a859] text-white shadow-md transition-all hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                            title="Gửi câu hỏi"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
