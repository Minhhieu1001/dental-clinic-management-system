import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  StatusBar,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardSafeViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Khoảng hở thêm giữa nội dung và bàn phím */
  extraSpace?: number;
}

/**
 * Container tự đẩy nội dung lên trên bàn phím cho cả màn hình chính, tab (có tabBarHideOnKeyboard)
 * và Modal trên Android Edge-to-Edge lẫn iOS.
 */
export function KeyboardSafeView({ children, style, extraSpace = 10 }: KeyboardSafeViewProps) {
  const ref = useRef<React.ComponentRef<typeof View>>(null);
  const insets = useSafeAreaInsets();
  const kbTopRef = useRef<number | null>(null);
  const kbHeightRef = useRef<number>(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [padding, setPadding] = useState(0);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const recompute = useCallback(() => {
    const top = kbTopRef.current;
    if (top == null) {
      setPadding(0);
      return;
    }

    ref.current?.measureInWindow((_x: number, y: number, _w: number, h: number) => {
      if (h <= 0) return;
      const screenH = Dimensions.get('screen').height;
      const statusH =
        Platform.OS === 'android' ? Math.max(StatusBar.currentHeight ?? 0, insets.top) : 0;

      // Trên Android, measureInWindow (getLocationInWindow) đôi khi thiếu StatusBar.currentHeight
      // so với endCoordinates.screenY (tính từ mép trên màn hình vật lý).
      const bottom =
        Platform.OS === 'android' && y + h + statusH <= screenH + 6
          ? y + h + statusH
          : y + h;

      const rawOverlap = Math.max(0, bottom - top);
      const maxKb = kbHeightRef.current > 0 ? kbHeightRef.current : rawOverlap;
      const overlap = Math.min(rawOverlap, maxKb);
      setPadding(overlap > 0 ? Math.round(overlap + extraSpace) : 0);
    });
  }, [extraSpace, insets.top]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      clearTimers();
      kbTopRef.current = e.endCoordinates.screenY;
      kbHeightRef.current = e.endCoordinates.height;
      recompute();
      // Đo lại sau khi React Navigation ẩn tab bar hoặc Android hoàn tất resize
      timersRef.current = [60, 160, 300].map((ms) => setTimeout(recompute, ms));
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      clearTimers();
      kbTopRef.current = null;
      kbHeightRef.current = 0;
      setPadding(0);
    });

    return () => {
      clearTimers();
      showSub.remove();
      hideSub.remove();
    };
  }, [recompute]);

  return (
    <View ref={ref} style={[{ flex: 1 }, style, { paddingBottom: padding }]} onLayout={recompute}>
      {children}
    </View>
  );
}
