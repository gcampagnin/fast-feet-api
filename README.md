# FastFeet API

Backend Fastify + Prisma para gerenciamento logístico descrito no PRD. Implementa autenticação com CPF/senha, RBAC para administradores e entregadores, fluxo completo das encomendas e notificações simuladas.

## Tecnologias

- Node.js + TypeScript
- Fastify com Zod para validação
- Prisma ORM (PostgreSQL)
- JWT + Bcrypt
- Upload multipart local
- Vitest

## Configuração

1. Copie `.env.example` para `.env` e ajuste `DATABASE_URL`, `JWT_SECRET`, diretório de upload e opcionalmente `NOTIFICATION_WEBHOOK`.
2. Instale dependências:

   ```bash
   npm install
   ```

3. Gere o cliente Prisma e rode migrações:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. Popule o usuário admin padrão (CPF `00011122233`, senha `admin123` – altere via variáveis `SEED_ADMIN_*` se desejar):

   ```bash
   npm run seed
   ```

5. Ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

## Scripts úteis

- `npm run dev` – Fastify com reload
- `npm run build` / `npm start`
- `npm run test` – Vitest watch
- `npm run prisma:migrate` / `prisma:deploy`
- `npm run seed` – cria admin

## Endpoints Principais

- `POST /auth/login`
- `PATCH /users/:id/password` *(admin)*
- `POST/GET/PUT/DELETE /couriers` *(admin)*
- `POST/GET/PUT/DELETE /recipients` *(admin)*
- `POST/GET/PUT/DELETE /orders` + `PATCH /orders/:id/await` *(admin)*
- Fluxo entregador (`/courier` prefix):
  - `GET /courier/me/orders`
  - `GET /courier/:id/orders`
  - `PATCH /courier/orders/:id/withdraw`
  - `PATCH /courier/orders/:id/deliver` *(multipart com foto obrigatória)*
  - `PATCH /courier/orders/:id/return`
  - `GET /courier/orders/nearby?latitude=&longitude=&radiusKm=`

## Notificações

Cada mudança de status grava eventos e dispara notificações mockadas. Por padrão o canal `console` apenas loga. Ajuste `NOTIFICATION_MOCK=webhook` e `NOTIFICATION_WEBHOOK` para enviar POST externo.
