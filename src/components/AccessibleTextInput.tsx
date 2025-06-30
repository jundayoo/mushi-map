import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getTextInputAccessibilityProps } from '../utils/accessibility';

interface AccessibleTextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  required?: boolean;
  maxLength?: number;
  editable?: boolean;
}

const AccessibleTextInput: React.FC<AccessibleTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  style,
  required = false,
  maxLength,
  editable = true,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const accessibilityProps = getTextInputAccessibilityProps(
    `${label}${required ? '、必須' : ''}`,
    placeholder,
    error,
    value
  );

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getLabelAccessibilityProps = () => {
    return {
      accessible: true,
      accessibilityLabel: `${label}${required ? '、必須項目' : ''}`,
      accessibilityRole: 'text' as const,
    };
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={() => inputRef.current?.focus()}
        activeOpacity={1}
        {...getLabelAccessibilityProps()}
      >
        <Text style={[styles.label, isFocused && styles.labelFocused]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      </TouchableOpacity>
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        !editable && styles.inputContainerDisabled,
      ]}>
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={maxLength}
          editable={editable}
          {...accessibilityProps}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
            accessible={true}
            accessibilityLabel={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
            accessibilityRole="button"
          >
            <MaterialIcons
              name={showPassword ? 'visibility-off' : 'visibility'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        )}
        
        {maxLength && (
          <Text
            style={styles.characterCount}
            accessible={true}
            accessibilityLabel={`${value.length}文字、最大${maxLength}文字`}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
      
      {error && (
        <View
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.error}>
            <MaterialIcons name="error-outline" size={16} color="#F44336" />
            {' '}{error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  labelFocused: {
    color: '#4CAF50',
  },
  required: {
    color: '#F44336',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  inputContainerFocused: {
    borderColor: '#4CAF50',
  },
  inputContainerError: {
    borderColor: '#F44336',
  },
  inputContainerDisabled: {
    backgroundColor: '#F5F5F5',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    color: '#999',
  },
  passwordToggle: {
    padding: 12,
  },
  characterCount: {
    paddingHorizontal: 8,
    fontSize: 12,
    color: '#666',
  },
  error: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AccessibleTextInput;