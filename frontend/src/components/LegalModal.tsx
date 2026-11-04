import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radius, shadowCard, spacing, topInset } from "../theme";
import { Button } from "./ui";
import { Icon } from "./Icon";

export type LegalDocType = "terms" | "privacy" | null;

interface LegalSection {
  heading: string;
  paragraphs: string[];
}

const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "1. Objeto do Aplicativo",
    paragraphs: [
      "O inWallet é uma ferramenta tecnológica voltada exclusivamente ao auxílio na organização e controle financeiro pessoal, permitindo ao usuário registrar manualmente suas contas, categorias, metas mensais e lançamentos de receitas e despesas para visualização de relatórios e gráficos consolidados.",
    ],
  },
  {
    heading: "2. Isenção Expressa de Responsabilidade",
    paragraphs: [
      "Ausência de Assessoria ou Consultoria: O inWallet é estritamente uma ferramenta de apoio à organização financeira pessoal e NÃO constitui, sob nenhuma hipótese, consultoria, assessoria ou recomendação de investimentos, planejamento fiduciário, análise de valores mobiliários, assessoria jurídica ou serviço de contabilidade oficial (nos termos das normas da CVM, do Banco Central do Brasil e do CFC).",
      "Caráter Declarativo dos Dados: Todos os saldos, valores, datas e classificações exibidos no aplicativo decorrem exclusivamente dos lançamentos inseridos manualmente pelo próprio usuário. O inWallet não audita a exatidão contábil nem realiza conciliação bancária oficial.",
      "Decisões Financeiras: Toda e qualquer decisão de gasto, poupança, contratação de crédito ou investimento tomada pelo usuário com base nos gráficos, indicadores ou metas exibidos no aplicativo é de responsabilidade única, exclusiva e integral do usuário, não cabendo ao inWallet qualquer responsabilização por eventuais perdas financeiras.",
    ],
  },
  {
    heading: "3. Responsabilidades do Usuário",
    paragraphs: [
      "Manter o sigilo de suas credenciais de acesso (usuário e senha) e proteger o desbloqueio físico do seu dispositivo móvel.",
      "Utilizar o aplicativo apenas para fins lícitos e pessoais, conferindo seus extratos bancários oficiais diretamente junto às suas instituições financeiras.",
    ],
  },
  {
    heading: "4. Encerramento de Conta",
    paragraphs: [
      "O usuário pode encerrar sua conta a qualquer momento diretamente pelo aplicativo (Ajustes > Excluir Minha Conta), ciente de que a exclusão removerá de forma permanente e irreversível todos os seus lançamentos e cadastros financeiros.",
    ],
  },
];

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "1. Dados Coletados e Finalidade (LGPD)",
    paragraphs: [
      "Em conformidade com a Lei Geral de Proteção de Dados Pessoais — LGPD (Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014), o inWallet coleta exclusivamente os dados necessários para a organização financeira pessoal:",
      "• Dados Cadastrais: Nome de usuário, e-mail e primeiro nome (opcional) para autenticação e identificação da conta.",
      "• Dados Financeiros Declarados: Contas, saldos, categorias, metas mensais e transações inseridas pelo usuário, processados unicamente para exibir relatórios ao próprio titular.",
    ],
  },
  {
    heading: "2. Não Compartilhamento com Terceiros",
    paragraphs: [
      "Transações, saldos bancários, metas e hábitos financeiros NÃO são vendidos, alugados, cedidos ou compartilhados com terceiros, corretoras, instituições financeiras, birôs de crédito ou redes de publicidade.",
      "O aplicativo não utiliza rastreadores comportamentais de anúncios nem comercializa perfis de consumo.",
    ],
  },
  {
    heading: "3. Segurança e Armazenamento Criptografado",
    paragraphs: [
      "Os tokens de autenticação (JWT Access e Refresh) são armazenados de forma criptografada no hardware seguro do dispositivo (iOS Keychain e Android Keystore / EncryptedSharedPreferences via expo-secure-store).",
      "As senhas são protegidas por hash criptográfico unidirecional e todas as consultas são isoladas por usuário autenticado.",
    ],
  },
  {
    heading: "4. Direitos do Titular e Exclusão Total (Art. 18 da LGPD)",
    paragraphs: [
      "O titular pode visualizar, corrigir seus dados, exportar seu extrato em CSV e solicitar a eliminação total de seus dados a qualquer momento em Ajustes > Excluir Minha Conta.",
      "A exclusão de conta remove imediatamente o usuário e apaga em cascata (CASCADE) todas as contas bancárias, categorias, metas e transações vinculadas no banco de dados.",
    ],
  },
];

export const LegalModal: React.FC<{
  doc: LegalDocType;
  onClose: () => void;
  onAccept?: () => void;
}> = ({ doc, onClose, onAccept }) => {
  if (!doc) return null;

  const isTerms = doc === "terms";
  const title = isTerms
    ? "Termos de Uso — inWallet"
    : "Política de Privacidade (LGPD)";
  const subtitle = isTerms
    ? "Condições de uso e cláusula de isenção de responsabilidade"
    : "Proteção de dados financeiros e direitos do titular (Lei nº 13.709/2018)";
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <Modal
      visible={!!doc}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, shadowCard]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Fechar documento legal"
            >
              <Icon name="close" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            {sections.map((sec) => (
              <View key={sec.heading} style={styles.section}>
                <Text style={styles.sectionHeading}>{sec.heading}</Text>
                {sec.paragraphs.map((p, idx) => (
                  <Text key={idx} style={styles.paragraph}>
                    {p}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            {onAccept && (
              <Button
                title="Li e Concordo com os Termos"
                onPress={() => {
                  onAccept();
                  onClose();
                }}
                style={{ flex: 1 }}
              />
            )}
            <Button
              title="Fechar"
              variant="ghost"
              onPress={onClose}
              style={onAccept ? undefined : { flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: topInset,
    paddingBottom: spacing.xl,
  },
  sheet: {
    width: "100%",
    maxWidth: 640,
    maxHeight: "90%",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  closeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  scroll: {
    paddingHorizontal: spacing.xl,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeading: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  paragraph: {
    color: colors.textMuted,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
});

