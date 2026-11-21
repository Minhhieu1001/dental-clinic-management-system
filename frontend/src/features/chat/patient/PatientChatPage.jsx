import ChatImageButton from '../components/ChatImageButton';
import ChatMessageContent from '../components/ChatMessageContent';
import ChatStickerModal from '../components/ChatStickerModal';
import { isDifferentDay, formatMessageDateDivider } from '../utils/chatDateUtils';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Building2,
  Sparkles,
  Headphones,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Phone,
  Calendar,
  Clock,
  Search,
  ChevronLeft,
  MapPin,
  MessageSquare,
  RefreshCw,
  Smile
} from 'lucide-react';
import toast from 'react-hot-toast';
import { chatService } from '../../../services/chat.service';
import { getBranches } from '../../../services/clinic.service';
import { useAuth } from '../../../hooks/useAuth';
import { useChatWebSocket } from '../../../hooks/useWebSocket';

const PATIENT_FAQ_SUGGESTIONS = [
  'Dạ em muốn tư vấn chi phí nhổ răng khôn ạ?',
  'Chi phí niềng răng trong suốt khoảng bao nhiêu ạ?',
  'Cho em hỏi đặt lịch khám tổng quát vào ngày mai có được không ạ?',
  'Răng em bị ê buốt khi uống nước lạnh thì điều trị như thế nào?',
  'Quy trình bọc răng sứ thẩm mỹ mất bao lâu?',
];

export default function PatientChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patientRooms, setPatientRooms] = useState([]);
  const roomRequestRef = useRef(0);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [searchBranch, setSearchBranch] = useState('');
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Lấy chính xác dữ liệu từ 1 nguồn duy nhất, không dùng || dự phòng
  const patientId = user?.patientId;
  const patientName = user?.fullName;

  const refreshPatientRooms = useCallback(async () => {
    if (!patientId) return;
    const requestId = ++roomRequestRef.current;
    try {
      const data = await chatService.getRoomsByPatient(patientId);
      if (requestId === roomRequestRef.current) setPatientRooms(data);
    } catch (error) {
      console.error('Failed to refresh patient rooms:', error);
    }
  }, [patientId]);

  const isChatVisible = useCallback(() => !document.hidden
    && (window.matchMedia('(min-width: 768px)').matches || showMobileChat), [showMobileChat]);

  useEffect(() => {
    const syncRead = async () => {
      try {
        if (room?.id && room.branchId === selectedBranch?.branchId && isChatVisible()) {
          await chatService.markAsRead(room.id, 'PATIENT');
        }
        await refreshPatientRooms();
      } catch (error) {
        console.error('Failed to mark chat read:', error);
      }
    };
    syncRead();
    document.addEventListener('visibilitychange', syncRead);
    window.addEventListener('resize', syncRead);
    return () => {
      document.removeEventListener('visibilitychange', syncRead);
      window.removeEventListener('resize', syncRead);
    };
  }, [room?.id, room?.branchId, selectedBranch?.branchId, isChatVisible, refreshPatientRooms]);

  // 1. Tải danh sách chi nhánh thực tế từ database
  const loadBranches = async () => {
    try {
      setLoadingBranches(true);
      const data = await getBranches();
      if (Array.isArray(data) && data.length > 0) {
        setBranches(data);
        if (!selectedBranch) {
          setSelectedBranch(data[0]);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách chi nhánh:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  // 2. Tải/Khởi tạo phòng chat và lịch sử tin nhắn
  const initChatRoom = async (branch) => {
    if (!branch?.branchId) return;

    try {
      setLoading(true);
      const activeRoom = await chatService.getOrCreateRoom(patientId, branch.branchId);
      if (activeRoom) {
        setRoom(activeRoom);
        const msgs = await chatService.getMessagesByRoom(activeRoom.id);
        setMessages(Array.isArray(msgs) ? msgs : []);
      }
    } catch (err) {
      console.error('Lỗi khởi tạo phòng chat:', err);
      toast.error('Không thể kết nối tới phòng chat của chi nhánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranch?.branchId) {
      initChatRoom(selectedBranch);
    }
  }, [selectedBranch?.branchId, patientId]);

  // 3. Đăng ký nhận tin nhắn Realtime qua WebSocket STOMP (Bỏ hoàn toàn cơ chế Polling setInterval)
  useChatWebSocket(room?.id, null, (newMsg) => {
    if (!newMsg?.id) return;
    setMessages((prev) => prev.some((m) => m.id === newMsg.id)
      ? prev.map((m) => m.id === newMsg.id ? newMsg : m) : [...prev, newMsg]);
  }, async (newMsg) => {
    try {
      if (newMsg.chatRoomId === room?.id && room?.branchId === selectedBranch?.branchId
        && newMsg.senderType === 'EMPLOYEE' && isChatVisible()) {
        await chatService.markAsRead(room.id, 'PATIENT');
      }
      await refreshPatientRooms();
    } catch (error) {
      console.error('Failed to refresh patient chat:', error);
    }
  }, patientId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Tải lại tin nhắn của phòng hiện tại
  const handleReloadMessages = async () => {
    if (!room?.id) return;
    try {
      setLoading(true);
      const msgs = await chatService.getMessagesByRoom(room.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
      toast.success('Đã làm mới tin nhắn');
    } catch (err) {
      toast.error('Không thể làm mới tin nhắn.');
    } finally {
      setLoading(false);
    }
  };

  // Gửi tin nhắn dạng văn bản (TEXT) lưu vào Database
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
        senderPatientId: patientId,
      };

      const newMsg = await chatService.sendMessage(payload);
      if (newMsg) {
        setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      }
      setInputMessage('');
      inputRef.current?.focus();
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
      toast.error('Không thể gửi tin nhắn qua máy chủ. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  // Gửi sticker nha khoa
  const handleSendSticker = async (stickerUrl) => {
    if (!stickerUrl || !room?.id || sending) return;

    setSending(true);
    try {
      const payload = {
        roomId: room.id,
        content: stickerUrl,
        senderType: 'PATIENT',
        messageType: 'STICKER',
        senderPatientId: patientId,
      };

      const newMsg = await chatService.sendMessage(payload);
      if (newMsg) {
        setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      }
    } catch (err) {
      console.error('Lỗi gửi sticker:', err);
      toast.error('Không thể gửi sticker. Vui lòng thử lại!');
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

  const filteredBranches = branches.filter((b) => {
    const name = b.branchName ? b.branchName.toLowerCase() : '';
    const addr = b.address ? b.address.toLowerCase() : '';
    const q = searchBranch.toLowerCase();
    return name.includes(q) || addr.includes(q);
  });

  return (
    <div className="h-[calc(100vh-130px)] min-h-[580px] flex flex-col md:flex-row bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* CỘT TRÁI: DANH SÁCH CHI NHÁNH PHÒNG KHÁM */}
      <div
        className={`${showMobileChat ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-88 flex-col border-r border-slate-200 bg-slate-50/70 shrink-0`}
      >
        <div className="p-3.5 bg-white border-b border-slate-200/90">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0">
                <Headphones size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Tư vấn trực tuyến</h2>
                <p className="text-[11px] text-slate-500 font-medium">Chọn chi nhánh để kết nối</p>
              </div>
            </div>

            {/* Nút làm mới danh sách chi nhánh */}
            <button
              type="button"
              onClick={loadBranches}
              className="flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100/80 px-2 py-1 rounded-lg border border-teal-200 transition-colors cursor-pointer"
              title="Làm mới danh sách chi nhánh"
            >
              <RefreshCw size={12} className={loadingBranches ? 'animate-spin' : ''} />
              <span className="font-semibold">Làm mới</span>
            </button>
          </div>

          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchBranch}
              onChange={(e) => setSearchBranch(e.target.value)}
              placeholder="Tìm kiếm chi nhánh..."
              className="w-full bg-slate-100 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:bg-white border border-transparent focus:border-teal-600 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <p className="px-2 pt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Chi nhánh phòng khám ({filteredBranches.length})
          </p>

          {filteredBranches.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Đang tải danh sách chi nhánh từ máy chủ...
            </div>
          ) : (
            filteredBranches.map((branch) => {
              const isSelected = selectedBranch?.branchId === branch.branchId;
              const branchRoom = patientRooms.find((item) => item.branchId === branch.branchId);
              const unreadCount = branchRoom?.patientUnreadCount || 0;

              return (
                <div
                  key={branch.branchId}
                  onClick={() => {
                    setSelectedBranch(branch);
                    setShowMobileChat(true);
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${isSelected
                    ? 'bg-gradient-to-r from-teal-50/95 to-emerald-50/80 border-2 border-teal-600 shadow-md ring-2 ring-teal-600/25'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span
                      className={`text-xs font-bold leading-tight ${isSelected ? 'text-teal-950 font-extrabold' : 'text-slate-800'
                        }`}
                    >
                      {branch.branchName}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {unreadCount > 0 && (
                        <span
                          className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold shadow-2xs"
                          aria-label={`${unreadCount} tin nhắn chưa đọc`}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}

                      {/* Huy hiệu nổi bật khi chi nhánh đang được chọn */}
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] font-extrabold text-white bg-teal-700 px-2 py-0.5 rounded-full shadow-2xs">
                          <Check size={11} strokeWidth={3} /> Đang chọn
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-1 text-[11px] text-slate-500 mb-1.5">
                    <MapPin size={12} className={`shrink-0 mt-0.5 ${isSelected ? 'text-teal-700' : 'text-slate-400'}`} />
                    <span className="line-clamp-1">{branch.address}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <Phone size={11} className={isSelected ? 'text-teal-700' : 'text-slate-400'} />
                      {branch.phoneNumber}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-white border-t border-slate-200/80 space-y-2 shrink-0">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/70 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-bold text-teal-900 uppercase">Tổng đài hỗ trợ 24/7</p>
              <p className="text-xs font-extrabold text-teal-800 tracking-wide">1900 1234</p>
            </div>
            <a
              href="tel:19001234"
              className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Phone size={12} /> Gọi ngay
            </a>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span>Giờ mở cửa: 08:00 – 20:00 (Cả T7 & CN)</span>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: KHUNG CHAT VỚI DỮ LIỆU THẬT */}
      <div
        className={`${showMobileChat ? 'flex' : 'hidden md:flex'
          } flex-1 flex-col bg-white overflow-hidden`}
      >
        <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shadow-2xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowMobileChat(false)}
              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="h-9 w-9 rounded-xl bg-teal-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              CD
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 truncate leading-tight">
                  {selectedBranch?.branchName || 'Đang kết nối...'}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Trực tuyến
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-slate-400 shrink-0" />
                <span>{selectedBranch?.address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Nút làm mới tin nhắn trong khung chat */}
            <button
              type="button"
              onClick={handleReloadMessages}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              title="Tải lại tin nhắn"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/patient/appointments')}
              className="hidden sm:inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              <Calendar size={13} />
              <span>Đặt lịch khám</span>
            </button>

            {selectedBranch?.phoneNumber && (
              <a
                href={`tel:${selectedBranch.phoneNumber.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
              >
                <Phone size={13} />
                <span className="hidden sm:inline">{selectedBranch.phoneNumber}</span>
              </a>
            )}
          </div>
        </div>

        {/* Luồng tin nhắn thực tế */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-200/80 rounded-2xl p-3.5 text-xs text-slate-700 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-teal-900 mb-1">
              <Sparkles size={15} className="text-teal-700" />
              <span>Chào mừng {patientName || 'bạn'} đến với Crown Dental!</span>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Bạn đang kết nối trực tiếp với đội ngũ tư vấn viên & bác sĩ chuyên khoa tại cơ sở{' '}
              <strong>{selectedBranch?.branchName}</strong>. Tin nhắn phản hồi sẽ xuất hiện tức thì theo thời gian thực.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Đang đồng bộ dữ liệu phòng chat...
            </div>
          ) : (
            messages.map((m, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDateDivider = !prevMessage || isDifferentDay(prevMessage.createdAt, m.createdAt);

              if (m.senderType === 'SYSTEM') {
                return (
                  <React.Fragment key={m.id || index}>
                    {showDateDivider && (
                      <div className="flex items-center justify-center my-3.5">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 border border-slate-300/40 text-[10.5px] font-semibold text-slate-600 shadow-2xs select-none">
                          <Calendar size={12} className="text-slate-500" />
                          <span>{formatMessageDateDivider(m.createdAt)}</span>
                        </div>
                      </div>
                    )}
                    <div className="text-center my-2">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-3 py-0.5 rounded-full">
                        {m.content}
                      </span>
                    </div>
                  </React.Fragment>
                );
              }

              const isMe = m.senderType === 'PATIENT';

              return (
                <React.Fragment key={m.id || index}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-3.5">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 border border-slate-300/40 text-[10.5px] font-semibold text-slate-600 shadow-2xs select-none">
                        <Calendar size={12} className="text-slate-500" />
                        <span>{formatMessageDateDivider(m.createdAt)}</span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`group/message flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <div className="h-7 w-7 rounded-full bg-teal-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                        CD
                      </div>
                    )}

                    <div
                      className={m.messageType === 'STICKER' ? 'max-w-[85%] sm:max-w-md' : m.messageType === 'IMAGE' ? 'max-w-[85%] sm:max-w-md text-xs text-slate-800' : `max-w-[85%] sm:max-w-md rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${isMe
                        ? 'bg-gradient-to-r from-teal-700 to-teal-800 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                        }`}
                    >
                      {!isMe && m.senderEmployeeName && (
                        <span className={`text-[10.5px] font-bold block mb-0.5 ${m.messageType === 'STICKER' ? 'text-teal-800' : 'text-teal-800'}`}>
                          {m.senderEmployeeName}
                        </span>
                      )}
                      <ChatMessageContent message={m} canRecall={m.senderType === 'PATIENT' && m.senderPatientId === patientId}
                        onRecalled={(updated) => setMessages((prev) => prev.map((item) => item.id === updated.id ? updated : item))} />
                      <div
                        className={`flex items-center justify-end gap-1 text-[9.5px] mt-1 ${m.messageType === 'IMAGE' || m.messageType === 'STICKER' ? 'text-slate-500' : isMe ? 'text-teal-200' : 'text-slate-400'
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
                      <div className="h-7 w-7 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {patientName ? patientName.charAt(0) : 'P'}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1 shrink-0 pl-1">
            <Sparkles size={12} /> Gợi ý:
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

        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <ChatImageButton key={room?.id || 'no-room'} roomId={room?.id}
              senderType="PATIENT" senderId={patientId} disabled={sending}
              onSent={(message) => setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message])} />

            <button
              type="button"
              onClick={() => setIsStickerModalOpen(true)}
              disabled={!room?.id || sending}
              className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              title="Gửi sticker nha khoa"
              aria-label="Gửi sticker nha khoa"
            >
              <Smile size={18} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập nội dung cần tư vấn với phòng khám..."
              className="flex-1 bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white border border-transparent focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || sending}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all cursor-pointer ${inputMessage.trim() && !sending
                ? 'bg-teal-700 hover:bg-teal-800 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed opacity-60'
                }`}
            >
              <Send size={14} />
              <span className="hidden sm:inline">Gửi</span>
            </button>
          </div>
        </div>

        {/* Modal chọn Sticker nha khoa */}
        <ChatStickerModal
          isOpen={isStickerModalOpen}
          onClose={() => setIsStickerModalOpen(false)}
          onSelectSticker={handleSendSticker}
        />
      </div>
    </div>
  );
}
