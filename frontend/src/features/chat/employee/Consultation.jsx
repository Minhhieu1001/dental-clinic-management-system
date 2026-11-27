import { chatPreview } from '../chatPreview';
import ChatImageButton from '../components/ChatImageButton';
import ChatMessageContent from '../components/ChatMessageContent';
import ChatStickerModal from '../components/ChatStickerModal';
import { isDifferentDay, formatMessageDateDivider } from '../utils/chatDateUtils';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Send,
  Search,
  CheckCheck,
  Check,
  Phone,
  User,
  Building2,
  Sparkles,
  RefreshCw,
  MessageSquare,
  ChevronLeft,
  Calendar,
  X,
  Smile
} from 'lucide-react';
import toast from 'react-hot-toast';
import { chatService } from '../../../services/chat.service';
import { getEmployeeById } from '../../../services/employee.service';
import { getRegisteredPatients } from '../../../services/patient.service';
import { useAuth } from '../../../hooks/useAuth';
import { useChatWebSocket } from '../../../hooks/useWebSocket';

export default function Consultation() {
  const { user } = useAuth();
  const [employeeProfile, setEmployeeProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [openingPatientId, setOpeningPatientId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(true);
  const [isStickerModalOpen, setIsStickerModalOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Tải thông tin nhân viên đang đăng nhập để lấy đúng duy nhất 1 chi nhánh của nhân viên
  useEffect(() => {
    let isMounted = true;
    async function loadEmployeeBranch() {
      if (!user?.employeeId) return;
      try {
        const emp = await getEmployeeById(user.employeeId);
        if (isMounted && emp) {
          setEmployeeProfile(emp);
        }
      } catch (err) {
        console.error('Lỗi tải thông tin nhân viên:', err);
      }
    }
    loadEmployeeBranch();
    return () => {
      isMounted = false;
    };
  }, [user?.employeeId]);

  const currentBranchId = employeeProfile?.branchId;
  const currentBranchName = employeeProfile?.branchName;
  const employeeName = user?.username;

  // 2. Tải danh sách phòng chat của chi nhánh và các bệnh nhân đã đăng ký tài khoản
  const fetchRooms = useCallback(async () => {
    if (!currentBranchId) return;
    try {
      const [roomsRes, patientsRes] = await Promise.allSettled([
        chatService.getRoomsByBranch(currentBranchId),
        getRegisteredPatients(),
      ]);

      const roomsList =
        roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value) ? roomsRes.value : [];
      if (roomsRes.status === 'rejected') {
        console.error('Lỗi tải danh sách phòng chat:', roomsRes.reason);
      }

      const patientsList =
        patientsRes.status === 'fulfilled' && Array.isArray(patientsRes.value)
          ? patientsRes.value.filter(
            (p) => p?.id && p.accountStatus !== 'BLOCK' && p.accountStatus !== 'INACTIVE'
          )
          : [];
      if (patientsRes.status === 'rejected') {
        console.error('Lỗi tải danh sách tài khoản bệnh nhân:', patientsRes.reason);
      }

      setRooms(roomsList);
      setRegisteredPatients(patientsList);
      setSelectedRoom((prev) => {
        if (prev) {
          return roomsList.find((r) => r.id === prev.id) || prev;
        }
        return roomsList.length > 0 ? roomsList[0] : null;
      });
    } catch (err) {
      console.error('Lỗi tải danh sách tư vấn:', err);
    } finally {
      setLoading(false);
    }
  }, [currentBranchId]);

  const handleRefresh = () => {
    setLoading(true);
    fetchRooms();
  };

  useEffect(() => {
    if (!currentBranchId) return;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchRooms();
    }, 0);
    return () => clearTimeout(timer);
  }, [currentBranchId, fetchRooms]);

  // 3. Tải tin nhắn khi đổi phòng
  useEffect(() => {
    if (!selectedRoom?.id) return;
    let isMounted = true;

    chatService
      .getMessagesByRoom(selectedRoom.id)
      .then((msgs) => {
        if (isMounted) {
          setMessages(msgs);
          chatService.markAsRead(selectedRoom.id, 'EMPLOYEE').catch(console.error);
          setRooms((prev) =>
            prev.map((r) => (r.id === selectedRoom.id ? { ...r, unreadCount: 0 } : r))
          );
        }
      })
      .catch((err) => console.error('Lỗi tải tin nhắn:', err));

    return () => {
      isMounted = false;
    };
  }, [selectedRoom?.id]);

  // 4. Đăng ký nhận tin nhắn Realtime qua WebSocket STOMP (Bỏ hoàn toàn cơ chế Polling setInterval)
  useChatWebSocket(
    selectedRoom?.id,
    currentBranchId,
    (newMsg) => {
      if (!newMsg?.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev.map((m) => m.id === newMsg.id ? newMsg : m);
        return [...prev, newMsg];
      });
      if (selectedRoom?.id === newMsg.chatRoomId) {
        chatService.markAsRead(selectedRoom.id, 'EMPLOYEE').catch(console.error);
      }
    },
    async (message) => {
      if (!currentBranchId) return;
      try {
        if (message.chatRoomId === selectedRoom?.id && message.senderType === 'PATIENT') {
          await chatService.markAsRead(selectedRoom.id, 'EMPLOYEE');
        }
        const updatedRooms = await chatService.getRoomsByBranch(currentBranchId);
        if (Array.isArray(updatedRooms)) setRooms(updatedRooms);
      } catch (error) {
        console.error('Failed to refresh chat rooms:', error);
      }
    }
  );

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gửi tin nhắn
  const handleSendMessage = async (customContent = null) => {
    const textToSend = (typeof customContent === 'string' ? customContent : inputMessage).trim();
    if (!textToSend || !selectedRoom?.id || sending) return;

    setSending(true);
    try {
      const payload = {
        roomId: selectedRoom.id,
        content: textToSend,
        senderType: 'EMPLOYEE',
        messageType: 'TEXT',
        senderEmployeeId: user?.employeeId,
      };

      const newMsg = await chatService.sendMessage(payload);
      setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      setInputMessage('');

      // Cập nhật preview phòng chat
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoom.id
            ? { ...r, lastMessage: textToSend, lastMessageType: 'TEXT', lastMessageTime: new Date().toISOString() }
            : r
        )
      );

      inputRef.current?.focus();
    } catch {
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  // Gửi sticker nha khoa
  const handleSendSticker = async (stickerUrl) => {
    if (!stickerUrl || !selectedRoom?.id || sending) return;

    setSending(true);
    try {
      const payload = {
        roomId: selectedRoom.id,
        content: stickerUrl,
        senderType: 'EMPLOYEE',
        messageType: 'STICKER',
        senderEmployeeId: user?.employeeId,
      };

      const newMsg = await chatService.sendMessage(payload);
      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));

      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoom.id
            ? { ...r, lastMessage: '[Sticker]', lastMessageType: 'STICKER', lastMessageTime: new Date().toISOString() }
            : r
        )
      );
    } catch {
      toast.error('Không thể gửi sticker. Vui lòng thử lại.');
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

  // Gộp phòng chat hiện có của chi nhánh với tài khoản bệnh nhân chưa có phòng chat
  const conversationItems = useMemo(() => {
    const roomItems = rooms.map((r) => ({
      ...r,
      key: `room-${r.id}`,
      hasRoom: true,
      room: r,
    }));

    const roomPatientIds = new Set(rooms.map((r) => r.patientId).filter(Boolean));

    const patientItems = registeredPatients
      .filter((p) => p?.id && !roomPatientIds.has(p.id))
      .map((p) => ({
        key: `patient-${p.id}`,
        id: null,
        patientId: p.id,
        patientName: p.fullName || p.patientCode || 'Bệnh nhân',
        patientCode: p.patientCode,
        patientPhone: p.phone,
        lastMessage: null,
        lastMessageType: null,
        lastMessageTime: null,
        unreadCount: 0,
        hasRoom: false,
        room: null,
      }));

    return [...roomItems, ...patientItems];
  }, [rooms, registeredPatients]);

  // Mở phòng chat (nếu chưa có phòng của chi nhánh + bệnh nhân thì tạo mới ngay)
  const handleSelectConversation = async (item) => {
    if (!item) return;

    if (item.hasRoom && item.room) {
      setSelectedRoom(item.room);
      setShowMobileList(false);
      return;
    }

    if (!currentBranchId || !item.patientId || openingPatientId) return;

    setOpeningPatientId(item.patientId);
    try {
      const createdRoom = await chatService.getOrCreateRoom(item.patientId, currentBranchId);
      if (createdRoom) {
        setRooms((prev) => {
          const exists = prev.some(
            (r) => r.id === createdRoom.id || r.patientId === createdRoom.patientId
          );
          if (exists) {
            return prev.map((r) =>
              r.id === createdRoom.id || r.patientId === createdRoom.patientId ? createdRoom : r
            );
          }
          return [createdRoom, ...prev];
        });
        setSelectedRoom(createdRoom);
        setShowMobileList(false);
      }
    } catch (err) {
      console.error('Lỗi tạo phòng chat với bệnh nhân:', err);
      toast.error('Không thể tạo phòng chat với bệnh nhân này.');
    } finally {
      setOpeningPatientId(null);
    }
  };

  // Lọc danh sách cuộc trò chuyện & tài khoản bệnh nhân
  const filteredRooms = conversationItems.filter((r) => {
    const pName = r.patientName ? r.patientName.toLowerCase() : '';
    const pPhone = r.patientPhone ? r.patientPhone : '';
    const pCode = r.patientCode ? r.patientCode.toLowerCase() : '';
    const q = searchQuery.toLowerCase();

    const matchQuery = pName.includes(q) || pPhone.includes(q) || pCode.includes(q);

    if (filterType === 'UNREAD') {
      return matchQuery && (r.unreadCount || 0) > 0;
    }
    return matchQuery;
  });

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Danh sách gợi ý câu trả lời nhanh (Đã thêm gợi ý chào kèm tên nhân viên)
  const quickReplies = [
    `Crown Dental xin chào bạn! Em là ${employeeName} - chuyên viên tư vấn của phòng khám. Em có thể hỗ trợ gì cho mình hôm nay ạ?`,
    'Dạ chi phí nhổ răng khôn mọc lệch dao động từ 1.500.000đ - 2.500.000đ ạ.',
    'Bạn có thể gửi hình ảnh răng hoặc mô tả triệu chứng cụ thể giúp phòng khám không ạ?',
    'Bạn có muốn đặt lịch hẹn khám trực tiếp với bác sĩ chuyên khoa vào ngày mai không ạ?',
    'Dạ phòng khám mở cửa từ 8:00 đến 20:00 tất cả các ngày trong tuần bạn nhé!',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-100 rounded-xl overflow-hidden shadow-xs border border-slate-200">
      {/* Top Banner Header: Branch Indicator (Cố định theo chi nhánh nhân viên đang đăng nhập, KHÔNG dùng selectbox) */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-900 text-white px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-teal-600/40 border border-teal-400/30 flex items-center justify-center text-teal-200">
            <MessageSquare size={17} />
          </div>
          <div>
            <h2 className="text-sm font-bold flex items-center gap-1.5 leading-tight">
              <span>Tư Vấn & Chăm Sóc Khách Hàng Trực Tuyến</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Chat Realtime
              </span>
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building2 size={12} className="text-teal-200 shrink-0" />
              <span className="text-xs font-bold text-teal-100 bg-teal-900/80 px-2 py-0.5 rounded-md border border-teal-400/30">
                Chi nhánh: {currentBranchName || 'Đang tải...'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          title="Tải lại danh sách phòng chat"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: DANH SÁCH CUỘC TRÒ CHUYỆN CỦA CHI NHÁNH */}
        <div
          className={`${showMobileList ? 'flex' : 'hidden md:flex'
            } w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white shrink-0`}
        >
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Tìm bệnh nhân theo tên, SĐT, mã BN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-white border border-transparent focus:border-teal-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`flex-1 py-1 px-2 rounded-md font-semibold text-center transition-colors cursor-pointer ${filterType === 'ALL'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Tất cả ({conversationItems.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('UNREAD')}
                className={`flex-1 py-1 px-2 rounded-md font-semibold text-center transition-colors cursor-pointer ${filterType === 'UNREAD'
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                Chưa đọc ({rooms.filter((r) => (r.unreadCount || 0) > 0).length})
              </button>
            </div>
          </div>

          {/* Rooms Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <User size={24} className="mx-auto mb-2 text-slate-300" />
                <p>Không có tài khoản bệnh nhân hoặc hội thoại nào phù hợp</p>
              </div>
            ) : (
              filteredRooms.map((r) => {
                const isCreating = openingPatientId === r.patientId;
                const isSelected = (r.hasRoom && selectedRoom?.id === r.id) || isCreating;
                const hasUnread = (r.unreadCount || 0) > 0;

                return (
                  <div
                    key={r.key}
                    onClick={() => handleSelectConversation(r)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors relative ${isSelected
                      ? 'bg-teal-50/80 border-l-4 border-teal-700'
                      : 'hover:bg-slate-50'
                      }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-teal-700 to-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {r.patientName ? r.patientName.charAt(0) : 'P'}
                      </div>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    {/* Room Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4
                          className={`text-xs truncate ${hasUnread ? 'font-black text-slate-900' : 'font-bold text-slate-800'
                            }`}
                        >
                          {r.patientName}
                        </h4>
                        {r.hasRoom ? (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatMessageTime(r.lastMessageTime)}
                          </span>
                        ) : (
                          <span className="text-[9.5px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded shrink-0">
                            Chưa chat
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                        {r.patientCode && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium text-[10px]">
                            {r.patientCode}
                          </span>
                        )}
                        {r.patientPhone && <span>{r.patientPhone}</span>}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                          className={`text-[11.5px] truncate ${!r.hasRoom
                            ? 'text-teal-700 italic font-medium'
                            : hasUnread
                              ? 'font-bold text-slate-800'
                              : 'text-slate-500'
                            }`}
                        >
                          {!r.hasRoom
                            ? isCreating
                              ? 'Đang tạo phòng chat...'
                              : 'Nhấn để tạo phòng chat với chi nhánh'
                            : chatPreview(r)}
                        </p>
                        {hasUnread && (
                          <span className="h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {r.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: KHUNG CHAT CHI TIẾT */}
        <div
          className={`${showMobileList ? 'hidden md:flex' : 'flex'
            } flex-1 flex-col bg-slate-50/60 overflow-hidden`}
        >
          {selectedRoom ? (
            <>
              {/* Chat Room Topbar */}
              <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="h-9 w-9 rounded-full bg-teal-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {selectedRoom.patientName ? selectedRoom.patientName.charAt(0) : 'P'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {selectedRoom.patientName}
                      </h3>
                      {selectedRoom.patientCode && (
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                          {selectedRoom.patientCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      {selectedRoom.patientPhone && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} />
                          {selectedRoom.patientPhone}
                        </span>
                      )}
                      <span className="inline-block h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Đang trực tuyến
                      </span>
                    </div>
                  </div>
                </div>


              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <MessageSquare size={32} className="text-slate-300 mb-2" />
                    <p>Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
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

                    const isEmployee = m.senderType === 'EMPLOYEE';

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
                          className={`group/message flex items-end gap-2 ${isEmployee ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isEmployee && (
                            <div className="h-7 w-7 rounded-full bg-slate-300 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {m.senderPatientName ? m.senderPatientName.charAt(0) : 'P'}
                            </div>
                          )}

                          <div
                            className={m.messageType === 'STICKER' ? 'max-w-[75%] sm:max-w-md' : m.messageType === 'IMAGE' ? 'max-w-[75%] sm:max-w-md text-xs text-slate-800' : `max-w-[75%] sm:max-w-md rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${isEmployee
                              ? 'bg-teal-800 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                              }`}
                          >
                            {isEmployee && m.senderEmployeeName && (
                              <span className={`text-[10px] font-bold block mb-0.5 ${m.messageType === 'IMAGE' || m.messageType === 'STICKER' ? 'text-teal-800' : 'text-teal-200'}`}>
                                {m.senderEmployeeName}
                              </span>
                            )}
                            <ChatMessageContent message={m} canRecall={m.senderType === 'EMPLOYEE' && m.senderEmployeeId === user?.employeeId}
                              onRecalled={(updated) => setMessages((prev) => prev.map((item) => item.id === updated.id ? updated : item))} />
                            <div
                              className={`flex items-center justify-end gap-1 text-[9.5px] mt-1 ${m.messageType === 'IMAGE' || m.messageType === 'STICKER' ? 'text-slate-500' : isEmployee ? 'text-teal-200' : 'text-slate-400'
                                }`}
                            >
                              <span>{formatMessageTime(m.createdAt)}</span>
                              {isEmployee && (
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

                          {isEmployee && (
                            <div className="h-7 w-7 rounded-full bg-teal-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              NV
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies Bar (Có câu chào hỏi mẫu kèm tên nhân viên tư vấn) */}
              <div className="px-3 py-2 bg-white border-t border-slate-200/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[11px] font-bold text-teal-800 flex items-center gap-1 shrink-0 pl-1">
                  <Sparkles size={12} /> Trả lời nhanh:
                </span>
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(reply)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 text-[11px] font-semibold border border-slate-200/80 transition-colors cursor-pointer shrink-0"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <ChatImageButton key={selectedRoom?.id || 'no-room'} roomId={selectedRoom?.id}
                    senderType="EMPLOYEE" senderId={user?.employeeId} disabled={sending}
                    onSent={(message) => setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message])} />

                  <button
                    type="button"
                    onClick={() => setIsStickerModalOpen(true)}
                    disabled={!selectedRoom?.id || sending}
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
                    placeholder="Nhập nội dung tư vấn cho bệnh nhân (Enter để gửi)..."
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
                    <span>Gửi</span>
                  </button>
                </div>
              </div>

              {/* Modal chọn Sticker nha khoa */}
              <ChatStickerModal
                isOpen={isStickerModalOpen}
                onClose={() => setIsStickerModalOpen(false)}
                onSelectSticker={handleSendSticker}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs px-4 text-center">
              <MessageSquare size={40} className="text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">Chọn một bệnh nhân để bắt đầu tư vấn</p>
              <p className="text-slate-400 text-[11px] mt-1">
                Danh sách bên trái hiển thị các hội thoại hiện có và tài khoản bệnh nhân đã đăng ký để mở phòng chat với chi nhánh {currentBranchName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
