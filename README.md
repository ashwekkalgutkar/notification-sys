# Configurable Notification System Architecture

A production-ready, highly extensible, and robust Configurable Notification System built with **NestJS (Node.js)** on the backend and **Angular (v18, Standalone Components, Reactive Forms)** on the frontend, backed by **SQLite** via **Prisma ORM**.

---

## 🎨 White Theme with Orange Accents & Glassmorphism

The system features a custom light-mode visual design system:

1. **Light Ambient Glassmorphism**:
   - Soft off-white canvas with dynamic multi-point ambient orange gradients (`radial-gradient` mesh lighting).
   - Glassmorphic panels with backdrop blur (`backdrop-filter: blur(16px)`), crisp white semi-transparent borders, and soft warm drop-shadows.
2. **Vibrant Orange Accent System**:
   - Primary buttons and active states feature an energetic warm orange (`#ff5500`, `#ff7d29`), with glowing ambient button shadows (`box-shadow: 0 8px 24px -4px rgba(255, 85, 0, 0.35)`).
   - Glowing orange input focus rings (`0 0 0 3px rgba(255, 85, 0, 0.15)`).
3. **Floating Aesthetic Glass Navigation Bar**:
   - Sticky floating pill-shaped navbar (`app-header`) containing the **NotifyHub** signal bell logo and pill-style navigation tabs with active tab shadows.
4. **Strict Typography Hierarchy**:
   - Page Titles: Deep Slate Navy (`#0f172a`, 24px, 700 weight).
   - Section Headers: Slate (`#1e293b`, 16px, 600 weight).
   - Field Labels: Muted Slate (`#475569`, 13px, 600 weight).
   - Captions / Hints: Muted Grey (`#64748b`, 12px, 500 weight).

---

## 🏛️ System Architecture & Design Decisions

### 1. Database Choice: SQLite + Prisma ORM
* **Justification**: SQLite with Prisma v5 was chosen because it provides a self-contained, zero-infrastructure setup for evaluation and development without requiring external database services (e.g., Dockerized Postgres). Prisma enforces strict type-safety, seamless schema migrations, and database-level unique constraints.

### 2. Database-Level Deduplication Strategy (Idempotency)
* **Mechanism**: Deduplication is strictly enforced at the **database constraint level** rather than relying solely on application memory (which fails under horizontal scaling or concurrent race conditions).
* **Prisma Constraint**:
  ```prisma
  model NotificationLog {
    id        String   @id @default(uuid())
    eventId   String
    ruleId    String
    recipient String
    channel   String
    status    String
    ...
    @@unique([eventId, ruleId, recipient, channel], name: "unique_event_dispatch")
  }
  ```
* **Behavior under concurrent requests**: When identical events carrying the same `eventId` are received concurrently, the database unique index immediately rejects duplicate insert attempts with a `P2002` unique constraint violation. The system catches this exception and flags the dispatch as `status: 'skipped'`, ensuring zero duplicate notifications are dispatched to end users.

### 3. Dynamic Condition Evaluator Engine
* **Logic**: Evaluates incoming JSON event payloads against structured rule conditions using **AND logic**.
* **Nested Field Resolution**: Supports dot-notation paths (e.g., `user.profile.tier` or `order.value`) using lodash-like object traversal.
* **Operators Supported**:
  * `gt` (Greater Than)
  * `lt` (Less Than)
  * `gte` (Greater or Equal)
  * `lte` (Less or Equal)
  * `eq` (Equal)
  * `neq` (Not Equal)
  * `contains` (Substring / Array containment)

### 4. Pluggable Channel Registry Architecture (Strategy Pattern)
* **Extensibility**: Adding a new communication channel (e.g., SMS, Slack, Webhook, WhatsApp) requires zero modifications to the core event processing pipeline or controller.
* **Steps to Add a New Channel**:
  1. Implement the `NotificationChannel` interface (`sendNotification(payload: ChannelPayload): Promise<ChannelDeliveryResult>`).
  2. Decorate with `@Injectable()` and implement `channelName` (e.g., `'slack'`).
  3. Register the provider in `ChannelsModule` and call `channelRegistry.registerChannel(newSlackChannel)`.

---

## 🚀 Quick Start & Local Setup Instructions

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher

---

### Step 1: Backend Setup (NestJS)

```bash
cd backend

# Install dependencies
npm install

# Apply database migrations & generate Prisma client
npx prisma db push

# Seed database with initial rules and sample data
npm run seed

# Run unit and integration tests
npm test
npm run test:e2e

# Start NestJS backend server (listening on http://localhost:3000)
npm run start:dev
```

---

### Step 2: Frontend Setup (Angular)

```bash
cd ../frontend

# Install dependencies
npm install

# Run component unit tests
npm test

# Start Angular development server
npm start
```

Open your browser and navigate to: `http://localhost:4200`

---

## 🧪 Testing Suite Coverage

### Backend Testing
* **Unit Tests**: `ConditionEvaluatorService` (covering standard operators, nested JSON paths, missing payload keys) and `ChannelRegistryService` (registration mechanics and channel failure resiliency).
  ```bash
  npm test
  ```
  *Status: 28 Passed, 0 Failed across 3 Test Suites.*

* **Integration / End-to-End Tests**: `events-dedup.e2e-spec.ts` verifies `POST /api/events` end-to-end processing and strictly verifies database-level idempotency by re-submitting duplicate `eventId` payloads.
  ```bash
  npm run test:e2e
  ```
  *Status: 3 Passed, 0 Failed across 2 Test Suites.*

### Frontend Testing
* **Component Tests**: `RuleFormComponent` unit tests covering Reactive Form rendering, dynamic condition row addition/removal (`FormArray`), and validation feedback.
  ```bash
  npm test
  ```
  *Status: 8 Passed, 0 Failed.*

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/rules` | List all notification rules (supports `?isEnabled=true/false`) |
| `POST` | `/api/rules` | Create a new notification rule (enforces DTO validation) |
| `GET` | `/api/rules/:id` | Get rule details |
| `PATCH` | `/api/rules/:id` | Update notification rule |
| `DELETE` | `/api/rules/:id` | Delete notification rule |
| `POST` | `/api/events` | **Trigger system event** (evaluates rules, interpolates templates, dispatches notifications, enforces dedup) |
| `GET` | `/api/notifications` | Paginated dispatch history (supports status, channel, recipient, and date filters) |

---

## 💡 What I'd Improve If I Had More Time

1. **Asynchronous Message Queue (BullMQ + Redis)**:
   - Currently, event matching and channel delivery run synchronously inside the `POST /api/events` HTTP request context.
   - For high-volume production traffic, event dispatches should be pushed to a distributed Redis queue (BullMQ), allowing background workers to process dispatches asynchronously with automated retries and exponential backoff.

2. **WebSockets / Server-Sent Events (SSE)**:
   - Push real-time notification dispatch status updates directly to the Angular frontend dashboard without needing manual polling.

3. **Multi-Tenant Rule Grouping & Rate Limiting**:
   - Introduce rate-limiting windows (e.g., maximum 5 notifications per recipient per hour) to prevent spamming end users during system outages.

4. **Visual Drag-and-Drop Rule Builder**:
   - Expand the dynamic condition builder into a full drag-and-drop flowchart engine supporting complex `OR` groups and nested condition trees.
