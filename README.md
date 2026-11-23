# InWallet

Plataforma de controle financeiro pessoal com **backend REST em Django + Django REST Framework** e **aplicativo mobile multiplataforma em React Native (Expo + TypeScript)**.

## Visão Geral

O **InWallet** permite gerenciar contas bancárias, categorias, transações (receitas, despesas, parcelamentos e recorrências), metas de orçamento por categoria e importação de extratos bancários (OFX e CSV), além de fluxo de assinatura **InWallet PRO** com geração de Pix BR Code (EMVCo/BACEN).

## Arquitetura e Engenharia de Software

O projeto segue arquitetura **cliente-servidor desacoplada** e aplica princípios **SOLID** e padrões de projeto no backend e no mobile:

### Backend (`inwallet/`, `wallet/`, `users/`)
- **Service Layer (`wallet/services/`)**: isola regras de negócio das views e serializers (`TransactionService`, `DashboardService`, `StatementImportService`, `PaymentGatewayService`).
- **Strategy + Factory/Registry (`wallet/services/strategies.py`)**: `BaseTransactionStrategy`, `IncomeStrategy`, `ExpenseStrategy` e `TransactionStrategyFactory` aplicam o **Open/Closed Principle (OCP)** para cálculo de variação de saldo.
- **Atomicidade e Prevenção de Deadlocks (`wallet/services/transaction_service.py`)**: operações de criação, edição e exclusão usam `@db_transaction.atomic` e `Account.objects.select_for_update()`, com ordenação determinística de `pk` na troca de contas para evitar deadlocks no PostgreSQL.
- **Otimização de Consultas**:
  - `DashboardService` agrega métricas mensais e anuais em consulta única com `Sum(Case(When(...)))` e `TruncMonth`.
  - `StatementImportService` pré-carrega tags `[REF:...]` em memória para deduplicação em $O(1)$, evitando *N+1 queries*.
- **Autenticação e Permissões**: JWT Stateless (`djangorestframework-simplejwt`) com rotação de refresh token e permissão customizada `IsProUser` (`wallet/permissions.py`).

### Mobile (`frontend/`)
- **Expo + React Native + TypeScript**: compatível com Android, iOS e Web (`react-native-web`).
- **Layout Adaptativo (`frontend/App.tsx`)**: alterna automaticamente entre `TabBar` inferior (mobile) e `Sidebar` lateral (telas $\ge$ 840px).
- **Armazenamento Seguro (`frontend/src/api/client.ts`)**: tokens JWT armazenados via `expo-secure-store` (Keychain no iOS / KeyStore no Android), com fallback controlado para `AsyncStorage` na Web.
- **Refresh Token com Lock de Concorrência (`frontend/src/api/client.ts`)**: interceptador Axios compartilha uma única `refreshPromise` quando múltiplas requisições simultâneas retornam `401`.
- **Context API & Engine de Temas (`frontend/src/contexts/`)**: `AuthContext` para sessão e `ThemeContext` com `createThemedStyles` (cache de `StyleSheet` para temas `dark` e `light`).

## Tecnologias Utilizadas

| Camada | Tecnologias |
| :--- | :--- |
| **Backend** | Python 3.12, Django 4.2 LTS, Django REST Framework, SimpleJWT, django-cors-headers, WhiteNoise, Gunicorn |
| **Banco de Dados** | PostgreSQL 16 (Docker/Produção) ou SQLite (desenvolvimento local) |
| **Mobile** | Expo (~58), React Native (0.88), React 19, TypeScript, Axios, `expo-secure-store`, `@react-native-async-storage/async-storage` |
| **Qualidade & Infra** | `pytest`, `pytest-django`, `flake8`, Docker & Docker Compose |

## Estrutura do Projeto

```text
InWallet/
├── inwallet/               # Configurações centrais do Django (settings, urls, wsgi)
├── wallet/                 # Domínio financeiro (models, serializers, api_views, permissions, tests)
│   └── services/           # Regras de negócio (TransactionService, DashboardService, StatementImportService, strategies)
├── users/                  # Autenticação, perfil, assinaturas PRO e PaymentGatewayService (Pix EMVCo)
├── frontend/               # Aplicativo Mobile Expo / React Native + TypeScript
│   ├── App.tsx             # Navegação por estado e layout responsivo (TabBar / Sidebar)
│   └── src/
│       ├── api/            # Cliente Axios, SecureStore e refresh automático de JWT
│       ├── contexts/       # AuthContext e ThemeContext
│       ├── components/     # Charts, Modais (Upgrade, Importação OFX/CSV, Legal), UI base
│       └── screens/        # Login, Register, Dashboard, Transactions, NewTransaction, Manage
├── docs/                   # Documentação de deploy e documentos legais (Privacidade / Termos)
├── DockerFile              # Imagem de produção do backend
└── docker-compose.yml      # Orquestração PostgreSQL + Backend
```

## Como Executar Localmente

### 1. Backend (Django)

```bash
# Criar e ativar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env

# Aplicar migrações e iniciar o servidor acessível na rede local (para Expo Go)
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### 2. Aplicativo Mobile (Expo)

> **Importante:** execute os comandos do Expo dentro da pasta `frontend/`.

```bash
cd frontend
npm install
npx expo start
```

- Pressione `a` para Android, `i` para iOS, `w` para Web ou escaneie o QR Code no **Expo Go** (na mesma rede Wi-Fi do backend).
- Opcionalmente, defina `EXPO_PUBLIC_API_URL` para apontar explicitamente para a URL do backend.

### 3. Docker Compose (PostgreSQL + Backend)

```bash
docker compose up --build
```

## Testes e Verificações

```bash
# Testes unitários e de integração do backend
.venv/bin/pytest

# Verificação do Django
.venv/bin/python manage.py check

# Verificação de tipos TypeScript no mobile
cd frontend && npx tsc --noEmit
```

## Autores

- **Samuel Jonas** — `samueljonascali@gmail.com`
- **Jairon José** — `jaironmitoj@gmail.com`
