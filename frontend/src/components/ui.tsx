import React, { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {
  colors,
  maxContentWidth,
  radius,
  shadowCard,
  spacing,
  topInset,
} from "../theme";
import { Icon, IconName } from "./Icon";

/** Container que centraliza o conteúdo. Aceita fluid para ocupar largura total no desktop. */
export const Screen: React.FC<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  fluid?: boolean;
}> = ({ children, style, fluid = false }) => (
  <View style={styles.screenOuter}>
    <View style={[styles.screenInner, fluid && styles.screenFluid, style]}>
      {children}
    </View>
  </View>
);

type Variant = "primary" | "success" | "danger" | "ghost" | "outline";

export const Button: React.FC<{
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}> = ({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  small,
  style,
}) => {
  const bg: Record<Variant, string> = {
    primary: colors.primary,
    success: colors.income,
    danger: colors.expense,
    ghost: colors.surfaceAlt,
    outline: "transparent",
  };

  const textColors: Record<Variant, string> = {
    primary: colors.white,
    success: colors.white,
    danger: colors.white,
    ghost: colors.textMuted,
    outline: colors.primary,
  };

  const inactive = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg[variant] },
        variant === "outline" && {
          borderWidth: 1,
          borderColor: colors.borderStrong,
        },
        inactive && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "ghost" || variant === "outline"
              ? colors.primary
              : colors.white
          }
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            { color: textColors[variant] },
            small && { fontSize: 13 },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export const Field: React.FC<
  TextInputProps & {
    label?: string;
    error?: string;
    hint?: string;
    secure?: boolean;
  }
> = ({ label, error, hint, secure, style, ...rest }) => {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          !!error && styles.inputRowError,
        ]}
      >
        <TextInput
          placeholderTextColor={colors.textFaint}
          accessibilityLabel={label || rest.placeholder}
          style={[styles.input, style]}
          secureTextEntry={secure && hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          {...rest}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Mostrar senha" : "Ocultar senha"}
          >
            <Text style={styles.eye}>{hidden ? "Mostrar" : "Ocultar"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
      {!error && !!hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
};

export const Input = Field;

export const Card: React.FC<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => (
  <View style={[styles.card, shadowCard, style]}>{children}</View>
);

export const SectionTitle: React.FC<{
  title: string;
  subtitle?: string;
  right?: ReactNode;
}> = ({ title, subtitle, right }) => (
  <View style={styles.sectionRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

export const EmptyState: React.FC<{
  icon?: IconName;
  title: string;
  subtitle?: string;
}> = ({ icon = "wallet", title, subtitle }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIconWrap}>
      <Icon name={icon} size={22} color={colors.textMuted} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {!!subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
  </View>
);

export const Header: React.FC<{
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
}> = ({ title, subtitle, left, right }) => (
  <View style={styles.header}>
    {left}
    <View style={{ flex: 1 }}>
      <Text style={styles.headerTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.headerSub}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

export const Chip: React.FC<{
  label: string;
  active?: boolean;
  onPress: () => void;
  count?: number;
}> = ({ label, active, onPress, count }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
    accessibilityState={{ selected: !!active }}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
    {count !== undefined && (
      <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
        <Text
          style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}
        >
          {count}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

export const Badge: React.FC<{
  label: string;
  color?: string;
  bg?: string;
}> = ({ label, color = colors.primary, bg = colors.primarySoft }) => (
  <View style={[styles.badge, { backgroundColor: bg }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  screenOuter: { flex: 1, backgroundColor: colors.bg, alignItems: "center" },
  screenInner: { flex: 1, width: "100%", maxWidth: maxContentWidth },
  screenFluid: { maxWidth: 1200 },

  button: {
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  buttonText: { fontWeight: "600", fontSize: 14, letterSpacing: 0.1 },

  fieldWrap: { marginTop: spacing.md },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
  },
  inputRowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },
  inputRowError: {
    borderColor: colors.expense,
  },
  input: { flex: 1, color: colors.text, fontSize: 14.5, paddingVertical: 11 },
  eye: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  fieldError: {
    color: colors.expense,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  fieldHint: { color: colors.textFaint, fontSize: 12, marginTop: 4 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  empty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: topInset,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  headerSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  chipTextActive: { color: colors.white, fontWeight: "600" },
  chipBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  chipBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipBadgeTextActive: {
    color: colors.white,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
  },
});
