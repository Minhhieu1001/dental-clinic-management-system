import { usePathname, useRouter } from 'expo-router';
import Bell from 'lucide-react-native/icons/bell';
import Calendar from 'lucide-react-native/icons/calendar';
import FileText from 'lucide-react-native/icons/file-text';
import Home from 'lucide-react-native/icons/house';
import LogIn from 'lucide-react-native/icons/log-in';
import LogOut from 'lucide-react-native/icons/log-out';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Phone from 'lucide-react-native/icons/phone';
import Pill from 'lucide-react-native/icons/pill';
import QrCode from 'lucide-react-native/icons/qr-code';
import Receipt from 'lucide-react-native/icons/receipt';
import ScanLine from 'lucide-react-native/icons/scan-line';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import User from 'lucide-react-native/icons/user';
import X from 'lucide-react-native/icons/x';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { resolveMediaUrl } from '../services/chat.service';
import { notificationService } from '../services/notification.service';
import { CheckInModal } from './CheckInModal';

const DRAWER_WIDTH = Math.min(310, Math.round(Dimensions.get('window').width * 0.82));

interface HeaderRightActionsProps {
  /** Số thông báo chưa đọc truyền từ ngoài vào (nếu có) */
  unreadCountOverride?: number;
  /** Callback reload dữ liệu sau khi quét QR check-in thành công */
  onCheckInSuccess?: () => void;
  /** Đặt khoảng cách lề phải khi gắn trong header của Tabs */
  inTabHeader?: boolean;
}

export function HeaderRightActions({
  unreadCountOverride,
  onCheckInSuccess,
  inTabHeader = false,
}: HeaderRightActionsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const slideX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (typeof unreadCountOverride === 'number') {
      setUnreadCount(unreadCountOverride);
      return;
    }
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    let active = true;
    notificationService
      .getByUserId(user.id)
      .then((list) => {
        if (active) setUnreadCount(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id, unreadCountOverride, pathname]);

  const openDrawer = useCallback(() => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    slideX.setValue(DRAWER_WIDTH);
    backdropOpacity.setValue(0);
    setDrawerMounted(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(slideX, {
          toValue: 0,
          damping: 26,
          stiffness: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [user, router, slideX, backdropOpacity]);

  const closeDrawer = useCallback(
    (afterClose?: () => void) => {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: DRAWER_WIDTH,
          duration: 190,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setDrawerMounted(false);
        afterClose?.();
      });
    },
    [slideX, backdropOpacity]
  );

  const navigateFromDrawer = (target: string) => {
    closeDrawer(() => {
      router.push(target as any);
    });
  };

  const handleOpenQrScanner = () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setCheckInOpen(true);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất tài khoản', 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          closeDrawer(async () => {
            await signOut();
            router.replace('/(auth)/login' as any);
          });
        },
      },
    ]);
  };

  const displayName = user?.username || user?.email?.split('@')[0] || 'Bệnh nhân';
  const displaySub = user?.email || (user?.phone ? `SĐT: ${user.phone}` : 'Cổng Bệnh nhân');
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const avatarUri = user?.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '';

  const mainNavItems = [
    {
      label: 'Tổng quan',
      route: '/(tabs)',
      active: pathname === '/' || pathname === '/index',
      Icon: Home,
    },
    {
      label: 'Lịch hẹn của tôi',
      route: '/(tabs)/appointments',
      active: pathname.includes('/appointments'),
      Icon: Calendar,
    },
    {
      label: 'Hồ sơ bệnh án',
      route: '/(tabs)/records?tab=INFO',
      active: pathname.includes('/records'),
      Icon: FileText,
    },
    {
      label: 'Đơn thuốc cá nhân',
      route: '/(tabs)/records?tab=PRESCRIPTIONS',
      active: false,
      Icon: Pill,
    },
    {
      label: 'Hóa đơn thanh toán',
      route: '/(tabs)/invoices',
      active: pathname.includes('/invoices'),
      Icon: Receipt,
    },
    {
      label: 'Thông báo & Nhắc lịch',
      route: '/notifications',
      active: pathname.includes('/notifications'),
      badge: unreadCount,
      Icon: Bell,
    },
    {
      label: 'Tư vấn trực tuyến',
      route: '/(tabs)/consultation',
      active: pathname.includes('/consultation'),
      Icon: MessageCircle,
    },
  ];

  return (
    <>
      <View style={[styles.actionsRow, inTabHeader && { marginRight: 14 }]}>
        {/* 1. Nút Quét mã QR Check-in (cạnh nút Thông báo) */}
        <Pressable style={styles.iconBtn} onPress={handleOpenQrScanner} hitSlop={6}>
          <ScanLine size={19} color="#ffffff" />
        </Pressable>

        {/* 2. Nút Thông báo */}
        {user ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/notifications')}
            hitSlop={6}>
            <Bell size={19} color="#ffffff" />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        {/* 3. Nút Tài khoản (bấm mở menu trượt từ phải sang như Web) */}
        <Pressable style={styles.accountBtn} onPress={openDrawer} hitSlop={6}>
          {user ? (
            avatarUri && !avatarFailed ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarBtnImg}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <View style={styles.avatarLetterCircle}>
                <Text style={styles.avatarLetterText}>{avatarLetter}</Text>
              </View>
            )
          ) : (
            <LogIn size={19} color="#ffffff" />
          )}
        </Pressable>
      </View>

      {/* Menu trượt từ bên phải sang (giống PatientHeader trên Web) */}
      <Modal
        visible={drawerMounted}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeDrawer()}>
        <View style={styles.drawerRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={styles.backdropPress} onPress={() => closeDrawer()} />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawerPanel,
              {
                width: DRAWER_WIDTH,
                transform: [{ translateX: slideX }],
              },
            ]}>
            {/* Phần thông tin tài khoản trên đầu Drawer */}
            <View style={[styles.drawerProfileHeader, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
              <View style={styles.drawerProfileRow}>
                {avatarUri && !avatarFailed ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.drawerAvatarImg}
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <View style={styles.drawerAvatarFallback}>
                    <Text style={styles.drawerAvatarLetter}>{avatarLetter}</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={styles.drawerName}>
                    {displayName}
                  </Text>
                  <Text numberOfLines={1} style={styles.drawerSub}>
                    {displaySub}
                  </Text>
                  <View style={styles.rolePill}>
                    <ShieldCheck size={11} color="#d1fae5" />
                    <Text style={styles.rolePillText}>Bệnh nhân Crown Dental</Text>
                  </View>
                </View>

                <Pressable style={styles.drawerCloseBtn} onPress={() => closeDrawer()} hitSlop={8}>
                  <X size={18} color="#ffffff" />
                </Pressable>
              </View>
            </View>

            {/* Danh sách menu điều hướng */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.drawerMenuContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionHeader}>DANH MỤC CHÍNH</Text>

              {mainNavItems.map((item) => {
                const Icon = item.Icon;
                return (
                  <Pressable
                    key={item.label}
                    style={[styles.menuItem, item.active && styles.menuItemActive]}
                    onPress={() => navigateFromDrawer(item.route)}>
                    <Icon
                      size={18}
                      color={item.active ? Colors.primaryDark : Colors.onPrimaryMuted}
                    />
                    <Text
                      style={[styles.menuItemText, item.active && styles.menuItemTextActive]}>
                      {item.label}
                    </Text>
                    {item.badge && item.badge > 0 ? (
                      <View style={styles.menuBadge}>
                        <Text style={styles.menuBadgeText}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}

              <View style={styles.drawerDivider} />
              <Text style={styles.sectionHeader}>TÀI KHOẢN & TIỆN ÍCH</Text>

              <Pressable
                style={[
                  styles.menuItem,
                  pathname.includes('/profile') && styles.menuItemActive,
                ]}
                onPress={() => navigateFromDrawer('/profile')}>
                <User
                  size={18}
                  color={
                    pathname.includes('/profile') ? Colors.primaryDark : Colors.onPrimaryMuted
                  }
                />
                <Text
                  style={[
                    styles.menuItemText,
                    pathname.includes('/profile') && styles.menuItemTextActive,
                  ]}>
                  Thông tin tài khoản & Bảo hiểm
                </Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() =>
                  closeDrawer(() => {
                    setCheckInOpen(true);
                  })
                }>
                <QrCode size={18} color={Colors.onPrimaryMuted} />
                <Text style={styles.menuItemText}>Quét mã QR Check-in tại quầy</Text>
              </Pressable>
            </ScrollView>

            {/* Footer Đăng xuất & Hotline */}
            <View
              style={[
                styles.drawerFooter,
                { paddingBottom: Math.max(insets.bottom, 14) + 6 },
              ]}>
              <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <LogOut size={16} color="#fecdd3" />
                <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
              </Pressable>

              <Pressable
                style={styles.hotlineRow}
                onPress={() => Linking.openURL('tel:19008059')}>
                <Phone size={12} color={Colors.onPrimaryMuted} />
                <Text style={styles.hotlineText}>
                  Hotline hỗ trợ: <Text style={{ color: '#ffffff', fontWeight: '800' }}>1900 8059</Text>
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Modal Camera Quét mã QR Check-in */}
      <CheckInModal
        visible={checkInOpen}
        onClose={() => setCheckInOpen(false)}
        onSuccess={onCheckInSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarBtnImg: {
    width: '100%',
    height: '100%',
  },
  avatarLetterCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetterText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
  },
  backdropPress: {
    flex: 1,
  },
  drawerPanel: {
    height: '100%',
    backgroundColor: '#006849',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: -6, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 16,
  },
  drawerProfileHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#00553b',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  drawerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  drawerAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  drawerAvatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarLetter: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  drawerName: { fontSize: 15, fontWeight: '800', color: '#ffffff' },
  drawerSub: { fontSize: 11.5, color: Colors.onPrimaryMuted, marginTop: 2 },
  rolePill: {
    marginTop: 5,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  rolePillText: { fontSize: 10, fontWeight: '700', color: '#ecfdf5' },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerMenuContent: {
    padding: 12,
    gap: 4,
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 10.5,
    fontWeight: '800',
    color: Colors.onPrimaryMuted,
    letterSpacing: 0.6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 13,
  },
  menuItemActive: {
    backgroundColor: '#ffffff',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  menuItemTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  menuBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  menuBadgeText: { color: '#ffffff', fontSize: 10.5, fontWeight: '800' },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 8,
  },
  drawerFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#004832',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    gap: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(225, 29, 72, 0.32)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.45)',
  },
  logoutBtnText: { color: '#ffe4e6', fontSize: 13, fontWeight: '800' },
  hotlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hotlineText: { fontSize: 12, color: Colors.onPrimaryMuted },
});
