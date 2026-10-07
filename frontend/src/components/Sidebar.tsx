import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Tab } from "./TabBar";
import { colors, radius, shadowCard, spacing } from "../theme";
import { useAuth } from "../contexts/AuthContext";

const NAV_ITEMS: { key: Tab; icon: string; label: string }[] = [
  { key: "home", icon: "🏠", label: "Dashboard" },
  { key: "transactions", icon: "🧾", label: "Extrato & Lançamentos" },
  { key: "manage", icon: "⚙️", label: "Configurações" },
];

interface SidebarProps {
  current: Tab;
  onChange: (t: Tab) => void;
  onAdd: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ current, onChange, onAdd }) => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.sidebar}>
      {/* Brand / Logo */}
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>💳</Text>
        </View>
        <View>
          <Text style={styles.brandTitle}>InWallet</Text>
          <Text style={styles.brandSubtitle}>Gestão Financeira</Text>
        </View>
      </View>

      {/* Botão Novo Lançamento em Destaque */}
      <TouchableOpacity
        style={[styles.addButton, shadowCard]}
        onPress={onAdd}
        activeOpacity={0.85}
      >
        <Text style={styles.addIcon}>+</Text>
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
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
              {active && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* Perfil & Logout no Rodapé da Sidebar */}
      {user && (
        <View style={styles.userFooter}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {(user.username || "U")[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.first_name || user.username}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email || `@${user.username}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            title="Sair"
          >
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: colors.white,
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
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  addIcon: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 22,
  },
  addText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  navGroup: {
    gap: 6,
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
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: "800",
  },
  activeIndicator: {
    position: "absolute",
    right: 0,
    top: 6,
    bottom: 6,
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
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textFaint,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: radius.sm,
  },
  logoutIcon: {
    fontSize: 16,
  },
});

