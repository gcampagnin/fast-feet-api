# PRD – Sistema FastFeet (API Backend)

## 1. Visão Geral
O FastFeet é um sistema backend para uma transportadora fictícia, responsável por gerenciar usuários (administradores e entregadores), destinatários e o ciclo completo de vida das encomendas.  
A API deve fornecer endpoints seguros, escaláveis e aderentes às regras de negócio da operação logística.

Este PRD descreve funcionalidades, requisitos, regras de negócio, fluxos, integrações e critérios de aceitação.

---

## 2. Objetivos do Sistema
- Gerenciar entregadores, destinatários e encomendas.
- Controlar todo o ciclo da encomenda: criação, retirada, entrega, devolução.
- Garantir segurança e acesso baseado em papéis (admin vs entregador).
- Registrar foto obrigatória para entrega.
- Notificar destinatários sobre mudanças no status.

---

## 3. Personas

### **Administrador**
- Gerencia entregadores, destinatários e encomendas.
- Pode alterar senha de qualquer usuário.
- Acompanha as operações e garante conformidade.

### **Entregador**
- Visualiza apenas suas próprias entregas.
- Registra retirada, entrega (com foto), devolução.
- Consulta encomendas próximas à sua localização.

### **Destinatário**
- Não utiliza o sistema diretamente, mas recebe notificações.

---

## 4. Tipos de Usuário
| Tipo | Acesso |
|------|--------|
| **admin** | CRUD completo + alteração de senha + relatórios |
| **entregador** | Operações relacionadas às próprias entregas |

---

## 5. Funcionalidades da Aplicação

### 5.1 Autenticação
- Login com **CPF + senha**.
- JWT com papéis para controle de acesso.

### 5.2 CRUD de Entregadores *(Somente Admin)*
- Criar entregador.
- Atualizar dados.
- Deletar.
- Listar todos.

### 5.3 CRUD de Destinatários *(Somente Admin)*
- Criar destinatário.
- Atualizar dados.
- Deletar.
- Listar todos.

### 5.4 CRUD de Encomendas *(Somente Admin)*
- Criar encomenda vinculada a:
  - Destinatário
  - Entregador (opcional)
- Atualizar dados.
- Deletar.
- Listar todas.

### 5.5 Operações de Entregador

#### 5.5.1 Marcar encomenda como “aguardando”
- Administrador define como disponível para retirada.

#### 5.5.2 Registrar retirada da encomenda
- Entregador pega a encomenda.
- Registro de data e hora.

#### 5.5.3 Registrar entrega
- Entregador deve enviar **obrigatoriamente uma foto**.
- Apenas o entregador que retirou pode marcar como entregue.

#### 5.5.4 Registrar devolução
- Entregador devolve encomenda ao centro de distribuição.

#### 5.5.5 Listagem de encomendas próximas
- Busca por endereço/geolocalização próximo ao entregador.

#### 5.5.6 Listar encomendas do entregador
- Apenas suas próprias encomendas.

### 5.6 Alteração de Senha *(Somente Admin)*
- Admin pode alterar senha de qualquer usuário.

### 5.7 Notificações ao Destinatário
- Em cada mudança de status:
  - aguardando → retirada
  - retirada → entregue
  - retirada → devolvida

Integração via serviço externo simulado (e-mail, push ou webhook).

---

## 6. Regras de Negócio

### RB01 — CRUD restrito a administradores  
Somente admins podem criar/editar/excluir:
- Entregadores  
- Destinatários  
- Encomendas  

### RB02 — Login obrigatório  
Somente usuários autenticados acessam endpoints.

### RB03 — Entregador só visualiza suas encomendas  
Nenhum entregador pode acessar dados de outro entregador.

### RB04 — Entrega exige foto  
Para finalizar uma entrega:
- Upload obrigatório de foto.
- Armazenamento no filesystem/S3.

### RB05 — Só quem retirou pode entregar  
Uma encomenda só pode ser marcada como entregue por quem fez a retirada.

### RB06 — Notificação obrigatória  
Destinatário deve ser notificado em cada mudança de status.

---

## 7. Fluxo das Encomendas

### **1. Criação (admin)**
Status inicial: *criada*

### **2. Aguardando retirada (admin)**
Status: *aguardando*

### **3. Retirada (entregador)**
Status: *retirada*  
Salva:
- entregador_id  
- data da retirada  

### **4. Entregue (entregador)**
Status: *entregue*  
Obrigatório:
- foto da entrega  
- data da entrega  

### **5. Devolvida (entregador)**
Status: *devolvida*  

---

## 8. Estrutura de Dados (Modelo Simplificado)

### **Usuário**
- id  
- nome  
- CPF  
- senha_hash  
- role (admin | entregador)

### **Destinatário**
- id  
- nome  
- rua  
- número  
- complemento  
- cidade  
- estado  
- cep  

### **Encomenda**
- id  
- destinatario_id  
- entregador_id  
- status  
- foto_entrega_url  
- retirada_em  
- entregue_em  
- devolvida_em  

---

## 9. Requisitos Técnicos

### Backend
- Node.js / TS
- Framework: Fastify, Express ou NestJS
- Banco: Postgres
- ORM: Prisma/Drizzle/TypeORM
- Upload: Multipart + local/S3
- Autenticação: JWT
- RBAC por middleware
- Testes:
  - Unitários
  - E2E

### Arquitetura
- Clean Architecture
- Domain-Driven Design (DDD)
- Domain Events para notificação

### Logs e Observabilidade
- Winston/Pino
- Correlation IDs
- Auditoria de ações de entregadores

---

## 10. Endpoints (Resumo)

### **Autenticação**
- POST `/auth/login`

### **Usuários**
- PATCH `/users/:id/password` (admin)

### **Entregadores (admin)**
- POST `/couriers`
- GET `/couriers`
- PUT `/couriers/:id`
- DELETE `/couriers/:id`

### **Destinatários (admin)**
- POST `/recipients`
- GET `/recipients`
- PUT `/recipients/:id`
- DELETE `/recipients/:id`

### **Encomendas**
- POST `/orders` (admin)  
- GET `/orders` (admin)  
- PUT `/orders/:id` (admin)  
- DELETE `/orders/:id` (admin)

### **Fluxo do entregador**
- PATCH `/orders/:id/withdraw`  
- PATCH `/orders/:id/deliver` (com foto)  
- PATCH `/orders/:id/return`  
- GET `/couriers/:id/orders`  
- GET `/orders/nearby`  

---

## 11. Critérios de Aceitação

### CA01 — Segurança
- Somente admins conseguem acessar rotas administrativas.
- JWT deve ser validado em todas as requisições.

### CA02 — Entregador vê apenas suas entregas
- Tentativa de acessar encomenda de outro entregador → 403 Forbidden.

### CA03 — Foto obrigatória
- Tentativa de marcar como entregue sem foto → 400 Bad Request.

### CA04 — Notificações
- Cada status gera um disparo para o serviço de notificação.

### CA05 — Geolocalização
- Filtrar encomendas por raio configurado.

---

## 12. Futuras Evoluções (Opcional)
- Dashboard de entregas.
- Integração real com serviços de push/email.
- Mapa de rotas.
- Prioridade de entregas.
- SLA de entrega.

---

## 13. Conclusão
Este PRD define o comportamento funcional e técnico da API FastFeet.  
Serve como referência para desenvolvimento, QA, documentação e evolução contínua.
