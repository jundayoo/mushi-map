import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { getButtonAccessibilityProps } from '../utils/accessibility';

interface AccessibleButtonProps {
  onPress: () => void;
  title: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onPress,
  title,
  accessibilityLabel,
  accessibilityHint,
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = 'primary',
  size = 'medium',
  icon,
}) => {
  const isDisabled = disabled || loading;
  
  const accessibilityProps = getButtonAccessibilityProps(
    accessibilityLabel || title,
    accessibilityHint,
    isDisabled
  );

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDisabled ? '#A5D6A7' : '#4CAF50',
        };
      case 'secondary':
        return {
          backgroundColor: isDisabled ? '#E0E0E0' : '#757575',
        };
      case 'danger':
        return {
          backgroundColor: isDisabled ? '#FFCDD2' : '#F44336',
        };
    }
  };

  const getSizeStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          button: { paddingVertical: 8, paddingHorizontal: 16 },
          text: { fontSize: 14 },
        };
      case 'medium':
        return {
          button: { paddingVertical: 12, paddingHorizontal: 24 },
          text: { fontSize: 16 },
        };
      case 'large':
        return {
          button: { paddingVertical: 16, paddingHorizontal: 32 },
          text: { fontSize: 18 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        getVariantStyles(),
        sizeStyles.button,
        style,
        isDisabled && styles.disabled,
      ]}
      {...accessibilityProps}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          {icon && icon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              textStyle,
              isDisabled && styles.disabledText,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.6,
    elevation: 0,
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default AccessibleButton;