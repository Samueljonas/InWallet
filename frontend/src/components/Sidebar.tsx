import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Tab } from "./TabBar";
import { radius, spacing } from "../theme";
import { createThemedStyles, useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { UpgradeModal } from "./UpgradeModal";
import { Icon, IconName } from "./Icon";

const NAV_ITEMS: { key: Tab; icon: IconName; label: string }[] = [
  { key: "home", icon: "home", label: "Dashboard" },
  { key: "transactions", icon: "transactions", label: "Extrato & Lançamentos" },
  { key: "manage", icon: "settings", label: "Configurações" },
];

interface SidebarProps {
  current: Tab;
  onChange: (t: Tab) => void;
  onAdd: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  current,
  onChange,
  onAdd,
}) => {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme, shadowCard } = useTheme();
  const styles = useStyles();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <View style={styles.sidebar}>
      {/* Brand / Logo */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Icon name="wallet" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.brandTitle}>InWallet</Text>
          <Text style={styles.brandSubtitle}>Gestão Financeira</Text>
        </View>
      </View>

      {/* Botão Novo Lançamento */}
      <TouchableOpacity
        style={[styles.addButton, shadowCard]}
        onPress={onAdd}
        activeOpacity={0.85}
        accessibilityLabel="Adicionar nova transação"
        accessibilityRole="button"
      >
        <Icon name="plus" size={16} color={colors.white} />
        <Text style={styles.addText}>Nova Transação</Text>
      </TouchableOpacity>

      {/* Links de Navegação */}
      <View style={styles.navGroup}>
        {NAV_ITEMS.map((item) => {
          const active = current === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => onChange(item.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
            >
              <Icon
                name={item.icon}
                size={16}
                color={active ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
              {active && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Card de Upgrade para Usuários Free */}
      {!user?.is_pro && (
        <TouchableOpacity
          style={styles.proPromoCard}
          onPress={() => setShowUpgradeModal(true)}
          activeOpacity={0.88}
        >
          <View style={styles.proPromoHeader}>
            <Text style={styles.proPromoBadge}>PRO</Text>
            <Text style={styles.proPromoTitle}>Passe para o PRO</Text>
          </View>
          <Text style={styles.proPromoDesc}>
            Contas ilimitadas, metas e exportação em CSV sem restrições.
          </Text>
          <Text style={styles.proPromoLink}>Conhecer planos</Text>
        </TouchableOpacity>
      )}

      {/* Alternador de Tema (Claro / Escuro) */}
      <TouchableOpacity
        style={styles.themeToggleBtn}
        onPress={toggleTheme}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={
          isDark ? "Ativar tema claro" : "Ativar tema escuro"
        }
      >
        <Icon
          name={isDark ? "sun" : "moon"}
          size={15}
          color={colors.textMuted}
        />
        <Text style={styles.themeToggleText}>
          {isDark ? "Tema Claro" : "Tema Escuro"}
        </Text>
      </TouchableOpacity>

      {/* Perfil & Logout no Rodapé da Sidebar */}
      {user && (
        <View style={styles.userFooter}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {(user.username || "U")[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.first_name || user.username}
              </Text>
              {user.is_pro && (
                <View style={styles.userProBadge}>
                  <Text style={styles.userProBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email || `@${user.username}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            accessibilityLabel="Sair da conta"
            accessibilityRole="button"
          >
            <Icon name="logout" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <UpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </View>
  );
};

const useStyles = createThemedStyles(({ colors }) => ({
  sidebar: {
    width: 260,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  addText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  navGroup: {
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.md,
    position: "relative",
  },
  navItemActive: {
    backgroundColor: colors.primarySoft,
  },
  navLabel: {
    fontSize: 13.5,
    fontWeight: "500",
    color: colors.textMuted,
  },
  navLabelActive: {
    color: colors.text,
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    right: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  userFooter: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textFaint,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  proPromoCard: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  proPromoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  proPromoBadge: {
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  proPromoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  proPromoDesc: {
    fontSize: 11.5,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 6,
  },
  proPromoLink: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  userProBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  userProBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "700",
  },
  themeToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  themeToggleText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.textMuted,
  },
}));
