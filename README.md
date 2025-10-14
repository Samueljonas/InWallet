
 <h1>InWallet</h1>

Controle financeiro pessoal com Django
🧩 Visão Geral

O inWallet é um sistema web desenvolvido em Django com foco em controle e análise financeira pessoal.
O usuário pode registrar manualmente suas despesas e receitas, organizar por categorias, e visualizar relatórios de gastos mensais e por categoria.

🔍 Objetivo acadêmico:
Este projeto foi desenvolvido com fins educacionais, para demonstrar boas práticas de desenvolvimento web com Django, uso de banco de dados PostgreSQL e geração de relatórios financeiros simples.

🚀 Funcionalidades

✔️ Cadastro de contas (ex: Carteira, Nubank, Banco X)
✔️ Cadastro manual de transações (gastos e receitas)
✔️ Organização por categorias (ex: Alimentação, Transporte, Salário)
✔️ Dashboard com resumo financeiro mensal
✔️ Relatório de gastos por categoria (Top 5 gastos)
✔️ Sistema de login e autenticação de usuários
✔️ Preparado para integração futura com bancos e importação de extratos
✔️ Configuração via .env para segurança e portabilidade


⚙️ Tecnologias Utilizadas
Tecnologia	Descrição
Python 3.11+	Linguagem principal
Django 4.2 LTS	Framework web backend
PostgreSQL	Banco de dados relacional
django-environ	Configuração por variáveis de ambiente
Gunicorn	Servidor WSGI para deploy
Whitenoise	Gerenciamento de arquivos estáticos
Bootstrap 5	Estilização do front-end
Docker Compose	Orquestração de containers (banco + app)
⚙️ Instalação e Execução Local
🔹 1. Clonar o repositório
git clone:  github.com/Samueljonas/Projeto_DSW.git
cd inwallet

🔹 2. Criar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate

🔹 3. Instalar dependências
pip install -r requirements.txt

🔹 4. Configurar variáveis de ambiente

Crie um arquivo .env na raiz:

DEBUG=True
SECRET_KEY=chave_dev_trocar
DB_NAME=inwallet_db
DB_USER=inwallet_user
DB_PASS=senha_dev
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=127.0.0.1,localhost

🔹 5. Rodar migrações
python manage.py makemigrations
python manage.py migrate

🔹 6. Criar superusuário
python manage.py createsuperuser

🔹 7. Executar servidor local
python manage.py runserver


Acesse em: 👉 http://127.0.0.1:8000



🧠 Estrutura Lógica
Componente	Função
models.py	Define as tabelas: Account, Category, Transaction
views.py	Controla fluxo de dados (Dashboard, CRUD de transações, relatórios)
forms.py	Formulários Django ModelForm
urls.py	Mapeia rotas e URLs
templates/	Interface HTML com Bootstrap
settings.py	Configurações de ambiente e banco 
.env	Credenciais e variáveis seguras
.gitignore	Impede envio de arquivos sensíveis ao GitHub

📊 Relatórios e Análises

O dashboard mostra:

Saldos por conta

Resumo mensal (últimos 12 meses)

Top 5 categorias mais gastas

Esses dados são calculados usando QuerySets Django com funções de agregação (Sum, Case, When, TruncMonth), permitindo análises rápidas diretamente no banco.


🧑‍💻 Autores

Samuel Jonas
Jairon José

💼 Projeto desenvolvido para fins acadêmicos.
📧 samueljonascali@gmail.com
