# Guia de Deploy em Produção — InWallet

Este guia descreve o passo a passo para publicar o **Backend (Django + DRF + PostgreSQL)** e o **Frontend (React Native / Expo SDK 58 Web & Mobile)** em produção.

---

## 1. Variáveis de Ambiente Obrigatórias (Backend)

Crie um arquivo `.env` na raiz do servidor (ou configure no painel do provedor Cloud) baseado no `.env.example`:

```env
SECRET_KEY=gere-uma-chave-forte-de-50-caracteres-aleatorios
DEBUG=False
ALLOWED_HOSTS=api.seudominio.com.br,localhost,127.0.0.1
SECURE_SSL_REDIRECT=True
CORS_ALLOWED_ORIGINS=https://app.seudominio.com.br

# Banco de Dados PostgreSQL (Opção A: URL única para Render/Railway/Fly.io)
DATABASE_URL=postgres://usuario:senha@host:5432/inwallet

# Banco de Dados PostgreSQL (Opção B: Variáveis separadas para Docker Compose)
DB_NAME=inwallet
DB_USER=inwallet
DB_PASS=senha_forte_postgres
DB_HOST=db
DB_PORT=5432

# Gateway de Pagamento & Pix EMV
PAYMENT_WEBHOOK_SECRET=segredo_webhook_asaas_ou_stripe
PIX_MERCHANT_KEY=sua_chave_pix@dominio.com.br
PIX_MERCHANT_CITY=SAO PAULO

# E-mail Transacional (Recuperação de Senha)
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=587
EMAIL_HOST_USER=resend
EMAIL_HOST_PASSWORD=re_sua_api_key
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=InWallet <noreply@seudominio.com.br>
```

---

## 2. Deploy com Docker & Docker Compose (VPS / Cloud)

O projeto já conta com [`DockerFile`](../DockerFile), [`docker-compose.yml`](../docker-compose.yml) e [`.dockerignore`](../.dockerignore) configurados com:
- Usuário não-root (`appuser`)
- Coleta automática de estáticos (`WhiteNoise`)
- Migrações automáticas na inicialização (`python manage.py migrate --noinput`)
- Servidor WSGI de produção (`gunicorn` com 3 workers)
- Healthcheck nativo em `GET /api/v1/health/`

### Comandos para subir em produção:

```bash
# 1. Construir e iniciar os containers em background
docker compose up -d --build

# 2. Verificar a saúde da API e do banco
curl http://localhost:8000/api/v1/health/
# Resposta esperada: {"status":"ok","database":"connected","service":"inwallet-api","version":"1.0.0"}

# 3. (Opcional) Criar superusuário administrativo
docker compose exec backend python manage.py createsuperuser
```

---

## 3. Deploy do Frontend Web (Vercel / Netlify / Cloudflare Pages)

Para gerar o bundle estático otimizado do **Expo Web**:

```bash
cd frontend
EXPO_PUBLIC_API_URL=https://api.seudominio.com.br npx expo export --platform web
```

O diretório `frontend/dist` conterá os arquivos estáticos prontos para publicação em qualquer CDN.

---

## 4. Build Nativo Android & iOS (Expo Application Services - EAS)

```bash
cd frontend
npm install -g eas-cli
eas login
eas build:configure

# Gerar APK / AAB para Google Play Store
EXPO_PUBLIC_API_URL=https://api.seudominio.com.br eas build --platform android

# Gerar IPA para Apple App Store
EXPO_PUBLIC_API_URL=https://api.seudominio.com.br eas build --platform ios
```

