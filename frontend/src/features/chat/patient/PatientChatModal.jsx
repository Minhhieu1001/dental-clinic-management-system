import ChatImageButton from '../components/ChatImageButton';
import ChatMessageContent from '../components/ChatMessageContent';
import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  Phone,
  Building2,
  Sparkles,
  Headphones,
  Check,
  CheckCheck,
  Image as ImageIcon,
  ChevronDown,
  Clock,
  ShieldCheck,
  RotateCcw,
  Bot
} from 'lucide-react';
import toast from 'react-hot-toast';
import { chatService } from '../../../services/chat.service';
import { useChatWebSocket } from '../../../hooks/useWebSocket';
import { useAuth } from '../../../hooks/useAuth';

const BRANCH_OPTIONS = [
  { id: 'BR-01', name: 'Crown Dental Phố Huế - Hà Nội', phone: '024 3822 8059' },
  { id: 'BR-02', name: 'Crown Dental Quận 1 - TP. Hồ Chí Minh', phone: '028 3930 1111' },
  { id: 'BR-03', name: 'Crown Dental Tân Bình - TP. Hồ Chí Minh', phone: '028 3810 2222' },
];

const PATIENT_FAQ_SUGGESTIONS = [
  'Dạ em muốn tư vấn chi phí nhổ răng khôn ạ?',
  'Chi phí niềng răng trong suốt khoảng bao nhiêu ạ?',
  'Cho em hỏi đặt lịch khám tổng quát vào ngày mai có được không ạ?',
  'Răng em bị ê buốt khi uống nước lạnh thì điều trị như thế nào?',
];

export default function PatientChatModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState(BRANCH_OPTIONS[0]);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const patientId = user?.patientId || user?.id || 'p-current';
  const patientName = user?.fullName || user?.username || 'Bệnh nhân';

  // Khởi tạo hoặc lấy phòng chat với chi nhánh được chọn
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    chatService
      .getOrCreateRoom(patientId, selectedBranch.id)
      .then((activeRoom) => {
        if (!isMounted) return;
        setRoom(activeRoom);
        return chatService.getMessagesByRoom(activeRoom.id);
      })
      .then((msgs) => {
        if (isMounted && msgs) {
          setMessages(msgs);
        }
      })
      .catch((err) => {
        console.error('Lỗi khởi tạo chat:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedBranch.id, patientId]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useChatWebSocket(isOpen ? room?.id : null, null, (message) => {
    if (!message?.id) return;
    setMessages((prev) => prev.some((m) => m.id === message.id)
      ? prev.map((m) => m.id === message.id ? message : m) : [...prev, message]);
  });

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend = null) => {
    const content = (typeof textToSend === 'string' ? textToSend : inputMessage).trim();
    if (!content || !room?.id || sending) return;

    setSending(true);
    try {
      const payload = {
        roomId: room.id,
        content,
        senderType: 'PATIENT',
        messageType: 'TEXT',
      };

      const newMsg = await chatService.sendMessage(payload);
      setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setInputMessage('');
      inputRef.current?.focus();

      // Giả lập nhân viên phản hồi tự động nếu là tin nhắn đầu tiên
      setTimeout(() => {
        const autoReply = {
          id: `reply-${Date.now()}`,
          chatRoomId: room.id,
          senderType: 'EMPLOYEE',
          messageType: 'TEXT',
          senderEmployeeName: `CSKH ${selectedBranch.name}`,
          content: `Cảm ơn bạn ${patientName} đã gửi câu hỏi. Chuyên viên tư vấn của ${selectedBranch.name} đang xem xét và sẽ phản hồi bạn ngay trong giây lát!`,
          isRead: true,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, autoReply]);
      }, 1500);
    } catch (err) {
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
      {/* Modal Dialog Container */}
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px] max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Headphones size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate leading-tight">
                  Tư Vấn & Hỗ Trợ Khách Hàng
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Trực tuyến
                </span>
              </div>

              {/* Branch Selector Dropdown */}
              <div className="flex items-center gap-1 mt-0.5">
                <Building2 size={11} className="text-teal-200 shrink-0" />
                <select
                  value={selectedBranch.id}
                  onChange={(e) => {
                    const b = BRANCH_OPTIONS.find((x) => x.id === e.target.value);
                    if (b) setSelectedBranch(b);
                  }}
                  className="bg-transparent text-teal-100 text-[11px] font-medium outline-none cursor-pointer hover:text-white"
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id} className="text-slate-800 bg-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X size={19} />
          </button>
        </div>

        {/* Emergency Hotline Strip */}
        <div className="bg-amber-50/90 border-b border-amber-200/70 px-4 py-2 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-amber-900 font-medium">
            <Phone size={13} className="text-amber-700" />
            <span>Cần trợ giúp khẩn cấp?</span>
          </div>
          <a
            href="tel:19001234"
            className="font-bold font-mono text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs"
          >
            Hotline: 1900 1234 (Miễn phí)
          </a>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {/* Welcome Card */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 border border-teal-200/80 rounded-xl p-3.5 text-xs text-slate-700 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-teal-900 mb-1">
              <Sparkles size={14} className="text-teal-700" />
              <span>Chào mừng bạn đến với Phòng khám Nha khoa Crown Dental!</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Bạn đang kết nối trực tiếp với đội ngũ tư vấn viên của chi nhánh{' '}
              <strong>{selectedBranch.name}</strong>. Hãy gửi câu hỏi hoặc chọn các chủ đề gợi ý bên dưới để được giải đáp nhanh nhất.
            </p>
          </div>

          {/* Messages list */}
          {messages.map((m) => {
            if (m.senderType === 'SYSTEM') {
              return (
                <div key={m.id} className="text-center my-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
                    {m.content}
                  </span>
                </div>
              );
            }

            const isMe = m.senderType === 'PATIENT';

            return (
              <div
                key={m.id}
                className={`group/message flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="h-7 w-7 rounded-full bg-teal-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                    CD
                  </div>
                )}

                <div
                  className={m.messageType === 'IMAGE' ? 'max-w-[80%] sm:max-w-md text-xs text-slate-800' : `max-w-[80%] sm:max-w-md rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                    isMe
                      ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {!isMe && m.senderEmployeeName && (
                    <span className="text-[10px] font-bold text-teal-800 block mb-0.5">
                      {m.senderEmployeeName}
                    </span>
                  )}
                  <ChatMessageContent message={m} canRecall={m.senderType === 'PATIENT' && m.senderPatientId === patientId}
                    onRecalled={(updated) => setMessages((prev) => prev.map((item) => item.id === updated.id ? updated : item))} />
                  <div
                    className={`flex items-center justify-end gap-1 text-[9.5px] mt-1 ${
                      m.messageType === 'IMAGE' ? 'text-slate-500' : isMe ? 'text-teal-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatMessageTime(m.createdAt)}</span>
                    {isMe && (
                      <span>
                        {m.isRead ? (
                          <CheckCheck size={12} className={m.messageType === 'IMAGE' ? 'text-teal-600' : 'text-emerald-300'} />
                        ) : (
                          <Check size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {isMe && (
                  <div className="h-7 w-7 rounded-full bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {patientName.charAt(0)}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Chips */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1 shrink-0 pl-1">
            <Sparkles size={12} /> Câu hỏi gợi ý:
          </span>
          {PATIENT_FAQ_SUGGESTIONS.map((faq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(faq)}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 text-[11px] font-semibold border border-slate-200/80 transition-colors cursor-pointer shrink-0"
            >
              {faq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <ChatImageButton key={room?.id || 'no-room'} roomId={room?.id}
                senderType="PATIENT" senderId={patientId} disabled={sending}
                onSent={(message) => setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message])} />

            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi hoặc mô tả tình trạng răng cần tư vấn..."
              className="flex-1 bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white border border-transparent focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || sending}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all cursor-pointer ${
                inputMessage.trim() && !sending
                  ? 'bg-teal-700 hover:bg-teal-800 active:scale-95'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <Send size={14} />
              <span className="hidden sm:inline">Gửi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
