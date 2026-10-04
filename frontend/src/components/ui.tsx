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
import { colors, maxContentWidth, radius, spacing, topInset } from "../theme";

/** Container que centraliza e limita a largura (bom na web, neutro no celular). */
export const Screen: React.FC<{
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => (
  <View style={styles.screenOuter}>
    <View style={[styles.screenInner, style]}>{children}</View>
  </View>
);

type Variant = "primary" | "success" | "danger" | "ghost";

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
        inactive && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={[styles.buttonText, small && { fontSize: 13 }]}>
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
  return (
    <View style={styles.fieldWrap}>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View
        style={[styles.inputRow, !!error && { borderColor: colors.expense }]}
      >
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, style]}
          secureTextEntry={secure && hidden}
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
  <View style={[styles.card, style]}>{children}</View>
);

export const SectionTitle: React.FC<{ title: string; right?: ReactNode }> = ({
  title,
  right,
}) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {right}
  </View>
);

export const EmptyState: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyIcon}>{icon}</Text>
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
}> = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screenOuter: { flex: 1, backgroundColor: colors.bg, alignItems: "center" },
  screenInner: { flex: 1, width: "100%", maxWidth: maxContentWidth },

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
  buttonText: { color: colors.white, fontWeight: "700", fontSize: 15 },

  fieldWrap: { marginTop: spacing.md },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, paddingVertical: 12 },
  eye: { color: colors.primaryLight, fontSize: 12, fontWeight: "700" },
  fieldError: { color: colors.expense, fontSize: 12, marginTop: 4 },
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
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },

  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: { fontSize: 38, marginBottom: spacing.sm },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: topInset,
    paddingBottom: spacing.md,
  },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: "800" },
  headerSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },

  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: colors.white },
});
