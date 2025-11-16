# FastFeet API

API em Node.js + TypeScript que implementa o PRD do FastFeet, sistema logístico responsável por gerenciar entregadores, destinatários e o ciclo completo das encomendas. O backend expõe autenticação via CPF/senha, RBAC, uploads de comprovante, notificações simuladas e camadas bem definidas para facilitar manutenção.

## ✨ Principais Funcionalidades
- Autenticação JWT com papéis `ADMIN` e `COURIER`.
- CRUD completo de entregadores, destinatários e encomendas.
- Fluxo operacional do entregador: retirada, entrega (com foto obrigatória), devolução e consulta de encomendas próximas.
- Geolocalização aproximada baseada em coordenadas.
- Registro de eventos e notificações (mock console ou webhook).
- Seeds e migrações Prisma para provisionar o banco rapidamente.

## 🧱 Stack
- Node.js 22 · TypeScript 5
- Fastify 5 com Zod e JWT
- Prisma ORM (PostgreSQL)
- Bcrypt para hashing
- Fastify Multipart para upload local
- Vitest + Supertest

## ✅ Requisitos
- Node.js >= 20
- PostgreSQL 15+ (local ou hospedado)
- npm ou outro gerenciador compatível

## 🚀 Como Rodar
1. **Clone** o repositório e entre na pasta:
   ```bash
   git clone <repo-url>
   cd fast-feet-api
   ```
2. **Variáveis de ambiente**
   ```bash
   cp .env.example .env
   # edite DATABASE_URL / JWT_SECRET conforme seu ambiente
   ```
3. **Instale dependências**
   ```bash
   npm install
   ```
4. **Banco & Prisma**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate      # cria o schema no banco apontado
   ```
5. **Seed opcional** (cria admin padrão CPF `00011122233`, senha `admin123`):
   ```bash
   npm run seed
   ```
6. **Execução**
   ```bash
   npm run dev    # hot reload
   npm run build  # gera dist
   npm start      # roda dist/server.js
   ```

Para rodar testes: `npm run test` (watch) ou `npm run test:run`.

## 🔐 Variáveis de Ambiente
| Nome | Descrição | Default |
| --- | --- | --- |
| `DATABASE_URL` | String de conexão Postgres usada pelo Prisma | obrigatória |
| `JWT_SECRET` | Segredo mínimo 10 chars para assinar tokens | obrigatória |
| `PORT` | Porta HTTP do Fastify | `3333` |
| `NODE_ENV` | `development`, `test` ou `production` | `development` |
| `UPLOAD_DIR` | Pasta para salvar fotos (caminho local) | `./uploads` |
| `NOTIFICATION_MOCK` | `console` ou `webhook` | `console` |
| `NOTIFICATION_WEBHOOK` | URL alvo quando `NOTIFICATION_MOCK=webhook` | opcional |
| `SEED_ADMIN_CPF` / `SEED_ADMIN_PASSWORD` | Personaliza credenciais do seed | defaults do README |

## 📂 Estrutura de Pastas
```
src/
 ├─ app.ts              # Registro de plugins/rotas Fastify
 ├─ env/                # Validação e carga das envs (Zod)
 ├─ domain/             # Entidades e contratos
 ├─ application/        # Casos de uso/serviços
 ├─ infra/              # Implementações Prisma, notificações, hash
 ├─ http/               # Rotas, controllers e testes E2E
 └─ utils/              # Helpers (CPF, geo, etc)
```

## 🗂️ Scripts
- `npm run dev` – Fastify + tsx watch.
- `npm run build` / `npm start` – compilação e execução do bundle.
- `npm run test` / `npm run test:run` – suíte Vitest com Supertest.
- `npm run prisma:generate` – gera cliente Prisma.
- `npm run prisma:migrate` – aplica migrações em desenvolvimento.
- `npm run prisma:deploy` – aplica migrações em produção.
- `npm run seed` – cria usuário admin padrão.

## 🌐 Endpoints
| Recurso | Endpoints |
| --- | --- |
| Auth | `POST /auth/login` |
| Usuários | `POST /users`, `GET /users`, `PATCH /users/:id/password` (admin) |
| Entregadores | `POST/GET/PUT/DELETE /couriers` (admin) |
| Destinatários | `POST/GET/PUT/DELETE /recipients` (admin) |
| Encomendas | `POST/GET/PUT/DELETE /orders`, `PATCH /orders/:id/await` (admin) |
| Fluxo do entregador | `GET /courier/me/orders`, `PATCH /courier/orders/:id/withdraw`, `PATCH /courier/orders/:id/deliver` (multipart), `PATCH /courier/orders/:id/return`, `GET /courier/orders/nearby` |

Veja o arquivo [`fastfeet_prd.md`](fastfeet_prd.md) para o detalhamento completo de regras de negócio e fluxos.

## 🔔 Notificações
A cada mudança de status um registro é persistido em `DeliveryEvent`/`Notification` e uma ação é disparada pelo `PrismaNotificationGateway`. Com `NOTIFICATION_MOCK=console` o payload é apenas logado; com `webhook` a API envia um POST JSON para a URL configurada.

## 🤝 Contribuindo
1. Faça um fork e crie uma branch feature.
2. Garanta que testes (`npm run test:run`) e lint (quando configurado) estejam verdes.
3. Abra um PR descrevendo o contexto.

Ficou com dúvidas ou encontrou algo fora do PRD? Abra uma issue! :rocket:
