import React, { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Colors } from '../constants/theme';

interface OtpCodeInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function OtpCodeInput({ value, onChange, disabled = false }: OtpCodeInputProps) {
  const inputsRef = useRef<Array<React.ComponentRef<typeof TextInput> | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);

  const handleChangeText = (index: number, raw: string) => {
    const digitsOnly = raw.replace(/[^0-9]/g, '');

    // Hỗ trợ dán nguyên chuỗi 6 chữ số OTP
    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 6).split('');
      const next = Array.from({ length: 6 }, (_, i) => chars[i] ?? '');
      onChange(next);
      const focusTarget = Math.min(chars.length, 5);
      inputsRef.current[focusTarget]?.focus();
      return;
    }

    const next = [...value];
    next[index] = digitsOnly;
    onChange(next);

    if (digitsOnly && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      const next = [...value];
      next[index - 1] = '';
      onChange(next);
      inputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: 6 }).map((_, index) => {
        const digit = value[index] ?? '';
        const isFocused = focusedIndex === index;
        return (
          <TextInput
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            value={digit}
            editable={!disabled}
            keyboardType="number-pad"
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={index === 0 ? 'sms-otp' : 'off'}
            maxLength={6}
            selectTextOnFocus
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((prev) => (prev === index ? null : prev))}
            onChangeText={(text) => handleChangeText(index, text)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            style={[
              styles.box,
              digit ? styles.boxFilled : null,
              isFocused ? styles.boxFocused : null,
              disabled ? styles.boxDisabled : null,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 16,
  },
  box: {
    flex: 1,
    height: 52,
    maxWidth: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  boxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  boxFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#ffffff',
    borderWidth: 2,
  },
  boxDisabled: {
    opacity: 0.6,
  },
});
