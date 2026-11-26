import CircleCheck from 'lucide-react-native/icons/circle-check';
import X from 'lucide-react-native/icons/x';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

export interface SuccessModalPayload {
  title: string;
  message?: string;
  buttonText?: string;
  onDismiss?: () => void;
}

interface SuccessModalContextValue {
  showSuccess: (payload: SuccessModalPayload) => void;
  hideSuccess: () => void;
}

const SuccessModalContext = createContext<SuccessModalContextValue>({
  showSuccess: () => {},
  hideSuccess: () => {},
});

export function SuccessModalProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<SuccessModalPayload | null>(null);

  const showSuccess = useCallback((next: SuccessModalPayload) => {
    setPayload(next);
  }, []);

  const hideSuccess = useCallback(() => {
    setPayload((prev) => {
      prev?.onDismiss?.();
      return null;
    });
  }, []);

  return (
    <SuccessModalContext.Provider value={{ showSuccess, hideSuccess }}>
      {children}
      <Modal
        visible={Boolean(payload)}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={hideSuccess}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Pressable style={styles.closeBtn} onPress={hideSuccess} hitSlop={8}>
              <X size={18} color={Colors.textSecondary} />
            </Pressable>

            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <CircleCheck size={34} color="#ffffff" />
              </View>
            </View>

            <Text style={styles.title}>{payload?.title || 'Thao tác thành công!'}</Text>
            {payload?.message ? <Text style={styles.message}>{payload.message}</Text> : null}

            <Pressable style={styles.btn} onPress={hideSuccess}>
              <Text style={styles.btnText}>{payload?.buttonText || 'Đã hiểu'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SuccessModalContext.Provider>
  );
}

export function useSuccessModal() {
  return useContext(SuccessModalContext);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    shadowColor: '#009165',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1.5,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 13.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  btn: {
    marginTop: 18,
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
