# Sofia EduCoins - "Aprendendo responsabilidades e conquistando recompensas"

Sofia EduCoins é uma aplicação web completa, responsiva, moderna e gamificada desenvolvida para ensinar responsabilidade, organização, disciplina e educação financeira para crianças de forma divertida.

O sistema combina uma interface lúdica e visualmente rica para a criança (inspirada em Duolingo, Habitica e Khan Academy Kids) com um painel administrativo completo de controle para os pais.

---

## 🚀 Como Executar o Projeto Localmente (Sem Docker)

O projeto foi configurado com um fallback automático para **SQLite** para facilitar o desenvolvimento local imediato, eliminando a necessidade de servidores de banco de dados externos.

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **NPM** (instalado com o Node)

### Passo 1: Configurar e Rodar o Backend

1. Abra um terminal e entre na pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Execute o comando para sincronizar o banco de dados SQLite (`dev.db`):
   ```bash
   npx prisma db push
   ```
4. Popule o banco com dados de teste (Medalhas, Itens da Loja, Tarefas Iniciais):
   ```bash
   npx prisma db seed
   ```
5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O servidor backend estará rodando em: **`http://localhost:5000`**
   A documentação interativa da API (Swagger UI) estará acessível em: **`http://localhost:5000/api-docs`**

---

### Passo 2: Configurar e Rodar o Frontend

1. Abra um novo terminal na pasta raiz e entre na pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do React (Vite):
   ```bash
   npm run dev
   ```
   A aplicação React estará rodando localmente em: **`http://localhost:5173`**

---

## 🐳 Como Executar com Docker (PostgreSQL)

Se você tiver o Docker instalado e quiser rodar o projeto com PostgreSQL e containers isolados, utilize o Docker Compose.

1. Na raiz do projeto, configure a variável `DATABASE_URL` no arquivo `./backend/.env` para apontar para o PostgreSQL do container:
   ```env
   DATABASE_URL="postgresql://postgres:postgrespassword@postgres:5432/educoins_db?schema=public"
   ```
2. Modifique o provider do banco no arquivo `./backend/prisma/schema.prisma` para `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Construa e suba todos os containers com Docker Compose:
   ```bash
   docker compose up --build
   ```
4. Em um terminal separado, rode as migrações e o seed dentro do container do backend:
   ```bash
   docker exec -it educoins-backend npx prisma migrate dev --name init
   docker exec -it educoins-backend npx prisma db seed
   ```
   - O Frontend estará disponível em: **`http://localhost:5173`**
   - O Backend estará disponível em: **`http://localhost:5000`**

---

## 🔑 Credenciais para Testes e Demonstração

Para facilitar a validação de todos os fluxos de forma rápida, a base de dados já vem pré-configurada com as seguintes contas (Senha padrão: `password123`):

### 1. Espaço da Sofia (Criança)
- **E-mail:** `sofia@educoins.com`
- **Senha:** `password123`
- **O que testar:** Visualizar tarefas assigned, clicar em "Fiz a tarefa!", depositar moedas/dinheiro no cofrinho de sonhos, comprar acessórios na loja e equipar roupas/mascotes em seu avatar SVG 2D.

### 2. Painel dos Pais (Administrador)
- **E-mail:** `pai@educoins.com`
- **Senha:** `password123`
- **O que testar:** Criar tarefas, aprovar tarefas concluídas pela Sofia (liberando recompensas), aprovar ou recusar pedidos de compras de sorvetes/brinquedos, visualizar relatórios de categorias de tarefas e cadastrar novos filhos.

---

## ⚙️ Funcionalidades Implementadas

### Gamificação Avançada
- **Avatar Dinâmico:** Renderizador vetorial SVG (`AvatarRenderer.jsx`) que veste e atualiza o visual da Sofia instantaneamente com cabelos coloridos, coroas, óculos e mascotes (dragão, unicórnio, gato).
- **Audio Arcade Synth:** Utilização da Web Audio API (`sound.js`) para reproduzir sintetizadores de som retro arcade (como moedas do Mario e level-up).
- **Streak & Níveis:** Mecânica de dias seguidos (streak) com ícone de foguinho e barra de experiência progressiva.
- **Achievements:** Medalheiro virtual de conquistas de tarefas e economia na prateleira de troféus.

### Infraestrutura
- **PWA (Progressive Web App):** Configuração com manifest offline pronto para instalação mobile através do Vite PWA.
- **WebSockets:** Conexão em tempo real (`Socket.io`) enviando alertas sonoros e confetes na tela do filho assim que o pai aprova uma tarefa, ou notificando o pai no momento da conclusão do dever.
- **REST API + Swagger:** Documentação interativa de rotas REST organizadas no endpoint `/api-docs`.
