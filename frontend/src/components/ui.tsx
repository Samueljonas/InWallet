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
      style={[
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg[variant] },
        variant === "outline" && {
          borderWidth: 1.5,
          borderColor: colors.primaryBorder,
        },
        inactive && { opacity: 0.55 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "ghost" || variant === "outline" ? colors.primary : colors.white}
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
          style={[styles.input, style]}
          secureTextEntry={secure && hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          {...rest}
        />
        {secure && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Text style={styles.eye}>{hidden ? "Mostrar" : "Ocultar"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
      {!error && !!hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
};

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
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

export const EmptyState: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIconWrap}>
      <Text style={styles.emptyIcon}>{icon}</Text>
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
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
    {count !== undefined && (
      <View style={[styles.chipBadge, active && styles.chipBadgeActive]}>
        <Text style={[styles.chipBadgeText, active && styles.chipBadgeTextActive]}>
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
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  buttonText: { fontWeight: "700", fontSize: 15 },

  fieldWrap: { marginTop: spacing.md },
  fieldLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
  },
  inputRowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  inputRowError: {
    borderColor: colors.expense,
  },
  input: { flex: 1, color: "#0F172A", fontSize: 15, paddingVertical: 12 },
  eye: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  fieldError: { color: colors.expense, fontSize: 12, marginTop: 4, fontWeight: "500" },
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
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  sectionSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyIcon: { fontSize: 30 },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 6,
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
  headerTitle: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  headerSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.white, fontWeight: "700" },
  chipBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 6,
  },
  chipBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  chipBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
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
    fontWeight: "700",
    color: colors.text,
  },
});

