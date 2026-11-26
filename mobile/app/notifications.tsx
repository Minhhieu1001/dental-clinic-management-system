import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import Calendar from 'lucide-react-native/icons/calendar';
import CheckCheck from 'lucide-react-native/icons/check-check';
import Receipt from 'lucide-react-native/icons/receipt';
import Search from 'lucide-react-native/icons/search';
import Stethoscope from 'lucide-react-native/icons/stethoscope';
import Trash2 from 'lucide-react-native/icons/trash-2';
import X from 'lucide-react-native/icons/x';
import { Colors } from '../src/constants/theme';
import { useAuth } from '../src/contexts/AuthContext';
import { useSuccessModal } from '../src/contexts/SuccessModalContext';
import { NotificationItem, notificationService } from '../src/services/notification.service';
import { useAppRealtime } from '../src/services/stompClient';

type ReadTab = 'ALL' | 'UNREAD' | 'READ';
const TYPE_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'FOLLOW_UP', label: 'Tái khám' },
  { key: 'STATUS_CHANGE', label: 'Lịch hẹn' },
  { key: 'PATIENT_CHECKIN', label: 'Tiếp nhận' },
  { key: 'PAYMENT_SUCCESS', label: 'Hóa đơn' },
];

function parseDate(value?: string | number[]): Date | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [y, m, d, h = 0, mi = 0] = value;
    return new Date(y, (m ?? 1) - 1, d ?? 1, h, mi);
  }
  const dt = new Date(value);
  return isNaN(dt.getTime()) ? null : dt;
}

function formatDateTime(value?: string | number[]) {
  const d = parseDate(value);
  if (!d) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())} • ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function typeMeta(type?: string) {
  switch (type) {
    case 'PAYMENT_SUCCESS':
      return { Icon: Receipt, color: Colors.emerald, bg: Colors.emeraldLight, label: 'Hóa đơn' };
    case 'PATIENT_CHECKIN':
      return { Icon: Stethoscope, color: Colors.info, bg: '#e0f2fe', label: 'Tiếp nhận' };
    case 'FOLLOW_UP':
      return { Icon: Calendar, color: Colors.warning, bg: Colors.warningLight, label: 'Tái khám' };
    case 'STATUS_CHANGE':
      return { Icon: Calendar, color: Colors.primary, bg: Colors.primaryLight, label: 'Lịch hẹn' };
    default:
      return { Icon: Bell, color: Colors.textSecondary, bg: Colors.inputBg, label: 'Hệ thống' };
  }
}

function navTarget(n: NotificationItem): { path: string; label: string } | null {
  const url = (n.targetUrl || '').toLowerCase();
  if (n.type === 'PAYMENT_SUCCESS' || url.includes('invoice')) return { path: '/(tabs)/invoices', label: 'Xem hóa đơn' };
  if (url.includes('record') || url.includes('prescription')) return { path: '/(tabs)/records', label: 'Xem hồ sơ' };
  if (n.type === 'FOLLOW_UP' || n.type === 'STATUS_CHANGE' || n.type === 'PATIENT_CHECKIN' || url.includes('appointment'))
    return { path: '/(tabs)/appointments', label: 'Xem lịch hẹn' };
  return null;
}

export default function NotificationsScreen() {
  const { user, patientId } = useAuth();
  const { showSuccess } = useSuccessModal();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<ReadTab>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const list = await notificationService.getByUserId(user.id);
      list.sort((a, b) => (parseDate(b.createdAt)?.getTime() ?? 0) - (parseDate(a.createdAt)?.getTime() ?? 0));
      setItems(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useAppRealtime({
    userId: user?.id,
    patientId,
    userPhone: user?.phone,
    onNotificationRealtime: useCallback(
      (incoming: NotificationItem) => {
        if (!incoming?.id) {
          load();
          return;
        }
        setItems((prev) =>
          prev.some((x) => x.id === incoming.id) ? prev : [incoming, ...prev]
        );
      },
      [load]
    ),
  });

  const unreadCount = items.filter((n) => !n.isRead).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((n) => {
      if (tab === 'UNREAD' && n.isRead) return false;
      if (tab === 'READ' && !n.isRead) return false;
      if (typeFilter !== 'ALL' && n.type !== typeFilter) return false;
      if (!q) return true;
      return (
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.senderName?.toLowerCase().includes(q)
      );
    });
  }, [items, tab, typeFilter, search]);

  const openItem = async (n: NotificationItem) => {
    setSelected(n);
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      notificationService.markAsRead(n.id).catch(() => { });
    }
  };

  const markAll = async () => {
    if (!user?.id || unreadCount === 0) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      showSuccess({
        title: 'Đã đánh dấu đã đọc!',
        message: 'Tất cả thông báo của bạn đã được chuyển sang trạng thái đã đọc.',
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể đánh dấu tất cả đã đọc.');
    }
  };

  const remove = (n: NotificationItem) => {
    Alert.alert('Xóa thông báo', 'Bạn có chắc muốn xóa thông báo này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await notificationService.deleteById(n.id);
            setItems((prev) => prev.filter((x) => x.id !== n.id));
            setSelected(null);
            showSuccess({
              title: 'Đã xóa thông báo!',
              message: 'Thông báo đã được xóa khỏi danh sách của bạn.',
            });
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa thông báo.');
          }
        },
      },
    ]);
  };

  const selectedNav = selected ? navTarget(selected) : null;
  const selectedMeta = typeMeta(selected?.type);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm thông báo..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={styles.tabRow}>
          {(['ALL', 'UNREAD', 'READ'] as ReadTab[]).map((t) => (
            <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'ALL' ? 'Tất cả' : t === 'UNREAD' ? `Chưa đọc (${unreadCount})` : 'Đã đọc'}
              </Text>
            </Pressable>
          ))}
          <Pressable style={styles.markAll} onPress={markAll} disabled={unreadCount === 0}>
            <CheckCheck size={16} color={unreadCount ? Colors.primary : Colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {TYPE_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.chip, typeFilter === f.key && styles.chipActive]}
              onPress={() => setTypeFilter(f.key)}>
              <Text style={[styles.chipText, typeFilter === f.key && { color: '#fff' }]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Bell size={36} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Không có thông báo nào.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const meta = typeMeta(item.type);
            const Icon = meta.Icon;
            return (
              <Pressable
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => openItem(item)}>
                <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                  <Icon size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, !item.isRead && { fontWeight: '800' }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!item.isRead ? <View style={styles.dot} /> : null}
                  </View>
                  <Text style={styles.cardContent} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <Text style={styles.cardTime}>
                    {meta.label} • {formatDateTime(item.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={[styles.iconWrap, { backgroundColor: selectedMeta.bg }]}>
                <selectedMeta.Icon size={18} color={selectedMeta.color} />
              </View>
              <Text style={styles.sheetLabel}>{selectedMeta.label}</Text>
              <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                <X size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 360 }}>
              <Text style={styles.sheetTitle}>{selected?.title}</Text>
              <Text style={styles.sheetTime}>
                {selected?.senderName ? `${selected.senderName} • ` : ''}
                {formatDateTime(selected?.createdAt)}
              </Text>
              <Text style={styles.sheetContent}>{selected?.content}</Text>
            </ScrollView>
            <View style={styles.sheetActions}>
              <Pressable style={styles.deleteBtn} onPress={() => selected && remove(selected)}>
                <Trash2 size={16} color={Colors.danger} />
                <Text style={{ color: Colors.danger, fontWeight: '700' }}>Xóa</Text>
              </Pressable>
              {selectedNav ? (
                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => {
                    setSelected(null);
                    router.push(selectedNav.path as any);
                  }}>
                  <Text style={styles.primaryBtnText}>{selectedNav.label}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 40 },
  header: { padding: 14, gap: 10, backgroundColor: Colors.card, borderBottomWidth: 1, borderColor: Colors.border },
  searchBox: {
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
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.inputBg },
  tabActive: { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primaryBorder },
  tabText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.primaryDark },
  markAll: { marginLeft: 'auto', padding: 8, borderRadius: 10, backgroundColor: Colors.inputBg },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: { borderColor: Colors.primaryBorder, backgroundColor: '#fbfffe' },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  cardContent: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  cardTime: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  emptyText: { color: Colors.textSecondary },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 18, gap: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sheetLabel: { flex: 1, fontWeight: '700', color: Colors.textSecondary },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  sheetTime: { fontSize: 12, color: Colors.textMuted, marginTop: 4, marginBottom: 10 },
  sheetContent: { fontSize: 14, color: Colors.text, lineHeight: 21 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  primaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
