import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Bot from 'lucide-react-native/icons/bot';
import RotateCcw from 'lucide-react-native/icons/rotate-ccw';
import Send from 'lucide-react-native/icons/send';
import Sparkles from 'lucide-react-native/icons/sparkles';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardSafeView } from '../src/components/KeyboardSafeView';
import { Colors } from '../src/constants/theme';
import { aiService } from '../src/services/ai.service';

interface AiMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isError?: boolean;
}

function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function makeSessionId(): string {
  return `session_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
}

const WELCOME_TEXT =
  'Xin chào! Em là Trợ lý ảo AI của Nha khoa Crown Dental 🦷✨\n\nEm có thể hỗ trợ quý khách tra cứu bảng giá dịch vụ chuẩn xác, quy trình đặt lịch, chính sách bảo hành và trả góp 0%. Quý khách đang quan tâm đến dịch vụ nào ạ?';

const QUICK_SUGGESTIONS = [
  'Bảng giá trám răng',
  'Giá bọc răng sứ bao nhiêu?',
  'Quy trình đặt lịch khám',
  'Chính sách trả góp 0%',
  'Chính sách bảo hành dịch vụ',
];

function renderFormattedBotText(text: string, isUser: boolean, isError?: boolean) {
  const baseColor = isUser ? '#ffffff' : isError ? '#9f1239' : Colors.text;
  const lines = (text || '').split('\n');

  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <Text
        key={lineIdx}
        style={[
          styles.msgText,
          { color: baseColor },
          lineIdx < lines.length - 1 && { marginBottom: 3 },
        ]}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={pIdx} style={{ fontWeight: '800', color: baseColor }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <React.Fragment key={pIdx}>{part}</React.Fragment>;
        })}
      </Text>
    );
  });
}

export default function AiChatbotScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<AiMessage>>(null);

  const [sessionId, setSessionId] = useState<string>(() => makeSessionId());
  const [messages, setMessages] = useState<AiMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text: WELCOME_TEXT,
      time: nowTimeStr(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [messages, loading]);

  const handleSend = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || loading) return;

    const userMsg: AiMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      time: nowTimeStr(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!preset) setInput('');
    setLoading(true);

    try {
      const data = await aiService.chatWithAgent(text, sessionId);
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
      const botMsg: AiMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text:
          data.reply ||
          'Cảm ơn quý khách đã gửi câu hỏi. Hiện tại hệ thống đang được cập nhật, quý khách vui lòng liên hệ hotline 1900 8059 để được hỗ trợ nhanh nhất ạ!',
        time: nowTimeStr(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'bot',
          text: 'Dạ, kết nối đến máy chủ AI đang gặp gián đoạn tạm thời. Quý khách vui lòng thử lại sau vài giây hoặc liên hệ trực tiếp với phòng khám nhé!',
          time: nowTimeStr(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (loading) return;
    setSessionId(makeSessionId());
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'bot',
        text: WELCOME_TEXT,
        time: nowTimeStr(),
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            hitSlop={8}>
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>

          <View style={styles.botAvatarWrap}>
            <Bot size={22} color="#ffffff" />
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Trợ lý Crown Dental</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={styles.headerSub}>Trực tuyến 24/7 • Báo giá & tư vấn tức thì</Text>
          </View>

          <Pressable
            style={styles.headerIconBtn}
            onPress={handleReset}
            hitSlop={8}
            accessibilityLabel="Làm mới phiên trò chuyện">
            <RotateCcw size={18} color="#ffffff" />
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardSafeView style={styles.body} extraSpace={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isBot = item.sender === 'bot';
            return (
              <View style={[styles.msgRow, isBot ? styles.msgRowBot : styles.msgRowUser]}>
                {isBot ? (
                  <View style={styles.msgBotAvatar}>
                    <Bot size={15} color="#ffffff" />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.bubbleWrap,
                    isBot ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' },
                  ]}>
                  <View
                    style={[
                      styles.bubble,
                      isBot
                        ? item.isError
                          ? styles.bubbleError
                          : styles.bubbleBot
                        : styles.bubbleUser,
                    ]}>
                    {renderFormattedBotText(item.text, !isBot, item.isError)}
                  </View>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            loading ? (
              <View style={[styles.msgRow, styles.msgRowBot, { marginTop: 4 }]}>
                <View style={styles.msgBotAvatar}>
                  <Bot size={15} color="#ffffff" />
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.typingText}>Trợ lý AI đang tra cứu...</Text>
                </View>
              </View>
            ) : undefined
          }
        />

        {/* Gợi ý nhanh */}
        {!loading ? (
          <View style={styles.suggestionsBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.suggestionsContent}>
              <View style={styles.suggestTag}>
                <Sparkles size={13} color="#d97706" />
                <Text style={styles.suggestTagText}>Gợi ý:</Text>
              </View>
              {QUICK_SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.suggestChip} onPress={() => handleSend(s)}>
                  <Text style={styles.suggestChipText}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Thanh nhập câu hỏi */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafe}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Nhập câu hỏi (giá trám răng, đặt lịch, bảo hành...)"
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={setInput}
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
              disabled={!input.trim() || loading}
              onPress={() => handleSend()}>
              <Send size={18} color="#ffffff" />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardSafeView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#34d399',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  headerInfo: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { color: '#ffffff', fontSize: 15.5, fontWeight: '800' },
  aiBadge: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  aiBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  headerSub: { color: Colors.onPrimaryMuted, fontSize: 11.5, marginTop: 2 },
  body: { flex: 1 },
  listContent: { padding: 14, gap: 12, paddingBottom: 18 },
  msgRow: { flexDirection: 'row', gap: 8 },
  msgRowBot: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgBotAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1f4fb2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubbleWrap: { maxWidth: '82%' },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleBot: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 4,
  },
  bubbleError: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  msgText: { fontSize: 13.5, lineHeight: 20 },
  timeText: { fontSize: 10.5, color: Colors.textMuted, marginTop: 4, paddingHorizontal: 4 },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  typingText: { fontSize: 12.5, fontWeight: '600', color: Colors.textSecondary },
  suggestionsBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 8,
  },
  suggestionsContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  suggestTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suggestTagText: { fontSize: 11.5, fontWeight: '700', color: Colors.textSecondary },
  suggestChip: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  suggestChipText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  inputSafe: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
});
