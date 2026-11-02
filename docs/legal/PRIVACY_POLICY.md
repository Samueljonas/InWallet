# Política de Privacidade — inWallet

**Última atualização:** 02 de novembro de 2026

Esta Política de Privacidade descreve como o aplicativo mobile **inWallet** realiza o tratamento dos dados pessoais e financeiros inseridos pelos usuários, em estrita conformidade com a **Lei Geral de Proteção de Dados Pessoais — LGPD (Lei nº 13.709/2018)** e com o **Marco Civil da Internet (Lei nº 12.965/2014)**.

---

## 1. Dados Coletados e Finalidade do Tratamento

O **inWallet** coleta exclusivamente os dados estritamente necessários para a prestação do serviço de organização financeira pessoal (Princípio da Necessidade — Art. 6º, III da LGPD):

1. **Dados Cadastrais de Identificação:** Nome de usuário (`username`), endereço de e-mail e primeiro nome/sobrenome (opcional), utilizados unicamente para autenticação, identificação da conta e recuperação de acesso.
2. **Dados Financeiros Pessoais Declarados:** Nomes de contas/carteiras, saldos informados, categorias personalizadas, metas mensais de gastos e lançamentos de receitas e despesas (valores, datas e descrições). Esses dados são processados exclusivamente para exibir relatórios, gráficos e saldos consolidados ao próprio titular.
3. **Registros Técnicos de Acesso:** Data, hora e endereço IP de conexões autenticadas à API, mantidos sob sigilo nos termos do Art. 15 do Marco Civil da Internet para fins de segurança da informação e prevenção a fraudes.

O aplicativo **não** coleta dados de localização (GPS), lista de contatos, microfone, câmera ou identificadores publicitários, nem realiza conexão automática com instituições bancárias sem ação direta do usuário.

---

## 2. Não Compartilhamento com Terceiros

O **inWallet** declara expressamente que:

- **Transações, saldos bancários, metas e hábitos financeiros NÃO são vendidos, alugados, cedidos ou compartilhados com terceiros**, corretoras, instituições financeiras, birôs de crédito ou redes de publicidade.
- O aplicativo não utiliza rastreadores comportamentais de anúncios nem comercializa perfis de consumo.
- Dados somente poderão ser fornecidos mediante ordem judicial específica, nos estritos limites do Marco Civil da Internet e da LGPD.

---

## 3. Segurança e Armazenamento dos Dados

Adotamos medidas técnicas e administrativas aptas a proteger os dados pessoais contra acessos não autorizados (Art. 46 da LGPD):

- **Armazenamento Seguro no Dispositivo Mobile:** Os tokens de sessão (JWT Access e Refresh) são armazenados de forma criptografada no hardware seguro do sistema operacional (**iOS Keychain** e **Android Keystore / EncryptedSharedPreferences** via `expo-secure-store`).
- **Criptografia de Senhas:** As senhas são submetidas a algoritmos de hash criptográfico unidirecional (PBKDF2/SHA-256) no servidor, jamais sendo armazenadas em texto puro.
- **Segregação Lógica:** Cada consulta ao banco de dados é estritamente vinculada ao identificador único do usuário autenticado, impedindo acesso cruzado entre contas.

---

## 4. Direitos do Titular e Exclusão Definitiva de Conta (Art. 18 da LGPD)

Em cumprimento ao Art. 18 da LGPD e às diretrizes de privacidade da Google Play Store e Apple App Store, o titular dos dados possui controle integral sobre suas informações diretamente no aplicativo:

- **Acesso, Correção e Portabilidade:** O usuário pode visualizar, editar seus cadastros e exportar seu extrato financeiro em formato aberto (`.csv`) a qualquer momento.
- **Eliminação Total e Imediata (Art. 18, VI):** O usuário pode excluir sua conta autonomamente no aplicativo acessando **Ajustes > Excluir Minha Conta**. A confirmação dispara a **exclusão imediata e irreversível em cascata (`CASCADE`)** do perfil do usuário e de todas as contas bancárias, categorias, metas e transações associadas no banco de dados, além da limpeza completa das credenciais locais no dispositivo.

---

## 5. Encarregado pelo Tratamento de Dados (DPO) e Contato

Para exercer direitos previstos na LGPD, esclarecer dúvidas sobre esta Política de Privacidade ou contatar o Encarregado de Proteção de Dados (DPO):

- **Controlador:** Equipe Responsável pelo inWallet *(Pendente de preenchimento jurídico: Razão Social / CNPJ ou Nome Completo do Controlador)*
- **Canal de Atendimento / DPO:** `privacidade@inwallet.app` *(Pendente de validação do e-mail oficial de suporte)*

