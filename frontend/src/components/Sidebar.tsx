import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Tab } from "./TabBar";
import { colors, radius, shadowCard, spacing } from "../theme";
import { useAuth } from "../contexts/AuthContext";
import { UpgradeModal } from "./UpgradeModal";

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

export const Sidebar: React.FC<SidebarProps> = ({
  current,
  onChange,
  onAdd,
}) => {
  const { user, logout } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
        accessibilityLabel="Adicionar nova transação"
        accessibilityRole="button"
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
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
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
          <Text style={styles.proPromoLink}>Conhecer planos →</Text>
        </TouchableOpacity>
      )}

      {/* Perfil & Logout no Rodapé da Sidebar */}
      {user && (
        <View style={styles.userFooter}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {(user.username || "U")[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
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
            <Text style={styles.logoutIcon}>🚪</Text>
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
  proPromoCard: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
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
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  proPromoTitle: {
    fontSize: 13,
    fontWeight: "800",
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
    fontWeight: "800",
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
    fontWeight: "900",
  },
});
