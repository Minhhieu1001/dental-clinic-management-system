import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Linking,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Building2 from 'lucide-react-native/icons/building-2';
import Check from 'lucide-react-native/icons/check';
import CheckCheck from 'lucide-react-native/icons/check-check';
import ImagePlus from 'lucide-react-native/icons/image-plus';
import MapPin from 'lucide-react-native/icons/map-pin';
import Phone from 'lucide-react-native/icons/phone';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Search from 'lucide-react-native/icons/search';
import Send from 'lucide-react-native/icons/send';
import Smile from 'lucide-react-native/icons/smile';
import Sparkles from 'lucide-react-native/icons/sparkles';
import X from 'lucide-react-native/icons/x';
import { KeyboardSafeView } from '../../src/components/KeyboardSafeView';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { useSuccessModal } from '../../src/contexts/SuccessModalContext';
import { BranchItem, clinicService } from '../../src/services/clinic.service';
import {
  ChatMessageItem,
  ChatRoomItem,
  DENTAL_STICKERS,
  chatService,
  isLikelyImageUrl,
  resolveMediaUrl,
} from '../../src/services/chat.service';
import { useChatWebSocket } from '../../src/services/stompClient';

const FAQ_CHIPS = [
  'Tôi muốn đặt lịch khám',
  'Chi phí cạo vôi răng bao nhiêu?',
  'Phòng khám mở cửa lúc mấy giờ?',
  'Tôi bị đau răng, cần tư vấn',
  'Tôi muốn đổi lịch hẹn',
];

function parseDate(value?: string | number[]): Date | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, mi = 0, s = 0] = value;
    return new Date(y, (m ?? 1) - 1, d ?? 1, h, mi, s);
  }
  const dt = new Date(value);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatTime(value?: string | number[]) {
  const d = parseDate(value);
  if (!d) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return `${hh}:${mm}`;
  return `${hh}:${mm} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function ChatMediaView({
  uri,
  isSticker,
  onPressImage,
}: {
  uri: string;
  isSticker: boolean;
  onPressImage?: (url: string) => void;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Text style={styles.mediaFallback}>
        {isSticker ? '[Sticker]' : '[Không tải được hình ảnh]'}
      </Text>
    );
  }

  if (isSticker) {
    return (
      <Image
        source={{ uri }}
        style={styles.stickerImg}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Pressable onPress={() => onPressImage?.(uri)} style={styles.imagePress}>
      <Image
        source={{ uri }}
        style={styles.chatImg}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    </Pressable>
  );
}

export default function ConsultationScreen() {
  const { patientId } = useAuth();
  const { showSuccess } = useSuccessModal();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [rooms, setRooms] = useState<ChatRoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [activeBranch, setActiveBranch] = useState<BranchItem | null>(null);
  const [activeRoom, setActiveRoom] = useState<ChatRoomItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [roomLoading, setRoomLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const listRef = useRef<FlatList<ChatMessageItem>>(null);
  const lastMsgIdRef = useRef<string | undefined>(undefined);
  const isNearBottomRef = useRef(true);

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const scrollToLatest = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated });
    });
  }, []);

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpen(true);
      setShowSuggestions(false);
      setStickerOpen(false);
      scrollToLatest(true);
    });
    const s2 = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [scrollToLatest]);

  useEffect(() => {
    const latest = messages[messages.length - 1];
    if (latest?.id && latest.id !== lastMsgIdRef.current) {
      const hadPrev = Boolean(lastMsgIdRef.current);
      lastMsgIdRef.current = latest.id;
      if (latest.senderType === 'PATIENT' || isNearBottomRef.current || !hadPrev) {
        scrollToLatest(hadPrev);
      }
    } else if (!latest) {
      lastMsgIdRef.current = undefined;
    }
  }, [messages, scrollToLatest]);

  const loadOverview = useCallback(async () => {
    try {
      const [b, r] = await Promise.all([
        clinicService.getBranches().catch(() => []),
        patientId ? chatService.getRoomsByPatient(patientId).catch(() => []) : Promise.resolve([]),
      ]);
      setBranches(b.filter((x) => !x.status || x.status === 'ACTIVE'));
      setRooms(r);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const list = await chatService.getMessagesByRoom(roomId);
      setMessages(list);
      if (list.some((m) => m.senderType !== 'PATIENT' && !m.isRead)) {
        chatService.markAsRead(roomId).catch(() => {});
      }
    } catch {
      // ignore load error
    }
  }, []);

  // Kết nối STOMP WebSocket Realtime (0 polling)
  const { status: wsStatus } = useChatWebSocket({
    roomId: activeRoom?.id ?? null,
    patientId,
    onMessage: useCallback(
      (incoming: ChatMessageItem) => {
        if (!incoming?.id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) {
            return prev.map((m) => (m.id === incoming.id ? incoming : m));
          }
          const tempIdx = prev.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              m.senderType === incoming.senderType &&
              (m.content === incoming.content || m.messageType === 'IMAGE')
          );
          if (tempIdx >= 0 && prev[tempIdx].content === incoming.content) {
            const next = [...prev];
            next[tempIdx] = incoming;
            return next;
          }
          return [...prev, incoming];
        });

        if (incoming.senderType === 'EMPLOYEE' && activeRoom?.id) {
          chatService.markAsRead(activeRoom.id).catch(() => {});
        }
      },
      [activeRoom?.id]
    ),
    onPatientUpdate: useCallback(
      (incoming: ChatMessageItem) => {
        if (incoming?.senderType === 'EMPLOYEE' && incoming.chatRoomId !== activeRoom?.id) {
          setRooms((prev) => {
            const exists = prev.some((r) => r.id === incoming.chatRoomId);
            if (!exists) {
              loadOverview();
              return prev;
            }
            return prev.map((r) =>
              r.id === incoming.chatRoomId
                ? { ...r, patientUnreadCount: (r.patientUnreadCount ?? 0) + 1 }
                : r
            );
          });
        }
      },
      [activeRoom?.id, loadOverview]
    ),
    onReconnect: useCallback(() => {
      if (activeRoom?.id) {
        loadMessages(activeRoom.id);
      } else {
        loadOverview();
      }
    }, [activeRoom?.id, loadMessages, loadOverview]),
  });

  const unreadByBranch = useMemo(() => {
    const map: Record<string, number> = {};
    rooms.forEach((r) => {
      map[r.branchId] = (map[r.branchId] ?? 0) + (r.patientUnreadCount ?? 0);
    });
    return map;
  }, [rooms]);

  const filteredBranches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) => b.branchName?.toLowerCase().includes(q) || b.address?.toLowerCase().includes(q)
    );
  }, [branches, search]);

  const openBranch = async (branch: BranchItem) => {
    if (!patientId) {
      Alert.alert('Thông báo', 'Không xác định được hồ sơ bệnh nhân.');
      return;
    }
    lastMsgIdRef.current = undefined;
    isNearBottomRef.current = true;
    setActiveBranch(branch);
    setMessages([]);
    setShowSuggestions(false);
    setStickerOpen(false);
    setRoomLoading(true);
    try {
      const room = await chatService.getOrCreateRoom(patientId, branch.branchId);
      setActiveRoom(room);
      await loadMessages(room.id);
      await chatService.markAsRead(room.id).catch(() => {});
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể mở phòng tư vấn.');
      setActiveBranch(null);
    } finally {
      setRoomLoading(false);
    }
  };

  const closeRoom = () => {
    Keyboard.dismiss();
    lastMsgIdRef.current = undefined;
    setActiveRoom(null);
    setActiveBranch(null);
    setMessages([]);
    setText('');
    setShowSuggestions(false);
    setStickerOpen(false);
    loadOverview();
  };

  const sendMessageTyped = async (
    content: string,
    messageType: 'TEXT' | 'IMAGE' | 'STICKER' = 'TEXT'
  ) => {
    const value = content.trim();
    if (!value || !activeRoom || !patientId || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessageItem = {
      id: tempId,
      chatRoomId: activeRoom.id,
      content: value,
      senderType: 'PATIENT',
      messageType,
      senderPatientId: patientId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    if (messageType === 'TEXT') setText('');
    setShowSuggestions(false);
    setStickerOpen(false);
    setMessages((prev) => [...prev, optimistic]);
    scrollToLatest(true);
    setSending(true);

    try {
      const msg = await chatService.sendMessage({
        roomId: activeRoom.id,
        content: value,
        senderType: 'PATIENT',
        messageType,
        senderPatientId: patientId,
      });
      if (msg?.id) {
        setMessages((prev) => {
          const alreadyFromWs = prev.some((m) => m.id === msg.id);
          if (alreadyFromWs) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? msg : m));
        });
      }
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      if (messageType === 'TEXT') setText(value);
      Alert.alert('Lỗi', e?.response?.data?.message || 'Gửi tin nhắn thất bại.');
    } finally {
      setSending(false);
    }
  };

  const pickAndSendImage = async (fromCamera: boolean) => {
    if (!activeRoom || !patientId || uploadingImage || sending) return;
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền máy ảnh để chụp ảnh gửi tư vấn.');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền thư viện ảnh để chọn ảnh gửi tư vấn.');
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

      if (result.canceled || !result.assets?.[0]?.uri) return;
      const asset = result.assets[0];

      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessageItem = {
        id: tempId,
        chatRoomId: activeRoom.id,
        content: asset.uri,
        senderType: 'PATIENT',
        messageType: 'IMAGE',
        senderPatientId: patientId,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      scrollToLatest(true);
      setUploadingImage(true);

      const fileName = asset.fileName || `chat-${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      const uploadedUrl = await chatService.uploadImage(asset.uri, mimeType, fileName);
      if (!uploadedUrl) {
        throw new Error('Máy chủ không trả về đường dẫn ảnh.');
      }

      const msg = await chatService.sendMessage({
        roomId: activeRoom.id,
        content: uploadedUrl,
        senderType: 'PATIENT',
        messageType: 'IMAGE',
        senderPatientId: patientId,
      });

      if (msg?.id) {
        setMessages((prev) => {
          const alreadyFromWs = prev.some((m) => m.id === msg.id);
          if (alreadyFromWs) return prev.filter((m) => m.id !== tempId);
          return prev.map((m) => (m.id === tempId ? msg : m));
        });
      }
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
      Alert.alert('Lỗi gửi ảnh', e?.response?.data?.message || e?.message || 'Không thể gửi hình ảnh.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChooseImageSource = () => {
    Keyboard.dismiss();
    Alert.alert('Gửi hình ảnh', 'Chọn nguồn hình ảnh', [
      { text: 'Thư viện ảnh', onPress: () => pickAndSendImage(false) },
      { text: 'Chụp ảnh mới', onPress: () => pickAndSendImage(true) },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  const recall = (m: ChatMessageItem) => {
    if (m.senderType !== 'PATIENT' || !m.content || m.id.startsWith('temp-')) return;
    Alert.alert('Thu hồi tin nhắn', 'Bạn có chắc muốn thu hồi tin nhắn này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Thu hồi',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatService.recallMessage(m.id);
            setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, content: '' } : x)));
            showSuccess({
              title: 'Đã thu hồi tin nhắn!',
              message: 'Tin nhắn đã được thu hồi khỏi cuộc trò chuyện.',
            });
          } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể thu hồi tin nhắn.');
          }
        },
      },
    ]);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isNearBottomRef.current = e.nativeEvent.contentOffset.y < 140;
  };

  // ======================= CHAT ROOM VIEW =======================
  if (activeBranch) {
    const suggestionsVisible = (!keyboardOpen && messages.length === 0) || showSuggestions;
    const statusLabel =
      wsStatus === 'connected'
        ? 'Trực tuyến (Realtime)'
        : wsStatus === 'reconnecting'
          ? 'Đang kết nối lại...'
          : 'Đang kết nối...';
    const isConnected = wsStatus === 'connected';

    return (
      <KeyboardSafeView style={styles.container} extraSpace={8}>
        <View style={styles.roomHeader}>
          <Pressable onPress={closeRoom} style={styles.iconBtn} hitSlop={8}>
            <ArrowLeft size={19} color={Colors.text} />
          </Pressable>
          <View style={styles.roomAvatar}>
            <Building2 size={17} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {activeBranch.branchName}
            </Text>
            <View style={styles.onlineRow}>
              <View
                style={[
                  styles.onlineDot,
                  { backgroundColor: isConnected ? Colors.primary : Colors.warning },
                ]}
              />
              <Text style={[styles.roomSub, !isConnected && { color: Colors.warning }]}>
                {statusLabel}
              </Text>
            </View>
          </View>
          {activeBranch.phone ? (
            <Pressable
              style={styles.iconBtn}
              onPress={() => Linking.openURL(`tel:${activeBranch.phone}`)}
              hitSlop={8}>
              <Phone size={17} color={Colors.primary} />
            </Pressable>
          ) : null}
          <Pressable
            style={styles.iconBtn}
            onPress={() => activeRoom && loadMessages(activeRoom.id)}
            hitSlop={8}>
            <RefreshCw size={17} color={Colors.primary} />
          </Pressable>
        </View>

        {roomLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyChat}>
            <View style={styles.emptyIconCircle}>
              <Building2 size={28} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Xin chào bạn</Text>
            <Text style={styles.emptyText}>
              Nhắn tin trực tiếp cho {activeBranch.branchName} hoặc chọn gợi ý bên dưới.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={reversedMessages}
            inverted
            keyExtractor={(m, i) => m.id ?? String(i)}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={100}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}
            renderItem={({ item }) => {
              const mine = item.senderType === 'PATIENT';
              const recalled = !item.content || !item.content.trim();
              const isTemp = item.id.startsWith('temp-');
              const trimmedContent = (item.content || '').trim();
              const isSticker =
                !recalled &&
                (item.messageType === 'STICKER' || DENTAL_STICKERS.includes(trimmedContent));
              const isImage =
                !recalled &&
                !isSticker &&
                (item.messageType === 'IMAGE' || isLikelyImageUrl(trimmedContent));
              const resolvedUri =
                isSticker || isImage
                  ? trimmedContent.startsWith('file://') || trimmedContent.startsWith('content://')
                    ? trimmedContent
                    : resolveMediaUrl(trimmedContent)
                  : '';

              return (
                <Pressable
                  onLongPress={() => mine && !recalled && recall(item)}
                  style={[styles.bubbleRow, mine ? styles.rowRight : styles.rowLeft]}>
                  <View
                    style={[
                      isSticker
                        ? [styles.stickerContainer, !mine && { alignItems: 'flex-start' }]
                        : [
                            styles.bubble,
                            mine ? styles.bubbleMine : styles.bubbleOther,
                            isImage && styles.bubbleMedia,
                          ],
                      recalled && styles.bubbleRecalled,
                      isTemp && { opacity: 0.78 },
                    ]}>
                    {!mine && item.senderEmployeeName && !recalled ? (
                      <Text style={[styles.senderName, isSticker && { marginLeft: 4 }]}>
                        {item.senderEmployeeName}
                      </Text>
                    ) : null}

                    {recalled ? (
                      <Text style={styles.recalledText}>Tin nhắn đã thu hồi</Text>
                    ) : isSticker || isImage ? (
                      <ChatMediaView
                        key={resolvedUri}
                        uri={resolvedUri}
                        isSticker={isSticker}
                        onPressImage={(url) => setPreviewImageUrl(url)}
                      />
                    ) : (
                      <Text style={[styles.bubbleText, mine && { color: '#ffffff' }]}>
                        {item.content}
                      </Text>
                    )}

                    <View
                      style={[
                        styles.metaRow,
                        isSticker && styles.stickerMetaPill,
                        isImage && styles.imageMetaRow,
                      ]}>
                      <Text
                        style={[
                          styles.timeText,
                          mine && !recalled && !isSticker && { color: Colors.onPrimaryMuted },
                        ]}>
                        {isTemp ? 'Đang gửi...' : formatTime(item.createdAt)}
                      </Text>
                      {mine && !recalled && !isTemp ? (
                        item.isRead ? (
                          <CheckCheck
                            size={12}
                            color={isSticker ? Colors.primary : Colors.onPrimaryMuted}
                          />
                        ) : (
                          <Check
                            size={12}
                            color={isSticker ? Colors.primary : Colors.onPrimaryMuted}
                          />
                        )
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}

        {suggestionsVisible ? (
          <View style={styles.chipsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8, alignItems: 'center' }}>
              {FAQ_CHIPS.map((c) => (
                <Pressable
                  key={c}
                  style={styles.chip}
                  onPress={() => sendMessageTyped(c, 'TEXT')}
                  disabled={sending}>
                  <Text style={styles.chipText}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {stickerOpen ? (
          <View style={styles.stickerTray}>
            <View style={styles.stickerTrayHeader}>
              <Text style={styles.stickerTrayTitle}>Sticker Nha khoa</Text>
              <Pressable onPress={() => setStickerOpen(false)} hitSlop={8}>
                <X size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.stickerGrid}>
              {DENTAL_STICKERS.map((url, idx) => (
                <Pressable
                  key={idx}
                  style={styles.stickerCell}
                  onPress={() => sendMessageTyped(url, 'STICKER')}
                  disabled={sending}>
                  <Image source={{ uri: url }} style={styles.stickerThumb} resizeMode="contain" />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <Pressable
            style={[styles.toolBtn, suggestionsVisible && styles.toolBtnActive]}
            onPress={() => {
              setStickerOpen(false);
              setShowSuggestions((v) => !v);
            }}
            hitSlop={6}>
            <Sparkles size={18} color={suggestionsVisible ? '#ffffff' : Colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.toolBtn, stickerOpen && styles.toolBtnActive]}
            onPress={() => {
              Keyboard.dismiss();
              setShowSuggestions(false);
              setStickerOpen((v) => !v);
            }}
            hitSlop={6}>
            <Smile size={18} color={stickerOpen ? '#ffffff' : Colors.primary} />
          </Pressable>
          <Pressable
            style={styles.toolBtn}
            onPress={handleChooseImageSource}
            disabled={uploadingImage || sending}
            hitSlop={6}>
            {uploadingImage ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <ImagePlus size={18} color={Colors.primary} />
            )}
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            disabled={!text.trim() || sending}
            onPress={() => sendMessageTyped(text, 'TEXT')}>
            {sending ? <ActivityIndicator color="#fff" size="small" /> : <Send size={18} color="#fff" />}
          </Pressable>
        </View>

        {/* Modal xem ảnh toàn màn hình */}
        <Modal
          visible={Boolean(previewImageUrl)}
          transparent
          statusBarTranslucent
          animationType="fade"
          onRequestClose={() => setPreviewImageUrl(null)}>
          <View style={styles.lightboxBackdrop}>
            <Pressable style={styles.lightboxClose} onPress={() => setPreviewImageUrl(null)}>
              <X size={24} color="#ffffff" />
            </Pressable>
            {previewImageUrl ? (
              <Image
                source={{ uri: previewImageUrl }}
                style={styles.lightboxImg}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </Modal>
      </KeyboardSafeView>
    );
  }

  // ======================= BRANCH LIST VIEW =======================
  return (
    <View style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.subtitle}>Chọn chi nhánh để trò chuyện với nhân viên tư vấn</Text>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm chi nhánh theo tên hoặc địa chỉ..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredBranches}
          keyExtractor={(b) => b.branchId}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadOverview();
              }}
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Không có chi nhánh nào.</Text>}
          renderItem={({ item }) => {
            const unread = unreadByBranch[item.branchId] ?? 0;
            return (
              <Pressable style={styles.branchCard} onPress={() => openBranch(item)}>
                <View style={styles.branchIcon}>
                  <Building2 size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.branchName}>{item.branchName}</Text>
                  {item.address ? (
                    <View style={styles.inline}>
                      <MapPin size={12} color={Colors.textSecondary} />
                      <Text style={styles.branchMeta} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  ) : null}
                  {item.phone ? (
                    <View style={styles.inline}>
                      <Phone size={12} color={Colors.textSecondary} />
                      <Text style={styles.branchMeta}>{item.phone}</Text>
                    </View>
                  ) : null}
                </View>
                {unread > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listHeader: { padding: 14, backgroundColor: Colors.card, borderBottomWidth: 1, borderColor: Colors.border },
  subtitle: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  searchBox: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, color: Colors.text },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  branchIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  branchMeta: { fontSize: 12, color: Colors.textSecondary, flexShrink: 1 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  roomAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: Colors.inputBg },
  roomTitle: { fontSize: 14.5, fontWeight: '800', color: Colors.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary },
  roomSub: { fontSize: 11.5, color: Colors.primary, fontWeight: '600' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  bubbleRow: { flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMedia: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 5 },
  bubbleOther: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 5,
  },
  bubbleRecalled: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stickerContainer: {
    padding: 2,
    alignItems: 'flex-end',
  },
  stickerImg: { width: 112, height: 112 },
  stickerMetaPill: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 4,
  },
  imagePress: { borderRadius: 12, overflow: 'hidden' },
  chatImg: { width: 220, height: 180, borderRadius: 12, backgroundColor: '#e2e8f0' },
  imageMetaRow: { paddingHorizontal: 4 },
  mediaFallback: { fontSize: 12.5, color: Colors.textMuted, fontStyle: 'italic', padding: 4 },
  senderName: { fontSize: 11, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  bubbleText: { fontSize: 14.5, color: Colors.text, lineHeight: 20 },
  recalledText: { fontStyle: 'italic', color: Colors.textMuted },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  timeText: { fontSize: 10.5, color: Colors.textMuted },
  chipsWrap: {
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  chipText: { fontSize: 12, color: Colors.primaryDark, fontWeight: '700' },
  stickerTray: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stickerTrayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stickerTrayTitle: { fontSize: 13, fontWeight: '800', color: Colors.text },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  stickerCell: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  stickerThumb: { width: '100%', height: '100%' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  toolBtn: {
    width: 36,
    height: 40,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14.5,
    color: Colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.textMuted, opacity: 0.6 },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  lightboxImg: { width: '94%', height: '78%' },
});
